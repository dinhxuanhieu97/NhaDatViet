<?php

namespace Tests\Feature;

use App\Enums\PropertyStatus;
use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    public function test_member_dang_tin_thanh_cong_va_tin_o_trang_thai_cho_duyet(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $response = $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $this->validPropertyPayload($base));

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseCount('properties', 1);
        $this->assertSame($member->id, Property::first()->user_id);
    }

    public function test_tin_moi_tao_co_slug_khong_dau_kem_id(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $this->validPropertyPayload($base))
            ->assertCreated();

        $property = Property::first();

        $this->assertStringContainsString('ban-nha-mat-pho-nguyen-trai', $property->slug);
        $this->assertStringEndsWith('-'.$property->id, $property->slug);
    }

    public function test_luu_nhap_thi_trang_thai_la_draft(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $this->validPropertyPayload($base, [
                'save_as_draft' => true,
            ]))
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft');
    }

    /**
     * Hồi quy: `required_unless:save_as_draft,1` không hoạt động khi `save_as_draft`
     * là boolean JSON thật (Laravel so sánh strict với giá trị bool/null — xem
     * `StorePropertyRequest::prepareForValidation()`). Trước khi sửa, "Lưu nháp"
     * vẫn đòi đủ trường bắt buộc theo loại hình (bedrooms/legal_status/…) và cả
     * contact_name/contact_phone — khiến bước "Tải ảnh" của wizard (tự lưu nháp
     * ngầm trước khi có id) luôn lỗi vì lúc đó bước "Liên hệ" (sau bước ảnh) chưa
     * được điền.
     */
    public function test_luu_nhap_khong_can_du_truong_bat_buoc_theo_loai_hinh_va_lien_he(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $response = $this->actingAs($member, 'sanctum')->postJson('/api/v1/my/properties', [
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
            'address' => '123 Nguyễn Trãi',
            'area' => 80,
            'title' => 'Bán nhà mặt phố Nguyễn Trãi Thanh Xuân diện tích 80m2 giá tốt',
            'description' => 'Chính chủ cần bán căn nhà mặt phố, vị trí đẹp, kinh doanh thuận lợi, '
                .'gần trường học và chợ. Sổ đỏ chính chủ, sang tên ngay.',
            'save_as_draft' => true,
            // Cố ý bỏ trống: bedrooms, bathrooms, floors, legal_status (bắt buộc theo
            // loại hình "Nhà"), contact_name, contact_phone (bắt buộc theo mặc định).
        ]);

        $response->assertCreated()->assertJsonPath('data.status', 'draft');
    }

    public function test_khach_chua_dang_nhap_khong_dang_tin_duoc(): void
    {
        $base = $this->seedBaseData();

        $this->postJson('/api/v1/my/properties', $this->validPropertyPayload($base))
            ->assertUnauthorized();
    }

    public function test_tieu_de_qua_ngan_bi_tu_choi(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $this->validPropertyPayload($base, [
                'title' => 'Bán nhà',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('title');
    }

    public function test_dat_nen_bat_buoc_co_mat_tien_va_duong_vao(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData('land');

        $payload = $this->validPropertyPayload($base);
        unset($payload['frontage'], $payload['road_width']);

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['frontage', 'road_width']);
    }

    public function test_chung_cu_bat_buoc_co_phong_ngu_va_noi_that(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData('apartment');

        $payload = $this->validPropertyPayload($base);
        unset($payload['bedrooms'], $payload['bathrooms']);

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['bedrooms', 'bathrooms', 'furniture']);
    }

    public function test_truong_khong_ap_dung_bi_loai_bo_khi_luu(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData('land');

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $this->validPropertyPayload($base, [
                'frontage' => 5,
                'road_width' => 8,
                'bedrooms' => 3,   // không áp dụng cho đất
                'furniture' => 'full', // không áp dụng cho đất
            ]))
            ->assertCreated();

        $property = Property::first();

        $this->assertNull($property->bedrooms);
        $this->assertNull($property->furniture);
        $this->assertNotNull($property->frontage);
    }

    public function test_member_vuot_han_muc_5_tin_bi_tu_choi(): void
    {
        $member = $this->userWithRole('member');
        $base = $this->seedBaseData();

        Property::factory()->count(5)->published()->create([
            'user_id' => $member->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/my/properties', $this->validPropertyPayload($base))
            ->assertStatus(403)
            ->assertJsonFragment(['message' => 'Bạn đã đạt hạn mức 5 tin đang hiển thị. Nâng cấp tài khoản môi giới để đăng không giới hạn.']);
    }

    public function test_agent_khong_bi_gioi_han_so_tin(): void
    {
        $agent = $this->userWithRole('agent');
        $base = $this->seedBaseData();

        Property::factory()->count(8)->published()->create([
            'user_id' => $agent->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($agent, 'sanctum')
            ->postJson('/api/v1/my/properties', $this->validPropertyPayload($base))
            ->assertCreated();
    }

    public function test_member_khong_sua_duoc_tin_cua_nguoi_khac(): void
    {
        $owner = $this->userWithRole('member');
        $other = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $property = Property::factory()->published()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($other, 'sanctum')
            ->putJson("/api/v1/my/properties/{$property->id}", ['title' => 'Tiêu đề mới của kẻ tấn công đủ dài để qua validate'])
            ->assertForbidden();
    }

    public function test_member_khong_xoa_duoc_tin_cua_nguoi_khac(): void
    {
        $owner = $this->userWithRole('member');
        $other = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $property = Property::factory()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/v1/my/properties/{$property->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('properties', ['id' => $property->id, 'deleted_at' => null]);
    }

    public function test_chu_tin_xoa_duoc_tin_cua_minh(): void
    {
        $owner = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $property = Property::factory()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/v1/my/properties/{$property->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('properties', ['id' => $property->id]);
    }

    public function test_admin_sua_duoc_tin_cua_nguoi_khac(): void
    {
        $owner = $this->userWithRole('member');
        $admin = $this->userWithRole('admin');
        $base = $this->seedBaseData();

        $property = Property::factory()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/my/properties/{$property->id}", [
                'title' => 'Tiêu đề đã được quản trị viên chỉnh sửa cho đúng chuẩn',
            ])
            ->assertOk();
    }

    public function test_sua_gia_tin_da_duyet_thi_phai_duyet_lai(): void
    {
        $owner = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $property = Property::factory()->published()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
            'price' => 5_000_000_000,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/v1/my/properties/{$property->id}", ['price' => 6_000_000_000])
            ->assertOk();

        $this->assertSame(PropertyStatus::Pending, $property->fresh()->status);
    }

    public function test_gui_duyet_tin_nhap_khong_co_anh_bi_tu_choi(): void
    {
        $owner = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $property = Property::factory()->draft()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/submit")
            ->assertStatus(422)
            ->assertJsonValidationErrors('images');
    }

    public function test_an_va_hien_lai_tin_da_duyet(): void
    {
        $owner = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $property = Property::factory()->published()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/toggle-visibility")
            ->assertOk()
            ->assertJsonPath('status', 'hidden');

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/toggle-visibility")
            ->assertOk()
            ->assertJsonPath('status', 'published');
    }

    public function test_danh_sach_tin_cua_toi_chi_chua_tin_cua_minh(): void
    {
        $owner = $this->userWithRole('member');
        $other = $this->userWithRole('member');
        $base = $this->seedBaseData();

        $common = [
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ];

        Property::factory()->count(3)->create($common + ['user_id' => $owner->id]);
        Property::factory()->count(2)->create($common + ['user_id' => $other->id]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/my/properties')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }
}
