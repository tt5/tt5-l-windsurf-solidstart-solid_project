import { h } from './jwt-CO0ye28h2.mjs';
import { t as t$1 } from '../nitro/nitro.mjs';
import 'jsonwebtoken';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:async_hooks';
import 'vinxi/lib/invariant';
import 'vinxi/lib/path';
import 'node:url';
import 'seroval';
import 'seroval-plugins/web';
import 'solid-js';
import 'solid-js/web';
import 'solid-js/web/storage';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import 'perf_hooks';
import 'events';
import 'crypto';

const t = async ({ request: s }) => {
  try {
    const r = await h(s);
    return r ? t$1({ valid: true, user: { id: r.userId, username: r.username, role: r.role || "user" } }) : t$1({ valid: false, message: "No valid session found" }, 200);
  } catch (r) {
    return console.error("Error verifying session:", r), t$1({ valid: false, message: "Error verifying session", error: r instanceof Error ? r.message : "Unknown error" }, 500);
  }
};

export { t as GET };
//# sourceMappingURL=verify2.mjs.map
