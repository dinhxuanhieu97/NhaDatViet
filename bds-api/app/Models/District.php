<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class District extends Model
{
    use HasFactory;

    protected $fillable = ['province_id', 'code', 'name', 'slug', 'type', 'is_legacy'];

    protected function casts(): array
    {
        return ['is_legacy' => 'boolean'];
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function wards(): HasMany
    {
        return $this->hasMany(Ward::class);
    }
}
