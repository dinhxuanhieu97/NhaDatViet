<?php

namespace App\Support;

use Illuminate\Support\Str;

class VietnameseText
{
    /** Bảng chuyển ký tự tiếng Việt có dấu → không dấu. */
    private const MAP = [
        'a' => 'áàảãạăắằẳẵặâấầẩẫậ',
        'e' => 'éèẻẽẹêếềểễệ',
        'i' => 'íìỉĩị',
        'o' => 'óòỏõọôốồổỗộơớờởỡợ',
        'u' => 'úùủũụưứừửữự',
        'y' => 'ýỳỷỹỵ',
        'd' => 'đ',
    ];

    /**
     * Ký tự mũ thường gặp trong tin BĐS: "80m²" phải khớp được với truy vấn "80m2".
     */
    private const SUPERSCRIPT = ['²' => '2', '³' => '3', '¹' => '1'];

    /** Bỏ dấu tiếng Việt, giữ nguyên chữ và số. */
    public static function removeAccents(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        $text = strtr($text, self::SUPERSCRIPT);

        foreach (self::MAP as $ascii => $accented) {
            $chars = preg_split('//u', $accented, -1, PREG_SPLIT_NO_EMPTY);
            $text = str_replace($chars, $ascii, $text);
        }

        return $text;
    }

    /**
     * Chuẩn hóa chuỗi để lưu vào cột search_text và để so khớp khi tìm kiếm:
     * bỏ dấu, bỏ ký tự đặc biệt, gộp khoảng trắng.
     */
    public static function normalize(string $text): string
    {
        $text = self::removeAccents(strip_tags($text));
        $text = preg_replace('/[^a-z0-9]+/u', ' ', $text) ?? '';

        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }

    /** Sinh slug thân thiện SEO từ tiêu đề tiếng Việt. */
    public static function slug(string $text, ?int $suffix = null): string
    {
        $slug = Str::slug(self::removeAccents($text));
        $slug = Str::limit($slug, 200, '');
        $slug = trim($slug, '-');

        if ($slug === '') {
            $slug = 'bat-dong-san';
        }

        return $suffix !== null ? $slug.'-'.$suffix : $slug;
    }
}
