<?php

namespace App\Models;

use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Support\VietnameseText;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'category_id', 'project_id',
        'province_id', 'district_id', 'ward_id',
        'title', 'slug', 'description', 'search_text',
        'listing_type', 'price', 'price_unit', 'area',
        'bedrooms', 'bathrooms', 'floors', 'direction',
        'legal_status', 'furniture', 'frontage', 'road_width',
        'address', 'latitude', 'longitude',
        'status', 'rejection_reason', 'published_at', 'expired_at',
        'moderated_by', 'moderated_at',
        'contact_name', 'contact_phone', 'contact_email', 'contact_zalo', 'contact_facebook',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'listing_type' => ListingType::class,
            'status' => PropertyStatus::class,
            'price' => 'decimal:2',
            'area' => 'decimal:2',
            'frontage' => 'decimal:2',
            'road_width' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'published_at' => 'datetime',
            'expired_at' => 'datetime',
            'moderated_at' => 'datetime',
            'is_featured' => 'boolean',
        ];
    }

    // ----------------------------------------------------------------- Quan hệ

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function ward(): BelongsTo
    {
        return $this->belongsTo(Ward::class);
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->where('is_primary', true);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(PropertyContact::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(PropertyReport::class);
    }

    // ------------------------------------------------------------------ Scopes

    /** Chỉ tin công khai (đã duyệt, chưa hết hạn). */
    public function scopePublic(Builder $q): Builder
    {
        return $q->where('status', PropertyStatus::Published)
            ->where(function (Builder $sub) {
                $sub->whereNull('expired_at')->orWhere('expired_at', '>', now());
            });
    }

    /** Tìm kiếm toàn văn, không phân biệt dấu tiếng Việt. */
    public function scopeSearch(Builder $q, ?string $keyword): Builder
    {
        if (blank($keyword)) {
            return $q;
        }

        $normalized = VietnameseText::normalize($keyword);
        $terms = array_filter(explode(' ', $normalized));

        return $q->where(function (Builder $sub) use ($terms) {
            foreach ($terms as $term) {
                $sub->where('search_text', 'like', '%'.$term.'%');
            }
        });
    }

    /** Lọc theo bán kính (km) quanh một tọa độ, dùng bounding box + Haversine. */
    public function scopeWithinRadius(Builder $q, float $lat, float $lng, float $radiusKm): Builder
    {
        $latDelta = $radiusKm / 111.0;
        $lngDelta = $radiusKm / (111.0 * max(cos(deg2rad($lat)), 0.01));

        // SQLite dùng MIN() dạng scalar, MySQL/PostgreSQL dùng LEAST().
        $least = $q->getConnection()->getDriverName() === 'sqlite' ? 'MIN' : 'LEAST';

        return $q->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', [$lat - $latDelta, $lat + $latDelta])
            ->whereBetween('longitude', [$lng - $lngDelta, $lng + $lngDelta])
            ->whereRaw(
                "(6371 * acos({$least}(1.0, cos(radians(?)) * cos(radians(latitude)) ".
                '* cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))) <= ?',
                [$lat, $lng, $lat, $radiusKm]
            );
    }

    // ---------------------------------------------------------------- Helpers

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function isOwnedBy(?User $user): bool
    {
        return $user !== null && $this->user_id === $user->id;
    }

    /** Đồng bộ cột search_text (dùng cho tìm kiếm không dấu). */
    public function syncSearchText(): void
    {
        $this->search_text = VietnameseText::normalize(
            implode(' ', array_filter([$this->title, $this->description, $this->address]))
        );
    }

    /** Định dạng giá theo cách người Việt đọc: 8,5 tỷ / 950 triệu. */
    public function priceText(): string
    {
        if ($this->price === null) {
            return 'Thỏa thuận';
        }

        $price = (float) $this->price;

        if ($this->price_unit === 'per_month') {
            return $this->humanPrice($price).'/tháng';
        }

        if ($this->price_unit === 'per_m2') {
            return $this->humanPrice($price).'/m²';
        }

        return $this->humanPrice($price);
    }

    public function pricePerM2Text(): ?string
    {
        if ($this->price === null || (float) $this->area <= 0 || $this->price_unit !== 'total') {
            return null;
        }

        return $this->humanPrice((float) $this->price / (float) $this->area).'/m²';
    }

    private function humanPrice(float $value): string
    {
        if ($value >= 1_000_000_000) {
            return rtrim(rtrim(number_format($value / 1_000_000_000, 2, ',', '.'), '0'), ',').' tỷ';
        }

        if ($value >= 1_000_000) {
            return rtrim(rtrim(number_format($value / 1_000_000, 2, ',', '.'), '0'), ',').' triệu';
        }

        if ($value >= 1_000) {
            return rtrim(rtrim(number_format($value / 1_000, 2, ',', '.'), '0'), ',').' nghìn';
        }

        return number_format($value, 0, ',', '.').' đ';
    }
}
