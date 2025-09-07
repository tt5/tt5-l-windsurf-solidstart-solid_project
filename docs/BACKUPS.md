# Database Backups

This document explains how to use the database backup functionality in the application.

## Automatic Backups

### Creating a Backup

To create a database backup:

```typescript
import { backupDatabase } from '../scripts/core/db';

// Basic usage (uses default settings)
const backupPath = await backupDatabase();
console.log(`Backup created at: ${backupPath}`);

// With custom options
const customBackup = await backupDatabase({
  maxBackups: 10,                  // Keep maximum of 10 backups
  backupDir: '/custom/backup/path' // Custom backup directory
});
```

### Default Settings

- **Backup Location**: `./data/backups/`
- **Max Backups Kept**: 5
- **Backup Naming**: `backup-{timestamp}.db` (e.g., `backup-2025-09-07T03-52-16-000Z.db`)

## Manual Backups

### List Existing Backups

```bash
# List all backup files
ls -l ./data/backups/
```

### Restore from Backup

To restore from a backup, simply replace the current database file with a backup:

```bash
# Stop the application first
cp ./data/backups/backup-2025-09-07T03-52-16-000Z.db ./data/app.db
```

## Best Practices

1. **Regular Backups**: Create backups before performing major database operations.
2. **Offsite Storage**: Consider copying important backups to a different machine or cloud storage.
3. **Test Restores**: Periodically verify that you can restore from your backups.
4. **Monitor Disk Space**: Ensure you have enough disk space for backups.

## Integration with Migrations

It's recommended to create a backup before running migrations:

```typescript
import { backupDatabase } from '../scripts/core/db';
import { runMigrations } from './migrations';

try {
  // Create backup before migrations
  await backupDatabase();
  
  // Run migrations
  await runMigrations();
} catch (error) {
  console.error('Migration failed:', error);
  // Restore from backup if needed
}
```

## Troubleshooting

- **Permission Issues**: Ensure the application has write access to the backup directory.
- **Disk Full**: Check available disk space if backups fail.
- **Corrupt Backups**: The system will automatically clean up failed backups.

For additional help, refer to the source code in `scripts/core/db.ts`.
