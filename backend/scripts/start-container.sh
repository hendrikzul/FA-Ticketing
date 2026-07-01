#!/bin/sh

set -eu

cd /var/www/html

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

mkdir -p bootstrap/cache storage/framework/cache storage/framework/sessions storage/framework/views

if [ ! -f vendor/autoload.php ]; then
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
  php artisan key:generate --force
fi

php artisan config:clear
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000
