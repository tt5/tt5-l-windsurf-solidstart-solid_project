import { l } from './auth-BVUYsDc62.mjs';
import { l as l$1 } from '../nitro/nitro.mjs';
import './jwt-CO0ye28h2.mjs';
import 'jsonwebtoken';
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
//# sourceMappingURL=events2.mjs.map
