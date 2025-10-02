import { f, l as l$1 } from '../nitro/nitro.mjs';
import { l } from './auth-BVUYsDc62.mjs';
import { p, c, i } from './api-D3monypt2.mjs';
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

const m = (e, t, s) => {
  if (e instanceof Error) {
    if (e.message === "Invalid coordinates provided" || e.message.includes("out of bounds")) return i("Invalid request", 400, e.message, { requestId: t });
    if (e.message === "Unauthorized") return i("Authentication required", 401, void 0, { requestId: t });
  }
  return e instanceof Error ? e.message : String(e), console.error(`[${t}] Error in ${s}:`, e), i("Failed to process request", 500, void 0, { requestId: t });
}, R = l(async ({ user: e }) => {
  const t = p();
  try {
    const s = await f(), i = e.userId;
    return await s.deleteAllBasePointsForUser(i), l$1.emitDeleted({ id: -1, userId: i, x: 0, y: 0, createdAtMs: Date.now() }), c({ success: true, message: "All base points deleted successfully", requestId: t });
  } catch (s) {
    return m(s, t, "DELETE /api/base-points");
  }
});

export { R as DELETE };
//# sourceMappingURL=base-points4.mjs.map
