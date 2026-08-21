<?php

namespace App\Models;

use App\Enums\ListingType;
use App\Enums\PropertyType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id', 'name', 'slug', 'type', 'listing_type',
        'icon', 'description', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => PropertyType::class,
            'listing_type' => ListingType::class,
            'is_active' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
