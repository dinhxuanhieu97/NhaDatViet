<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'name' => 'Bán nhà riêng',
            'slug' => 'ban-nha-rieng-'.Str::random(6),
            'type' => 'house',
            'listing_type' => 'sale',
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    public function type(string $type, string $listingType = 'sale'): static
    {
        return $this->state(fn () => [
            'type' => $type,
            'listing_type' => $listingType,
            'slug' => $type.'-'.$listingType.'-'.Str::random(6),
        ]);
    }
}
