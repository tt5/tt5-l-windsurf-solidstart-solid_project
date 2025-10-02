import { D } from './db-97-DOlOW.mjs';
import { l } from './auth-BVUYsDc6.mjs';
import { p, c, i } from './api-D3monypt.mjs';
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

const m = (e, t, s) => {
  if (e instanceof Error) {
    if (e.message === "Invalid coordinates provided" || e.message.includes("out of bounds")) return i("Invalid request", 400, e.message, { requestId: t });
    if (e.message === "Unauthorized") return i("Authentication required", 401, void 0, { requestId: t });
  }
  return e instanceof Error ? e.message : String(e), console.error(`[${t}] Error in ${s}:`, e), i("Failed to process request", 500, void 0, { requestId: t });
}, R = l(async ({ user: e }) => {
  const t = p();
  try {
    const s = await D(), i = e.userId;
    return await s.deleteAllBasePointsForUser(i), l$1.emitDeleted({ id: -1, userId: i, x: 0, y: 0, createdAtMs: Date.now() }), c({ success: true, message: "All base points deleted successfully", requestId: t });
  } catch (s) {
    return m(s, t, "DELETE /api/base-points");
  }
});

export { R as DELETE };
//# sourceMappingURL=base-points.mjs.map
