<?php

namespace Tests\Feature;

use App\Jobs\ProcessPropertyImage;
use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Chạy thật ProcessPropertyImage (không fake queue) để đảm bảo pipeline
 * resize → WebP → thumbnail hoạt động với Intervention Image.
 */
class ImageProcessingJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_tao_ra_ban_webp_va_thumbnail(): void
    {
        $this->seedRoles();
        $base = $this->seedBaseData();
        Storage::fake('public');

        $owner = $this->userWithRole('member');

        $property = Property::factory()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        // Ảnh 3000x2000 để kiểm tra việc thu nhỏ về tối đa 1600x1200.
        $file = UploadedFile::fake()->image('nha-lon.jpg', 3000, 2000);
        $path = $file->store("properties/{$property->id}", 'public');

        $image = $property->images()->create([
            'path' => $path,
            'is_primary' => true,
            'sort_order' => 1,
            'is_processed' => false,
        ]);

        (new ProcessPropertyImage($image->id))->handle();

        $image->refresh();

        $this->assertTrue($image->is_processed);
        $this->assertNotNull($image->path_webp);
        $this->assertNotNull($image->path_thumb);
        Storage::disk('public')->assertExists($image->path_webp);
        Storage::disk('public')->assertExists($image->path_thumb);

        // Kiểm tra kích thước thực tế sau khi xử lý.
        $webp = getimagesizefromstring(Storage::disk('public')->get($image->path_webp));
        $thumb = getimagesizefromstring(Storage::disk('public')->get($image->path_thumb));

        $this->assertLessThanOrEqual(1600, $webp[0]);
        $this->assertLessThanOrEqual(1200, $webp[1]);
        $this->assertSame(400, $thumb[0]);
        $this->assertSame(300, $thumb[1]);
    }

    public function test_anh_lon_duoc_chen_watermark_con_thumbnail_thi_khong(): void
    {
        $this->seedRoles();
        $base = $this->seedBaseData();
        Storage::fake('public');

        // Watermark thật đi kèm repo; nếu thiếu file thì bỏ qua để CI không đỏ oan.
        $watermark = config('bds.image.watermark_path');

        if (blank($watermark) || ! file_exists($watermark)) {
            $this->markTestSkipped('Chưa cấu hình file watermark.');
        }

        $owner = $this->userWithRole('member');

        $property = Property::factory()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $file = UploadedFile::fake()->image('nha.jpg', 1600, 1200);
        $path = $file->store("properties/{$property->id}", 'public');

        $image = $property->images()->create([
            'path' => $path,
            'is_primary' => true,
            'sort_order' => 1,
        ]);

        (new ProcessPropertyImage($image->id))->handle();

        $image->refresh();

        $disk = Storage::disk('public');
        $large = imagecreatefromstring($disk->get($image->path_webp));
        $thumb = imagecreatefromstring($disk->get($image->path_thumb));

        // Ảnh fake của Laravel là nền trơn, nên vùng góc phải dưới chỉ nhiều màu
        // khi thực sự có watermark.
        $this->assertTrue(
            $this->hasVisibleContent($large, 0.75, 0.99),
            'Ảnh lớn phải có watermark ở góc phải dưới.'
        );

        // Thumbnail 400px nhỏ hơn watermark_min_width nên phải sạch.
        $this->assertFalse(
            $this->hasVisibleContent($thumb, 0.75, 0.99),
            'Thumbnail không được chèn watermark.'
        );
    }

    /** Đếm số màu khác nhau trong một vùng ảnh để phát hiện watermark. */
    private function hasVisibleContent(\GdImage $image, float $fromRatio, float $toRatio): bool
    {
        $w = imagesx($image);
        $h = imagesy($image);

        $colors = [];

        for ($x = (int) ($w * $fromRatio); $x < (int) ($w * $toRatio); $x += 3) {
            for ($y = (int) ($h * $fromRatio); $y < (int) ($h * $toRatio); $y += 3) {
                $colors[imagecolorat($image, $x, $y)] = true;
            }
        }

        return count($colors) > 5;
    }

    public function test_job_khong_loi_khi_file_khong_ton_tai(): void
    {
        $this->seedRoles();
        $base = $this->seedBaseData();
        Storage::fake('public');

        $owner = $this->userWithRole('member');

        $property = Property::factory()->create([
            'user_id' => $owner->id,
            'category_id' => $base['category']->id,
            'province_id' => $base['province']->id,
            'district_id' => $base['district']->id,
        ]);

        $image = $property->images()->create([
            'path' => 'properties/khong-ton-tai.jpg',
            'sort_order' => 1,
        ]);

        (new ProcessPropertyImage($image->id))->handle();

        $this->assertFalse($image->fresh()->is_processed);
    }
}
