<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\District;
use App\Models\Property;
use App\Models\Province;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kiểm tra 2 tính năng độc lập cùng thêm một lượt: validate số điện thoại
 * theo đúng đầu số nhà mạng (App\Support\VietnamesePhone) và chống spam/bot
 * bằng honeypot + đo thời gian điền form (App\Support\SpamGuard). Xem
 * CLAUDE.md §4.23 và §4.24.
 */
class AntiSpamAndPhoneValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    private function make(): Property
    {
        $owner = $this->userWithRole('agent');
        $province = Province::factory()->create();
        $district = District::factory()->create(['province_id' => $province->id]);
        $category = Category::factory()->type('house', 'sale')->create();

        return Property::factory()->published()->create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'province_id' => $province->id,
            'district_id' => $district->id,
        ]);
    }

    private function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Người dùng mới',
            'email' => 'nguoidungmoi@example.com',
            'phone' => '0912345678',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
            ...$this->bdsAntiSpamBypass(),
        ], $overrides);
    }

    // --- VietnamesePhone::REGEX ---------------------------------------------

    public function test_dau_so_di_dong_moi_duoc_cap_phep_thi_hop_le(): void
    {
        // Vietnamobile (052), Gmobile (059), iTel (087), Wintel/Reddi (055) —
        // đều là đầu số 3 chữ số đang được cấp phép nhưng không lọt qua nếu
        // chỉ check độ dài chung chung như quy tắc validate cũ.
        foreach (['0521234567', '0591234567', '0871234567', '0551234567'] as $phone) {
            $this->postJson('/api/v1/auth/register', $this->registerPayload([
                'email' => "hople_{$phone}@example.com",
                'phone' => $phone,
            ]))->assertCreated();
        }
    }

    public function test_dau_so_chua_tung_duoc_cap_bi_tu_choi(): void
    {
        // 060x, 095x, 057x: đúng 10 số, đúng dạng 0[khác 0]xxxxxxxx nhưng
        // chưa từng được Bộ TT&TT cấp cho nhà mạng nào — chỉ check độ dài sẽ
        // lọt qua sai, còn regex theo đầu số thật phải từ chối.
        foreach (['0601234567', '0951234567', '0571234567'] as $phone) {
            $this->postJson('/api/v1/auth/register', $this->registerPayload([
                'email' => "saiso_{$phone}@example.com",
                'phone' => $phone,
            ]))->assertStatus(422)->assertJsonValidationErrors('phone');
        }
    }

    public function test_so_co_dinh_dang_02x_bi_tu_choi_khi_dang_ky(): void
    {
        // Đầu số cố định (Hà Nội 024, TP.HCM 028...) có 10-11 số nhưng không
        // phải số di động — phải bị từ chối dù dài đúng 10 số.
        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'phone' => '0241234567',
        ]))->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_dau_so_hop_le_duoc_chap_nhan_khi_gui_lien_he(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/contact", [
            'name' => 'Người mua',
            'phone' => '0561234567', // Vietnamobile
            ...$this->bdsAntiSpamBypass(),
        ])->assertCreated();

        $this->assertDatabaseHas('property_contacts', [
            'property_id' => $property->id,
            'phone' => '0561234567',
        ]);
    }

    // --- SpamGuard: honeypot -------------------------------------------------

    public function test_dien_honeypot_khi_gui_lien_he_thi_tra_thanh_cong_gia_khong_luu(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/contact", [
            'name' => 'Bot',
            'phone' => '0912345678',
            'website' => 'http://spam.example', // honeypot bị điền → nghi bot
            ...$this->bdsAntiSpamBypass(),
        ])->assertCreated(); // vẫn 201 "thành công giả" để không lộ cho bot

        $this->assertDatabaseMissing('property_contacts', [
            'property_id' => $property->id,
            'phone' => '0912345678',
        ]);
    }

    public function test_dien_honeypot_khi_dang_ky_thi_bi_tu_choi_khong_tao_tai_khoan(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'email' => 'bot-honeypot@example.com',
            'website' => 'http://spam.example',
        ]))->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'bot-honeypot@example.com']);
    }

    public function test_dien_honeypot_khi_bao_cao_thi_tra_thanh_cong_gia_khong_luu(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/report", [
            'reason' => 'spam',
            'website' => 'http://spam.example',
            ...$this->bdsAntiSpamBypass(),
        ])->assertCreated();

        $this->assertDatabaseCount('property_reports', 0);
    }

    // --- SpamGuard: submit quá nhanh so với lúc form hiện ra -----------------

    public function test_gui_lien_he_qua_nhanh_bi_coi_la_bot(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/contact", [
            'name' => 'Bot nhanh',
            'phone' => '0912345678',
            // form vừa hiện ra ngay trước khi submit — người thật không thể
            // đọc + gõ nhanh vậy (ngưỡng min_fill_ms mặc định 2000ms).
            'form_rendered_at' => (int) round(microtime(true) * 1000),
        ])->assertCreated(); // thành công giả

        $this->assertDatabaseMissing('property_contacts', [
            'property_id' => $property->id,
            'phone' => '0912345678',
        ]);
    }

    public function test_dang_ky_qua_nhanh_bi_coi_la_bot(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'email' => 'bot-nhanh@example.com',
            'form_rendered_at' => (int) round(microtime(true) * 1000),
        ]))->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'bot-nhanh@example.com']);
    }

    public function test_thieu_form_rendered_at_bi_coi_la_bot(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/contact", [
            'name' => 'Không có mốc thời gian',
            'phone' => '0912345678',
        ])->assertCreated(); // thành công giả

        $this->assertDatabaseMissing('property_contacts', [
            'property_id' => $property->id,
            'phone' => '0912345678',
        ]);
    }

    // --- Trường hợp hợp lệ: honeypot rỗng + đủ thời gian điền -----------------

    public function test_gui_lien_he_hop_le_van_hoat_dong_binh_thuong(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/contact", [
            'name' => 'Người mua thật',
            'phone' => '0912345678',
            'website' => '', // honeypot để trống — đúng hành vi người dùng thật
            ...$this->bdsAntiSpamBypass(),
        ])->assertCreated();

        $this->assertDatabaseHas('property_contacts', [
            'property_id' => $property->id,
            'phone' => '0912345678',
        ]);
    }
}
