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

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Deployment

For production deployment, make sure to:
1. Set up proper database backups
2. Configure environment variables for production
3. Run migrations as part of your deployment process

## License

MIT
