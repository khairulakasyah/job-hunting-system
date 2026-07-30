FROM php:8.3-cli-alpine

RUN apk add --no-cache postgresql-dev oniguruma-dev libxml2-dev \
    && docker-php-ext-install pdo_pgsql mbstring xml bcmath ctype curl fileinfo

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

# .env is excluded by .dockerignore, but Laravel needs one during build
RUN cp .env.example .env \
    && composer install --no-dev --optimize-autoloader \
    && php artisan key:generate \
    && php artisan optimize \
    && chmod -R 777 storage bootstrap/cache \
    && rm .env

EXPOSE 8000

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
