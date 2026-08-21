<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Notifications\PropertyApproved;
use App\Notifications\PropertyRejected;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ModerationController extends Controller
{
    /** Danh sách tin theo trạng thái (mặc định: chờ duyệt). */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Property::class);

        $properties = Property::query()
            ->when(
                $request->query('status'),
                fn ($q, $s) => $q->where('status', $s),
                fn ($q) => $q->where('status', PropertyStatus::Pending)
            )
            ->when($request->query('q'), fn ($q, $kw) => $q->search($kw))
            ->when($request->query('province_id'), fn ($q, $id) => $q->where('province_id', $id))
            ->with(['category', 'province', 'district', 'user', 'images'])
            ->orderBy('created_at')
            ->paginate(min((int) $request->query('per_page', 20), 50))
            ->withQueryString();

        return PropertyResource::collection($properties);
    }

    public function approve(Request $request, Property $property): JsonResponse
    {
        $this->authorize('moderate', Property::class);

        if (! in_array($property->status, [PropertyStatus::Pending, PropertyStatus::Rejected], true)) {
            throw ValidationException::withMessages([
                'status' => ['Chỉ tin đang chờ duyệt hoặc bị từ chối mới có thể duyệt.'],
            ]);
        }

        $days = (int) config('bds.publish_days', 30);

        $property->update([
            'status' => PropertyStatus::Published,
            'rejection_reason' => null,
            'published_at' => now(),
            'expired_at' => now()->addDays($days),
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
        ]);

        $property->user->notify(new PropertyApproved($property));

        return response()->json([
            'message' => 'Đã duyệt tin đăng.',
            'data' => new PropertyResource($property->fresh()),
        ]);
    }

    public function reject(Request $request, Property $property): JsonResponse
    {
        $this->authorize('moderate', Property::class);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ], [
            'reason.required' => 'Bắt buộc nhập lý do từ chối.',
            'reason.min' => 'Lý do từ chối phải có ít nhất 10 ký tự.',
        ], ['reason' => 'lý do từ chối']);

        if ($property->status !== PropertyStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Chỉ tin đang chờ duyệt mới có thể từ chối.'],
            ]);
        }

        $property->update([
            'status' => PropertyStatus::Rejected,
            'rejection_reason' => $data['reason'],
            'published_at' => null,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
        ]);

        $property->user->notify(new PropertyRejected($property, $data['reason']));

        return response()->json([
            'message' => 'Đã từ chối tin đăng.',
            'data' => new PropertyResource($property->fresh()),
        ]);
    }

    /** Gỡ tin (xóa mềm) — chỉ admin. */
    public function destroy(Request $request, Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $property->delete();

        return response()->json(null, 204);
    }
}
