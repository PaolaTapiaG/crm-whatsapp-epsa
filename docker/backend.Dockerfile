
FROM php:8.2-cli

WORKDIR /var/www/html

RUN apt-get update \
        && apt-get install -y --no-install-recommends git unzip libpq-dev libsqlite3-dev \
        && docker-php-ext-install pdo_mysql pdo_pgsql pdo_sqlite \
        && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY backend-laravel/composer.json backend-laravel/composer.lock ./
ENV COMPOSER_MAX_PARALLEL_HTTP=1 \
    COMPOSER_PROCESS_TIMEOUT=900
RUN git config --global http.version HTTP/1.1 \
    && composer install --no-dev --no-interaction --prefer-source --no-scripts \
    || (sleep 10 && composer install --no-dev --no-interaction --prefer-source --no-scripts)

COPY backend-laravel/ ./

RUN composer dump-autoload --no-dev --optimize \
        && php artisan package:discover --ansi

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
        && chmod -R 775 storage bootstrap/cache

EXPOSE 10000

# Verificar que el middleware CORS existe
RUN echo "=== Verificando EnsureCors.php ===" \
    && cat app/Http/Middleware/EnsureCors.php \
    && echo "=== Verificando bootstrap/app.php ===" \
    && grep -A10 "withMiddleware" bootstrap/app.php

CMD ["sh", "-c", "php artisan config:clear && exec env PHP_CLI_SERVER_WORKERS=1 php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
