FROM php:8.3-cli-alpine

# Install git along with postgresql dependencies
RUN apk add --no-cache postgresql-dev git \
    && docker-php-ext-install pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

# Step 1 — Generate app key, then install Composer dependencies
RUN cp .env.example .env \
    && php -r "file_put_contents('.env', str_replace('APP_KEY=', 'APP_KEY=base64:' . base64_encode(random_bytes(32)), file_get_contents('.env')));" \
    && composer install --no-dev --no-interaction --optimize-autoloader --no-scripts

# Step 2b — Clear stale cache, then discover packages
RUN rm -f bootstrap/cache/*.php \
    && php artisan package:discover --ansi

# Step 2c — Cache config
RUN php artisan config:cache

# Step 2d — Cache events
RUN php artisan event:cache

# Step 2e — Cache routes
RUN php artisan route:cache

# Step 3 — Set permissions and remove build-only .env
RUN chmod -R 777 storage bootstrap/cache \
    && rm .env

EXPOSE 8000

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]