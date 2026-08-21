<?php

namespace App\Http\Resources;

use App\Models\PropertyImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PropertyImage */
class PropertyImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url(),
            'thumb_url' => $this->thumbUrl(),
            'is_primary' => $this->is_primary,
            'sort_order' => $this->sort_order,
            'is_processed' => $this->is_processed,
        ];
    }
}
