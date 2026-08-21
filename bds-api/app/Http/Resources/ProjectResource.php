<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bọc dự án theo cùng cấu trúc với PropertyResource ({data, links, meta}).
 *
 * Trước đây ProjectController trả thẳng paginator của Laravel — cấu trúc phẳng
 * (total nằm ở cấp 1, không có `meta`) nên frontend đọc `page.meta.total` bị lỗi
 * và trang /du-an trả HTTP 500. Mọi endpoint phân trang phải dùng Resource để
 * frontend chỉ cần biết một hình dạng dữ liệu duy nhất.
 *
 * @mixin Project
 */
class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'developer' => $this->developer,
            'address' => $this->address,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'description' => $this->description,
            'total_area' => $this->total_area !== null ? (float) $this->total_area : null,
            'total_units' => $this->total_units,
            'price_from' => $this->price_from !== null ? (float) $this->price_from : null,
            'price_to' => $this->price_to !== null ? (float) $this->price_to : null,
            'status' => $this->status,
            'handover_at' => $this->handover_at?->toDateString(),
            'thumbnail' => $this->thumbnail,
            'is_featured' => $this->is_featured,
            'properties_count' => $this->whenCounted('properties'),

            'province' => $this->whenLoaded('province', fn () => $this->province ? [
                'id' => $this->province->id,
                'name' => $this->province->name,
                'slug' => $this->province->slug,
            ] : null),
            'district' => $this->whenLoaded('district', fn () => $this->district ? [
                'id' => $this->district->id,
                'name' => $this->district->name,
                'slug' => $this->district->slug,
            ] : null),
        ];
    }
}
