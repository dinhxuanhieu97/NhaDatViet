<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\District;
use App\Models\Province;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class LocationController extends Controller
{
    public function provinces(): JsonResponse
    {
        $data = $this->rememberArray('locations:provinces', now()->addWeek(), function () {
            return Province::query()
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'slug', 'type']);
        });

        return response()->json(['data' => $data]);
    }

    public function districts(Province $province): JsonResponse
    {
        $data = $this->rememberArray("locations:districts:{$province->id}", now()->addWeek(), function () use ($province) {
            return $province->districts()
                ->orderBy('name')
                ->get(['id', 'province_id', 'code', 'name', 'slug', 'type']);
        });

        return response()->json(['data' => $data]);
    }

    public function wards(District $district): JsonResponse
    {
        $data = $this->rememberArray("locations:wards:{$district->id}", now()->addWeek(), function () use ($district) {
            return $district->wards()
                ->orderBy('name')
                ->get(['id', 'district_id', 'code', 'name', 'slug', 'type']);
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Cache::remember nhưng lưu mảng thuần (->toArray()) thay vì Collection Eloquent.
     *
     * Từng gãy /nha-dat-ban vì cache DB lưu Collection object — sau một lần
     * migrate:fresh/seed lại, unserialize() trả "incomplete object" (class chưa
     * nạp đúng lúc đọc cache), khiến frontend .map() lỗi và crash cả trang.
     * Lưu mảng thuần thì không bao giờ gặp lỗi unserialize object kiểu này;
     * đồng thời tự phục hồi nếu cache cũ (từ code trước đây) vẫn còn hỏng.
     */
    private function rememberArray(string $key, \DateTimeInterface $ttl, \Closure $resolver): array
    {
        try {
            $cached = Cache::get($key);

            if (is_array($cached)) {
                return $cached;
            }
        } catch (\Throwable) {
            // cache hỏng — bỏ qua, tính lại bên dưới
        }

        Cache::forget($key);
        $fresh = $resolver()->toArray();
        Cache::put($key, $fresh, $ttl);

        return $fresh;
    }
}
