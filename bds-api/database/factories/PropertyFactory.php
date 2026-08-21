<?php

namespace Database\Factories;

use App\Enums\PropertyStatus;
use App\Models\Category;
use App\Models\District;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    protected $model = Property::class;

    public function definition(): array
    {
        $district = District::inRandomOrder()->first() ?? District::factory()->create();

        return [
            'user_id' => User::factory(),
            'category_id' => Category::inRandomOrder()->value('id') ?? Category::factory(),
            'province_id' => $district->province_id,
            'district_id' => $district->id,
            'title' => 'Bán nhà mặt phố '.fake()->streetName().' diện tích rộng rãi',
            'description' => fake()->paragraph(10),
            'listing_type' => 'sale',
            'price' => fake()->numberBetween(10, 100) * 100_000_000,
            'price_unit' => 'total',
            'area' => fake()->numberBetween(30, 300),
            'bedrooms' => fake()->numberBetween(1, 5),
            'bathrooms' => fake()->numberBetween(1, 4),
            'floors' => fake()->numberBetween(1, 5),
            'direction' => 'dong-nam',
            'legal_status' => 'red_book',
            'furniture' => 'basic',
            'address' => fake()->streetAddress(),
            'latitude' => fake()->randomFloat(6, 20.9, 21.1),
            'longitude' => fake()->randomFloat(6, 105.7, 105.9),
            'status' => PropertyStatus::Pending,
            'contact_name' => fake()->name(),
            'contact_phone' => '09'.fake()->numerify('########'),
            'contact_email' => fake()->safeEmail(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => PropertyStatus::Published,
            'published_at' => now()->subDay(),
            'expired_at' => now()->addDays(30),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => PropertyStatus::Draft]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => PropertyStatus::Rejected,
            'rejection_reason' => 'Thông tin chưa đầy đủ.',
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => PropertyStatus::Published,
            'published_at' => now()->subDays(40),
            'expired_at' => now()->subDay(),
        ]);
    }

    public function at(float $lat, float $lng): static
    {
        return $this->state(fn () => ['latitude' => $lat, 'longitude' => $lng]);
    }
}
