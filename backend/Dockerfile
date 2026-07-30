FROM php:8.3-cli-alpine

# Install git along with postgresql dependencies
RUN apk add --no-cache postgresql-dev git \
    && docker-php-ext-install pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

# Run the build steps with corrected directory paths
RUN cp .env.example .env \
    && composer install --no-dev --no-interaction --optimize-autoloader --no-scripts \
    && php artisan key:generate --force \
    && php artisan package:discover --ansi \
    && php artisan optimize \
    && chmod -R 777 storage bootstrap/cache \
    && rm .env

EXPOSE 8000

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]