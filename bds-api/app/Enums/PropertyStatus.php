<?php

namespace App\Enums;

enum PropertyStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Published = 'published';
    case Rejected = 'rejected';
    case Expired = 'expired';
    case Hidden = 'hidden';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Tin nháp',
            self::Pending => 'Chờ duyệt',
            self::Published => 'Đang hiển thị',
            self::Rejected => 'Bị từ chối',
            self::Expired => 'Hết hạn',
            self::Hidden => 'Đã ẩn',
        };
    }

    /** Các trạng thái hiển thị công khai. */
    public static function publicStatuses(): array
    {
        return [self::Published->value];
    }
}
