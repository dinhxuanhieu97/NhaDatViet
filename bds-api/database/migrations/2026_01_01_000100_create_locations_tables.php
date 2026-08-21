<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->string('slug', 120)->index();
            $table->string('type', 30)->default('tinh'); // tinh | thanh-pho
            $table->timestamps();
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('province_id')->constrained('provinces')->cascadeOnDelete();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->string('slug', 120)->index();
            $table->string('type', 30)->default('quan');
            $table->timestamps();

            $table->index(['province_id', 'slug']);
        });

        Schema::create('wards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')->constrained('districts')->cascadeOnDelete();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->string('slug', 120)->index();
            $table->string('type', 30)->default('phuong');
            $table->timestamps();

            $table->index(['district_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wards');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('provinces');
    }
};
