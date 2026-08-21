<?php

namespace App\Console\Commands;

use App\Enums\PropertyStatus;
use App\Models\Property;
use Illuminate\Console\Command;

class ExpireProperties extends Command
{
    protected $signature = 'bds:expire-properties';

    protected $description = 'Chuyển các tin đăng quá hạn sang trạng thái hết hạn';

    public function handle(): int
    {
        $count = Property::query()
            ->where('status', PropertyStatus::Published)
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', now())
            ->update(['status' => PropertyStatus::Expired]);

        $this->info("Đã chuyển {$count} tin đăng sang trạng thái hết hạn.");

        return self::SUCCESS;
    }
}
