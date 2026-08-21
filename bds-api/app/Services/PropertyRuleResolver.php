<?php

namespace App\Services;

use App\Enums\PropertyType;
use App\Models\Category;
use App\Support\VietnamesePhone;

/**
 * Sinh bộ rule validate động cho tin đăng dựa trên loại hình bất động sản.
 * Tách riêng để tránh phình logic trong FormRequest (rủi ro R-Sprint2).
 */
class PropertyRuleResolver
{
    /**
     * @return array<string, mixed>
     */
    public function rules(?Category $category, bool $isUpdate = false): array
    {
        // Trên PUT, mọi trường đều là partial update: chỉ validate khi có mặt trong payload.
        $required = $isUpdate ? ['sometimes', 'required'] : ['required'];
        $optional = $isUpdate ? ['sometimes', 'nullable'] : ['nullable'];

        $rules = [
            'category_id' => [$isUpdate ? 'sometimes' : 'required', 'integer', 'exists:categories,id'],
            'project_id' => [...$optional, 'integer', 'exists:projects,id'],
            'province_id' => [$isUpdate ? 'sometimes' : 'required', 'integer', 'exists:provinces,id'],
            'district_id' => [$isUpdate ? 'sometimes' : 'required', 'integer', 'exists:districts,id'],
            'ward_id' => [...$optional, 'integer', 'exists:wards,id'],

            'title' => [...$required, 'string', 'min:30', 'max:200'],
            'description' => [...$required, 'string', 'min:50', 'max:10000'],

            'price' => [...$optional, 'numeric', 'min:0', 'max:999999999999'],
            'price_unit' => [...$optional, 'in:total,per_m2,per_month'],
            'area' => [...$required, 'numeric', 'min:1', 'max:1000000'],

            'bedrooms' => [...$optional, 'integer', 'min:0', 'max:50'],
            'bathrooms' => [...$optional, 'integer', 'min:0', 'max:50'],
            'floors' => [...$optional, 'integer', 'min:0', 'max:100'],
            'direction' => [...$optional, 'in:dong,tay,nam,bac,dong-nam,tay-nam,dong-bac,tay-bac'],
            'legal_status' => [...$optional, 'in:red_book,pink_book,sale_contract,waiting,other'],
            'furniture' => [...$optional, 'in:full,basic,none'],
            'frontage' => [...$optional, 'numeric', 'min:0', 'max:9999'],
            'road_width' => [...$optional, 'numeric', 'min:0', 'max:9999'],

            'address' => [...$required, 'string', 'max:255'],
            'latitude' => [...$optional, 'numeric', 'between:-90,90'],
            'longitude' => [...$optional, 'numeric', 'between:-180,180'],

            // Không bắt buộc tuyệt đối: khi lưu nháp (kể cả lưu nháp ngầm lúc tải ảnh ở
            // bước 5, trước khi người dùng điền liên hệ ở bước 6) vẫn phải lưu được.
            // Bắt buộc thật sự khi gửi duyệt được validate lại ở step6Schema (client)
            // và khi save_as_draft=false (server, qua required_unless bên dưới).
            'contact_name' => [...$optional, 'string', 'max:120', 'required_unless:save_as_draft,1'],
            'contact_phone' => [
                ...$optional, 'string', 'regex:'.VietnamesePhone::REGEX, 'required_unless:save_as_draft,1',
            ],
            'contact_email' => [...$optional, 'email', 'max:150'],
            // Số Zalo riêng (nếu khác contact_phone) và link Facebook — hoàn toàn không
            // bắt buộc, kể cả lúc gửi duyệt. Bỏ trống contact_zalo thì frontend tự dùng
            // contact_phone khi tạo link zalo.me.
            'contact_zalo' => [...$optional, 'string', 'regex:'.VietnamesePhone::REGEX],
            'contact_facebook' => [...$optional, 'url', 'max:255'],

            'save_as_draft' => ['sometimes', 'boolean'],
        ];

        if ($category === null) {
            return $rules;
        }

        // Bắt buộc thêm theo loại hình, chỉ áp dụng khi KHÔNG lưu nháp.
        foreach ($category->type->requiredFields() as $field) {
            if (! isset($rules[$field])) {
                continue;
            }

            $rules[$field] = array_values(array_filter(
                $rules[$field],
                fn ($rule) => ! in_array($rule, ['nullable', 'required'], true)
            ));

            // Trên update, chỉ ràng buộc khi trường có mặt trong payload.
            array_unshift($rules[$field], 'required_unless:save_as_draft,1');

            if ($isUpdate) {
                array_unshift($rules[$field], 'sometimes');
            }
        }

        return $rules;
    }

    /**
     * Loại bỏ các trường không áp dụng cho loại hình để không lưu rác vào DB.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function stripHiddenFields(array $data, ?Category $category): array
    {
        if ($category === null) {
            return $data;
        }

        foreach ($category->type->hiddenFields() as $field) {
            $data[$field] = null;
        }

        return $data;
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'category_id' => 'danh mục',
            'project_id' => 'dự án',
            'province_id' => 'tỉnh/thành phố',
            'district_id' => 'quận/huyện',
            'ward_id' => 'phường/xã',
            'title' => 'tiêu đề',
            'description' => 'mô tả',
            'price' => 'giá',
            'area' => 'diện tích',
            'bedrooms' => 'số phòng ngủ',
            'bathrooms' => 'số phòng tắm',
            'floors' => 'số tầng',
            'direction' => 'hướng',
            'legal_status' => 'tình trạng pháp lý',
            'furniture' => 'nội thất',
            'frontage' => 'mặt tiền',
            'road_width' => 'đường vào',
            'address' => 'địa chỉ',
            'contact_name' => 'tên liên hệ',
            'contact_phone' => 'số điện thoại',
            'contact_email' => 'email liên hệ',
            'contact_zalo' => 'số Zalo',
            'contact_facebook' => 'link Facebook',
        ];
    }

    /** Kiểm tra danh mục hợp lệ với loại hình dự án (project cần project_id). */
    public function typeOf(?Category $category): ?PropertyType
    {
        return $category?->type;
    }
}
