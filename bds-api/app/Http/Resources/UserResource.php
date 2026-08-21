<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'company' => $this->company,
            // Kênh mạng xã hội cấp hồ sơ — xem CLAUDE.md §4.31.
            'social_tiktok' => $this->social_tiktok,
            'social_youtube' => $this->social_youtube,
            'social_instagram' => $this->social_instagram,
            'status' => $this->status,
            'email_verified' => $this->email_verified_at !== null,
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            'post_limit' => $this->postLimit(),
            'image_limit' => $this->imageLimit(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
