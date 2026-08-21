<?php

namespace App\Http\Resources;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Property */
class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $canSeeFullContact = $viewer !== null
            && ($this->isOwnedBy($viewer) || $viewer->can('property.moderate'));

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'listing_type' => $this->listing_type->value,
            'listing_type_label' => $this->listing_type->label(),

            'price' => $this->price !== null ? (float) $this->price : null,
            'price_unit' => $this->price_unit,
            'price_text' => $this->priceText(),
            'price_per_m2_text' => $this->pricePerM2Text(),

            'area' => (float) $this->area,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'floors' => $this->floors,
            'direction' => $this->direction,
            'legal_status' => $this->legal_status,
            'furniture' => $this->furniture,
            'frontage' => $this->frontage !== null ? (float) $this->frontage : null,
            'road_width' => $this->road_width !== null ? (float) $this->road_width : null,

            'address' => $this->address,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,

            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'rejection_reason' => $this->when($canSeeFullContact, $this->rejection_reason),
            'published_at' => $this->published_at?->toIso8601String(),
            'expired_at' => $this->expired_at?->toIso8601String(),
            'views_count' => $this->views_count,
            'is_featured' => $this->is_featured,

            'contact_name' => $this->contact_name,
            'contact_phone' => $canSeeFullContact
                ? $this->contact_phone
                : $this->maskPhone($this->contact_phone),
            'contact_email' => $this->when($canSeeFullContact, $this->contact_email),
            // Không mask: người đăng chủ động chọn công khai hai kênh này (khác
            // contact_phone, vốn phải "bấm để hiện số" qua GET .../reveal-phone).
            'contact_zalo' => $this->contact_zalo,
            'contact_facebook' => $this->contact_facebook,

            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
                'type' => $this->category->type->value,
            ]),
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
                'slug' => $this->project->slug,
            ] : null),
            'province' => $this->whenLoaded('province', fn () => [
                'id' => $this->province->id,
                'name' => $this->province->name,
                'slug' => $this->province->slug,
            ]),
            'district' => $this->whenLoaded('district', fn () => [
                'id' => $this->district->id,
                'name' => $this->district->name,
                'slug' => $this->district->slug,
            ]),
            'ward' => $this->whenLoaded('ward', fn () => $this->ward ? [
                'id' => $this->ward->id,
                'name' => $this->ward->name,
            ] : null),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'company' => $this->user->company,
                'avatar' => $this->user->avatar,
                // Kênh mạng xã hội cấp hồ sơ (khác contact_zalo/contact_facebook
                // ở trên, vốn đặt riêng theo từng tin) — xem CLAUDE.md §4.31.
                // Không mask/ẩn ở đây: BdsContactBox tự quyết định ẩn nút nào
                // dựa trên giá trị rỗng, giống cách contact_facebook đang làm.
                'social_tiktok' => $this->user->social_tiktok,
                'social_youtube' => $this->user->social_youtube,
                'social_instagram' => $this->user->social_instagram,
            ]),
            'images' => PropertyImageResource::collection($this->whenLoaded('images')),
            'primary_image' => $this->whenLoaded('images', fn () => $this->resolvePrimaryImage()),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function resolvePrimaryImage(): ?string
    {
        $image = $this->images->firstWhere('is_primary', true) ?? $this->images->first();

        return $image?->thumbUrl();
    }

    private function maskPhone(?string $phone): ?string
    {
        if (blank($phone) || strlen($phone) < 7) {
            return $phone;
        }

        return substr($phone, 0, 3).str_repeat('x', strlen($phone) - 6).substr($phone, -3);
    }
}
