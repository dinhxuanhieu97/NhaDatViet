<?php

namespace Database\Factories;

use App\Models\Province;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Province>
 */
class ProvinceFactory extends Factory
{
    protected $model = Province::class;

    public function definition(): array
    {
        return [
            'code' => Str::random(8),
            'name' => 'Hà Nội',
            'slug' => 'ha-noi',
            'type' => 'thanh-pho',
        ];
    }
}
