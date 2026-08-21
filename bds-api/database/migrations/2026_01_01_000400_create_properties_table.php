<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            // Quan hệ
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('province_id')->constrained('provinces')->restrictOnDelete();
            $table->foreignId('district_id')->constrained('districts')->restrictOnDelete();
            $table->foreignId('ward_id')->nullable()->constrained('wards')->nullOnDelete();

            // Nội dung
            $table->string('title', 200);
            $table->string('slug', 255)->unique();
            $table->text('description');
            $table->text('search_text')->nullable(); // tiêu đề + mô tả + địa chỉ, đã bỏ dấu

            // Phân loại & giá
            $table->enum('listing_type', ['sale', 'rent'])->index();
            $table->decimal('price', 15, 2)->nullable(); // null = Thỏa thuận
            $table->enum('price_unit', ['total', 'per_m2', 'per_month'])->default('total');
            $table->decimal('area', 10, 2);

            // Thông số
            $table->unsignedTinyInteger('bedrooms')->nullable();
            $table->unsignedTinyInteger('bathrooms')->nullable();
            $table->unsignedTinyInteger('floors')->nullable();
            $table->enum('direction', [
                'dong', 'tay', 'nam', 'bac',
                'dong-nam', 'tay-nam', 'dong-bac', 'tay-bac',
            ])->nullable();
            $table->enum('legal_status', [
                'red_book', 'pink_book', 'sale_contract', 'waiting', 'other',
            ])->nullable();
            $table->enum('furniture', ['full', 'basic', 'none'])->nullable();
            $table->decimal('frontage', 6, 2)->nullable();
            $table->decimal('road_width', 6, 2)->nullable();

            // Vị trí
            $table->string('address');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Trạng thái & kiểm duyệt
            $table->enum('status', [
                'draft', 'pending', 'published', 'rejected', 'expired', 'hidden',
            ])->default('pending');
            $table->string('rejection_reason', 500)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();

            // Liên hệ & thống kê
            $table->string('contact_name', 120);
            $table->string('contact_phone', 20);
            $table->string('contact_email', 150)->nullable();
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('reports_count')->default(0);
            $table->boolean('is_featured')->default(false);

            $table->timestamps();
            $table->softDeletes();

            // Index phục vụ tìm kiếm
            $table->index(['status', 'listing_type', 'category_id'], 'idx_search_main');
            $table->index(['status', 'province_id', 'district_id'], 'idx_search_area');
            $table->index(['status', 'published_at'], 'idx_published');
            $table->index(['price', 'area'], 'idx_price_area');
            $table->index(['latitude', 'longitude'], 'idx_geo');
            $table->index(['user_id', 'status'], 'idx_user_status');
        });

        // Full-Text Index chỉ áp dụng cho MySQL/MariaDB.
        // PostgreSQL dùng GIN trên to_tsvector; SQLite (test) dùng LIKE trên search_text.
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE properties ADD FULLTEXT idx_ft_property (title, description, address)');
        } elseif ($driver === 'pgsql') {
            DB::statement("CREATE INDEX idx_ft_property ON properties USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(address,'')))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
