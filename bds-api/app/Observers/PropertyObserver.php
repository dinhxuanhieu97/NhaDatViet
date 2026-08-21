<?php

namespace App\Observers;

use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Support\PropertyListingCache;
use App\Support\VietnameseText;
use Illuminate\Support\Str;

class PropertyObserver
{
    public function creating(Property $property): void
    {
        $property->syncSearchText();

        // Slug thật cần id (sinh ở created()); đặt giá trị tạm duy nhất để thỏa ràng buộc UNIQUE.
        if (blank($property->slug)) {
            $property->slug = 'tmp-'.Str::uuid();
        }
    }

    public function created(Property $property): void
    {
        $property->slug = $this->uniqueSlug($property);
        $property->saveQuietly();

        // Hiếm khi tin được tạo thẳng ở trạng thái Published (vd. factory
        // ->published() trong test) — vẫn cần bỏ cache listing cũ nếu có.
        if ($property->status === PropertyStatus::Published) {
            PropertyListingCache::invalidate();
        }
    }

    public function updating(Property $property): void
    {
        $property->syncSearchText();

        if ($property->isDirty('title')) {
            $property->slug = $this->uniqueSlug($property);
        }
    }

    /**
     * Tin đổi trạng thái (duyệt / từ chối / tự ẩn do báo cáo / hết hạn qua
     * `->update()` từng model...) → cache trang danh sách công khai cũ không
     * còn đúng nữa, tăng phiên bản để bỏ qua toàn bộ cache cũ ngay lập tức.
     *
     * Không bắt được mass update (`Property::query()->update()`, vd. cron
     * `bds:expire-properties`) vì Eloquent không bắn event cho mass update —
     * chấp nhận được vì `scopePublic()` tự loại tin hết hạn theo thời gian ở
     * tầng query, TTL cache là lưới an toàn cho khoảng trễ đó. Xem CLAUDE.md §4.25.
     */
    public function updated(Property $property): void
    {
        if ($property->wasChanged('status')) {
            PropertyListingCache::invalidate();
        }
    }

    public function deleted(Property $property): void
    {
        if ($property->status === PropertyStatus::Published) {
            PropertyListingCache::invalidate();
        }
    }

    private function uniqueSlug(Property $property): string
    {
        return VietnameseText::slug($property->title, $property->id);
    }
}
