import { l } from './auth-BVUYsDc62.mjs';
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

function r(t, { status: n = 200, headers: e = {} } = {}) {
  return new Response(JSON.stringify(t), { status: n, headers: { "Content-Type": "application/json", ...e } });
}
const m = l(async () => r({ message: "Authenticated" }));

export { m as POST };
//# sourceMappingURL=index4.mjs.map
