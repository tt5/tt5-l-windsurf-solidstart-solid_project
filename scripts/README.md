# Database Management System

This directory contains the database management scripts for the application.

## Getting Started

### Prerequisites

- Node.js 20+
- SQLite3

## Available Commands

### Database Initialization and Migration

```bash
# Initialize a new database (creates required tables)
npm run db:init

# Run database migrations
npm run db:migrate

# Check database status and verify integrity
npm run db:check

# Detailed database verification
npm run db:verify
```

### Direct Script Usage

You can also run the scripts directly with `tsx`:

```bash
# Initialize database
tsx scripts/migrate.ts init

# Run migrations
tsx scripts/migrate.ts migrate

# Check database status
tsx scripts/check-db.ts

# Detailed verification
tsx scripts/check-db.ts verify
```

## Script Descriptions

### `migrate.ts`

A comprehensive database migration and initialization script that handles:
- Database initialization with required tables
- Running database migrations
- Managing migration history

### `check-db.ts`

A database verification and health check script that provides:
- Database connection verification
- Table existence and structure validation
- Row count statistics
- Migration status
- Data integrity checks

## Best Practices

1. **Always backup your database** before running migrations or initialization
2. Use `db:check` regularly to verify database health
3. Run `db:init` only when setting up a new environment
4. Use `db:migrate` to apply database schema changes
5. Check the output of verification scripts for any warnings or errors
db migrate
```

## Migration System

### Creating a New Migration

1. Create a new file in the `migrations` directory with the following naming convention:
   `###_description_of_change.ts` (e.g., `001_initial_schema.ts`)

2. The migration file should export the following:
   ```typescript
   export const description = 'Description of what this migration does';
   
   export function up(db: Database) {
     // Migration code here
   }
   
   // Optional: Implement down() to revert the migration
   export function down(db: Database) {
     // Rollback code here
   }
   ```

### Running Migrations

Migrations are automatically run in order based on their filenames. The system keeps track of which migrations have been applied in the `migrations` table.

## Best Practices

1. Always create a backup before running migrations
2. Test migrations in a development environment first
3. Write idempotent migrations that can be run multiple times safely
4. Include both `up` and `down` methods for each migration
5. Use transactions for data migrations to ensure consistency

## File Structure

```
scripts/
├── core/
│   ├── db.ts          # Core database utilities
│   └── migrate.ts     # Migration system
├── migrations/        # Database migrations
│   ├── 001_initial_schema.ts
│   └── ...
└── cli.ts            # Command-line interface
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
