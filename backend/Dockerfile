FROM php:8.4-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_pgsql pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . /var/www

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for database to be ready\n\
echo "Waiting for database..."\n\
for i in {1..30}; do\n\
  if php artisan db:show > /dev/null 2>&1; then\n\
    echo "Database is ready!"\n\
    break\n\
  fi\n\
  echo "Database not ready, waiting... ($i/30)"\n\
  sleep 2\n\
done\n\
\n\
# Run migrations\n\
php artisan migrate --force\n\
\n\
# Cache configuration\n\
php artisan config:cache\n\
php artisan route:cache\n\
php artisan view:cache\n\
\n\
# Create storage link\n\
php artisan storage:link || true\n\
\n\
# Start server\n\
php artisan serve --host=0.0.0.0 --port=${PORT:-10000}\n\
' > /var/www/start.sh && chmod +x /var/www/start.sh

# Expose port
EXPOSE ${PORT:-10000}

# Start command
CMD ["/var/www/start.sh"]
