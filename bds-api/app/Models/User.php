<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'avatar',
        'company',
        'status',
        'google_id',
        'facebook_id',
        // Kênh mạng xã hội ở cấp hồ sơ — xem migration
        // 2026_08_19_171230_add_social_channels_to_users.php.
        'social_tiktok',
        'social_youtube',
        'social_instagram',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /** Hạn mức số tin đang hiển thị/chờ duyệt. null = không giới hạn. */
    public function postLimit(): ?int
    {
        $limits = config('bds.post_limits', []);
        $best = 0;

        foreach ($this->getRoleNames() as $role) {
            if (! array_key_exists($role, $limits)) {
                continue;
            }
            if ($limits[$role] === null) {
                return null;
            }
            $best = max($best, (int) $limits[$role]);
        }

        return $best > 0 ? $best : ($limits['member'] ?? 5);
    }

    /** Số ảnh tối đa cho mỗi tin đăng. */
    public function imageLimit(): int
    {
        $limits = config('bds.image_limits', []);
        $best = 0;

        foreach ($this->getRoleNames() as $role) {
            $best = max($best, (int) ($limits[$role] ?? 0));
        }

        return $best > 0 ? $best : ($limits['member'] ?? 10);
    }
}
