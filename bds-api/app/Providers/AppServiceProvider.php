<?php

namespace App\Providers;

use App\Models\Property;
use App\Observers\PropertyObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Property::observe(PropertyObserver::class);

        // Admin có toàn quyền, không cần khai báo từng permission.
        Gate::before(function ($user) {
            return $user->hasRole('admin') ? true : null;
        });
    }
}
