# 🗑️ Audit Logs Cleanup Guide

## Overview
This guide explains how to clear old audit logs from the database before deployment.

---

## 🖥️ Command Line (Recommended for Deployment)

### Clear logs older than 30 days (default)
```bash
php artisan logs:clear
```

### Clear logs older than specific days
```bash
# Clear logs older than 7 days
php artisan logs:clear --days=7

# Clear logs older than 90 days
php artisan logs:clear --days=90
```

### Clear ALL logs (use with caution!)
```bash
php artisan logs:clear --all
```

### Skip confirmation prompt (for scripts)
```bash
php artisan logs:clear --days=30 --force
php artisan logs:clear --all --force
```

---

## 🌐 API Endpoints (Admin Only)

### Clear old logs
```bash
DELETE /api/logs/clear/old?days=30
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "Successfully deleted 150 old audit logs.",
  "deleted": 150,
  "kept_days": 30
}
```

### Clear ALL logs
```bash
DELETE /api/logs/clear/all
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "Successfully cleared all 500 audit logs.",
  "deleted": 500
}
```

---

## 📋 Pre-Deployment Checklist

### Before pushing to production:

1. **Backup important logs** (optional)
   ```bash
   php artisan db:seed --class=LogBackupSeeder
   ```

2. **Clear old logs**
   ```bash
   php artisan logs:clear --days=30 --force
   ```

3. **Verify logs cleared**
   ```bash
   php artisan tinker
   >>> App\Models\Log::count()
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Clear old audit logs before deployment"
   git push
   ```

---

## 🔄 Automated Cleanup (Scheduled)

Add to `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Clear logs older than 90 days every week
    $schedule->command('logs:clear --days=90 --force')
             ->weekly()
             ->sundays()
             ->at('02:00');
}
```

Or monthly:
```php
protected function schedule(Schedule $schedule)
{
    // Clear logs older than 30 days every month
    $schedule->command('logs:clear --days=30 --force')
             ->monthly()
             ->at('02:00');
}
```

---

## 💡 Usage Examples

### Example 1: Clear before deployment
```bash
# Clear logs older than 7 days
php artisan logs:clear --days=7 --force

# Output:
# Found 45 logs older than 7 days (before 2026-04-19 10:30:00)
# ✓ Successfully deleted 45 old audit logs.
# ✓ Kept logs from the last 7 days.
```

### Example 2: Clear all logs (fresh start)
```bash
php artisan logs:clear --all --force

# Output:
# ✓ Successfully cleared all 200 audit logs.
```

### Example 3: Interactive mode
```bash
php artisan logs:clear --days=30

# Output:
# Found 120 logs older than 30 days (before 2026-03-27 10:30:00)
# Do you want to delete these logs? (yes/no) [no]:
# > yes
# ✓ Successfully deleted 120 old audit logs.
# ✓ Kept logs from the last 30 days.
```

---

## 🔒 Security Notes

1. **Admin Only**: API endpoints require admin authentication
2. **Confirmation**: Command requires confirmation unless `--force` is used
3. **Irreversible**: Deleted logs cannot be recovered
4. **Backup**: Consider backing up logs before clearing

---

## 📊 Recommended Retention Periods

| Environment | Retention Period | Command |
|-------------|------------------|---------|
| Development | 7 days | `php artisan logs:clear --days=7` |
| Staging | 30 days | `php artisan logs:clear --days=30` |
| Production | 90 days | `php artisan logs:clear --days=90` |

---

## 🚨 Troubleshooting

### "No logs to clear"
- No logs match the criteria
- Check with: `php artisan tinker` → `App\Models\Log::count()`

### "Permission denied"
- Ensure you have database write permissions
- Check database connection in `.env`

### "Command not found"
- Run: `composer dump-autoload`
- Verify file exists: `app/Console/Commands/ClearOldLogs.php`

---

## 📝 Quick Reference

```bash
# Most common use case (before deployment)
php artisan logs:clear --days=30 --force

# Check how many logs will be deleted
php artisan tinker
>>> App\Models\Log::where('created_at', '<', now()->subDays(30))->count()

# Clear and verify
php artisan logs:clear --days=30 --force
php artisan tinker
>>> App\Models\Log::count()
```

---

**Created:** April 26, 2026  
**Last Updated:** April 26, 2026
