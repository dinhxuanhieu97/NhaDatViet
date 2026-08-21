<?php

namespace App\Enums;

enum ListingType: string
{
    case Sale = 'sale';
    case Rent = 'rent';

    public function label(): string
    {
        return match ($this) {
            self::Sale => 'Bán',
            self::Rent => 'Cho thuê',
        };
    }
}
