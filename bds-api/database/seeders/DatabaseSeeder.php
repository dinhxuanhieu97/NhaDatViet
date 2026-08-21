<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            LocationSeeder::class,
            CategorySeeder::class,
            ProjectSeeder::class,
        ]);

        $admin = User::updateOrCreate(
            ['email' => 'admin@bds.local'],
            [
                'name' => 'Quản trị viên',
                'phone' => '0900000001',
                'password' => 'password',
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );
        $admin->syncRoles(['admin']);

        $moderator = User::updateOrCreate(
            ['email' => 'moderator@bds.local'],
            [
                'name' => 'Kiểm duyệt viên',
                'phone' => '0900000002',
                'password' => 'password',
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );
        $moderator->syncRoles(['moderator']);

        $agent = User::updateOrCreate(
            ['email' => 'agent@bds.local'],
            [
                'name' => 'Nguyễn Văn Môi Giới',
                'phone' => '0900000003',
                'company' => 'Công ty BĐS Thịnh Vượng',
                'password' => 'password',
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );
        $agent->syncRoles(['agent']);

        $member = User::updateOrCreate(
            ['email' => 'member@bds.local'],
            [
                'name' => 'Trần Thị Thành Viên',
                'phone' => '0900000004',
                'password' => 'password',
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );
        $member->syncRoles(['member']);

        if (app()->environment('local')) {
            $this->call(PropertyDemoSeeder::class);
        }
    }
}
