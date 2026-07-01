ARG BASE_IMAGE=php:8.4-cli-bookworm
ARG SKIP_SYSTEM_DEPS=0
FROM ${BASE_IMAGE}

# Core system deps — always needed
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libzip-dev \
        zip unzip \
        git curl ca-certificates \
        && rm -rf /var/lib/apt/lists/*

# PHP extensions — always needed for PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql pgsql zip

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for cache
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader --no-scripts

# Copy app
COPY . .

# Run post-install scripts now that artisan exists
RUN composer run-script post-autoload-dump

# Permissions
RUN mkdir -p /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/bootstrap/cache && \
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

CMD ["/bin/sh", "/var/www/html/scripts/start-container.sh"]
