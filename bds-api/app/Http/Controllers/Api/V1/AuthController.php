<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\SpamGuard;
use App\Support\VietnamesePhone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:'.VietnamesePhone::REGEX, 'unique:users,phone'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
            'company' => ['nullable', 'string', 'max:150'],
        ], [], [
            'name' => 'họ tên',
            'email' => 'email',
            'phone' => 'số điện thoại',
            'password' => 'mật khẩu',
        ]);

        // Không thể trả "thành công giả" như form liên hệ/báo cáo (đăng ký cần
        // token thật để đăng nhập tiếp) — báo lỗi chung chung thay vì tiết lộ
        // chính xác lý do bị chặn, tránh chỉ điểm cho bot cách né honeypot/thời gian.
        if (SpamGuard::isSuspicious($request)) {
            throw ValidationException::withMessages([
                'email' => ['Không tạo được tài khoản. Vui lòng thử lại.'],
            ]);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => $data['password'],
            'company' => $data['company'] ?? null,
            'status' => 'active',
        ]);

        $user->assignRole('member');

        return (new UserResource($user->fresh()))
            ->additional([
                'message' => 'Đăng ký thành công.',
                'token' => $user->createToken('api')->plainTextToken,
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Cho phép đăng nhập bằng email hoặc số điện thoại.
        $user = User::where('email', $data['email'])
            ->orWhere('phone', $data['email'])
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email/số điện thoại hoặc mật khẩu không đúng.'],
            ]);
        }

        if (! $user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đang bị tạm khóa.'],
            ]);
        }

        return (new UserResource($user))
            ->additional(['token' => $user->createToken('api')->plainTextToken])
            ->response();
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Đã đăng xuất.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function updateProfile(Request $request): UserResource
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'required', 'string', 'regex:'.VietnamesePhone::REGEX, 'unique:users,phone,'.$user->id],
            'company' => ['nullable', 'string', 'max:150'],
            'avatar' => ['nullable', 'string', 'max:255'],
            // Kênh mạng xã hội ở cấp hồ sơ, áp dụng cho mọi tin đăng của người
            // này — khác contact_zalo/contact_facebook trên Property (đặt
            // riêng theo từng tin, xem CLAUDE.md §4.31).
            'social_tiktok' => ['nullable', 'url', 'max:255'],
            'social_youtube' => ['nullable', 'url', 'max:255'],
            'social_instagram' => ['nullable', 'url', 'max:255'],
        ]);

        $user->update($data);

        return new UserResource($user->fresh());
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
            // "Ghi nhớ đăng nhập" ở form đổi mật khẩu: giữ nguyên phiên đang dùng
            // (không bắt đăng nhập lại ngay trên thiết bị này), chỉ thu hồi token
            // của các thiết bị/phiên khác — vẫn đảm bảo tính năng bảo mật gốc của
            // việc đổi mật khẩu (đăng xuất nơi khác) mà không làm phiền người vừa đổi.
            'keep_current_session' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        $user->update(['password' => $data['password']]);

        // currentAccessToken() có thể null (vd. test dùng actingAs() không qua token
        // thật) — khi đó không có gì để "giữ lại" nên rơi về hành vi cũ: thu hồi hết.
        $currentTokenId = optional($request->user()->currentAccessToken())->id;
        $keepCurrentSession = $request->boolean('keep_current_session') && $currentTokenId;

        if ($keepCurrentSession) {
            $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        } else {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $keepCurrentSession
                ? 'Đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất.'
                : 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
            'logged_out' => ! $keepCurrentSession,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        // Không tiết lộ email có tồn tại hay không (chống dò tài khoản).
        return response()->json([
            'message' => $status === Password::RESET_LINK_SENT
                ? 'Đã gửi email hướng dẫn đặt lại mật khẩu.'
                : 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        return response()->json(['message' => 'Đặt lại mật khẩu thành công.']);
    }
}
