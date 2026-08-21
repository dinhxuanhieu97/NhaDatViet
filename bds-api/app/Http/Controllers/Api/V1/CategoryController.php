<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $listingType = $request->query('listing_type');
        $type = $request->query('type');

        $key = 'categories:'.($listingType ?? 'all').':'.($type ?? 'all');

        // Cache mảng đã render qua Resource (không cache Collection Eloquent thô).
        // Lý do: cache DB từng lưu Collection object rồi gãy unserialize() sau
        // khi seed lại DB ("incomplete object"), kéo theo /nha-dat-ban crash vì
        // frontend .map() nhận về lỗi 500 thay vì mảng. Cache mảng thuần đã
        // resolve() thì không còn phụ thuộc autoload class lúc đọc lại, và nếu
        // cache cũ vẫn hỏng kiểu khác thì tự bỏ qua, tính lại.
        $data = null;

        try {
            $cached = Cache::get($key);

            if (is_array($cached)) {
                $data = $cached;
            }
        } catch (\Throwable) {
            // cache hỏng — bỏ qua, tính lại bên dưới
        }

        if ($data === null) {
            Cache::forget($key);

            $categories = Category::query()
                ->where('is_active', true)
                ->when($listingType, fn ($q) => $q->where('listing_type', $listingType))
                ->when($type, fn ($q) => $q->where('type', $type))
                ->orderBy('sort_order')
                ->get();

            $data = CategoryResource::collection($categories)->resolve();
            Cache::put($key, $data, now()->addDay());
        }

        return response()->json(['data' => $data]);
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category);
    }
}
