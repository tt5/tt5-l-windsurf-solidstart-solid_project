import { a } from './performance-CpMIxBac.mjs';
import { l as l$1 } from './auth-BVUYsDc6.mjs';
import './utils-AQpNWTN2.mjs';
import './jwt-CO0ye28h.mjs';
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
//# sourceMappingURL=performance.mjs.map
