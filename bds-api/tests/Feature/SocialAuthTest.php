<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Mockery;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    public function test_provider_khong_ho_tro_bi_tu_choi(): void
    {
        $this->getJson('/api/v1/auth/social/twitter/redirect')
            ->assertStatus(422)
            ->assertJsonValidationErrors('provider');
    }

    public function test_provider_chua_cau_hinh_client_id_bi_tu_choi(): void
    {
        // .env test không có GOOGLE_CLIENT_ID/SECRET thật → phải báo lỗi rõ ràng
        // thay vì Socialite ném exception khó hiểu.
        config(['services.google.client_id' => null, 'services.google.client_secret' => null]);

        $this->getJson('/api/v1/auth/social/google/redirect')
            ->assertStatus(422)
            ->assertJsonValidationErrors('provider');
    }

    public function test_dang_nhap_google_lan_dau_tao_tai_khoan_moi_va_gan_vai_tro_member(): void
    {
        config(['services.google.client_id' => 'x', 'services.google.client_secret' => 'y']);

        $socialUser = Mockery::mock(SocialiteUserContract::class);
        $socialUser->shouldReceive('getId')->andReturn('google-uid-123');
        $socialUser->shouldReceive('getEmail')->andReturn('hieu.google@example.com');
        $socialUser->shouldReceive('getName')->andReturn('Hieu Nguyen');
        $socialUser->shouldReceive('getNickname')->andReturn(null);
        $socialUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($socialUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/v1/auth/social/google/callback');

        $response->assertRedirect();
        $location = $response->headers->get('Location');

        $this->assertStringContainsString('/dang-nhap/mang-xa-hoi?token=', $location);
        $this->assertStringNotContainsString('error=', $location);

        $user = User::where('email', 'hieu.google@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('google-uid-123', $user->google_id);
        $this->assertTrue($user->hasRole('member'));
    }

    public function test_email_da_ton_tai_thi_lien_ket_thay_vi_tao_trung(): void
    {
        config(['services.facebook.client_id' => 'x', 'services.facebook.client_secret' => 'y']);

        $existing = $this->userWithRole('member', ['email' => 'da-co-san@example.com']);

        $socialUser = Mockery::mock(SocialiteUserContract::class);
        $socialUser->shouldReceive('getId')->andReturn('fb-uid-999');
        $socialUser->shouldReceive('getEmail')->andReturn('da-co-san@example.com');
        $socialUser->shouldReceive('getName')->andReturn('Tên Facebook');
        $socialUser->shouldReceive('getNickname')->andReturn(null);
        $socialUser->shouldReceive('getAvatar')->andReturn(null);

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($socialUser);

        Socialite::shouldReceive('driver')->with('facebook')->andReturn($provider);

        $this->get('/api/v1/auth/social/facebook/callback')->assertRedirect();

        $this->assertSame(1, User::where('email', 'da-co-san@example.com')->count());
        $this->assertSame('fb-uid-999', $existing->fresh()->facebook_id);
    }

    public function test_phien_het_han_dieu_huong_ve_frontend_kem_thong_bao_loi(): void
    {
        config(['services.google.client_id' => 'x', 'services.google.client_secret' => 'y']);

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andThrow(new InvalidStateException);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/v1/auth/social/google/callback');
        $location = $response->headers->get('Location');

        $this->assertStringContainsString('/dang-nhap/mang-xa-hoi?error=', $location);
    }
}
