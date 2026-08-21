<?php

use Illuminate\Support\Facades\Schedule;

// Hằng ngày lúc 01:00 — chuyển tin quá hạn sang trạng thái expired.
Schedule::command('bds:expire-properties')->dailyAt('01:00');

// Dọn token Sanctum hết hạn.
Schedule::command('sanctum:prune-expired --hours=24')->daily();
