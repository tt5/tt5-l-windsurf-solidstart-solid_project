import { D } from './db-97-DOlOW.mjs';
import { l } from './auth-BVUYsDc6.mjs';
import { p, c as c$1, i } from './api-D3monypt.mjs';
import { basePointEventService as l$1 } from './base-point-events-C2UNy6C4.mjs';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import './utils-AQpNWTN2.mjs';
import './jwt-CO0ye28h.mjs';
import 'jsonwebtoken';
import 'events';

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
    const a = await (await D()).add(e.userId, o.x, o.y);
    return l$1.emitCreated(a), c$1({ basePoint: a }, { status: 201, requestId: r });
  } catch (o) {
    return b(o, r, "POST /api/base-points");
  }
});

export { O as POST };
//# sourceMappingURL=base-points3.mjs.map
