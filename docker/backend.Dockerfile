FROM php:8.2-cli

WORKDIR /var/www/html

RUN docker-php-ext-install pdo_sqlite

CMD ["php", "artisan", "serve", "--host=0.0.0.0"]