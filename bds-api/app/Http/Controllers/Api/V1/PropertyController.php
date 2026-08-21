<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\SearchPropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Models\PropertyContact;
use App\Models\PropertyReport;
use App\Services\PropertySearchService;
use App\Support\PropertyListingCache;
use App\Support\PropertyViewCounter;
use App\Support\SpamGuard;
use App\Support\VietnamesePhone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PropertyController extends Controller
{
    public function __construct(private readonly PropertySearchService $search) {}

    /** Danh sách tin công khai kèm bộ lọc — cache theo PropertyListingCache (xem CLAUDE.md §4.25). */
    public function index(SearchPropertyRequest $request): JsonResponse
    {
        $filters = $request->filters();
        $perPage = $request->perPage();
        $page = (int) $request->query('page', 1);

        $data = PropertyListingCache::remember(
            $filters,
            $page,
            $perPage,
            function () use ($filters, $perPage, $request) {
                $properties = $this->search->paginate($filters, $perPage);

                // ->response($request)->getData(true): resolve toàn bộ resource
                // (data + links + meta phân trang) thành mảng thuần để cache —
                // không cache Collection/Model Eloquent thô (CLAUDE.md §4.15).
                return PropertyResource::collection($properties)->response($request)->getData(true);
            }
        );

        return response()->json($data);
    }

    /** Marker cho trang tìm kiếm bản đồ. */
    public function map(SearchPropertyRequest $request): JsonResponse
    {
        $markers = $this->search->markers($request->filters())->map(fn (Property $p) => [
            'id' => $p->id,
            'slug' => $p->slug,
            'title' => $p->title,
            'price_text' => $p->priceText(),
            'area' => (float) $p->area,
            'bedrooms' => $p->bedrooms,
            'lat' => (float) $p->latitude,
            'lng' => (float) $p->longitude,
            'thumb' => $p->images->first()?->thumbUrl(),
        ]);

        return response()->json([
            'data' => $markers,
            'meta' => [
                'count' => $markers->count(),
                'limit' => config('bds.map.max_markers'),
            ],
        ]);
    }

    /** Chi tiết tin theo slug. */
    public function show(Request $request, string $slug): PropertyResource
    {
        $property = Property::where('slug', $slug)
            ->with(['category', 'project', 'province', 'district', 'ward', 'user', 'images'])
            ->first();

        if (! $property) {
            throw new NotFoundHttpException('Không tìm thấy tin đăng.');
        }

        // `$request->user()` (không tham số) phân giải qua guard MẶC ĐỊNH
        // ('web', session) — route này công khai, không có middleware
        // `auth:sanctum` nào chạy trước để chuyển guard mặc định sang
        // 'sanctum' cho request (như `Authenticate` middleware làm ở các
        // route bắt buộc đăng nhập). Không chỉ định 'sanctum' tường minh thì
        // client API thật gửi Bearer token vẫn bị coi là khách vãng lai —
        // bug này từng lọt qua vì test dùng `actingAs($user, 'sanctum')`
        // (tự chuyển guard mặc định) nên không tái hiện được ngoài đời thật.
        // Xem CLAUDE.md §4.26.
        $user = $request->user('sanctum');

        if (! $user?->can('view', $property) && $property->status !== PropertyStatus::Published) {
            throw new NotFoundHttpException('Không tìm thấy tin đăng.');
        }

        // Tăng lượt xem không kích hoạt observer/updated_at — chỉ tính nếu
        // người xem này (theo user id/IP) chưa xem tin trong khoảng chống
        // trùng gần đây (xem PropertyViewCounter, CLAUDE.md §4.26).
        if (PropertyViewCounter::shouldCount($request, $property)) {
            $property->increment('views_count');
        }

        return new PropertyResource($property);
    }

    /** Tin tương tự (cùng khu vực, cùng loại, giá gần nhau). */
    public function similar(string $slug): AnonymousResourceCollection
    {
        $property = Property::where('slug', $slug)->firstOrFail();

        $similar = Property::query()
            ->public()
            ->where('id', '!=', $property->id)
            ->where('district_id', $property->district_id)
            ->where('category_id', $property->category_id)
            ->with(['category', 'province', 'district', 'user', 'images'])
            ->orderByDesc('published_at')
            ->limit(8)
            ->get();

        return PropertyResource::collection($similar);
    }

    /**
     * Trả số điện thoại thật (không mask) khi người xem chủ động bấm "Hiện số".
     *
     * `PropertyResource` luôn mask contact_phone cho người xem không phải chủ tin
     * / kiểm duyệt viên (xem `canSeeFullContact`) — endpoint riêng này là hành
     * động rõ ràng ("bấm để hiện số") thay vì lộ số ngay trong payload chi tiết
     * tin, hạn chế bot quét số hàng loạt. Giới hạn tần suất qua route (throttle).
     */
    public function revealPhone(string $slug): JsonResponse
    {
        $property = Property::where('slug', $slug)->public()->firstOrFail();

        return response()->json(['data' => ['phone' => $property->contact_phone]]);
    }

    /** Gửi liên hệ tới người đăng tin. */
    public function contact(Request $request, string $slug): JsonResponse
    {
        $property = Property::where('slug', $slug)->public()->firstOrFail();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'regex:'.VietnamesePhone::REGEX],
            'email' => ['nullable', 'email', 'max:150'],
            'message' => ['nullable', 'string', 'max:1000'],
        ], [], [
            'name' => 'họ tên',
            'phone' => 'số điện thoại',
        ]);

        // Honeypot/thời gian điền form nghi bot → vờ thành công, không lưu gì
        // cả — tránh lộ cho bot biết bị chặn để nó không đổi chiến thuật.
        if (SpamGuard::isSuspicious($request)) {
            return response()->json([
                'message' => 'Đã gửi thông tin liên hệ tới người đăng tin.',
            ], 201);
        }

        PropertyContact::create([
            ...$data,
            'property_id' => $property->id,
            // 'sanctum' tường minh — route công khai, xem giải thích ở show(). Xem CLAUDE.md §4.26.
            'user_id' => $request->user('sanctum')?->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Đã gửi thông tin liên hệ tới người đăng tin.',
        ], 201);
    }

    /** Báo cáo tin vi phạm. */
    public function report(Request $request, string $slug): JsonResponse
    {
        $property = Property::where('slug', $slug)->public()->firstOrFail();

        $data = $request->validate([
            'reason' => ['required', 'in:duplicate,wrong_info,sold_already,spam,fraud,other'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        // Vờ thành công, không lưu — cùng lý do với contact() ở trên.
        if (SpamGuard::isSuspicious($request)) {
            return response()->json(['message' => 'Đã ghi nhận báo cáo. Cảm ơn bạn.'], 201);
        }

        // 'sanctum' tường minh — route công khai, xem giải thích ở show(). Xem CLAUDE.md §4.26.
        $reporterId = $request->user('sanctum')?->id;

        // Chống lạm dụng: nếu không chặn trùng, một người có thể tự gửi đủ ngưỡng
        // báo cáo để ẩn tin của đối thủ. Mỗi người/IP chỉ được tính 1 lần trên mỗi tin.
        $alreadyReported = PropertyReport::query()
            ->where('property_id', $property->id)
            ->when(
                $reporterId,
                fn ($q) => $q->where('reporter_id', $reporterId),
                fn ($q) => $q->whereNull('reporter_id')->where('ip_address', $request->ip()),
            )
            ->exists();

        if ($alreadyReported) {
            return response()->json([
                'message' => 'Bạn đã báo cáo tin đăng này trước đó. Chúng tôi đang xử lý.',
            ], 200);
        }

        PropertyReport::create([
            ...$data,
            'property_id' => $property->id,
            'reporter_id' => $reporterId,
            'ip_address' => $request->ip(),
        ]);

        // Đếm lại từ bảng báo cáo (số người khác nhau) thay vì cộng dồn mù quáng.
        // reports_count cố ý không nằm trong $fillable nên dùng forceFill.
        $uniqueReports = PropertyReport::where('property_id', $property->id)->count();
        $property->forceFill(['reports_count' => $uniqueReports])->save();

        $threshold = (int) config('bds.auto_hide_reports', 3);

        if ($uniqueReports >= $threshold && $property->status === PropertyStatus::Published) {
            $property->update(['status' => PropertyStatus::Hidden]);
        }

        return response()->json(['message' => 'Đã ghi nhận báo cáo. Cảm ơn bạn.'], 201);
    }
}
