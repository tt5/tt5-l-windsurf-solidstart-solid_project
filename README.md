# SolidStart Project

A SolidStart application with SQLite database integration.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- SQLite3

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Database Management

### Initial Setup

1. Create the database and tables:
   ```bash
   npm run db:init
   ```

### Migrations

Migrations are stored in the `/migrations` directory and are used to manage database schema changes.

#### Creating a New Migration

```bash
# Create a new migration file
npm run db:create-migration "Your migration description"
```

This will create a new timestamped migration file in the `/migrations` directory.

#### Running Migrations

```bash
# Run all pending migrations
npm run db:migrate
```

#### Checking Database Status

```bash
# Check database status and applied migrations
npm run db:check
```

### Development Workflow

1. Create a new migration for your changes:
   ```bash
   npm run db:create-migration "Add new feature table"
   ```

2. Edit the generated migration file in `/migrations`

3. Test your migration:
   ```bash
   # Reset the database (warning: deletes all data)
   rm -rf data/
   
   # Reinitialize and run migrations
   npm run db:init
   npm run db:migrate
   ```

## Database Setup

This project uses SQLite for data storage. Follow these steps to set up the database:

1. **Create a `.env` file** in the project root with the following content:
   ```
   DATABASE_URL=file:./data/dev.db
   ```

2. **Create a data directory** (if it doesn't exist):
   ```bash
   mkdir -p data
   ```

3. **Run database migrations** to set up the schema:
   ```bash
   npm run db:migrate
   ```
   This will create the SQLite database file at `./data/dev.db` and apply all pending migrations.

### Available Database Scripts

- `npm run db:migrate`: Run database migrations
- `npm run db:create-migration <name>`: Create a new migration file
- `npm run db:reset`: Reset the database (warning: will delete all data)

## Development

`rm -rf data` `npm run db:migrate -- init`

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

Logout and then go to /game

Now restarting the server and refreshing /game will always auto-logged in.

## Deployment

For production deployment, make sure to:
1. Set up proper database backups
2. Configure environment variables for production
3. Run migrations as part of your deployment process

## License

MIT
