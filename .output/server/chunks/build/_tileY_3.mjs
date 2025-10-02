import { g as g$1, I, f } from '../nitro/nitro.mjs';
import { l as l$1 } from './auth-BVUYsDc62.mjs';
import { p, i } from './api-D3monypt2.mjs';
import { deflate, inflate } from 'pako';
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
import 'perf_hooks';
import 'events';
import 'crypto';
import './jwt-CO0ye28h2.mjs';
import 'jsonwebtoken';

const l = 64, T = 8, x = 6;
class U {
  async generateTile(t, o) {
    const s = await f(), d = await I(), { minX: r, minY: i, maxX: e, maxY: c } = this.getTileBounds(t, o), a = await s.getPointsInBounds(r, i, e, c), m = await d.getTile(t, o);
    if (m) {
      const b = m.data, E = this.createBitmap(a, r, i);
      if (b.length === E.length && b.every((S, C) => S === E[C])) return m;
    }
    const p = this.createBitmap(a, r, i), f$1 = Date.now(), u = Buffer.concat([Buffer.from([1]), Buffer.from(deflate(p, { level: x }))]);
    return { tileX: t, tileY: o, data: p, compressedData: u, version: 1, lastUpdatedMs: f$1 };
  }
  getTileBounds(t, o) {
    return { minX: t * l, minY: o * l, maxX: (t + 1) * l - 1, maxY: (o + 1) * l - 1 };
  }
  createBitmap(t, o, s) {
    const d = Math.ceil(l * l / T), r = new Uint8Array(d);
    for (const c of t) {
      const a = c.x - o, m = c.y - s;
      if (a < 0 || a >= l || m < 0 || m >= l) continue;
      const p = m * l + a, f = Math.floor(p / T), u = p % T;
      r[f] |= 1 << u;
    }
    const i = deflate(r, { level: x }), e = Buffer.alloc(1);
    return e[0] = 1, Buffer.concat([e, Buffer.from(i)]);
  }
  decompressBitmap(t) {
    if (t.length === 0) return new Uint8Array(0);
    const o = t[0], s = t.subarray(1);
    return o === 1 ? inflate(s) : new Uint8Array(s);
  }
  static worldToTileCoords(t, o) {
    return { tileX: Math.floor(t / l), tileY: Math.floor(o / l) };
  }
  static getTilesInBounds(t, o, s, d) {
    const r = this.worldToTileCoords(t, o), i = this.worldToTileCoords(s, d), e = [];
    for (let c = r.tileY; c <= i.tileY; c++) for (let a = r.tileX; a <= i.tileX; a++) e.push({ x: a, y: c });
    return e;
  }
}
const X = new U(), v = { min: -1e3, max: 1e3 }, M = 64, h = Math.ceil(v.max / M), g = Math.floor(v.min / M), Y = (n, t) => {
  if (typeof n != "number" || typeof t != "number" || isNaN(n) || isNaN(t)) throw new Error("Tile coordinates must be valid numbers");
  if (!Number.isInteger(n) || !Number.isInteger(t)) throw new Error("Tile coordinates must be whole numbers");
  if (n < g || n > h || t < g || t > h) throw new Error(`Tile coordinates must be between ${g} and ${h}`);
}, _ = (n, t, o) => (console.error(`[${t}] Error in ${o}:`, n), n instanceof Error ? n.message.includes("coordinates must be") ? i(n.message, 400, void 0, { requestId: t }) : i(`Internal server error: ${n.message}`, 500, void 0, { requestId: t }) : i("An unknown error occurred", 500, void 0, { requestId: t })), V = l$1(async (n) => {
  const { params: t } = n, o = p(), { tileX: s, tileY: d } = t;
  try {
    const r = parseInt(s, 10), i = parseInt(d, 10);
    Y(r, i);
    let e = null, c = true;
    try {
      if (e = await g$1.get(r, i), !e) {
        const f = await I();
        if (e = await X.generateTile(r, i), e) await f.saveTile(e), await g$1.set(e), c = false;
        else throw new Error("Failed to generate tile");
      }
    } catch (f) {
      throw console.error(`[Tile API] Error processing tile (${r}, ${i}):`, f), f;
    }
    if (!e) throw new Error("Tile not found and could not be generated");
    const a = { success: true, data: { tileX: e.tileX, tileY: e.tileY, data: e.data ? Array.from(e.data).join(",") : "", version: e.version || 1, lastUpdatedMs: e.lastUpdatedMs || Date.now(), fromCache: c, bounds: { minX: e.tileX * 64, minY: e.tileY * 64, maxX: (e.tileX + 1) * 64 - 1, maxY: (e.tileY + 1) * 64 - 1 } }, requestId: o }, m = e.lastUpdatedMs || Date.now(), p = new Headers({ "Content-Type": "application/json", "Cache-Control": "public, max-age=10, s-maxage=10", ETag: `"${m}"`, "Last-Modified": new Date(m).toUTCString() });
    return new Response(JSON.stringify(a), { status: 200, headers: p });
  } catch (r) {
    return _(r, o, `GET /api/map/tile/${s}/${d}`);
  }
});

export { V as GET };
//# sourceMappingURL=_tileY_3.mjs.map
