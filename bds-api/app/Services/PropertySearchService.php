<?php

namespace App\Services;

use App\Models\Property;
use App\Support\VietnameseText;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class PropertySearchService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return $this->query($filters)->paginate($perPage)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function query(array $filters): Builder
    {
        $query = Property::query()
            ->public()
            ->with(['category', 'province', 'district', 'ward', 'user', 'images']);

        $this->applyFilters($query, $filters);
        $this->applySort($query, $filters['sort'] ?? 'newest', $filters['q'] ?? null);

        return $query;
    }

    /**
     * Truy vấn nhẹ dành cho bản đồ: chỉ lấy cột cần thiết, giới hạn số marker.
     *
     * @param  array<string, mixed>  $filters
     */
    public function markers(array $filters): Collection
    {
        $limit = (int) config('bds.map.max_markers', 300);

        $query = Property::query()
            ->public()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with(['images' => fn ($q) => $q->where('is_primary', true)]);

        $this->applyFilters($query, $filters);

        return $query
            ->select(['id', 'title', 'slug', 'price', 'price_unit', 'area', 'latitude', 'longitude', 'bedrooms'])
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();
    }

    /**
     * @param  array<string, mixed>  $f
     */
    private function applyFilters(Builder $query, array $f): void
    {
        $query
            ->when(filled($f['q'] ?? null), fn ($q) => $q->search($f['q']))
            ->when(filled($f['listing_type'] ?? null), fn ($q) => $q->where('listing_type', $f['listing_type']))
            ->when(filled($f['category_id'] ?? null), fn ($q) => $q->where('category_id', $f['category_id']))
            ->when(filled($f['type'] ?? null), fn ($q) => $q->whereHas('category', fn ($c) => $c->where('type', $f['type'])))
            ->when(filled($f['province_id'] ?? null), fn ($q) => $q->where('province_id', $f['province_id']))
            ->when(filled($f['district_id'] ?? null), fn ($q) => $q->where('district_id', $f['district_id']))
            ->when(filled($f['ward_id'] ?? null), fn ($q) => $q->where('ward_id', $f['ward_id']))
            ->when(filled($f['project_id'] ?? null), fn ($q) => $q->where('project_id', $f['project_id']))
            ->when(filled($f['price_min'] ?? null), fn ($q) => $q->where('price', '>=', $f['price_min']))
            ->when(filled($f['price_max'] ?? null), fn ($q) => $q->where('price', '<=', $f['price_max']))
            ->when(filled($f['area_min'] ?? null), fn ($q) => $q->where('area', '>=', $f['area_min']))
            ->when(filled($f['area_max'] ?? null), fn ($q) => $q->where('area', '<=', $f['area_max']))
            ->when(filled($f['bedrooms'] ?? null), fn ($q) => $q->where('bedrooms', '>=', $f['bedrooms']))
            ->when(filled($f['bathrooms'] ?? null), fn ($q) => $q->where('bathrooms', '>=', $f['bathrooms']))
            ->when(filled($f['direction'] ?? null), fn ($q) => $q->where('direction', $f['direction']))
            ->when(filled($f['legal_status'] ?? null), fn ($q) => $q->where('legal_status', $f['legal_status']))
            ->when(filled($f['furniture'] ?? null), fn ($q) => $q->where('furniture', $f['furniture']));

        // Lọc theo bán kính quanh một tọa độ.
        if (filled($f['lat'] ?? null) && filled($f['lng'] ?? null)) {
            $radius = min(
                (float) ($f['radius'] ?? config('bds.map.default_radius_km', 5)),
                (float) config('bds.map.max_radius_km', 50)
            );

            $query->withinRadius((float) $f['lat'], (float) $f['lng'], $radius);
        }

        // Lọc theo khung nhìn bản đồ (bounding box).
        if (filled($f['bounds'] ?? null) && is_array($f['bounds'])) {
            [$swLat, $swLng, $neLat, $neLng] = array_map('floatval', $f['bounds']);
            $query->whereBetween('latitude', [min($swLat, $neLat), max($swLat, $neLat)])
                ->whereBetween('longitude', [min($swLng, $neLng), max($swLng, $neLng)]);
        }
    }

    private function applySort(Builder $query, string $sort, ?string $keyword): void
    {
        // "relevance" chỉ có ý nghĩa khi có từ khóa tìm kiếm — không có `q` thì
        // không có gì để xếp theo độ liên quan, rơi về mặc định (tin mới nhất).
        if ($sort === 'relevance' && filled($keyword)) {
            $this->applyRelevanceOrder($query, $keyword);

            return;
        }

        match ($sort) {
            'price_asc' => $query->orderByRaw('price IS NULL, price ASC'),
            'price_desc' => $query->orderByRaw('price IS NULL, price DESC'),
            'area_asc' => $query->orderBy('area'),
            'area_desc' => $query->orderByDesc('area'),
            'views' => $query->orderByDesc('views_count'),
            default => $query->orderByDesc('is_featured')->orderByDesc('published_at')->orderByDesc('id'),
        };
    }

    /**
     * Xếp hạng theo độ liên quan: `scopeSearch()` đã bắt buộc mọi từ khóa phải
     * xuất hiện trong `search_text` (AND), nên tại bước sắp xếp mọi dòng đều
     * đã khớp — cái khác nhau là khớp *sớm hay muộn* trong chuỗi. Vì
     * `syncSearchText()` nối `title` trước rồi mới đến `description`/`address`,
     * vị trí khớp càng nhỏ (INSTR càng nhỏ) nghĩa là khớp ở tiêu đề — liên quan
     * hơn khớp sâu trong mô tả. Cộng dồn vị trí của tất cả từ khóa, tổng càng
     * nhỏ càng liên quan. `INSTR()` có ở cả SQLite lẫn MySQL nên không cần
     * nhánh riêng theo driver như `scopeWithinRadius()`.
     */
    private function applyRelevanceOrder(Builder $query, string $keyword): void
    {
        $normalized = VietnameseText::normalize($keyword);
        $terms = array_values(array_filter(explode(' ', $normalized)));

        if ($terms === []) {
            $query->orderByDesc('is_featured')->orderByDesc('published_at')->orderByDesc('id');

            return;
        }

        $bindings = [];
        $parts = [];

        foreach ($terms as $term) {
            $parts[] = 'INSTR(search_text, ?)';
            $bindings[] = $term;
        }

        $query->orderByRaw('('.implode(' + ', $parts).') ASC', $bindings)
            ->orderByDesc('published_at')
            ->orderByDesc('id');
    }
}
