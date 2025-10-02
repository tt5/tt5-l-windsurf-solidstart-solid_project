import { u, p as p$1, o } from '../nitro/nitro.mjs';
import { l } from './auth-BVUYsDc62.mjs';
import { p, i } from './api-D3monypt2.mjs';
import { a } from './performance-CpMIxBac2.mjs';
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

const B = { up: [0, 0], down: [0, 0], right: [0, 0], left: [0, 0] }, W = l(async ({ request: S, user: O }) => {
  const m = p(), g = performance.now();
  try {
    const { borderIndices: o$1, currentPosition: s, direction: h } = await S.json(), b = performance.now(), R = await u(), a$1 = await new p$1(R).getAll();
    if (!Array.isArray(a$1)) throw new Error(`Expected basePoints to be an array, got ${typeof a$1}`);
    const f = a$1.length > 0 ? [...new Map(a$1.map((e) => [`${e.x},${e.y}`, e])).values()] : [{ x: 0, y: 0, userId: "default" }], [q, E] = B[h], x = o$1.flatMap((e, k) => {
      const i = e % o.GRID_SIZE - s[0], c = Math.floor(e / o.GRID_SIZE) - s[1];
      return f.flatMap(({ x: y, y: I }) => {
        if (y === i && I === c) return [];
        const t = Math.abs(i - y), r = Math.abs(c - I);
        if (t === 0 || r === 0 || t === r || 2 * t === r || 2 * r === t || 3 * t === r || 3 * r === t || 5 * t === r || 5 * r === t) {
          const p = i + s[0] + q, u = c + s[1] + E;
          return p >= 0 && p < o.GRID_SIZE && u >= 0 && u < o.GRID_SIZE ? [p + u * o.GRID_SIZE] : [];
        }
        return [];
      });
    }), P = new Set(o$1), d = { success: true, data: { squares: [...new Set(x)].filter((e) => P.has(e)) } }, l = performance.now() - b, w = performance.now() - g;
    return a.track("calculate-squares", w, { basePointCount: f.length, responseSize: JSON.stringify(d).length, dbTime: l, processingTime: w - l }), new Response(JSON.stringify(d), { headers: { "Content-Type": "application/json" }, status: 200 });
  } catch (o) {
    console.error(`[${m}] Error in calculate-squares:`, o);
    const s = o instanceof Error ? o.message : "Unknown error";
    return i("Failed to calculate squares", 500, s, { requestId: m });
  }
});

export { W as POST };
//# sourceMappingURL=calculate-squares2.mjs.map
