<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FavoriteController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $propertyIds = $request->user()->favorites()->pluck('property_id');

        // Lọc public(): tin đã lưu nhưng sau đó bị gỡ/ẩn/hết hạn không được lộ lại nội dung.
        $properties = Property::whereIn('id', $propertyIds)
            ->public()
            ->with(['category', 'province', 'district', 'user', 'images'])
            ->orderByDesc('id')
            ->paginate(20);

        return PropertyResource::collection($properties);
    }

    public function store(Request $request, Property $property): JsonResponse
    {
        // Chỉ cho lưu tin đang hiển thị công khai. Nếu không chặn, người dùng có thể
        // dò id để lưu rồi đọc nội dung tin nháp/chờ duyệt của người khác.
        abort_unless(
            $property->status === PropertyStatus::Published,
            404,
            'Không tìm thấy tin đăng.'
        );

        Favorite::firstOrCreate([
            'user_id' => $request->user()->id,
            'property_id' => $property->id,
        ]);

        return response()->json(['message' => 'Đã lưu tin vào danh sách yêu thích.'], 201);
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        $request->user()->favorites()->where('property_id', $property->id)->delete();

        return response()->json(null, 204);
    }
}
