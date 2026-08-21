<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\District;
use App\Models\Property;
use App\Models\Province;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Kiểm tra App\Support\PropertyListingCache — cache trang danh sách công khai
 * (GET /properties) và tự invalidate khi tin đổi trạng thái. Xem CLAUDE.md §4.25.
 */
class PropertyListingCacheTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected Province $province;

    protected District $district;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();

        $this->owner = $this->userWithRole('agent');
        $this->province = Province::factory()->create();
        $this->district = District::factory()->create(['province_id' => $this->province->id]);
        $this->category = Category::factory()->type('house', 'sale')->create();
    }

    private function make(array $attrs = []): Property
    {
        return Property::factory()->published()->create(array_merge([
            'user_id' => $this->owner->id,
            'category_id' => $this->category->id,
            'province_id' => $this->province->id,
            'district_id' => $this->district->id,
        ], $attrs));
    }

    public function test_lan_goi_thu_hai_tra_ve_ket_qua_da_cache_du_du_lieu_da_doi_truc_tiep(): void
    {
        $property = $this->make(['title' => 'Bán nhà mặt phố Lê Lợi']);

        // Lần 1: cache miss, tính và lưu cache.
        $this->getJson('/api/v1/properties')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Bán nhà mặt phố Lê Lợi');

        // Đổi title thẳng qua query builder — CỐ TÌNH bỏ qua Eloquent event
        // (giống việc dữ liệu đổi mà không có gì kích hoạt invalidate) để
        // chứng minh lần gọi sau lấy từ cache chứ không truy vấn lại DB.
        DB::table('properties')->where('id', $property->id)->update(['title' => 'Đã đổi trực tiếp, không qua model event']);

        $this->getJson('/api/v1/properties')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Bán nhà mặt phố Lê Lợi');
    }

    public function test_duyet_tin_lam_cache_listing_cu_het_hieu_luc_ngay(): void
    {
        $this->make(['title' => 'Tin đã duyệt từ trước']);

        // Cache lần đầu: chỉ có 1 tin.
        $this->getJson('/api/v1/properties')->assertOk()->assertJsonCount(1, 'data');

        $pending = Property::factory()->create([
            'user_id' => $this->owner->id,
            'category_id' => $this->category->id,
            'province_id' => $this->province->id,
            'district_id' => $this->district->id,
            'status' => 'pending',
        ]);

        $moderator = $this->userWithRole('moderator');

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/v1/admin/properties/{$pending->id}/approve")
            ->assertOk();

        // Cache cũ (1 tin) phải bị bỏ ngay — không cần chờ hết TTL.
        $this->getJson('/api/v1/properties')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_bo_loc_khac_nhau_khong_dung_chung_mot_khoa_cache(): void
    {
        $this->make(['listing_type' => 'sale']);
        $this->make(['listing_type' => 'rent']);

        $this->getJson('/api/v1/properties?listing_type=sale')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/properties?listing_type=rent')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/properties')->assertOk()->assertJsonCount(2, 'data');
    }
}
