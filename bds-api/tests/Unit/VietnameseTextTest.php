<?php

namespace Tests\Unit;

use App\Support\VietnameseText;
use PHPUnit\Framework\TestCase;

class VietnameseTextTest extends TestCase
{
    public function test_bo_dau_tieng_viet(): void
    {
        $this->assertSame('nguyen trai', VietnameseText::removeAccents('Nguyễn Trãi'));
        $this->assertSame('da nang', VietnameseText::removeAccents('Đà Nẵng'));
        $this->assertSame('quan hoa', VietnameseText::removeAccents('Quán Hoa'));
        $this->assertSame(
            'ban nha mat pho cuc dep',
            VietnameseText::removeAccents('Bán nhà mặt phố cực đẹp')
        );
    }

    public function test_chuan_hoa_bo_ky_tu_dac_biet_va_gop_khoang_trang(): void
    {
        $this->assertSame(
            'ban nha 80m2 gia 8 5 ty',
            VietnameseText::normalize('Bán nhà 80m², giá 8,5 tỷ!!!')
        );

        $this->assertSame('a b c', VietnameseText::normalize("A   \n B \t C"));
        $this->assertSame('', VietnameseText::normalize('  !!!  '));
    }

    public function test_chuan_hoa_bo_the_html(): void
    {
        $this->assertSame(
            'nha dep',
            VietnameseText::normalize('<p><strong>Nhà đẹp</strong></p>')
        );
    }

    public function test_sinh_slug_khong_dau_kem_hau_to_id(): void
    {
        $this->assertSame(
            'ban-nha-mat-pho-nguyen-trai-80m2-1234',
            VietnameseText::slug('Bán nhà mặt phố Nguyễn Trãi 80m²', 1234)
        );

        $this->assertSame('du-an-vinhomes-smart-city', VietnameseText::slug('Dự án Vinhomes Smart City'));
    }

    public function test_slug_rong_co_gia_tri_du_phong(): void
    {
        $this->assertSame('bat-dong-san-9', VietnameseText::slug('!!!', 9));
    }
}
