<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'developer', 'province_id', 'district_id', 'address',
        'latitude', 'longitude', 'description', 'total_area', 'total_units',
        'price_from', 'price_to', 'status', 'handover_at', 'thumbnail', 'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'total_area' => 'decimal:2',
            'price_from' => 'decimal:2',
            'price_to' => 'decimal:2',
            'handover_at' => 'date',
            'is_featured' => 'boolean',
        ];
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
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
