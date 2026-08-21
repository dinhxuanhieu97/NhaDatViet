<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    public function test_khach_dang_ky_thanh_cong_va_nhan_vai_tro_member(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Nguyễn Văn A',
            'email' => 'nguyenvana@example.com',
            'phone' => '0912345678',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
            ...$this->bdsAntiSpamBypass(),
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'token', 'data' => ['id', 'roles']]);

        $user = User::where('email', 'nguyenvana@example.com')->first();

        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('member'));
        $this->assertSame('active', $user->status);
    }

    public function test_dang_ky_that_bai_khi_email_trung(): void
    {
        User::factory()->create(['email' => 'trung@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'B',
            'email' => 'trung@example.com',
            'phone' => '0912345679',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_dang_ky_that_bai_khi_sdt_sai_dinh_dang(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'B',
            'email' => 'b@example.com',
            'phone' => '12345',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_dang_nhap_thanh_cong_bang_email(): void
    {
        $user = $this->userWithRole('member', [
            'email' => 'a@example.com',
            'password' => 'matkhau123',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'a@example.com',
            'password' => 'matkhau123',
        ])->assertOk()->assertJsonPath('data.id', $user->id);
    }

    public function test_dang_nhap_thanh_cong_bang_so_dien_thoai(): void
    {
        $this->userWithRole('member', [
            'phone' => '0987654321',
            'password' => 'matkhau123',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => '0987654321',
            'password' => 'matkhau123',
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_dang_nhap_sai_mat_khau_bi_tu_choi(): void
    {
        $this->userWithRole('member', ['email' => 'a@example.com', 'password' => 'matkhau123']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'a@example.com',
            'password' => 'saibet',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_tai_khoan_bi_khoa_khong_dang_nhap_duoc(): void
    {
        $this->userWithRole('member', [
            'email' => 'khoa@example.com',
            'password' => 'matkhau123',
            'status' => 'suspended',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'khoa@example.com',
            'password' => 'matkhau123',
        ])->assertStatus(422);
    }

    public function test_me_tra_ve_vai_tro_va_quyen(): void
    {
        $user = $this->userWithRole('agent');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.roles.0', 'agent')
            ->assertJsonPath('data.post_limit', null); // agent không giới hạn
    }

    public function test_khach_chua_dang_nhap_khong_goi_duoc_me(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_doi_mat_khau_thanh_cong_va_thu_hoi_token(): void
    {
        $user = $this->userWithRole('member', ['password' => 'matkhaucu123']);
        $user->createToken('api');

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'matkhaucu123',
                'password' => 'matkhaumoi123',
                'password_confirmation' => 'matkhaumoi123',
            ])->assertOk();

        $this->assertSame(0, $user->fresh()->tokens()->count());
    }

    public function test_doi_mat_khau_giu_phien_hien_tai_khi_chon_ghi_nho_dang_nhap(): void
    {
        $user = $this->userWithRole('member', ['password' => 'matkhaucu123']);
        $currentToken = $user->createToken('api');
        $otherDeviceToken = $user->createToken('api');

        $this->withToken($currentToken->plainTextToken)
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'matkhaucu123',
                'password' => 'matkhaumoi123',
                'password_confirmation' => 'matkhaumoi123',
                'keep_current_session' => true,
            ])->assertOk()->assertJsonPath('logged_out', false);

        $remaining = $user->fresh()->tokens();

        $this->assertSame(1, $remaining->count());
        $this->assertSame($currentToken->accessToken->id, $remaining->first()->id);
        $this->assertNotSame($otherDeviceToken->accessToken->id, $remaining->first()->id);
    }

    public function test_doi_mat_khau_that_bai_khi_sai_mat_khau_hien_tai(): void
    {
        $user = $this->userWithRole('member', ['password' => 'matkhaucu123']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'sai',
                'password' => 'matkhaumoi123',
                'password_confirmation' => 'matkhaumoi123',
            ])->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    public function test_cap_nhat_ho_so(): void
    {
        $user = $this->userWithRole('agent');

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/profile', [
                'name' => 'Tên Mới',
                'company' => 'Công ty ABC',
            ])->assertOk()->assertJsonPath('data.name', 'Tên Mới');
    }

    public function test_cap_nhat_kenh_mang_xa_hoi_o_ho_so(): void
    {
        $user = $this->userWithRole('agent');

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/profile', [
                'social_tiktok' => 'https://tiktok.com/@nguoiban',
                'social_youtube' => 'https://youtube.com/@nguoiban',
                'social_instagram' => 'https://instagram.com/nguoiban',
            ])->assertOk()
            ->assertJsonPath('data.social_tiktok', 'https://tiktok.com/@nguoiban')
            ->assertJsonPath('data.social_youtube', 'https://youtube.com/@nguoiban')
            ->assertJsonPath('data.social_instagram', 'https://instagram.com/nguoiban');
    }

    public function test_cap_nhat_kenh_mang_xa_hoi_tu_choi_link_khong_hop_le(): void
    {
        $user = $this->userWithRole('agent');

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/profile', [
                'social_tiktok' => 'khong-phai-url',
            ])->assertStatus(422)->assertJsonValidationErrors('social_tiktok');
    }

    public function test_cap_nhat_kenh_mang_xa_hoi_cho_phep_bo_trong(): void
    {
        $user = $this->userWithRole('agent', [
            'social_tiktok' => 'https://tiktok.com/@cu',
        ]);

        // Middleware mặc định ConvertEmptyStringsToNull tự đổi '' thành null
        // trước khi tới validator — gửi '' để "xóa" link cũ là hợp lệ, và kết
        // quả lưu/trả về đúng là null (không phải chuỗi rỗng).
        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/profile', [
                'social_tiktok' => '',
            ])->assertOk()->assertJsonPath('data.social_tiktok', null);
    }

    public function test_dang_xuat_thu_hoi_token_hien_tai(): void
    {
        $user = $this->userWithRole('member');
        $token = $user->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertSame(0, $user->fresh()->tokens()->count());
    }
}
