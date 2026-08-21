<?php

namespace Tests;

use App\Models\Category;
use App\Models\District;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Cache;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Driver cache trong test (`array`, xem phpunit.xml) sống suốt cả
        // tiến trình PHP chạy test — KHÔNG tự dọn giữa các test method như
        // RefreshDatabase làm với DB. Không flush ở đây thì PropertyListingCache
        // (và cache category/location) có thể trả dữ liệu "mồ côi" từ test
        // trước đã rollback DB (vd. cùng khóa cache trùng vì cùng bộ filter,
        // nhưng property id/nội dung của test trước đã không còn tồn tại).
        // Flush đầu mỗi test đảm bảo cache luôn sạch, độc lập giữa các test.
        Cache::flush();
    }

    protected function seedRoles(): void
    {
        $this->seed(RolePermissionSeeder::class);
    }

    /** Tạo user kèm vai trò. */
    protected function userWithRole(string $role, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->assignRole($role);

        return $user->fresh();
    }

    /** Bộ dữ liệu tối thiểu: 1 tỉnh, 1 quận, 1 danh mục. */
    protected function seedBaseData(string $type = 'house', string $listingType = 'sale'): array
    {
        $province = Province::factory()->create();
        $district = District::factory()->create(['province_id' => $province->id]);
        $category = Category::factory()->type($type, $listingType)->create();

        return compact('province', 'district', 'category');
    }

    /**
     * Field chống bot (xem App\Support\SpamGuard) mà mọi request test tới
     * register/contact/report phải gửi kèm — thiếu `form_rendered_at` hoặc
     * gửi honeypot có giá trị sẽ bị SpamGuard coi là bot và trả "thành công
     * giả" (không ghi DB) hoặc lỗi validate chung chung, làm sai lệch assertion
     * của test tưởng như request hợp lệ.
     */
    protected function bdsAntiSpamBypass(): array
    {
        return [
            'form_rendered_at' => (int) round(microtime(true) * 1000) - 5000,
        ];
    }

    /** Payload hợp lệ để tạo tin đăng. */
    protected function validPropertyPayload(array $base, array $overrides = []): array
    {
        return array_merge([
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
            'title' => 'Bán nhà mặt phố Nguyễn Trãi Thanh Xuân diện tích 80m2 giá tốt',
            'description' => 'Chính chủ cần bán căn nhà mặt phố, vị trí đẹp, kinh doanh thuận lợi, '
                .'gần trường học và chợ. Sổ đỏ chính chủ, sang tên ngay.',
            'price' => 8_500_000_000,
            'price_unit' => 'total',
            'area' => 80,
            'bedrooms' => 4,
            'bathrooms' => 3,
            'floors' => 4,
            'legal_status' => 'red_book',
            'address' => '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
            'latitude' => 21.0021,
            'longitude' => 105.8000,
            'contact_name' => 'Nguyễn Văn A',
            'contact_phone' => '0912345678',
            'contact_email' => 'a@example.com',
        ], $overrides);
    }
}
