<?php

namespace App\Support;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Chống đếm trùng lượt xem tin (`views_count`): xem đi xem lại cùng một tin
 * trong thời gian ngắn (F5 liên tục, double-click, bot quét) chỉ được tính 1
 * lượt. Đánh dấu "đã xem" qua `Cache` (Redis ở production theo
 * `.env.example`) — dùng `Cache::add()` (put-if-absent) làm "cổng" quyết
 * định có tính lượt xem mới hay không, cùng triết lý cache-qua-Redis với
 * `PropertyListingCache` (CLAUDE.md §4.25) nhưng không phụ thuộc cứng vào
 * extension Redis lúc test/dev.
 */
class PropertyViewCounter
{
    /**
     * true = lượt xem mới trong cửa sổ chống trùng, gọi nơi này thì NÊN
     * `increment('views_count')`. false = đã xem gần đây, bỏ qua.
     */
    public static function shouldCount(Request $request, Property $property): bool
    {
        $visitor = self::visitorKey($request);
        $key = "property:viewed:{$property->id}:{$visitor}";
        $ttl = now()->addMinutes((int) config('bds.view_dedupe_minutes', 30));

        return Cache::add($key, true, $ttl);
    }

    /**
     * Người dùng đã đăng nhập: định danh theo user id (ổn định qua nhiều
     * thiết bị/mạng khác nhau). Khách vãng lai: định danh theo IP — thô hơn
     * (nhiều người dùng chung IP sau NAT/wifi công cộng sẽ bị gộp chung 1
     * lượt xem trong cửa sổ chống trùng) nhưng không cần cookie/session để
     * hoạt động, phù hợp API stateless của dự án.
     *
     * `user('sanctum')` — không dùng `user()` mặc định vì route này công khai
     * (không có middleware `auth:sanctum` chuyển guard mặc định), nên
     * `user()` luôn resolve qua guard 'web' (session) và trả null với client
     * API thật gửi Bearer token. Xem CLAUDE.md §4.26.
     */
    private static function visitorKey(Request $request): string
    {
        $user = $request->user('sanctum');

        return $user !== null ? 'user:'.$user->id : 'ip:'.$request->ip();
    }
}
