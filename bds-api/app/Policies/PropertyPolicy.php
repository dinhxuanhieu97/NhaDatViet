<?php

namespace App\Policies;

use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    /** Xem danh sách mọi trạng thái (trang quản trị). */
    public function viewAny(User $user): bool
    {
        return $user->can('property.moderate');
    }

    public function view(?User $user, Property $property): bool
    {
        if ($property->status === PropertyStatus::Published) {
            return true;
        }

        if ($user === null) {
            return false;
        }

        return $property->isOwnedBy($user) || $user->can('property.moderate');
    }

    public function create(User $user): bool
    {
        if (! $user->can('property.create') || ! $user->isActive()) {
            return false;
        }

        $limit = $user->postLimit();

        if ($limit === null) {
            return true;
        }

        $active = $user->properties()
            ->whereIn('status', [PropertyStatus::Pending, PropertyStatus::Published])
            ->count();

        return $active < $limit;
    }

    public function update(User $user, Property $property): bool
    {
        if ($user->can('property.update.any')) {
            return true;
        }

        return $property->isOwnedBy($user) && $user->can('property.update.own');
    }

    public function delete(User $user, Property $property): bool
    {
        if ($user->can('property.delete.any')) {
            return true;
        }

        return $property->isOwnedBy($user) && $user->can('property.delete.own');
    }

    public function moderate(User $user): bool
    {
        return $user->can('property.moderate');
    }
}
