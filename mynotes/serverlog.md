$ npm run dev

> dev
> vinxi dev

vinxi v0.5.8
(node:244553) ExperimentalWarning: Support for loading ES Module in require() is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vinxi starting dev server

  ➜ Local:    http://localhost:3000/
  ➜ Network:  use --host to expose

Error: Transform failed with 1 error:
<stdin>:47:2: ERROR: Unexpected "}"
    at failureErrorWithLog (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:1467:15)
    at /home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:736:50
    at responseCallbacks.<computed> (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:603:9)
    at handleIncomingPacket (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:658:12)
    at Socket.readFromStdout (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:581:7)
    at Socket.emit (node:events:507:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:189:23) {
  errors: [
    {
      detail: undefined,
      id: '',
      location: [Object],
      notes: [],
      pluginName: '',
      text: 'Unexpected "}"'
    }
  ],
  warnings: []
}
Initializing server...
Initializing database...
Initializing database...
Database tables verified/created
Ensuring database tables exist...
Initializing repositories...
Running database migrations...
Creating migrations table if not exists...
Found 4 migration files
Found 4 applied migrations
✓ Migration already applied: 0001_initial_schema
✓ Migration already applied: 0002_add_base_points
✓ Migration already applied: 0003_add_default_base_point
✓ Migration already applied: 0004_add_users_table
No pending migrations to apply
Database initialization completed
Server initialization complete
Error: Transform failed with 1 error:
<stdin>:47:2: ERROR: Unexpected "}"
    at failureErrorWithLog (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:1467:15)
    at /home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:736:50
    at responseCallbacks.<computed> (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:603:9)
    at handleIncomingPacket (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:658:12)
    at Socket.readFromStdout (/home/n/data/l/windsurf/solidstart/solid-project/node_modules/esbuild/lib/main.js:581:7)
    at Socket.emit (node:events:507:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:189:23) {
  errors: [
    {
      detail: undefined,
      id: '',
      location: [Object],
      notes: [],
      pluginName: '',
      text: 'Unexpected "}"'
    }
  ],
  warnings: []
}