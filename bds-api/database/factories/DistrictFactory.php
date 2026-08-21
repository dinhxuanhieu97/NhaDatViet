<?php

namespace Database\Factories;

use App\Models\District;
use App\Models\Province;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<District>
 */
class DistrictFactory extends Factory
{
    protected $model = District::class;

    public function definition(): array
    {
        return [
            'province_id' => Province::factory(),
            'code' => Str::random(8),
            'name' => 'Thanh Xuân',
            'slug' => 'thanh-xuan',
            'type' => 'quan',
        ];
    }
}
