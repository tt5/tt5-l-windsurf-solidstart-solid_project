import { f, l as l$1 } from '../nitro/nitro.mjs';
import { l } from './auth-BVUYsDc62.mjs';
import { p, c as c$1, i } from './api-D3monypt2.mjs';
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
import './jwt-CO0ye28h2.mjs';
import 'jsonwebtoken';

const s = 1e3, c = (t, e) => {
  if (typeof t != "number" || typeof e != "number" || isNaN(t) || isNaN(e)) throw new Error("Coordinates must be valid numbers");
  if (!Number.isInteger(t) || !Number.isInteger(e)) throw new Error("Coordinates must be whole numbers");
  if (Math.abs(t) > s || Math.abs(e) > s) throw new Error(`Coordinates must be between -${s} and ${s}`);
}, b = (t, e, r) => {
  if (t instanceof Error) {
    if (t.message === "Invalid coordinates provided" || t.message.includes("out of bounds")) return i("Invalid request", 400, t.message, { requestId: e });
    if (t.message === "Unauthorized") return i("Authentication required", 401, void 0, { requestId: e });
  }
  return t instanceof Error ? t.message : String(t), console.error(`[${e}] Error in ${r}:`, t), i("Failed to process request", 500, void 0, { requestId: e });
}, O = l(async ({ request: t, user: e }) => {
  const r = p();
  try {
    const o = await t.json();
    c(o.x, o.y);
    const a = await (await f()).add(e.userId, o.x, o.y);
    return l$1.emitCreated(a), c$1({ basePoint: a }, { status: 201, requestId: r });
  } catch (o) {
    return b(o, r, "POST /api/base-points");
  }
});

export { O as POST };
//# sourceMappingURL=base-points32.mjs.map
