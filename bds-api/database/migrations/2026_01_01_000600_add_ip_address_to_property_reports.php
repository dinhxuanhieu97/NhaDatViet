<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lưu IP người báo cáo để chặn khách vãng lai gửi trùng nhiều lần
     * (một người tự đủ ngưỡng sẽ ẩn được tin của người khác).
     */
    public function up(): void
    {
        Schema::table('property_reports', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('reporter_id');
            $table->index(['property_id', 'reporter_id'], 'idx_report_unique_reporter');
            $table->index(['property_id', 'ip_address'], 'idx_report_unique_ip');
        });
    }

    public function down(): void
    {
        Schema::table('property_reports', function (Blueprint $table) {
            $table->dropIndex('idx_report_unique_reporter');
            $table->dropIndex('idx_report_unique_ip');
            $table->dropColumn('ip_address');
        });
    }
};
