<?php

namespace App\Jobs;

use App\Models\PropertyImage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Alignment;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\ImageInterface;

/**
 * Resize → chèn watermark → xuất WebP + thumbnail cho ảnh tin đăng.
 * Chạy nền qua queue để không làm chậm request upload.
 */
class ProcessPropertyImage implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(public int $imageId) {}

    public function handle(): void
    {
        $image = PropertyImage::find($this->imageId);

        if (! $image) {
            return;
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($image->path)) {
            Log::warning("ProcessPropertyImage: không tìm thấy file {$image->path}");

            return;
        }

        $config = config('bds.image');
        $manager = new ImageManager(new Driver);

        $encoder = new WebpEncoder(quality: (int) $config['webp_quality']);

        $source = $manager->decodePath($disk->path($image->path));

        // 1. Resize giữ tỷ lệ, không phóng to ảnh nhỏ.
        $source->scaleDown(
            width: (int) $config['max_width'],
            height: (int) $config['max_height'],
        );

        // 2. Chèn watermark (chỉ với ảnh lớn — thumbnail quá nhỏ để đọc được chữ).
        $this->applyWatermark($source, $manager, $config);

        // 3. Xuất bản WebP.
        $webpPath = preg_replace('/\.[^.]+$/', '', $image->path).'.webp';
        $disk->put($webpPath, (string) $source->encode($encoder));

        // 4. Xuất thumbnail (cắt đúng khung 400×300).
        $thumbPath = preg_replace('/\.[^.]+$/', '', $image->path).'_thumb.webp';
        $thumb = $manager->decodePath($disk->path($image->path))
            ->cover((int) $config['thumb_width'], (int) $config['thumb_height']);
        $disk->put($thumbPath, (string) $thumb->encode($encoder));

        $image->update([
            'path_webp' => $webpPath,
            'path_thumb' => $thumbPath,
            'is_processed' => true,
        ]);
    }

    /**
     * Chèn watermark vào góc phải dưới, co giãn theo bề rộng ảnh để trên ảnh
     * nào cũng chiếm cùng một tỷ lệ thị giác.
     *
     * @param  array<string, mixed>  $config
     */
    private function applyWatermark(ImageInterface $image, ImageManager $manager, array $config): void
    {
        $path = $config['watermark_path'] ?? null;

        if (blank($path) || ! file_exists($path)) {
            return;
        }

        // Ảnh quá nhỏ thì watermark chiếm chỗ mà không đọc được.
        if ($image->width() < (int) $config['watermark_min_width']) {
            return;
        }

        $targetWidth = (int) round($image->width() * (float) $config['watermark_ratio']);

        $watermark = $manager->decodePath($path)->scale(width: $targetWidth);

        $margin = (int) $config['watermark_margin'];

        $image->insert(
            image: $watermark,
            x: $margin,
            y: $margin,
            alignment: Alignment::BOTTOM_RIGHT,
            transparency: (float) $config['watermark_opacity'],
        );
    }

    public function failed(\Throwable $e): void
    {
        Log::error("ProcessPropertyImage thất bại cho image #{$this->imageId}: ".$e->getMessage());
    }
}
