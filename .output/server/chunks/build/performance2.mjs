import { a } from './performance-CpMIxBac2.mjs';
import { l as l$1 } from './auth-BVUYsDc62.mjs';
import '../nitro/nitro.mjs';
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

const l = l$1(async () => {
  try {
    const r = a.getMetrics(), t = r.filter((e) => e.operation === "calculate-squares"), s = { totalRequests: r.length, calculateSquares: { count: t.length, averageDuration: t.reduce((e, a) => e + a.duration, 0) / Math.max(1, t.length), maxBasePoints: Math.max(...t.map((e) => e.data.basePointCount || 0), 0), averageResponseSize: t.reduce((e, a) => e + (a.data.responseSize || 0), 0) / Math.max(1, t.length) }, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() };
    return new Response(JSON.stringify({ success: true, data: s }), { headers: { "Content-Type": "application/json" }, status: 200 });
  } catch (r) {
    return console.error("Error getting performance metrics:", r), new Response(JSON.stringify({ success: false, error: "Failed to get performance metrics" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

export { l as GET };
//# sourceMappingURL=performance2.mjs.map
