#!/bin/bash
set -e

echo "Starting Laravel application..."
echo "Database Host: ${DB_HOST}"
echo "Database Port: ${DB_PORT}"
echo "Database Name: ${DB_DATABASE}"

# Wait for database to be ready with longer timeout
echo "Waiting for database connection..."
MAX_RETRIES=120
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" > /dev/null 2>&1; then
    echo "✓ Database server is accepting connections"
    
    # Test actual database connection
    if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" -c "SELECT 1" > /dev/null 2>&1; then
      echo "✓ Successfully connected to database"
      break
    else
      echo "Database server ready but cannot connect to database yet..."
    fi
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  REMAINING=$((MAX_RETRIES - RETRY_COUNT))
  echo "Database not ready, waiting... ($RETRY_COUNT/$MAX_RETRIES, $REMAINING attempts remaining)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ ERROR: Database connection timeout after $MAX_RETRIES attempts"
  echo "Please check:"
  echo "  1. Database service is running on Render"
  echo "  2. DATABASE_URL environment variable is set correctly"
  echo "  3. Database and web service are in the same region"
  echo "  4. Database has finished initializing"
  exit 1
fi

# Run migrations
echo "Running migrations..."
php artisan migrate --force || { echo "❌ Migration failed"; exit 1; }

# Run seeders (optional, don't fail if it errors)
echo "Running seeders..."
php artisan db:seed --force || echo "⚠ Seeding failed, continuing..."

# Cache configuration
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
php artisan storage:link || true

echo "✓ Application ready!"
echo "Starting server on port ${PORT:-10000}"
php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
