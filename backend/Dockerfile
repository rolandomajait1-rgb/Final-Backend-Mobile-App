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
    unzip \
    postgresql-client

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

# Create startup script with better error handling and longer timeout
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Starting Laravel application..."\n\
echo "Database Host: ${DB_HOST}"\n\
echo "Database Port: ${DB_PORT}"\n\
echo "Database Name: ${DB_DATABASE}"\n\
\n\
# Wait for database to be ready with longer timeout\n\
echo "Waiting for database connection..."\n\
MAX_RETRIES=120\n\
RETRY_COUNT=0\n\
\n\
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do\n\
  if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" > /dev/null 2>&1; then\n\
    echo "✓ Database server is accepting connections"\n\
    \n\
    # Test actual database connection\n\
    if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" -c "SELECT 1" > /dev/null 2>&1; then\n\
      echo "✓ Successfully connected to database"\n\
      break\n\
    else\n\
      echo "Database server ready but cannot connect to database yet..."\n\
    fi\n\
  fi\n\
  \n\
  RETRY_COUNT=$((RETRY_COUNT + 1))\n\
  REMAINING=$((MAX_RETRIES - RETRY_COUNT))\n\
  echo "Database not ready, waiting... ($RETRY_COUNT/$MAX_RETRIES, $REMAINING attempts remaining)"\n\
  sleep 2\n\
done\n\
\n\
if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then\n\
  echo "❌ ERROR: Database connection timeout after $MAX_RETRIES attempts"\n\
  echo "Please check:"\n\
  echo "  1. Database service is running on Render"\n\
  echo "  2. DATABASE_URL environment variable is set correctly"\n\
  echo "  3. Database and web service are in the same region"\n\
  echo "  4. Database has finished initializing"\n\
  exit 1\n\
fi\n\
\n\
# Run migrations\n\
echo "Running migrations..."\n\
php artisan migrate --force || { echo "❌ Migration failed"; exit 1; }\n\
\n\
# Run seeders (optional, don\'t fail if it errors)\n\
echo "Running seeders..."\n\
php artisan db:seed --force || echo "⚠ Seeding failed, continuing..."\n\
\n\
# Cache configuration\n\
echo "Caching configuration..."\n\
php artisan config:cache\n\
php artisan route:cache\n\
php artisan view:cache\n\
\n\
# Create storage link\n\
php artisan storage:link || true\n\
\n\
echo "✓ Application ready!"\n\
echo "Starting server on port ${PORT:-10000}"\n\
php artisan serve --host=0.0.0.0 --port=${PORT:-10000}\n\
' > /var/www/start.sh && chmod +x /var/www/start.sh

# Expose port
EXPOSE ${PORT:-10000}

# Start command
CMD ["/var/www/start.sh"]
