FROM php:8.2-cli

WORKDIR /var/www/html

RUN apt-get update \
	&& apt-get install -y --no-install-recommends git unzip libpq-dev libsqlite3-dev \
	&& docker-php-ext-install pdo_mysql pdo_pgsql pdo_sqlite \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY backend-laravel/composer.json backend-laravel/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

COPY backend-laravel/ ./

RUN composer dump-autoload --no-dev --optimize \
	&& php artisan package:discover --ansi

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
	&& chmod -R 775 storage bootstrap/cache

EXPOSE 10000

# Render injects production variables at runtime. Clear an older cached config before
# serving so CORS and provider settings always use the current deployment values.
CMD ["sh", "-c", "php artisan config:clear && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
