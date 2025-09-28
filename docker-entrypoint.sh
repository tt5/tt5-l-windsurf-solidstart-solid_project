#!/bin/sh

echo "Initializing database..."
npx tsx --no-warnings /app/server/chunks/scripts/init-db.js

echo "Starting application..."
exec "$@"
