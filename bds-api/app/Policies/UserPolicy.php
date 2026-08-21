<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('user.viewAny');
    }

    public function view(User $user, User $target): bool
    {
        return $user->id === $target->id || $user->can('user.view');
    }

    public function update(User $user, User $target): bool
    {
        return $user->id === $target->id || $user->can('user.update');
    }

    public function delete(User $user, User $target): bool
    {
        return $user->id !== $target->id && $user->can('user.delete');
    }

    public function assignRole(User $user): bool
    {
        return $user->can('user.assignRole');
    }
}
