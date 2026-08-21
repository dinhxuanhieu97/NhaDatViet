<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PropertyImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id', 'path', 'path_webp', 'path_thumb',
        'is_primary', 'sort_order', 'is_processed',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'is_processed' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function url(): string
    {
        return Storage::disk('public')->url($this->path_webp ?: $this->path);
    }

    public function thumbUrl(): string
    {
        return Storage::disk('public')->url($this->path_thumb ?: $this->path_webp ?: $this->path);
    }
}
