import { l } from './auth-BVUYsDc6.mjs';
import './utils-AQpNWTN2.mjs';
import './jwt-CO0ye28h.mjs';
import 'jsonwebtoken';

function r(t, { status: n = 200, headers: e = {} } = {}) {
  return new Response(JSON.stringify(t), { status: n, headers: { "Content-Type": "application/json", ...e } });
}
const m = l(async () => r({ message: "Authenticated" }));

export { m as POST };
//# sourceMappingURL=index.mjs.map
