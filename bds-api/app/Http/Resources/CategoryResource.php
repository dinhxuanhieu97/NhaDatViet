<?php

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Category */
class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'listing_type' => $this->listing_type->value,
            'listing_type_label' => $this->listing_type->label(),
            'icon' => $this->icon,
            'sort_order' => $this->sort_order,
            'required_fields' => $this->type->requiredFields(),
            'hidden_fields' => $this->type->hiddenFields(),
            'children' => self::collection($this->whenLoaded('children')),
        ];
    }
}
