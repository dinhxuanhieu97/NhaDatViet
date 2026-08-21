<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

/**
 * Đăng nhập bằng Google / Facebook (Laravel Socialite).
 *
 * Đây là luồng redirect trình duyệt thật (không phải gọi API JSON từ SPA):
 * nút "Đăng nhập với Google/Facebook" ở frontend là một thẻ <a> điều hướng cả
 * trang sang `redirect()`, provider xác thực xong sẽ tự gọi lại `callback()`,
 * và ta điều hướng tiếp về một trang callback phía frontend kèm token trên
 * query string để trang đó lưu token và hoàn tất đăng nhập — giống cách đăng
 * nhập thường lưu token vào localStorage sau khi POST /auth/login.
 *
 * CẦN app OAuth thật (Client ID/Secret) mới hoạt động — xem CLAUDE.md §"Đăng
 * nhập mạng xã hội" để biết cách tạo trên Google Cloud Console / Meta for
 * Developers và khai báo trong .env. Thiếu cấu hình sẽ trả lỗi rõ ràng thay vì
 * lỗi khó hiểu từ Socialite.
 */
class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];

    public function redirect(Request $request, string $provider): RedirectResponse
    {
        $this->ensureSupportedAndConfigured($provider);

        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->ensureSupportedAndConfigured($provider);

        // Origin đầu tiên trong BDS_WEB_ORIGIN (có thể là danh sách phân tách bởi dấu
        // phẩy, giống cách config/cors.php đọc biến này) — nơi điều hướng trình duyệt
        // về sau khi provider xác thực xong.
        $frontendUrl = rtrim(explode(',', env('BDS_WEB_ORIGIN', 'http://localhost:3000'))[0], '/');
        $callbackPage = "{$frontendUrl}/dang-nhap/mang-xa-hoi";

        try {
            /** @var SocialiteUser $socialUser */
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (InvalidStateException) {
            return redirect("{$callbackPage}?error=".urlencode('Phiên đăng nhập đã hết hạn, vui lòng thử lại.'));
        } catch (\Throwable) {
            return redirect("{$callbackPage}?error=".urlencode('Không đăng nhập được qua '.ucfirst($provider).'. Vui lòng thử lại.'));
        }

        if (! $socialUser->getEmail()) {
            return redirect("{$callbackPage}?error=".urlencode('Tài khoản '.ucfirst($provider).' của bạn không có email công khai để liên kết.'));
        }

        $user = $this->findOrCreateUser($provider, $socialUser);

        if (! $user->isActive()) {
            return redirect("{$callbackPage}?error=".urlencode('Tài khoản đang bị tạm khóa.'));
        }

        $token = $user->createToken('api')->plainTextToken;

        return redirect("{$callbackPage}?token=".urlencode($token));
    }

    private function findOrCreateUser(string $provider, SocialiteUser $socialUser): User
    {
        $providerIdColumn = "{$provider}_id";

        // Đã từng đăng nhập bằng provider này → dùng lại đúng tài khoản đó.
        $user = User::where($providerIdColumn, $socialUser->getId())->first();

        if ($user) {
            return $user;
        }

        // Chưa từng dùng provider này, nhưng email đã có tài khoản (đăng ký thường
        // hoặc qua provider kia) → liên kết thêm vào tài khoản hiện có thay vì tạo trùng.
        $user = User::where('email', $socialUser->getEmail())->first();

        if ($user) {
            $user->update([$providerIdColumn => $socialUser->getId()]);

            return $user;
        }

        // Tài khoản hoàn toàn mới — mật khẩu ngẫu nhiên không dùng để đăng nhập
        // thường (chỉ đăng nhập qua provider), người dùng có thể đặt mật khẩu
        // thật sau ở trang Hồ sơ cá nhân > Đổi mật khẩu nếu muốn dùng thêm cách này.
        $user = User::create([
            'name' => $socialUser->getName() ?: $socialUser->getNickname() ?: 'Người dùng '.ucfirst($provider),
            'email' => $socialUser->getEmail(),
            'password' => Str::random(40),
            'avatar' => $socialUser->getAvatar(),
            'status' => 'active',
            $providerIdColumn => $socialUser->getId(),
        ]);

        $user->assignRole('member');

        return $user;
    }

    private function ensureSupportedAndConfigured(string $provider): void
    {
        if (! in_array($provider, self::PROVIDERS, true)) {
            throw ValidationException::withMessages([
                'provider' => ["Không hỗ trợ đăng nhập qua \"{$provider}\"."],
            ]);
        }

        if (! config("services.{$provider}.client_id") || ! config("services.{$provider}.client_secret")) {
            throw ValidationException::withMessages([
                'provider' => [
                    'Đăng nhập qua '.ucfirst($provider).' chưa được cấu hình trên máy chủ '
                    .'(thiếu Client ID/Secret trong .env).',
                ],
            ]);
        }
    }
}
