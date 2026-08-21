<?php

namespace Tests\Feature;

use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Notifications\PropertyApproved;
use App\Notifications\PropertyRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ModerationTest extends TestCase
{
    use RefreshDatabase;

    protected array $base;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
        $this->base = $this->seedBaseData();
        Notification::fake();
    }

    private function makeProperty(int $userId, string $state = 'pending'): Property
    {
        $factory = Property::factory();

        $factory = match ($state) {
            'published' => $factory->published(),
            'draft' => $factory->draft(),
            'rejected' => $factory->rejected(),
            default => $factory,
        };

        return $factory->create([
            'user_id' => $userId,
            'category_id' => $this->base['category']->id,
            'province_id' => $this->base['province']->id,
            'district_id' => $this->base['district']->id,
        ]);
    }

    public function test_moderator_xem_duoc_hang_doi_duyet_tin(): void
    {
        $member = $this->userWithRole('member');
        $moderator = $this->userWithRole('moderator');

        $this->makeProperty($member->id, 'pending');
        $this->makeProperty($member->id, 'published');

        $this->actingAs($moderator, 'sanctum')
            ->getJson('/api/v1/admin/properties')
            ->assertOk()
            ->assertJsonCount(1, 'data'); // chỉ tin pending
    }

    public function test_member_khong_truy_cap_duoc_trang_quan_tri(): void
    {
        $member = $this->userWithRole('member');

        $this->actingAs($member, 'sanctum')
            ->getJson('/api/v1/admin/properties')
            ->assertForbidden();
    }

    public function test_agent_khong_duyet_duoc_tin(): void
    {
        $agent = $this->userWithRole('agent');
        $property = $this->makeProperty($agent->id, 'pending');

        $this->actingAs($agent, 'sanctum')
            ->postJson("/api/v1/admin/properties/{$property->id}/approve")
            ->assertForbidden();
    }

    public function test_moderator_duyet_tin_thanh_cong(): void
    {
        $member = $this->userWithRole('member');
        $moderator = $this->userWithRole('moderator');
        $property = $this->makeProperty($member->id, 'pending');

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/v1/admin/properties/{$property->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $property->refresh();

        $this->assertSame(PropertyStatus::Published, $property->status);
        $this->assertNotNull($property->published_at);
        $this->assertNotNull($property->expired_at);
        $this->assertSame($moderator->id, $property->moderated_by);

        Notification::assertSentTo($member, PropertyApproved::class);
    }

    public function test_tin_duyet_xong_hien_ra_o_danh_sach_cong_khai(): void
    {
        $member = $this->userWithRole('member');
        $moderator = $this->userWithRole('moderator');
        $property = $this->makeProperty($member->id, 'pending');

        $this->getJson('/api/v1/properties')->assertOk()->assertJsonCount(0, 'data');

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/v1/admin/properties/{$property->id}/approve")
            ->assertOk();

        $this->getJson('/api/v1/properties')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_tu_choi_tin_khong_co_ly_do_bi_loi_422(): void
    {
        $member = $this->userWithRole('member');
        $moderator = $this->userWithRole('moderator');
        $property = $this->makeProperty($member->id, 'pending');

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/v1/admin/properties/{$property->id}/reject", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('reason');
    }

    public function test_tu_choi_tin_voi_ly_do_hop_le(): void
    {
        $member = $this->userWithRole('member');
        $moderator = $this->userWithRole('moderator');
        $property = $this->makeProperty($member->id, 'pending');

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/v1/admin/properties/{$property->id}/reject", [
                'reason' => 'Ảnh không rõ ràng và mô tả sơ sài, vui lòng bổ sung.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertSame(
            'Ảnh không rõ ràng và mô tả sơ sài, vui lòng bổ sung.',
            $property->fresh()->rejection_reason
        );

        Notification::assertSentTo($member, PropertyRejected::class);
    }

    public function test_moderator_khong_xoa_duoc_tin_cua_nguoi_khac(): void
    {
        $member = $this->userWithRole('member');
        $moderator = $this->userWithRole('moderator');
        $property = $this->makeProperty($member->id, 'published');

        $this->actingAs($moderator, 'sanctum')
            ->deleteJson("/api/v1/admin/properties/{$property->id}")
            ->assertForbidden();
    }

    public function test_admin_go_duoc_tin_bat_ky(): void
    {
        $member = $this->userWithRole('member');
        $admin = $this->userWithRole('admin');
        $property = $this->makeProperty($member->id, 'published');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/properties/{$property->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('properties', ['id' => $property->id]);
    }

    public function test_admin_gan_vai_tro_cho_user(): void
    {
        $member = $this->userWithRole('member');
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/users/{$member->id}/roles", ['roles' => ['agent']])
            ->assertOk();

        $this->assertTrue($member->fresh()->hasRole('agent'));
        $this->assertFalse($member->fresh()->hasRole('member'));
    }

    public function test_admin_khong_tu_go_quyen_admin_cua_chinh_minh(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/users/{$admin->id}/roles", ['roles' => ['member']])
            ->assertStatus(422);

        $this->assertTrue($admin->fresh()->hasRole('admin'));
    }

    public function test_moderator_khong_gan_duoc_vai_tro(): void
    {
        $member = $this->userWithRole('member');
        $moderator = $this->userWithRole('moderator');

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/v1/admin/users/{$member->id}/roles", ['roles' => ['admin']])
            ->assertForbidden();
    }

    public function test_admin_khoa_tai_khoan_thi_user_khong_goi_duoc_api(): void
    {
        $member = $this->userWithRole('member');
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/users/{$member->id}", ['status' => 'suspended'])
            ->assertOk();

        $this->actingAs($member->fresh(), 'sanctum')
            ->getJson('/api/v1/my/properties')
            ->assertForbidden();
    }

    public function test_thong_ke_tra_ve_dung_so_lieu(): void
    {
        $member = $this->userWithRole('member');
        $admin = $this->userWithRole('admin');

        $this->makeProperty($member->id, 'pending');
        $this->makeProperty($member->id, 'published');
        $this->makeProperty($member->id, 'published');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/stats')
            ->assertOk()
            ->assertJsonPath('properties.pending', 1)
            ->assertJsonPath('properties.published', 2)
            ->assertJsonPath('properties.total', 3);
    }

    public function test_lenh_het_han_chuyen_tin_qua_han_sang_expired(): void
    {
        $member = $this->userWithRole('member');

        Property::factory()->expired()->create([
            'user_id' => $member->id,
            'category_id' => $this->base['category']->id,
            'province_id' => $this->base['province']->id,
            'district_id' => $this->base['district']->id,
        ]);

        $this->artisan('bds:expire-properties')->assertSuccessful();

        $this->assertSame(PropertyStatus::Expired, Property::first()->status);
        $this->getJson('/api/v1/properties')->assertJsonCount(0, 'data');
    }
}
