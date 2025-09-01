# Interactive Grid Game

An interactive grid-based game built with SolidJS and SolidStart, featuring a persistent game state stored in SQLite.

## Features

- Interactive 7x7 grid with selectable squares
- Persistent game state using SQLite
- Real-time updates with SolidJS reactivity
- Responsive design that works on desktop and mobile
- Directional controls for moving selections
- Random selection and clear all functionality

## Tech Stack

- [SolidJS](https://www.solidjs.com/) - Reactive JavaScript library
- [SolidStart](https://start.solidjs.com/) - Full-stack framework
- [SQLite](https://www.sqlite.org/) - Embedded database
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite3 Node.js addon
- [Vite](https://vitejs.dev/) - Build tool and dev server

## Prerequisites

- Node.js 22 or higher
- npm or pnpm
- SQLite3 (for development database)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/solid-project.git
   cd solid-project
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application uses SQLite for data persistence. The database file is automatically created at `data/app.db` when you first run the application.

### Database Schema

```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  created_at TEXT GENERATED ALWAYS AS (datetime(created_at_ms / 1000, 'unixepoch')) VIRTUAL,
  created_at_ms INTEGER DEFAULT (strftime('%s','now') * 1000 + (strftime('%f','now') - strftime('%S','now') * 1000))
);
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm start` - Start the production server

## Project Structure

- `/src/components` - Reusable UI components
- `/src/lib` - Database and utility functions
- `/src/routes` - Application routes and API endpoints
- `/src/services` - Business logic and API services
- `/data` - Database files (auto-generated)
- `/scripts` - Database initialization and migration scripts

## License

MIT

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
# l-windsurf-solidstart-solid_project
