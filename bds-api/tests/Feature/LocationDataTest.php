<?php

namespace Tests\Feature;

use App\Models\District;
use App\Models\Province;
use App\Models\Ward;
use Database\Seeders\LocationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Bảo vệ dữ liệu địa giới TP.HCM khỏi bị sửa nhầm.
 * Số liệu theo Nghị quyết 1685/NQ-UBTVQH15 (hiệu lực 01/7/2025).
 */
class LocationDataTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Số phường mới của từng khu vực (quận cũ) sau sắp xếp 2025.
     * Khi bổ sung Gò Vấp (6), Bình Thạnh (5), Thủ Đức (13) thì thêm vào đây.
     */
    private const EXPECTED_WARD_COUNTS = [
        'Quận 12' => 5,
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LocationSeeder::class);
    }

    public function test_tphcm_co_dung_cac_khu_vuc_da_seed(): void
    {
        $hcmc = Province::where('code', '79')->first();

        $this->assertNotNull($hcmc, 'Phải có tỉnh/thành TP.HCM với mã 79.');
        $this->assertSame(count(self::EXPECTED_WARD_COUNTS), $hcmc->districts()->count());
    }

    public function test_moi_khu_vuc_co_dung_so_phuong_moi(): void
    {
        foreach (self::EXPECTED_WARD_COUNTS as $areaName => $expected) {
            $district = District::where('name', $areaName)->first();

            $this->assertNotNull($district, "Thiếu khu vực {$areaName}.");
            $this->assertSame(
                $expected,
                $district->wards()->count(),
                "Khu vực {$areaName} phải có {$expected} phường."
            );
        }
    }

    public function test_tong_so_phuong_tphcm_khop_tung_khu_vuc(): void
    {
        $hcmc = Province::where('code', '79')->first();

        $total = Ward::whereHas('district', fn ($q) => $q->where('province_id', $hcmc->id))->count();

        $this->assertSame(array_sum(self::EXPECTED_WARD_COUNTS), $total);
    }

    public function test_khu_vuc_duoc_danh_dau_legacy_vi_da_bo_cap_quan_huyen(): void
    {
        $this->assertSame(
            0,
            District::where('is_legacy', false)->count(),
            'Từ 01/7/2025 không còn quận/huyện, mọi bản ghi districts phải là khu vực legacy.'
        );
    }

    public function test_ten_phuong_moi_dung_theo_nghi_quyet(): void
    {
        $quan12 = District::where('name', 'Quận 12')->first();

        $this->assertEqualsCanonicalizing(
            ['Đông Hưng Thuận', 'Trung Mỹ Tây', 'Tân Thới Hiệp', 'Thới An', 'An Phú Đông'],
            $quan12->wards()->pluck('name')->all()
        );
    }

    /**
     * Chặn việc seed lại các tỉnh/thành theo địa giới trước 01/7/2025.
     * Dữ liệu quận/huyện cũ lẫn với dữ liệu thật sẽ khiến người dùng chọn nhầm
     * đơn vị hành chính không còn tồn tại.
     */
    public function test_chi_seed_tphcm_khong_lan_du_lieu_dia_gioi_cu(): void
    {
        $this->assertSame(
            ['Hồ Chí Minh'],
            Province::pluck('name')->all(),
            'Chỉ được seed TP.HCM. Muốn thêm tỉnh khác thì phải dùng dữ liệu đã cập nhật theo sắp xếp 2025.'
        );
    }

    public function test_ma_phuong_la_duy_nhat(): void
    {
        $this->assertSame(
            Ward::count(),
            Ward::distinct()->count('code'),
            'Mã phường bị trùng — sẽ hỏng khi import lại dữ liệu.'
        );
    }
}
