import { f } from '../nitro/nitro.mjs';
import { l } from './auth-BVUYsDc62.mjs';
import { p as p$1, c, i } from './api-D3monypt2.mjs';
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

const p = 20, h = (t, s, e) => {
  if (t instanceof Error) {
    if (t.message === "Invalid coordinates provided" || t.message.includes("out of bounds")) return i("Invalid request", 400, t.message, { requestId: s });
    if (t.message === "Unauthorized") return i("Authentication required", 401, void 0, { requestId: s });
  }
  return t instanceof Error ? t.message : String(t), console.error(`[${s}] Error in ${e}:`, t), i("Failed to process request", 500, void 0, { requestId: s });
}, U = l(async ({ request: t }) => {
  const s = p$1(), e = new URL(t.url), a = parseInt(e.searchParams.get("x") || "0"), i = parseInt(e.searchParams.get("y") || "0");
  try {
    let o = await (await f()).getAll();
    return !isNaN(a) && !isNaN(i) && (o = o.filter((c) => {
      const m = c.x - a, u = c.y - i;
      return Math.abs(m) <= p && Math.abs(u) <= p;
    })), c({ basePoints: o }, { requestId: s });
  } catch (n) {
    return h(n, s, "GET /api/base-points");
  }
});

export { U as GET };
//# sourceMappingURL=base-points22.mjs.map
