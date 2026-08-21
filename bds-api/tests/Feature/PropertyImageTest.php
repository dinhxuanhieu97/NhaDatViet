<?php

namespace Tests\Feature;

use App\Jobs\ProcessPropertyImage;
use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyImageTest extends TestCase
{
    use RefreshDatabase;

    protected array $base;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
        $this->base = $this->seedBaseData();
        Storage::fake('public');
        Bus::fake();
    }

    private function makeProperty(int $userId): Property
    {
        return Property::factory()->create([
            'user_id' => $userId,
            'category_id' => $this->base['category']->id,
            'province_id' => $this->base['province']->id,
            'district_id' => $this->base['district']->id,
        ]);
    }

    public function test_upload_anh_thanh_cong_va_dispatch_job_xu_ly(): void
    {
        $owner = $this->userWithRole('member');
        $property = $this->makeProperty($owner->id);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", [
                'images' => [
                    UploadedFile::fake()->image('nha1.jpg', 1200, 900),
                    UploadedFile::fake()->image('nha2.jpg', 1200, 900),
                ],
            ])
            ->assertCreated()
            ->assertJsonCount(2, 'data');

        $this->assertSame(2, $property->images()->count());
        Bus::assertDispatchedTimes(ProcessPropertyImage::class, 2);
    }

    public function test_anh_dau_tien_duoc_dat_lam_anh_dai_dien(): void
    {
        $owner = $this->userWithRole('member');
        $property = $this->makeProperty($owner->id);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", [
                'images' => [UploadedFile::fake()->image('nha.jpg')],
            ])->assertCreated();

        $this->assertTrue($property->images()->first()->is_primary);
    }

    public function test_khong_upload_duoc_anh_len_tin_cua_nguoi_khac(): void
    {
        $owner = $this->userWithRole('member');
        $other = $this->userWithRole('member');
        $property = $this->makeProperty($owner->id);

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", [
                'images' => [UploadedFile::fake()->image('hack.jpg')],
            ])->assertForbidden();
    }

    public function test_tu_choi_file_khong_phai_anh(): void
    {
        $owner = $this->userWithRole('member');
        $property = $this->makeProperty($owner->id);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", [
                'images' => [UploadedFile::fake()->create('mal.php', 100, 'application/x-php')],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('images.0');
    }

    public function test_vuot_han_muc_anh_bi_tu_choi(): void
    {
        $owner = $this->userWithRole('member'); // hạn mức 10 ảnh
        $property = $this->makeProperty($owner->id);

        $images = [];

        for ($i = 0; $i < 11; $i++) {
            $images[] = UploadedFile::fake()->image("nha{$i}.jpg");
        }

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", ['images' => $images])
            ->assertStatus(422)
            ->assertJsonValidationErrors('images');
    }

    public function test_xoa_anh_dai_dien_thi_anh_ke_tiep_len_thay(): void
    {
        $owner = $this->userWithRole('member');
        $property = $this->makeProperty($owner->id);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", [
                'images' => [
                    UploadedFile::fake()->image('a.jpg'),
                    UploadedFile::fake()->image('b.jpg'),
                ],
            ])->assertCreated();

        $primary = $property->images()->where('is_primary', true)->first();

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/v1/my/properties/{$property->id}/images/{$primary->id}")
            ->assertNoContent();

        $this->assertSame(1, $property->images()->count());
        $this->assertTrue($property->images()->first()->is_primary);
    }

    public function test_sap_xep_lai_thu_tu_va_doi_anh_dai_dien(): void
    {
        $owner = $this->userWithRole('member');
        $property = $this->makeProperty($owner->id);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", [
                'images' => [
                    UploadedFile::fake()->image('a.jpg'),
                    UploadedFile::fake()->image('b.jpg'),
                ],
            ])->assertCreated();

        $ids = $property->images()->pluck('id')->all();

        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/v1/my/properties/{$property->id}/images/order", [
                'order' => [$ids[1], $ids[0]],
                'primary_id' => $ids[1],
            ])->assertOk();

        $this->assertTrue($property->images()->find($ids[1])->is_primary);
        $this->assertFalse($property->images()->find($ids[0])->is_primary);
        $this->assertSame(1, $property->images()->find($ids[1])->sort_order);
    }

    public function test_gui_duyet_thanh_cong_khi_da_co_anh(): void
    {
        $owner = $this->userWithRole('member');
        $property = Property::factory()->draft()->create([
            'user_id' => $owner->id,
            'category_id' => $this->base['category']->id,
            'province_id' => $this->base['province']->id,
            'district_id' => $this->base['district']->id,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/images", [
                'images' => [UploadedFile::fake()->image('a.jpg')],
            ])->assertCreated();

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/my/properties/{$property->id}/submit")
            ->assertOk();

        $this->assertSame('pending', $property->fresh()->status->value);
    }
}
