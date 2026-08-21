<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isActive()) {
            return response()->json([
                'message' => 'Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ quản trị viên.',
            ], 403);
        }

        return $next($request);
    }
}
