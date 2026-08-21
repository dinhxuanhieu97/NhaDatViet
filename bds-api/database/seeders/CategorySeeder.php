<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Support\VietnameseText;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /** [tên, loại hình, nhu cầu] */
    private const ITEMS = [
        // Bán
        ['Bán căn hộ chung cư', 'apartment', 'sale'],
        ['Bán nhà riêng', 'house', 'sale'],
        ['Bán nhà mặt phố', 'house', 'sale'],
        ['Bán nhà biệt thự, liền kề', 'house', 'sale'],
        ['Bán đất nền dự án', 'land', 'sale'],
        ['Bán đất', 'land', 'sale'],
        ['Bán kho, nhà xưởng', 'house', 'sale'],
        ['Dự án đang mở bán', 'project', 'sale'],
        // Cho thuê
        ['Cho thuê căn hộ chung cư', 'apartment', 'rent'],
        ['Cho thuê nhà riêng', 'house', 'rent'],
        ['Cho thuê nhà mặt phố', 'house', 'rent'],
        ['Cho thuê văn phòng', 'house', 'rent'],
        ['Cho thuê phòng trọ, nhà trọ', 'house', 'rent'],
        ['Cho thuê đất', 'land', 'rent'],
        ['Cho thuê kho, nhà xưởng', 'house', 'rent'],
    ];

    public function run(): void
    {
        foreach (self::ITEMS as $index => [$name, $type, $listingType]) {
            Category::updateOrCreate(
                ['slug' => VietnameseText::slug($name)],
                [
                    'name' => $name,
                    'type' => $type,
                    'listing_type' => $listingType,
                    'sort_order' => $index,
                    'is_active' => true,
                ]
            );
        }
    }
}
