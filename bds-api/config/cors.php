<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CORS cho bds-web gọi bds-api
    |--------------------------------------------------------------------------
    | Production: đặt BDS_WEB_ORIGIN=https://yourdomain.com trong .env.
    | Không dùng '*' khi đã bật supports_credentials.
    */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(
        explode(',', (string) env('BDS_WEB_ORIGIN', 'http://localhost:3000'))
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false, // dùng Bearer token, không dùng cookie session
];
