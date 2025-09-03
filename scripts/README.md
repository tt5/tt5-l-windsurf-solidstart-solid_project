# Database Management System

This directory contains the database management scripts for the application.

## Getting Started

### Prerequisites

- Node.js 16+
- SQLite3

### Installation

```bash
# Install dependencies
npm install better-sqlite3 @types/better-sqlite3
```

## Available Commands

### Using npm scripts

```bash
# Initialize a new database
npm run db:init

# Run migrations
npm run db:migrate

# Check database status
npm run db:status

# Create a backup
npm run db:backup

# Reset the database (DANGEROUS!)
npm run db:reset
```

### Using the CLI directly

You can also use the CLI directly:

```bash
# Install the CLI globally
npm install -g .

# Then use it from anywhere
db --help
db status
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
