<?php

namespace Database\Seeders;

use App\Enums\PropertyStatus;
use App\Models\Category;
use App\Models\District;
use App\Models\Property;
use App\Models\User;
use App\Models\Ward;
use Illuminate\Database\Seeder;

class PropertyDemoSeeder extends Seeder
{
    public function run(): void
    {
        $agent = User::role('agent')->first();
        $member = User::role('member')->first();

        if (! $agent) {
            return;
        }

        $categories = Category::all();
        $districts = District::with('province')->get();

        if ($categories->isEmpty() || $districts->isEmpty()) {
            return;
        }

        $directions = ['dong', 'tay', 'nam', 'bac', 'dong-nam', 'tay-nam', 'dong-bac', 'tay-bac'];
        $legals = ['red_book', 'pink_book', 'sale_contract', 'waiting'];
        $streets = ['Nguyễn Trãi', 'Lê Lợi', 'Trần Hưng Đạo', 'Nguyễn Huệ', 'Hoàng Diệu', 'Phan Chu Trinh'];

        // Duyệt vòng tròn qua danh mục để mọi loại hình × nhu cầu đều có dữ liệu demo.
        for ($i = 1; $i <= 45; $i++) {
            $category = $categories[($i - 1) % $categories->count()];
            $district = $districts->random();
            $ward = Ward::where('district_id', $district->id)->inRandomOrder()->first();

            // Member có hạn mức 5 tin (config/bds.php) nên chỉ giao 4 tin đầu,
            // phần còn lại thuộc về agent — nếu không, dashboard demo sẽ hiện
            // "20/5 tin đang hiển thị", trông như lỗi nghiệp vụ.
            $owner = ($member && $i <= 4) ? $member : $agent;
            $isRent = $category->listing_type->value === 'rent';

            $area = fake()->numberBetween(30, 250);
            $price = $isRent
                ? fake()->numberBetween(5, 60) * 1_000_000
                : fake()->numberBetween(15, 180) * 100_000_000;

            $type = $category->type->value;
            $street = $streets[array_rand($streets)];
            $title = sprintf(
                '%s %s %s, %s %dm²',
                $isRent ? 'Cho thuê' : 'Bán',
                match ($type) {
                    'land' => 'đất',
                    'house' => 'nhà',
                    'apartment' => 'căn hộ',
                    default => 'bất động sản',
                },
                $street,
                $district->name,
                $area
            );

            $property = new Property([
                'user_id' => $owner->id,
                'category_id' => $category->id,
                'province_id' => $district->province_id,
                'district_id' => $district->id,
                'ward_id' => $ward?->id,
                'title' => $title,
                'description' => sprintf(
                    'Chính chủ %s %s tại %s, %s, %s. Diện tích %dm², vị trí thuận tiện, '.
                    'gần trường học, chợ, bệnh viện. Giao thông thuận lợi, khu dân cư an ninh. '.
                    'Liên hệ xem nhà bất cứ lúc nào.',
                    $isRent ? 'cho thuê' : 'cần bán',
                    $type === 'land' ? 'lô đất' : ($type === 'apartment' ? 'căn hộ' : 'căn nhà'),
                    $street,
                    $district->name,
                    $district->province->name,
                    $area
                ),
                'listing_type' => $category->listing_type->value,
                'price' => $price,
                'price_unit' => $isRent ? 'per_month' : 'total',
                'area' => $area,
                'bedrooms' => $type === 'land' ? null : fake()->numberBetween(1, 5),
                'bathrooms' => $type === 'land' ? null : fake()->numberBetween(1, 4),
                'floors' => in_array($type, ['land', 'apartment'], true) ? null : fake()->numberBetween(1, 5),
                'direction' => $directions[array_rand($directions)],
                'legal_status' => $legals[array_rand($legals)],
                'furniture' => $type === 'land' ? null : fake()->randomElement(['full', 'basic', 'none']),
                'frontage' => $type === 'land' ? fake()->randomFloat(1, 4, 12) : null,
                'road_width' => $type === 'land' ? fake()->randomFloat(1, 3, 15) : null,
                'address' => fake()->numberBetween(1, 300).' '.$street.', '.$district->name,
                // Giới hạn trong khung toạ độ Quận 12 để tìm theo bán kính có ý nghĩa.
                'latitude' => fake()->randomFloat(6, 10.83, 10.89),
                'longitude' => fake()->randomFloat(6, 106.60, 106.70),
                'status' => $i <= 36 ? PropertyStatus::Published : PropertyStatus::Pending,
                'contact_name' => $owner->name,
                'contact_phone' => $owner->phone ?? '0900000000',
                'contact_email' => $owner->email,
            ]);

            if ($property->status === PropertyStatus::Published) {
                $property->published_at = now()->subDays(fake()->numberBetween(0, 20));
                $property->expired_at = now()->addDays(fake()->numberBetween(5, 30));
                $property->views_count = fake()->numberBetween(10, 3000);
            }

            $property->save();
        }

        $this->seedAcceptanceShowcase($agent);
    }

    /**
     * Tin đăng cố định khớp kịch bản nghiệm thu #6 trong docs/01-Dac-Ta-Ky-Thuat.md:
     * "chung cư TP.HCM, 2 phòng ngủ, 2–3 tỷ". Dữ liệu ngẫu nhiên ở trên không đảm bảo
     * sinh ra tổ hợp này, nên chốt cứng để demo và nghiệm thu luôn có kết quả.
     */
    private function seedAcceptanceShowcase(User $owner): void
    {
        $category = Category::where('type', 'apartment')->where('listing_type', 'sale')->first();
        $district = District::with('province')->where('code', '79Q12')->first();

        if (! $category || ! $district) {
            return;
        }

        $ward = Ward::where('district_id', $district->id)
            ->where('slug', 'thoi-an')
            ->first();

        $property = new Property([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'province_id' => $district->province_id,
            'district_id' => $district->id,
            'ward_id' => $ward?->id,
            'title' => 'Bán căn hộ chung cư 2 phòng ngủ 68m² Quận 12, TP.HCM, full nội thất',
            'description' => 'Chính chủ cần bán căn hộ 2 phòng ngủ, 2 vệ sinh, diện tích thông thủy 68m² '
                .'tại phường Thới An, khu vực Quận 12, TP.HCM. Căn góc thoáng, hướng Đông Nam, '
                .'đầy đủ nội thất cao cấp. Tòa nhà có bể bơi, phòng gym, siêu thị dưới chân tòa. '
                .'Sổ hồng chính chủ, sang tên ngay. Liên hệ xem nhà bất cứ lúc nào trong tuần.',
            'listing_type' => 'sale',
            'price' => 2_800_000_000,
            'price_unit' => 'total',
            'area' => 68,
            'bedrooms' => 2,
            'bathrooms' => 2,
            'direction' => 'dong-nam',
            'legal_status' => 'pink_book',
            'furniture' => 'full',
            'address' => '9A Thới An 15, Thới An',
            // Toạ độ khu Picity High Park để kịch bản tìm theo bán kính có kết quả.
            'latitude' => 10.8690,
            'longitude' => 106.6570,
            'contact_name' => $owner->name,
            'contact_phone' => $owner->phone ?? '0900000000',
            'contact_email' => $owner->email,
            'is_featured' => true,
        ]);

        $property->status = PropertyStatus::Published;
        $property->published_at = now()->subDay();
        $property->expired_at = now()->addDays(29);
        $property->views_count = 1_286;
        $property->save();
    }
}
