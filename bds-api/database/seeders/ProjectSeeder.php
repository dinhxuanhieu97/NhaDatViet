<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Project;
use App\Support\VietnameseText;
use Illuminate\Database\Seeder;

/**
 * Dự án bất động sản có thật tại khu vực đang được seed (hiện là Quận 12, TP.HCM).
 * Toạ độ lấy xấp xỉ vị trí thực tế để tính năng tìm theo bán kính cho kết quả hợp lý.
 *
 * Cấu trúc: [tên, chủ đầu tư, mã khu vực, lat, lng, trạng thái, quy mô (ha), số căn]
 */
class ProjectSeeder extends Seeder
{
    private const DATA = [
        // Quận 12
        ['Picity High Park', 'Pi Group', '79Q12', 10.8690, 106.6570, 'selling', 8.6, 3000],
        ['Prosper Plaza', 'Đất Xanh', '79Q12', 10.8420, 106.6280, 'handed_over', 1.4, 700],
        ['Thái An Apartment', 'Đất Xanh', '79Q12', 10.8390, 106.6320, 'handed_over', 2.0, 900],
        ['Tô Ký Tower', 'Bảo Sơn', '79Q12', 10.8580, 106.6220, 'handed_over', 0.8, 400],
        // TODO: dự án tại Gò Vấp, Bình Thạnh, Thủ Đức — bổ sung cùng lúc với địa giới.
    ];

    public function run(): void
    {
        foreach (self::DATA as [$name, $developer, $areaCode, $lat, $lng, $status, $area, $units]) {
            $district = District::where('code', $areaCode)->first();

            if (! $district) {
                continue;
            }

            Project::updateOrCreate(
                ['slug' => VietnameseText::slug($name)],
                [
                    'name' => $name,
                    'developer' => $developer,
                    'province_id' => $district->province_id,
                    'district_id' => $district->id,
                    'address' => $name.', '.$district->name.', TP.HCM',
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'description' => sprintf(
                        'Dự án %s do %s phát triển tại khu vực %s, TP.HCM. '
                        .'Quy mô %s ha với khoảng %s căn hộ.',
                        $name,
                        $developer,
                        $district->name,
                        number_format($area, 1, ',', '.'),
                        number_format($units, 0, ',', '.')
                    ),
                    'total_area' => $area,
                    'total_units' => $units,
                    'status' => $status,
                    'is_featured' => true,
                ]
            );
        }
    }
}
