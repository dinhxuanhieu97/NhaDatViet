<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyImageResource;
use App\Jobs\ProcessPropertyImage;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PropertyImageController extends Controller
{
    public function store(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $maxSize = (int) config('bds.image.max_upload_size_kb', 5120);

        $request->validate([
            'images' => ['required', 'array', 'min:1'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', "max:$maxSize"],
        ], [], ['images' => 'hình ảnh']);

        $limit = $request->user()->imageLimit();
        $current = $property->images()->count();
        $incoming = count($request->file('images'));

        if ($current + $incoming > $limit) {
            throw ValidationException::withMessages([
                'images' => ["Mỗi tin đăng chỉ được tối đa {$limit} ảnh (hiện có {$current})."],
            ]);
        }

        $created = [];
        $sort = (int) $property->images()->max('sort_order');

        foreach ($request->file('images') as $file) {
            $path = $file->store("properties/{$property->id}", 'public');

            $image = $property->images()->create([
                'path' => $path,
                'is_primary' => $current === 0 && $created === [],
                'sort_order' => ++$sort,
                'is_processed' => false,
            ]);

            ProcessPropertyImage::dispatch($image->id);

            $created[] = $image;
        }

        return response()->json([
            'message' => 'Tải ảnh lên thành công. Ảnh đang được tối ưu hóa.',
            'data' => PropertyImageResource::collection(collect($created)),
        ], 201);
    }

    public function destroy(Request $request, Property $property, PropertyImage $image): JsonResponse
    {
        $this->authorize('update', $property);

        if ($image->property_id !== $property->id) {
            return response()->json(['message' => 'Ảnh không thuộc tin đăng này.'], 404);
        }

        foreach ([$image->path, $image->path_webp, $image->path_thumb] as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }

        $wasPrimary = $image->is_primary;
        $image->delete();

        if ($wasPrimary) {
            $property->images()->orderBy('sort_order')->first()?->update(['is_primary' => true]);
        }

        return response()->json(null, 204);
    }

    /** Sắp xếp lại thứ tự và chọn ảnh đại diện. */
    public function reorder(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $data = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['integer', 'exists:property_images,id'],
            'primary_id' => ['nullable', 'integer', 'exists:property_images,id'],
        ]);

        $ids = $property->images()->pluck('id')->all();

        foreach ($data['order'] as $index => $imageId) {
            if (! in_array($imageId, $ids, true)) {
                continue;
            }
            PropertyImage::where('id', $imageId)->update(['sort_order' => $index + 1]);
        }

        if (! empty($data['primary_id']) && in_array($data['primary_id'], $ids, true)) {
            $property->images()->update(['is_primary' => false]);
            PropertyImage::where('id', $data['primary_id'])->update(['is_primary' => true]);
        }

        return response()->json([
            'message' => 'Đã cập nhật thứ tự ảnh.',
            'data' => PropertyImageResource::collection($property->images()->get()),
        ]);
    }
}
