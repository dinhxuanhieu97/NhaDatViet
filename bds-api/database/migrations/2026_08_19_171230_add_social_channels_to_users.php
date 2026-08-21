<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kênh mạng xã hội ở cấp HỒ SƠ NGƯỜI DÙNG (áp dụng cho mọi tin đăng của
        // người này) — khác với contact_zalo/contact_facebook trên Property
        // (2026_08_16_163000_add_zalo_facebook_contact_to_properties.php), vốn
        // đặt riêng theo TỪNG tin. Không đụng tới 2 cột đó — người dùng chỉ yêu
        // cầu quản lý danh sách social link mới ở trang Hồ sơ cá nhân.
        Schema::table('users', function (Blueprint $table) {
            $table->string('social_tiktok', 255)->nullable()->after('company');
            $table->string('social_youtube', 255)->nullable()->after('social_tiktok');
            $table->string('social_instagram', 255)->nullable()->after('social_youtube');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['social_tiktok', 'social_youtube', 'social_instagram']);
        });
    }
};
