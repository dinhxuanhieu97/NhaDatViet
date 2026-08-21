<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Hạn mức đăng tin theo vai trò
    |--------------------------------------------------------------------------
    | Số tin đang ở trạng thái pending/published tối đa mỗi vai trò được giữ.
    | null = không giới hạn.
    */
    'post_limits' => [
        'member' => 5,
        'agent' => null,
        'moderator' => null,
        'admin' => null,
    ],

    /*
    | Số ảnh tối đa mỗi tin đăng, theo vai trò.
    */
    'image_limits' => [
        'member' => 10,
        'agent' => 20,
        'moderator' => 20,
        'admin' => 20,
    ],

    /*
    | Số ngày hiển thị của một tin sau khi được duyệt.
    */
    'publish_days' => 30,

    /*
    | Số lần bị báo cáo trước khi tin tự động bị ẩn.
    */
    'auto_hide_reports' => 3,

    /*
    | Xử lý ảnh
    */
    'image' => [
        'max_width' => 1600,
        'max_height' => 1200,
        'webp_quality' => 82,
        'thumb_width' => 400,
        'thumb_height' => 300,

        /*
        | Watermark chèn vào ảnh lớn (không chèn vào thumbnail vì quá nhỏ).
        | Đặt null để tắt. File mặc định đi kèm repo tại resources/images/bds-watermark.png
        */
        'watermark_path' => resource_path('images/bds-watermark.png'),
        // Intervention Image v4: tham số `transparency` là float 0–1, trong đó
        // 1.0 = đục hoàn toàn, 0.0 = trong suốt hoàn toàn. Truyền ngoài khoảng này sẽ ném exception.
        'watermark_opacity' => 0.75,
        'watermark_ratio' => 0.22,      // bề rộng watermark = 22% bề rộng ảnh
        'watermark_margin' => 20,       // khoảng cách tới mép ảnh (px)
        'watermark_min_width' => 600,   // ảnh hẹp hơn mức này thì bỏ qua watermark

        'max_upload_size_kb' => 5120,
    ],

    /*
    | Giới hạn tìm kiếm bản đồ
    */
    'map' => [
        'max_markers' => 300,
        'max_radius_km' => 50,
        'default_radius_km' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache trang danh sách tin công khai
    |--------------------------------------------------------------------------
    | Xem App\Support\PropertyListingCache và CLAUDE.md §4.25. TTL này là lưới
    | an toàn cho trường hợp tin tự rớt khỏi listing theo thời gian
    | (`expired_at`) mà không có sự kiện model nào kích hoạt invalidate ngay
    | (cron `bds:expire-properties` dùng mass update, không bắn Eloquent event).
    */
    'cache' => [
        'listing_ttl_seconds' => 120,
    ],

    /*
    |--------------------------------------------------------------------------
    | Chống đếm trùng lượt xem tin
    |--------------------------------------------------------------------------
    | Xem App\Support\PropertyViewCounter và CLAUDE.md §4.26. Một người xem
    | (user id nếu đã đăng nhập, IP nếu khách vãng lai) xem lại cùng một tin
    | trong khoảng thời gian này chỉ được tính 1 lượt.
    */
    'view_dedupe_minutes' => 30,

    /*
    |--------------------------------------------------------------------------
    | Chống spam/bot cho form công khai (không cần đăng nhập)
    |--------------------------------------------------------------------------
    | Không dùng captcha — kết hợp honeypot (field ẩn, người thật không thấy
    | để điền) + đo thời gian điền form (bot thường submit gần như ngay lập
    | tức). Tên field phải khớp với hằng số cùng tên ở bds-web/src/lib/bds-anti-spam.ts.
    | Xem App\Support\SpamGuard và CLAUDE.md §4.24.
    */
    'anti_spam' => [
        'honeypot_field' => 'website',
        'timestamp_field' => 'form_rendered_at',
        // Submit nhanh hơn mức này (mili-giây) kể từ lúc form hiện ra bị coi là bot.
        'min_fill_ms' => 2000,
    ],
];
