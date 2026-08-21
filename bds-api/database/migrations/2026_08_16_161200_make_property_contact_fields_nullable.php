<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cho phép `contact_name`/`contact_phone` NULL ở tầng DB.
     *
     * Bản ghi nháp (status = draft) có thể được tạo trước khi người dùng điền
     * thông tin liên hệ — ví dụ khi wizard tự lưu nháp ngầm ở bước "Tải ảnh"
     * (bước 5), trước bước "Liên hệ" (bước 6). Validate ở tầng request đã cho
     * phép bỏ trống hai trường này khi `save_as_draft=true`
     * (xem `PropertyRuleResolver`), nhưng cột DB vẫn NOT NULL nên insert sẽ vỡ
     * ràng buộc — sửa cho khớp. Gửi duyệt thật sự (`save_as_draft=false`) vẫn
     * bắt buộc điền đủ ở tầng validate như cũ.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('contact_name', 120)->nullable()->change();
            $table->string('contact_phone', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('contact_name', 120)->nullable(false)->change();
            $table->string('contact_phone', 20)->nullable(false)->change();
        });
    }
};
