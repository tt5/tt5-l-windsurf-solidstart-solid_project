import { t } from '../nitro/nitro.mjs';
import { h } from './jwt-CO0ye28h2.mjs';

function l(o) {
  return async (r) => {
    const s = r, t$1 = s.request.headers.get("accept") === "text/event-stream", e = await h(s.request);
    return t$1 ? (e && (s.locals || (s.locals = {}), s.locals.user = e), o({ ...s, user: e || { userId: "anonymous", username: "anonymous" }, locals: { ...s.locals, user: e || { userId: "anonymous", username: "anonymous" } } })) : e ? (s.locals || (s.locals = {}), s.locals.user = e, o({ ...s, user: e, locals: { ...s.locals, user: e } })) : (console.warn("[Auth] Unauthorized access attempt"), t({ error: "Unauthorized" }, 401));
  };
}

export { l };
//# sourceMappingURL=auth-BVUYsDc62.mjs.map
