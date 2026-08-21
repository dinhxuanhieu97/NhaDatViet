<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Moderator = 'moderator';
    case Agent = 'agent';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Quản trị viên',
            self::Moderator => 'Kiểm duyệt viên',
            self::Agent => 'Môi giới',
            self::Member => 'Thành viên',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
