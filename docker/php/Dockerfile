# Image PHP-FPM cho bds-api (Laravel 13, PHP 8.3)
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        git \
        curl \
        unzip \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
        freetype-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        libwebp-dev \
        $PHPIZE_DEPS \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        bcmath \
        exif \
        gd \
        intl \
        opcache \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Cấu hình PHP phù hợp việc upload nhiều ảnh tin đăng.
RUN { \
        echo 'upload_max_filesize=10M'; \
        echo 'post_max_size=60M'; \
        echo 'memory_limit=512M'; \
        echo 'max_execution_time=120'; \
    } > /usr/local/etc/php/conf.d/bds-api.ini

WORKDIR /var/www/bds-api

EXPOSE 9000

CMD ["php-fpm"]
