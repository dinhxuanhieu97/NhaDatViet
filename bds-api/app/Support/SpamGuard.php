<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Chặn spam/bot cho form công khai không cần đăng nhập (liên hệ, báo cáo tin,
 * đăng ký) mà không cần captcha/script bên thứ 3. Hai lớp phòng vệ:
 *
 * 1. Honeypot: field ẩn tên giống field thật ("website") — người dùng thật
 *    không thấy nên luôn để trống; bot điền tự động theo tên field thường
 *    điền cả field ẩn.
 * 2. Đo thời gian điền form: frontend gắn mốc thời gian lúc form hiện ra
 *    (`form_rendered_at`, ms epoch, đặt lúc component mount — KHÔNG đổi lại
 *    giữa các lần bấm gửi lại sau lỗi validate, nên không phạt nhầm người
 *    dùng submit lại nhanh). Submit sớm hơn ngưỡng `min_fill_ms` kể từ mốc
 *    đó bị coi là bot vì người thật cần thời gian đọc + gõ.
 *
 * Đây là hàng rào nhẹ, không tuyệt đối — chống được phần lớn bot đơn giản/
 * script tự động, không chống được bot cố tình giả lập độ trễ. Kết hợp với
 * throttle theo route (đã có sẵn) để giới hạn thêm theo IP.
 */
class SpamGuard
{
    /**
     * true nếu request có dấu hiệu spam/bot: honeypot bị điền, thiếu mốc thời
     * gian bắt buộc (client thật luôn gửi vì đây là SPA — không có JS thì
     * không load được form), hoặc submit quá nhanh so với lúc form hiện ra.
     */
    public static function isSuspicious(Request $request): bool
    {
        $honeypotField = config('bds.anti_spam.honeypot_field');
        $timestampField = config('bds.anti_spam.timestamp_field');

        if (filled($request->input($honeypotField))) {
            return true;
        }

        $renderedAt = $request->input($timestampField);

        if (! is_numeric($renderedAt)) {
            return true;
        }

        $elapsedMs = (int) round(microtime(true) * 1000) - (float) $renderedAt;

        return $elapsedMs < (int) config('bds.anti_spam.min_fill_ms');
    }
}
