<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\PropertyRuleResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class MyPropertyController extends Controller
{
    public function __construct(private readonly PropertyRuleResolver $resolver) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $properties = $request->user()->properties()
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->with(['category', 'province', 'district', 'images'])
            ->orderByDesc('id')
            ->paginate(min((int) $request->query('per_page', 20), 50))
            ->withQueryString();

        return PropertyResource::collection($properties);
    }

    public function show(Request $request, Property $property): PropertyResource
    {
        $this->authorize('update', $property);

        $property->load(['category', 'project', 'province', 'district', 'ward', 'images']);

        return new PropertyResource($property);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->cannot('create', Property::class)) {
            $limit = $user->postLimit();

            return response()->json([
                'message' => $limit !== null
                    ? "Bạn đã đạt hạn mức {$limit} tin đang hiển thị. Nâng cấp tài khoản môi giới để đăng không giới hạn."
                    : 'Bạn không có quyền đăng tin.',
            ], 403);
        }

        $data = $request->validated();
        $category = $request->category();
        $data = $this->resolver->stripHiddenFields($data, $category);

        unset($data['save_as_draft']);

        $property = new Property($data);
        $property->user_id = $user->id;
        $property->listing_type = $category->listing_type->value;
        $property->status = $request->isDraft() ? PropertyStatus::Draft : PropertyStatus::Pending;
        $property->save();

        $property->load(['category', 'province', 'district', 'images']);

        return response()->json([
            'message' => $request->isDraft()
                ? 'Đã lưu tin nháp.'
                : 'Đã gửi tin chờ kiểm duyệt.',
            'data' => new PropertyResource($property),
        ], 201);
    }

    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $data = $request->validated();
        $category = $request->category();
        $data = $this->resolver->stripHiddenFields($data, $category);

        unset($data['save_as_draft']);

        // Sửa nội dung trọng yếu của tin đã duyệt → phải duyệt lại.
        $criticalFields = ['price', 'area', 'address', 'title', 'description', 'category_id'];
        $needsRemoderation = $property->status === PropertyStatus::Published
            && collect($criticalFields)->contains(
                fn ($f) => array_key_exists($f, $data) && (string) $property->{$f} !== (string) $data[$f]
            );

        $property->fill($data);

        if ($category) {
            $property->listing_type = $category->listing_type->value;
        }

        if ($needsRemoderation) {
            $property->status = PropertyStatus::Pending;
            $property->published_at = null;
        }

        $property->save();
        $property->load(['category', 'province', 'district', 'images']);

        return response()->json([
            'message' => $needsRemoderation
                ? 'Đã cập nhật. Tin cần được kiểm duyệt lại trước khi hiển thị.'
                : 'Đã cập nhật tin đăng.',
            'data' => new PropertyResource($property),
        ]);
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $property->delete();

        return response()->json(null, 204);
    }

    /** Gửi tin nháp / tin bị từ chối đi kiểm duyệt. */
    public function submit(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        if (! in_array($property->status, [PropertyStatus::Draft, PropertyStatus::Rejected], true)) {
            throw ValidationException::withMessages([
                'status' => ['Chỉ tin nháp hoặc tin bị từ chối mới có thể gửi duyệt.'],
            ]);
        }

        if ($property->images()->count() === 0) {
            throw ValidationException::withMessages([
                'images' => ['Tin đăng cần có ít nhất 1 hình ảnh trước khi gửi duyệt.'],
            ]);
        }

        $property->update([
            'status' => PropertyStatus::Pending,
            'rejection_reason' => null,
        ]);

        return response()->json(['message' => 'Đã gửi tin đi kiểm duyệt.']);
    }

    /** Ẩn / hiện tin đã duyệt. */
    public function toggleVisibility(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $new = match ($property->status) {
            PropertyStatus::Published => PropertyStatus::Hidden,
            PropertyStatus::Hidden => PropertyStatus::Published,
            default => throw ValidationException::withMessages([
                'status' => ['Chỉ tin đang hiển thị hoặc đã ẩn mới đổi được trạng thái này.'],
            ]),
        };

        $property->update(['status' => $new]);

        return response()->json([
            'message' => $new === PropertyStatus::Hidden ? 'Đã ẩn tin.' : 'Đã hiển thị lại tin.',
            'status' => $new->value,
        ]);
    }
}
