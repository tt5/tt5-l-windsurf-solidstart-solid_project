# SolidStart Application

A modern web application built with SolidJS and SolidStart, featuring user authentication and interactive components.

## ✨ Features

- 🔐 User authentication (login/logout/delete account)
- 🎮 Interactive game components
- 📱 Responsive design with mobile support
- 🗃️ SQLite database for data persistence
- ⚡ Real-time reactivity with SolidJS
- 🎨 Modular CSS with CSS Modules

## 🛠️ Tech Stack

- **Frontend**:
  - [SolidJS](https://www.solidjs.com/) - Reactive JavaScript library
  - [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
  - [SolidStart](https://start.solidjs.com/) - Full-stack framework
  - [Vite](https://vitejs.dev/) - Build tool and dev server

- **Backend**:
  - [SQLite](https://www.sqlite.org/) - Embedded database
  - [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - High-performance SQLite3

## 🚀 Getting Started

### Prerequisites

- Node.js 22 or higher
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tt5/tt5-l-windsurf-solidstart-solid_project.git
   cd tt5-l-windsurf-solidstart-solid_project
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
src/
├── components/    # Reusable UI components
├── contexts/     # Application state management
├── routes/       # Page components
├── lib/          # Server-side code and utilities
└── hooks/        # Custom React hooks
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
