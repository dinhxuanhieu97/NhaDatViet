<?php

namespace App\Http\Requests;

use App\Models\Category;
use App\Services\PropertyRuleResolver;
use Illuminate\Foundation\Http\FormRequest;

class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Ủy quyền xử lý ở Controller qua Policy.
    }

    /**
     * Chuẩn hóa `save_as_draft` thành chuỗi '1'/'0' trước khi validate.
     *
     * Laravel's `required_unless` so sánh strict (===) khi giá trị so sánh là
     * boolean/null (xem `ValidatesAttributes::validateRequiredUnless`), mà tham
     * số rule luôn được parse thành chuỗi — nên `required_unless:save_as_draft,1`
     * KHÔNG BAO GIỜ khớp nếu `save_as_draft` còn là boolean JSON thật (`true`/`false`).
     * Hậu quả: trước khi có fix này, "Lưu nháp" luôn đòi đủ trường bắt buộc theo
     * loại hình (bedrooms, legal_status, contact_name, …) y hệt gửi duyệt — vô
     * hiệu hóa hoàn toàn tính năng lưu nháp một phần.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('save_as_draft')) {
            $this->merge(['save_as_draft' => $this->boolean('save_as_draft') ? '1' : '0']);
        }
    }

    public function rules(): array
    {
        return app(PropertyRuleResolver::class)->rules($this->category());
    }

    public function attributes(): array
    {
        return app(PropertyRuleResolver::class)->attributes();
    }

    public function messages(): array
    {
        return [
            'title.min' => 'Tiêu đề phải có ít nhất 30 ký tự.',
            'description.min' => 'Mô tả phải có ít nhất 50 ký tự.',
            'contact_phone.regex' => 'Số điện thoại không đúng định dạng Việt Nam.',
            'required_unless' => 'Trường :attribute là bắt buộc với loại bất động sản này.',
        ];
    }

    public function category(): ?Category
    {
        $id = $this->input('category_id');

        return $id ? Category::find($id) : null;
    }

    public function isDraft(): bool
    {
        return $this->boolean('save_as_draft');
    }
}
