import { u } from '../nitro/nitro.mjs';
import { randomBytes } from 'crypto';
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

function s(a, { status: r = 200, headers: t = {} } = {}) {
  return new Response(JSON.stringify(a), { status: r, headers: { "Content-Type": "application/json", ...t } });
}
async function h({ request: a }) {
  try {
    const { username: r, password: t } = await a.json();
    if (!r || !t) return s({ error: "Username and password are required" }, { status: 400 });
    const e = await u();
    if (await e.get("SELECT id FROM users WHERE username = ?", [r])) return s({ error: "Username already exists" }, { status: 400 });
    const o = `user_${randomBytes(16).toString("hex")}`;
    await e.exec("BEGIN TRANSACTION");
    try {
      return await e.run("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)", [o, r, t]), await e.exec("COMMIT"), s({ user: { id: o, username: r } }, { status: 201 });
    } catch (i) {
      throw await e.exec("ROLLBACK"), i;
    }
  } catch (r) {
    return console.error("Registration error:", r), s({ error: "Failed to register user" }, { status: 500 });
  }
}

export { h as POST };
//# sourceMappingURL=register3.mjs.map
