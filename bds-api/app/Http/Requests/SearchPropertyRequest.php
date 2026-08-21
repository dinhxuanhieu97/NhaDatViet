<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchPropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:200'],
            'listing_type' => ['nullable', 'in:sale,rent'],
            'category_id' => ['nullable', 'integer'],
            'type' => ['nullable', 'in:land,house,apartment,project'],
            'province_id' => ['nullable', 'integer'],
            'district_id' => ['nullable', 'integer'],
            'ward_id' => ['nullable', 'integer'],
            'project_id' => ['nullable', 'integer'],
            'price_min' => ['nullable', 'numeric', 'min:0'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'gte:price_min'],
            'area_min' => ['nullable', 'numeric', 'min:0'],
            'area_max' => ['nullable', 'numeric', 'min:0', 'gte:area_min'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'direction' => ['nullable', 'in:dong,tay,nam,bac,dong-nam,tay-nam,dong-bac,tay-bac'],
            'legal_status' => ['nullable', 'in:red_book,pink_book,sale_contract,waiting,other'],
            'furniture' => ['nullable', 'in:full,basic,none'],
            'lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:lng'],
            'lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:lat'],
            'radius' => ['nullable', 'numeric', 'min:0.1', 'max:'.config('bds.map.max_radius_km', 50)],
            'bounds' => ['nullable', 'array', 'size:4'],
            'bounds.*' => ['numeric'],
            'sort' => ['nullable', 'in:newest,relevance,price_asc,price_desc,area_asc,area_desc,views'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function filters(): array
    {
        return $this->validated();
    }

    public function perPage(): int
    {
        return (int) ($this->validated()['per_page'] ?? 20);
    }
}
