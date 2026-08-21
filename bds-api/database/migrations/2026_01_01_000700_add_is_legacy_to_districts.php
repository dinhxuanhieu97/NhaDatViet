<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Từ 01/7/2025 Việt Nam bỏ cấp quận/huyện (Nghị quyết 1685/NQ-UBTVQH15).
     * Bảng districts được giữ lại làm CẤP KHU VỰC TÌM KIẾM vì người mua bán BĐS
     * vẫn tra cứu theo tên quận cũ. Cột is_legacy đánh dấu bản ghi không còn là
     * đơn vị hành chính hợp pháp, để tầng hiển thị không ghi vào địa chỉ pháp lý.
     */
    public function up(): void
    {
        Schema::table('districts', function (Blueprint $table) {
            $table->boolean('is_legacy')->default(false)->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('districts', function (Blueprint $table) {
            $table->dropColumn('is_legacy');
        });
    }
};
