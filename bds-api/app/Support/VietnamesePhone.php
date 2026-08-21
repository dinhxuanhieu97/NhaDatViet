<?php

namespace App\Support;

class VietnamesePhone
{
    /**
     * Regex số di động Việt Nam 10 số, khớp đúng đầu số nhà mạng đang được cấp
     * phép (Viettel, MobiFone, VinaPhone, Vietnamobile, Gmobile, iTel, Wintel/
     * Reddi) tính đến 2026 — không dùng `0[0-9]{8,10}` chung chung vì cho lọt
     * qua cả đầu số cố định (02x) và đầu số di động chưa từng được cấp (vd.
     * 060x, 095x, 057x). Chi tiết đầu số theo nhà mạng xem CLAUDE.md §4.23.
     */
    public const REGEX = '/^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/';
}
