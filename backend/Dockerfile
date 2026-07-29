FROM php:8.3-cli

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install

RUN mkdir -p storage bootstrap/cache

EXPOSE 8000

CMD ["php","artisan","serve","--host=0.0.0.0","--port=8000"]