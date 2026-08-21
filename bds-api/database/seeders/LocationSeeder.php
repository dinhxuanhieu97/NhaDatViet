<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Province;
use App\Models\Ward;
use App\Support\VietnameseText;
use Illuminate\Database\Seeder;

/**
 * Dữ liệu địa giới hành chính.
 *
 * BỐI CẢNH PHÁP LÝ QUAN TRỌNG
 * ---------------------------
 * Từ 01/7/2025 (Nghị quyết 1685/NQ-UBTVQH15), Việt Nam bỏ cấp hành chính
 * quận/huyện. TP.HCM còn 168 phường/xã trực thuộc thành phố. Các đơn vị
 * "Quận 12", "Quận Gò Vấp", "Quận Bình Thạnh", "TP Thủ Đức" KHÔNG còn tồn tại
 * về mặt pháp lý.
 *
 * Bảng `districts` vẫn được giữ và dùng như CẤP KHU VỰC TÌM KIẾM (không phải
 * đơn vị hành chính), vì người mua bán bất động sản vẫn quen tìm theo tên quận cũ
 * ("nhà Gò Vấp", "căn hộ Thủ Đức"). Cột `districts.is_legacy` đánh dấu bản chất này.
 * Địa chỉ pháp lý đầy đủ của một tin đăng là: <phường mới> + <tỉnh/thành>.
 *
 * PHẠM VI DỮ LIỆU
 * ---------------
 * Hiện chỉ TP.HCM — khu vực Quận 12 (cũ) với đủ 5 phường mới.
 * Gò Vấp, Bình Thạnh, Thủ Đức sẽ bổ sung sau (xem TODO trong HCMC_AREAS).
 *
 * Cố ý KHÔNG seed các tỉnh/thành khác: dữ liệu quận/huyện cũ của những tỉnh đó đã bị
 * bãi bỏ từ 01/7/2025, để lẫn với dữ liệu thật sẽ khiến người dùng chọn nhầm đơn vị
 * không còn tồn tại. Muốn mở rộng thì import dữ liệu đã cập nhật, không dùng lại dữ liệu cũ.
 *
 * IMPORT PRODUCTION
 * -----------------
 * Cột `code` của các phường TP.HCM hiện dùng mã nội bộ dạng `79GV01`
 * (79 = mã tỉnh TP.HCM, GV = khu vực, 01 = số thứ tự) vì mã chính thức của
 * Cục Thống kê cho các phường mới cần đối chiếu văn bản gốc. Khi có mã chính thức,
 * cập nhật cột `code` — các quan hệ khác dùng khóa ngoại nên không bị ảnh hưởng.
 */
class LocationSeeder extends Seeder
{
    /**
     * TP.HCM — các phường mới theo Nghị quyết 1685/NQ-UBTVQH15 (hiệu lực 01/7/2025).
     *
     * Cấu trúc: [mã khu vực, tên khu vực (quận cũ), [danh sách phường mới]]
     */
    private const HCMC_AREAS = [
        ['Q12', 'Quận 12', [
            'Đông Hưng Thuận', // gộp từ Tân Thới Nhất, Tân Hưng Thuận, Đông Hưng Thuận
            'Trung Mỹ Tây',    // gộp từ Tân Chánh Hiệp, Trung Mỹ Tây
            'Tân Thới Hiệp',   // gộp từ Hiệp Thành, Tân Thới Hiệp
            'Thới An',         // gộp từ Thạnh Xuân, Thới An
            'An Phú Đông',     // gộp từ Thạnh Lộc, An Phú Đông
        ]],
        // TODO: Gò Vấp (6 phường), Bình Thạnh (5), Thủ Đức (13) — bổ sung sau.
        // Danh sách phường mới của các khu vực này đã đối chiếu NQ 1685/NQ-UBTVQH15,
        // xem lịch sử git commit a5cbbf6 để lấy lại nguyên văn khi cần.
    ];

    public function run(): void
    {
        $this->seedHoChiMinhCity();
    }

    /** TP.HCM — dữ liệu thật theo địa giới hiện hành. */
    private function seedHoChiMinhCity(): void
    {
        $hcmc = Province::updateOrCreate(
            ['code' => '79'],
            [
                'name' => 'Hồ Chí Minh',
                'slug' => 'ho-chi-minh',
                'type' => 'thanh-pho',
            ]
        );

        foreach (self::HCMC_AREAS as [$areaCode, $areaName, $wards]) {
            $district = District::updateOrCreate(
                ['code' => '79'.$areaCode],
                [
                    'province_id' => $hcmc->id,
                    'name' => $areaName,
                    'slug' => VietnameseText::slug($areaName),
                    // Khu vực tìm kiếm kế thừa tên quận cũ, không còn là ĐVHC.
                    'type' => 'khu-vuc',
                    'is_legacy' => true,
                ]
            );

            foreach ($wards as $index => $wardName) {
                Ward::updateOrCreate(
                    ['code' => sprintf('79%s%02d', $areaCode, $index + 1)],
                    [
                        'district_id' => $district->id,
                        'name' => $wardName,
                        'slug' => VietnameseText::slug($wardName),
                        'type' => 'phuong',
                    ]
                );
            }
        }
    }
}
