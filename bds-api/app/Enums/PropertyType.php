<?php

namespace App\Enums;

enum PropertyType: string
{
    case Land = 'land';
    case House = 'house';
    case Apartment = 'apartment';
    case Project = 'project';

    public function label(): string
    {
        return match ($this) {
            self::Land => 'Đất',
            self::House => 'Nhà',
            self::Apartment => 'Chung cư',
            self::Project => 'Dự án',
        };
    }

    /**
     * Trường bắt buộc thêm theo loại hình bất động sản.
     *
     * @return array<int, string>
     */
    public function requiredFields(): array
    {
        return match ($this) {
            self::Land => ['frontage', 'road_width', 'legal_status'],
            self::House => ['bedrooms', 'bathrooms', 'floors', 'legal_status'],
            self::Apartment => ['bedrooms', 'bathrooms', 'furniture'],
            self::Project => ['project_id'],
        };
    }

    /**
     * Trường không áp dụng cho loại hình (frontend ẩn đi, backend bỏ qua).
     *
     * @return array<int, string>
     */
    public function hiddenFields(): array
    {
        return match ($this) {
            self::Land => ['bedrooms', 'bathrooms', 'floors', 'furniture'],
            self::House => [],
            self::Apartment => ['frontage', 'road_width'],
            self::Project => ['bedrooms', 'bathrooms'],
        };
    }
}
