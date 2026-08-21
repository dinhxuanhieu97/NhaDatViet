<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Cache trang danh sách tin công khai (`GET /properties`) — chỉ cache mảng
 * JSON đã resolve() xong (giống `CategoryController`/`LocationController`),
 * KHÔNG bao giờ cache Collection/Model Eloquent thô (xem CLAUDE.md §4.15 —
 * bài học cache DB gãy unserialize() sau `migrate:fresh --seed`).
 *
 * Dùng chiến lược "khóa theo phiên bản" thay vì `Cache::tags()`: driver cache
 * khác nhau giữa môi trường (test dùng `array`, dev dùng `database`, production
 * dùng `redis` theo `.env.example`) — `array`/`database` không hỗ trợ tags,
 * còn tăng một số nguyên (`Cache::increment()`) thì driver nào cũng làm được.
 * Mọi khóa cache đều gắn số phiên bản hiện tại; khi tin đổi trạng thái, tăng
 * phiên bản khiến TOÀN BỘ khóa cũ (dù chưa hết TTL) lập tức bị bỏ qua mà
 * không cần biết chính xác khóa nào chứa tin vừa đổi.
 *
 * Hạn chế đã biết: `bds:expire-properties` (cron) đổi trạng thái bằng
 * `Property::query()->update()` — mass update không kích hoạt Eloquent event
 * nên không tự tăng phiên bản. Chấp nhận được vì `scopePublic()` đã tự loại
 * tin hết hạn theo `expired_at` ngay ở tầng query — TTL ngắn (`listing_ttl_seconds`)
 * là lưới an toàn cho đúng khoảng trễ này, cùng triết lý với cache
 * category/location hiện có trong dự án. Xem CLAUDE.md §4.25.
 */
class PropertyListingCache
{
    private const VERSION_KEY = 'properties:listing:version';

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public static function remember(array $filters, int $page, int $perPage, Closure $resolve): array
    {
        $key = self::key($filters, $page, $perPage);

        try {
            $cached = Cache::get($key);

            if (is_array($cached)) {
                return $cached;
            }
        } catch (Throwable) {
            // Cache hỏng (vd. đổi driver giữa chừng) — bỏ qua, tính lại bên dưới.
        }

        $data = $resolve();

        Cache::put($key, $data, now()->addSeconds((int) config('bds.cache.listing_ttl_seconds', 120)));

        return $data;
    }

    /** Gọi khi một tin đổi trạng thái (duyệt / từ chối / tự ẩn do báo cáo / tạo mới đã công khai...). */
    public static function invalidate(): void
    {
        // Driver `redis` tự khởi tạo INCR từ 0 nếu khóa chưa có, nhưng driver
        // `database`/`array` KHÔNG — `DatabaseStore::increment()` trả `false`
        // thẳng khi khóa chưa tồn tại thay vì tạo mới (đọc source mới phát
        // hiện, không như tài liệu ngầm định). `Cache::add()` chỉ ghi khi
        // khóa chưa có (put-if-absent, an toàn gọi nhiều lần) nên đảm bảo
        // khóa luôn tồn tại trước khi tăng, hoạt động thống nhất trên mọi driver.
        Cache::add(self::VERSION_KEY, 0);
        Cache::increment(self::VERSION_KEY);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private static function key(array $filters, int $page, int $perPage): string
    {
        ksort($filters);

        $payload = $filters + ['page' => $page, 'per_page' => $perPage];

        return 'properties:listing:v'.self::version().':'.md5(json_encode($payload));
    }

    private static function version(): int
    {
        return (int) (Cache::get(self::VERSION_KEY) ?? 0);
    }
}
