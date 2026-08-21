<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public const PERMISSIONS = [
        // Tin đăng
        'property.viewAny',
        'property.view',
        'property.create',
        'property.update.own',
        'property.update.any',
        'property.delete.own',
        'property.delete.any',
        'property.moderate',
        // Người dùng
        'user.viewAny',
        'user.view',
        'user.create',
        'user.update',
        'user.delete',
        'user.assignRole',
        // Danh mục & địa giới
        'category.manage',
        'location.manage',
        // Hệ thống
        'report.view',
        'setting.manage',
    ];

    public const ROLE_MATRIX = [
        'admin' => self::PERMISSIONS,
        'moderator' => [
            'property.viewAny', 'property.view', 'property.create',
            'property.update.own', 'property.delete.own', 'property.moderate',
            'user.viewAny', 'user.view', 'report.view',
        ],
        'agent' => [
            'property.viewAny', 'property.view', 'property.create',
            'property.update.own', 'property.delete.own',
        ],
        'member' => [
            'property.viewAny', 'property.view', 'property.create',
            'property.update.own', 'property.delete.own',
        ],
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::ROLE_MATRIX as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
