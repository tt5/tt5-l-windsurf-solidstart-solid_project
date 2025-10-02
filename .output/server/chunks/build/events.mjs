import { l } from './auth-BVUYsDc6.mjs';
import { basePointEventService as l$1 } from './base-point-events-C2UNy6C4.mjs';
import './utils-AQpNWTN2.mjs';
import './jwt-CO0ye28h.mjs';
import 'jsonwebtoken';
import 'events';

const b = l(async (i) => {
  const { request: c, clientAddress: l } = i, t = i.user || { userId: "anonymous", username: "anonymous" }, d = new ReadableStream({ start(s) {
    const u = new TextEncoder();
    let n = true, r;
    const o = (e) => {
      if (n) try {
        s.enqueue(u.encode(e));
      } catch (v) {
        console.error("[SSE] Error sending data:", v), n = false, s.close();
      }
    }, m = () => {
      const e = `event: connected
data: ${JSON.stringify({ message: "Connection established", timestamp: (/* @__PURE__ */ new Date()).toISOString(), userId: t.userId })}

`;
      o(e);
    }, p = () => {
      r = setInterval(() => {
        if (!n) {
          clearInterval(r);
          return;
        }
        const e = `event: ping
data: ${JSON.stringify({ type: "ping", timestamp: Date.now() })}

`;
        o(e);
      }, 3e4);
    }, g = { userId: t.userId, username: t.username, ip: l, connectedAt: (/* @__PURE__ */ new Date()).toISOString(), send: (e) => {
      n && o(`data: ${e}

`);
    } }, { cleanup: f } = l$1.registerClient(g);
    m(), p();
    const a = () => {
      n && (n = false, clearInterval(r), f(), s.close());
    };
    return c.signal.addEventListener("abort", a), () => {
      a(), c.signal.removeEventListener("abort", a);
    };
  } });
  return new Response(d, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Content-Encoding": "none", "X-Accel-Buffering": "no", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": "true" } });
});

export { b as GET };
//# sourceMappingURL=events.mjs.map
