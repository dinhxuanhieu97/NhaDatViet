<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kênh liên hệ bổ sung, không bắt buộc — người đăng có thể để trống.
     * Không mask/ẩn hai cột này (khác `contact_phone`) vì đây là kênh người đăng
     * CHỦ ĐỘNG chọn công khai (Zalo dùng ngay contact_phone nếu bỏ trống, ở tầng
     * ứng dụng, không phải tầng dữ liệu — xem PropertyResource).
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('contact_zalo', 20)->nullable()->after('contact_email');
            $table->string('contact_facebook', 255)->nullable()->after('contact_zalo');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['contact_zalo', 'contact_facebook']);
        });
    }
};
