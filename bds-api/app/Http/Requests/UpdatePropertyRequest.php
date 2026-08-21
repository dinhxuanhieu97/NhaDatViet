<?php

namespace App\Http\Requests;

use App\Models\Category;
use App\Services\PropertyRuleResolver;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Ủy quyền xử lý ở Controller qua Policy.
    }

    /**
     * Chuẩn hóa `save_as_draft` thành chuỗi '1'/'0' trước khi validate — xem giải
     * thích chi tiết ở `StorePropertyRequest::prepareForValidation()`.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('save_as_draft')) {
            $this->merge(['save_as_draft' => $this->boolean('save_as_draft') ? '1' : '0']);
        }
    }

    public function rules(): array
    {
        return app(PropertyRuleResolver::class)->rules($this->category(), isUpdate: true);
    }

    public function attributes(): array
    {
        return app(PropertyRuleResolver::class)->attributes();
    }

    public function category(): ?Category
    {
        $id = $this->input('category_id') ?? $this->route('property')?->category_id;

        return $id ? Category::find($id) : null;
    }

    public function isDraft(): bool
    {
        return $this->boolean('save_as_draft');
    }
}
