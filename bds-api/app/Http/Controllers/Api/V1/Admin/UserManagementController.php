<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->when($request->query('q'), function ($q, $kw) {
                $q->where(function ($sub) use ($kw) {
                    $sub->where('name', 'like', "%{$kw}%")
                        ->orWhere('email', 'like', "%{$kw}%")
                        ->orWhere('phone', 'like', "%{$kw}%");
                });
            })
            ->when($request->query('role'), fn ($q, $role) => $q->role($role))
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->withCount('properties')
            ->orderByDesc('id')
            ->paginate(min((int) $request->query('per_page', 20), 50))
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        return new UserResource($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'unique:users,phone,'.$user->id],
            'company' => ['nullable', 'string', 'max:150'],
            'status' => ['sometimes', Rule::in(['active', 'suspended', 'pending'])],
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'Đã cập nhật người dùng.',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $this->authorize('assignRole', User::class);

        $data = $request->validate([
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => [Rule::in(UserRole::values())],
        ]);

        // Không cho tự hạ quyền chính mình khỏi admin (tránh khóa hệ thống).
        if ($user->id === $request->user()->id && ! in_array('admin', $data['roles'], true)) {
            return response()->json([
                'message' => 'Bạn không thể tự gỡ quyền quản trị của chính mình.',
            ], 422);
        }

        $user->syncRoles($data['roles']);

        return response()->json([
            'message' => 'Đã cập nhật vai trò.',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return response()->json(null, 204);
    }
}
