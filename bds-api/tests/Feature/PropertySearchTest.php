<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\District;
use App\Models\Property;
use App\Models\Province;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertySearchTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected Province $hanoi;

    protected District $thanhXuan;

    protected District $hoanKiem;

    protected Category $banChungCu;

    protected Category $banNha;

    protected Category $thueNha;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();

        $this->owner = $this->userWithRole('agent');

        $this->hanoi = Province::factory()->create(['name' => 'Hà Nội', 'slug' => 'ha-noi']);
        $this->thanhXuan = District::factory()->create([
            'province_id' => $this->hanoi->id, 'name' => 'Thanh Xuân', 'slug' => 'thanh-xuan',
        ]);
        $this->hoanKiem = District::factory()->create([
            'province_id' => $this->hanoi->id, 'name' => 'Hoàn Kiếm', 'slug' => 'hoan-kiem',
        ]);

        $this->banChungCu = Category::factory()->type('apartment', 'sale')->create(['name' => 'Bán căn hộ chung cư']);
        $this->banNha = Category::factory()->type('house', 'sale')->create(['name' => 'Bán nhà riêng']);
        $this->thueNha = Category::factory()->type('house', 'rent')->create(['name' => 'Cho thuê nhà riêng']);
    }

    private function make(array $attrs = []): Property
    {
        return Property::factory()->published()->create(array_merge([
            'user_id' => $this->owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
        ], $attrs));
    }

    public function test_chi_tra_ve_tin_da_duyet(): void
    {
        $this->make();
        Property::factory()->create([  // pending
            'user_id' => $this->owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
        ]);

        $this->getJson('/api/v1/properties')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_khong_tra_ve_tin_het_han(): void
    {
        Property::factory()->expired()->create([
            'user_id' => $this->owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
        ]);

        $this->getJson('/api/v1/properties')->assertJsonCount(0, 'data');
    }

    public function test_loc_theo_nhu_cau_ban_hoac_thue(): void
    {
        $this->make(['category_id' => $this->banNha->id, 'listing_type' => 'sale']);
        $this->make(['category_id' => $this->thueNha->id, 'listing_type' => 'rent']);

        $this->getJson('/api/v1/properties?listing_type=rent')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.listing_type', 'rent');
    }

    public function test_loc_theo_loai_hinh_bat_dong_san(): void
    {
        $this->make(['category_id' => $this->banChungCu->id]);
        $this->make(['category_id' => $this->banNha->id]);

        $this->getJson('/api/v1/properties?type=apartment')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category.type', 'apartment');
    }

    public function test_loc_theo_khu_vuc(): void
    {
        $this->make(['district_id' => $this->thanhXuan->id]);
        $this->make(['district_id' => $this->hoanKiem->id]);
        $this->make(['district_id' => $this->hoanKiem->id]);

        $this->getJson("/api/v1/properties?district_id={$this->hoanKiem->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson("/api/v1/properties?province_id={$this->hanoi->id}")
            ->assertJsonCount(3, 'data');
    }

    public function test_loc_theo_khoang_gia(): void
    {
        $this->make(['price' => 1_000_000_000]);
        $this->make(['price' => 2_500_000_000]);
        $this->make(['price' => 9_000_000_000]);

        $this->getJson('/api/v1/properties?price_min=2000000000&price_max=3000000000')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.price', 2500000000);
    }

    public function test_loc_theo_dien_tich_va_so_phong_ngu(): void
    {
        $this->make(['area' => 40, 'bedrooms' => 1]);
        $this->make(['area' => 80, 'bedrooms' => 3]);
        $this->make(['area' => 150, 'bedrooms' => 5]);

        $this->getJson('/api/v1/properties?area_min=60&area_max=200&bedrooms=3')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_kich_ban_nghiem_thu_chung_cu_ha_noi_2pn_gia_2_den_3_ty(): void
    {
        // Khớp
        $this->make([
            'category_id' => $this->banChungCu->id,
            'district_id' => $this->thanhXuan->id,
            'bedrooms' => 2,
            'price' => 2_800_000_000,
        ]);
        // Lệch giá
        $this->make(['category_id' => $this->banChungCu->id, 'bedrooms' => 2, 'price' => 5_000_000_000]);
        // Lệch số phòng
        $this->make(['category_id' => $this->banChungCu->id, 'bedrooms' => 1, 'price' => 2_500_000_000]);
        // Lệch loại hình
        $this->make(['category_id' => $this->banNha->id, 'bedrooms' => 2, 'price' => 2_500_000_000]);

        $this->getJson(
            '/api/v1/properties?type=apartment&listing_type=sale'
            ."&province_id={$this->hanoi->id}&bedrooms=2&price_min=2000000000&price_max=3000000000"
        )
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.price', 2800000000);
    }

    public function test_tim_kiem_toan_van_khong_phan_biet_dau(): void
    {
        $this->make(['title' => 'Bán nhà mặt phố Nguyễn Trãi Thanh Xuân cực đẹp giá tốt']);
        $this->make(['title' => 'Bán căn hộ chung cư Vinhomes Smart City đầy đủ nội thất']);

        // Không dấu
        $this->getJson('/api/v1/properties?q=nguyen+trai')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Có dấu
        $this->getJson('/api/v1/properties?q='.urlencode('Nguyễn Trãi'))
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Viết HOA
        $this->getJson('/api/v1/properties?q='.urlencode('VINHOMES'))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_sap_xep_theo_do_lien_quan_uu_tien_khop_o_tieu_de(): void
    {
        // Khớp từ khóa ở PHẦN MÔ TẢ (search_text nối title trước, description
        // sau — khớp càng muộn trong chuỗi thì INSTR() càng lớn, liên quan
        // càng thấp) — tạo trước để nếu sort mặc định (mới nhất) vẫn đang được
        // dùng nhầm thì test này sẽ thấy sai thứ tự.
        $khopMoTa = $this->make([
            'title' => 'Bán nhà mặt phố Thanh Xuân view đẹp',
            'description' => 'Gần Vinhomes Smart City, tiện di chuyển, an ninh tốt.',
        ]);

        // Khớp từ khóa ngay TIÊU ĐỀ — phải xếp lên trước dù tạo sau (mới hơn
        // không quyết định thứ tự khi sort=relevance).
        $khopTieuDe = $this->make([
            'title' => 'Bán căn hộ Vinhomes Smart City đầy đủ nội thất',
            'description' => 'Căn góc view hồ, sổ hồng riêng, sẵn sàng dọn vào ở ngay.',
        ]);

        $response = $this->getJson('/api/v1/properties?q=vinhomes&sort=relevance')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $response->assertJsonPath('data.0.id', $khopTieuDe->id)
            ->assertJsonPath('data.1.id', $khopMoTa->id);
    }

    public function test_sort_relevance_khong_co_tu_khoa_thi_roi_ve_mac_dinh(): void
    {
        // Không có `q` thì "relevance" không có ý nghĩa gì để xếp — không được
        // lỗi 500, phải rơi về hành vi mặc định (tin mới nhất trước).
        $cu = $this->make();
        $moi = $this->make();

        $this->getJson('/api/v1/properties?sort=relevance')
            ->assertOk()
            ->assertJsonPath('data.0.id', $moi->id)
            ->assertJsonPath('data.1.id', $cu->id);
    }

    public function test_tim_kiem_theo_ban_kinh_toa_do(): void
    {
        // Hồ Gươm: 21.0287, 105.8524
        $this->make(['latitude' => 21.0287, 'longitude' => 105.8524]);  // 0 km
        $this->make(['latitude' => 21.0500, 'longitude' => 105.8600]);  // ~2.4 km
        $this->make(['latitude' => 21.2000, 'longitude' => 106.0000]);  // ~24 km

        $this->getJson('/api/v1/properties?lat=21.0287&lng=105.8524&radius=5')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/properties?lat=21.0287&lng=105.8524&radius=50')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_sap_xep_theo_gia_tang_dan_va_giam_dan(): void
    {
        $this->make(['price' => 3_000_000_000]);
        $this->make(['price' => 1_000_000_000]);
        $this->make(['price' => 2_000_000_000]);

        $this->getJson('/api/v1/properties?sort=price_asc')
            ->assertOk()
            ->assertJsonPath('data.0.price', 1000000000);

        $this->getJson('/api/v1/properties?sort=price_desc')
            ->assertOk()
            ->assertJsonPath('data.0.price', 3000000000);
    }

    public function test_phan_trang_hoat_dong_dung(): void
    {
        Property::factory()->count(25)->published()->create([
            'user_id' => $this->owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
        ]);

        $this->getJson('/api/v1/properties?per_page=10')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.last_page', 3);
    }

    public function test_bo_loc_khong_hop_le_bi_tu_choi(): void
    {
        $this->getJson('/api/v1/properties?price_min=5000000000&price_max=1000000000')
            ->assertStatus(422)
            ->assertJsonValidationErrors('price_max');

        $this->getJson('/api/v1/properties?listing_type=khong-ton-tai')
            ->assertStatus(422);
    }

    public function test_api_ban_do_tra_ve_marker(): void
    {
        $this->make(['latitude' => 21.0287, 'longitude' => 105.8524]);
        $this->make(['latitude' => null, 'longitude' => null]);

        $this->getJson('/api/v1/properties/map')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.count', 1)
            ->assertJsonStructure(['data' => [['id', 'slug', 'title', 'price_text', 'lat', 'lng']]]);
    }

    public function test_xem_chi_tiet_tin_tang_luot_xem(): void
    {
        $property = $this->make(['views_count' => 5]);

        $this->getJson("/api/v1/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', $property->slug);

        $this->assertSame(6, $property->fresh()->views_count);
    }

    public function test_xem_lai_tin_trong_thoi_gian_ngan_khong_tinh_them_luot_xem(): void
    {
        $property = $this->make(['views_count' => 0]);

        // Cùng client test (cùng IP mặc định của bộ test HTTP) — F5/xem lại
        // nhiều lần liên tiếp chỉ được tính 1 lượt trong cửa sổ chống trùng.
        $this->getJson("/api/v1/properties/{$property->slug}")->assertOk();
        $this->getJson("/api/v1/properties/{$property->slug}")->assertOk();
        $this->getJson("/api/v1/properties/{$property->slug}")->assertOk();

        $this->assertSame(1, $property->fresh()->views_count);
    }

    public function test_hai_nguoi_dang_nhap_khac_nhau_xem_cung_tin_tinh_2_luot_xem(): void
    {
        $property = $this->make(['views_count' => 0]);

        $a = $this->userWithRole('member');
        $b = $this->userWithRole('member');

        $this->actingAs($a, 'sanctum')->getJson("/api/v1/properties/{$property->slug}")->assertOk();
        $this->actingAs($b, 'sanctum')->getJson("/api/v1/properties/{$property->slug}")->assertOk();

        $this->assertSame(2, $property->fresh()->views_count);
    }

    public function test_cung_mot_nguoi_dang_nhap_xem_lai_khong_tinh_them_luot_xem(): void
    {
        $property = $this->make(['views_count' => 0]);
        $user = $this->userWithRole('member');

        $this->actingAs($user, 'sanctum')->getJson("/api/v1/properties/{$property->slug}")->assertOk();
        $this->actingAs($user, 'sanctum')->getJson("/api/v1/properties/{$property->slug}")->assertOk();

        $this->assertSame(1, $property->fresh()->views_count);
    }

    public function test_khach_khong_xem_duoc_tin_chua_duyet(): void
    {
        $property = Property::factory()->create([
            'user_id' => $this->owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
        ]);

        $this->getJson("/api/v1/properties/{$property->slug}")->assertNotFound();
    }

    public function test_chu_tin_dung_bearer_token_that_van_xem_duoc_tin_chua_duyet_cua_minh(): void
    {
        // Cố tình dùng `withToken()` (Bearer token thật) thay vì `actingAs()`.
        // `actingAs($user, 'sanctum')` tự chuyển guard MẶC ĐỊNH của request
        // sang 'sanctum' (`Auth::shouldUse()`), che giấu mất trường hợp thật:
        // route `GET /properties/{slug}` không có middleware `auth:sanctum`
        // nên không có gì tự chuyển guard — nếu controller lỡ gọi
        // `$request->user()` (không tham số) thay vì `user('sanctum')`, test
        // dùng actingAs vẫn xanh trong khi client API thật gửi Bearer token
        // lại bị coi là khách vãng lai. Đây chính là bug đã gặp khi live-verify
        // tính năng đếm view (CLAUDE.md §4.26) — test này khóa lại hành vi đúng.
        $property = Property::factory()->create([
            'user_id' => $this->owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
            'status' => 'pending',
        ]);

        $token = $this->owner->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson("/api/v1/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', $property->slug);
    }

    public function test_gui_lien_he_bang_bearer_token_that_luu_dung_user_id(): void
    {
        // Cùng lý do dùng withToken() thay actingAs() ở test phía trên.
        $property = $this->make();
        $buyer = $this->userWithRole('member');
        $token = $buyer->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/properties/{$property->slug}/contact", [
                'name' => 'Người mua đã đăng nhập',
                'phone' => '0912345678',
                ...$this->bdsAntiSpamBypass(),
            ])
            ->assertCreated();

        $this->assertDatabaseHas('property_contacts', [
            'property_id' => $property->id,
            'user_id' => $buyer->id,
        ]);
    }

    public function test_bao_cao_bang_bearer_token_that_ghi_dung_reporter_id(): void
    {
        // Cùng lý do dùng withToken() thay actingAs() ở 2 test phía trên.
        $property = $this->make();
        $reporter = $this->userWithRole('member');
        $token = $reporter->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/properties/{$property->slug}/report", [
                'reason' => 'spam',
                ...$this->bdsAntiSpamBypass(),
            ])
            ->assertCreated();

        $this->assertDatabaseHas('property_reports', [
            'property_id' => $property->id,
            'reporter_id' => $reporter->id,
        ]);
    }

    public function test_khach_chi_thay_so_dien_thoai_da_che(): void
    {
        $property = $this->make(['contact_phone' => '0912345678']);

        $this->getJson("/api/v1/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.contact_phone', '091xxxx678');

        $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/v1/properties/{$property->slug}")
            ->assertJsonPath('data.contact_phone', '0912345678');
    }

    public function test_bam_hien_so_tra_ve_so_that_khong_bi_che(): void
    {
        $property = $this->make(['contact_phone' => '0912345678']);

        // Danh sách/chi tiết vẫn phải che số — endpoint reveal-phone riêng
        // biệt mới trả số thật, đúng bởi hành động chủ động (bấm gọi/Zalo)
        // chứ không lộ sẵn trong payload để hạn chế bot quét hàng loạt.
        $this->getJson("/api/v1/properties/{$property->slug}")
            ->assertJsonPath('data.contact_phone', '091xxxx678');

        $this->getJson("/api/v1/properties/{$property->slug}/reveal-phone")
            ->assertOk()
            ->assertJsonPath('data.phone', '0912345678');
    }

    public function test_khong_hien_so_cho_tin_chua_duyet(): void
    {
        $property = Property::factory()->create([
            'user_id' => $this->owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
        ]);

        $this->getJson("/api/v1/properties/{$property->slug}/reveal-phone")->assertNotFound();
    }

    public function test_tra_ve_zalo_va_facebook_khong_bi_che(): void
    {
        $property = $this->make([
            'contact_zalo' => '0987654321',
            'contact_facebook' => 'https://facebook.com/nguoiban',
        ]);

        $this->getJson("/api/v1/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.contact_zalo', '0987654321')
            ->assertJsonPath('data.contact_facebook', 'https://facebook.com/nguoiban');
    }

    public function test_tra_ve_kenh_mang_xa_hoi_cua_nguoi_dang_tren_tin(): void
    {
        $this->owner->update([
            'social_tiktok' => 'https://tiktok.com/@nguoiban',
            'social_youtube' => 'https://youtube.com/@nguoiban',
            'social_instagram' => 'https://instagram.com/nguoiban',
        ]);
        $property = $this->make();

        $this->getJson("/api/v1/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.user.social_tiktok', 'https://tiktok.com/@nguoiban')
            ->assertJsonPath('data.user.social_youtube', 'https://youtube.com/@nguoiban')
            ->assertJsonPath('data.user.social_instagram', 'https://instagram.com/nguoiban');
    }

    public function test_khong_dien_kenh_mang_xa_hoi_thi_tra_ve_rong(): void
    {
        // $this->owner mặc định không có social_* (chưa từng set) — xác nhận
        // API trả về null/rỗng chứ không lỗi, để frontend tự ẩn nút tương ứng.
        $property = $this->make();

        $this->getJson("/api/v1/properties/{$property->slug}")
            ->assertOk()
            ->assertJsonPath('data.user.social_tiktok', null)
            ->assertJsonPath('data.user.social_youtube', null)
            ->assertJsonPath('data.user.social_instagram', null);
    }

    public function test_gui_lien_he_thanh_cong(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/contact", [
            'name' => 'Người mua',
            'phone' => '0987654321',
            'message' => 'Tôi muốn xem nhà cuối tuần này.',
            ...$this->bdsAntiSpamBypass(),
        ])->assertCreated();

        $this->assertDatabaseHas('property_contacts', [
            'property_id' => $property->id,
            'phone' => '0987654321',
        ]);
    }

    public function test_tin_bi_3_nguoi_khac_nhau_bao_cao_thi_tu_dong_bi_an(): void
    {
        $property = $this->make();

        for ($i = 0; $i < 3; $i++) {
            $reporter = $this->userWithRole('member');

            $this->actingAs($reporter, 'sanctum')
                ->postJson("/api/v1/properties/{$property->slug}/report", [
                    'reason' => 'spam',
                    ...$this->bdsAntiSpamBypass(),
                ])
                ->assertCreated();
        }

        $this->assertSame('hidden', $property->fresh()->status->value);
        $this->getJson('/api/v1/properties')->assertJsonCount(0, 'data');
    }

    public function test_mot_nguoi_bao_cao_nhieu_lan_khong_an_duoc_tin(): void
    {
        $property = $this->make();
        $attacker = $this->userWithRole('member');

        $this->actingAs($attacker, 'sanctum')
            ->postJson("/api/v1/properties/{$property->slug}/report", [
                'reason' => 'spam',
                ...$this->bdsAntiSpamBypass(),
            ])
            ->assertCreated();

        // Các lần sau bị coi là trùng, không cộng thêm vào ngưỡng ẩn tin.
        // (Giữ dưới ngưỡng throttle 10 req/giờ để kiểm đúng logic chống trùng.)
        for ($i = 0; $i < 4; $i++) {
            $this->actingAs($attacker, 'sanctum')
                ->postJson("/api/v1/properties/{$property->slug}/report", [
                    'reason' => 'spam',
                    ...$this->bdsAntiSpamBypass(),
                ])
                ->assertOk();
        }

        $this->assertSame('published', $property->fresh()->status->value);
        $this->assertSame(1, $property->fresh()->reports_count);
        $this->assertDatabaseCount('property_reports', 1);
    }

    public function test_khach_vang_lai_bao_cao_trung_bi_chan_theo_ip(): void
    {
        $property = $this->make();

        $this->postJson("/api/v1/properties/{$property->slug}/report", [
            'reason' => 'spam',
            ...$this->bdsAntiSpamBypass(),
        ])->assertCreated();

        $this->postJson("/api/v1/properties/{$property->slug}/report", [
            'reason' => 'fraud',
            ...$this->bdsAntiSpamBypass(),
        ])->assertOk();

        $this->assertDatabaseCount('property_reports', 1);
        $this->assertSame('published', $property->fresh()->status->value);
    }

    public function test_khong_luu_duoc_tin_chua_duyet_de_doc_trom_noi_dung(): void
    {
        $owner = $this->userWithRole('member');
        $attacker = $this->userWithRole('member');

        $hidden = Property::factory()->create([
            'user_id' => $owner->id,
            'category_id' => $this->banNha->id,
            'province_id' => $this->hanoi->id,
            'district_id' => $this->thanhXuan->id,
        ]);

        $this->actingAs($attacker, 'sanctum')
            ->postJson("/api/v1/my/favorites/{$hidden->id}")
            ->assertNotFound();

        $this->assertDatabaseCount('favorites', 0);
    }

    public function test_tin_da_luu_nhung_bi_go_khong_con_hien_o_danh_sach_yeu_thich(): void
    {
        $reader = $this->userWithRole('member');
        $property = $this->make();

        $this->actingAs($reader, 'sanctum')
            ->postJson("/api/v1/my/favorites/{$property->id}")
            ->assertCreated();

        $this->actingAs($reader, 'sanctum')
            ->getJson('/api/v1/my/favorites')
            ->assertJsonCount(1, 'data');

        $property->update(['status' => 'hidden']);

        $this->actingAs($reader, 'sanctum')
            ->getJson('/api/v1/my/favorites')
            ->assertJsonCount(0, 'data');
    }
}
