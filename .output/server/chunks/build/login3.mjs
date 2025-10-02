import { u, f } from '../nitro/nitro.mjs';
import { k } from './jwt-CO0ye28h2.mjs';
import { serialize } from 'cookie';
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
import 'jsonwebtoken';

function o(a, { status: r = 200, headers: t = {} } = {}) {
  return new Response(JSON.stringify(a), { status: r, headers: { "Content-Type": "application/json", ...t } });
}
async function T({ request: a }) {
  try {
    const r = await a.json(), { username: t, password: i } = r;
    if (!t || !i) return o({ error: "Username and password are required" }, { status: 400 });
    let e = await (await u()).get("SELECT id, username FROM users WHERE username = ?", [t]);
    if (!e) return o({ error: "Invalid credentials" }, { status: 401 });
    try {
      const s = await f();
      (await s.getByUser(e.id)).length === 0 && await s.add(e.id, 0, 0);
    } catch (s) {
      console.error("Error initializing base points:", s);
    }
    const n = k({ userId: e.id, username: e.username }), u$1 = serialize("auth_token", n, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 3600 * 24 * 7, path: "/" });
    return o({ user: { id: e.id, username: e.username } }, { status: 200, headers: { "Set-Cookie": u$1 } });
  } catch (r) {
    return console.error("Login error:", r), o({ error: "Failed to log in" }, { status: 500 });
  }
}

export { T as POST };
//# sourceMappingURL=login3.mjs.map
