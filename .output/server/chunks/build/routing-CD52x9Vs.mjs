import { useContext, createMemo, createContext, createSignal, createRenderEffect, on, runWithOwner, getOwner, startTransition, resetErrorBoundaries, batch, untrack, createComponent } from 'solid-js';
import { isServer, getRequestEvent } from 'solid-js/web';

function ge() {
  let t = /* @__PURE__ */ new Set();
  function e(s) {
    return t.add(s), () => t.delete(s);
  }
  let n = false;
  function r(s, o) {
    if (n) return !(n = false);
    const a = { to: s, options: o, defaultPrevented: false, preventDefault: () => a.defaultPrevented = true };
    for (const c of t) c.listener({ ...a, from: c.location, retry: (f) => {
      f && (n = true), c.navigate(s, { ...o, resolve: false });
    } });
    return !a.defaultPrevented;
  }
  return { subscribe: e, confirm: r };
}
let M;
function Q() {
  (!window.history.state || window.history.state._depth == null) && window.history.replaceState({ ...window.history.state, _depth: window.history.length - 1 }, ""), M = window.history.state._depth;
}
isServer || Q();
function _e(t) {
  return { ...t, _depth: window.history.state && window.history.state._depth };
}
function qe(t, e) {
  let n = false;
  return () => {
    const r = M;
    Q();
    const s = r == null ? null : M - r;
    if (n) {
      n = false;
      return;
    }
    s && e(s) ? (n = true, window.history.go(-s)) : t();
  };
}
const ye = /^(?:[a-z0-9]+:)?\/\//i, we = /^\/+|(\/)\/+$/g, ve = "http://sr";
function E(t, e = false) {
  const n = t.replace(we, "$1");
  return n ? e || /^[?#]/.test(n) ? n : "/" + n : "";
}
function q(t, e, n) {
  if (ye.test(e)) return;
  const r = E(t), s = n && E(n);
  let o = "";
  return !s || e.startsWith("/") ? o = r : s.toLowerCase().indexOf(r.toLowerCase()) !== 0 ? o = r + s : o = s, (o || "/") + E(e, !o);
}
function Re(t, e) {
  if (t == null) throw new Error(e);
  return t;
}
function Pe(t, e) {
  return E(t).replace(/\/*(\*.*)?$/g, "") + E(e);
}
function V(t) {
  const e = {};
  return t.searchParams.forEach((n, r) => {
    r in e ? Array.isArray(e[r]) ? e[r].push(n) : e[r] = [e[r], n] : e[r] = n;
  }), e;
}
function xe(t, e, n) {
  const [r, s] = t.split("/*", 2), o = r.split("/").filter(Boolean), a = o.length;
  return (c) => {
    const f = c.split("/").filter(Boolean), h = f.length - a;
    if (h < 0 || h > 0 && s === void 0 && !e) return null;
    const l = { path: a ? "" : "/", params: {} }, m = (d) => n === void 0 ? void 0 : n[d];
    for (let d = 0; d < a; d++) {
      const p = o[d], y = p[0] === ":", v = y ? f[d] : f[d].toLowerCase(), C = y ? p.slice(1) : p.toLowerCase();
      if (y && $(v, m(C))) l.params[C] = v;
      else if (y || !$(v, C)) return null;
      l.path += `/${v}`;
    }
    if (s) {
      const d = h ? f.slice(-h).join("/") : "";
      if ($(d, m(s))) l.params[s] = d;
      else return null;
    }
    return l;
  };
}
function $(t, e) {
  const n = (r) => r === t;
  return e === void 0 ? true : typeof e == "string" ? n(e) : typeof e == "function" ? e(t) : Array.isArray(e) ? e.some(n) : e instanceof RegExp ? e.test(t) : false;
}
function be(t) {
  const [e, n] = t.pattern.split("/*", 2), r = e.split("/").filter(Boolean);
  return r.reduce((s, o) => s + (o.startsWith(":") ? 2 : 3), r.length - (n === void 0 ? 0 : 1));
}
function Y(t) {
  const e = /* @__PURE__ */ new Map(), n = getOwner();
  return new Proxy({}, { get(r, s) {
    return e.has(s) || runWithOwner(n, () => e.set(s, createMemo(() => t()[s]))), e.get(s)();
  }, getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true };
  }, ownKeys() {
    return Reflect.ownKeys(t());
  } });
}
function Z(t) {
  let e = /(\/?\:[^\/]+)\?/.exec(t);
  if (!e) return [t];
  let n = t.slice(0, e.index), r = t.slice(e.index + e[0].length);
  const s = [n, n += e[1]];
  for (; e = /^(\/\:[^\/]+)\?/.exec(r); ) s.push(n += e[1]), r = r.slice(e[0].length);
  return Z(r).reduce((o, a) => [...o, ...s.map((c) => c + a)], []);
}
const Ae = 100, Ce = createContext(), ee = createContext(), W = () => Re(useContext(Ce), "<A> and 'use' router primitives can be only used inside a Route."), Ee = () => useContext(ee) || W().base, We = (t) => {
  const e = Ee();
  return createMemo(() => e.resolvePath(t()));
}, $e = (t) => {
  const e = W();
  return createMemo(() => {
    const n = t();
    return n !== void 0 ? e.renderPath(n) : n;
  });
}, Ie = () => W().navigatorFactory(), Me = () => W().location;
function Le(t, e = "") {
  const { component: n, preload: r, load: s, children: o, info: a } = t, c = !o || Array.isArray(o) && !o.length, f = { key: t, component: n, preload: r || s, info: a };
  return te(t.path).reduce((h, l) => {
    for (const m of Z(l)) {
      const d = Pe(e, m);
      let p = c ? d : d.split("/*", 1)[0];
      p = p.split("/").map((y) => y.startsWith(":") || y.startsWith("*") ? y : encodeURIComponent(y)).join("/"), h.push({ ...f, originalPath: l, pattern: p, matcher: xe(p, !c, t.matchFilters) });
    }
    return h;
  }, []);
}
function Se(t, e = 0) {
  return { routes: t, score: be(t[t.length - 1]) * 1e4 - e, matcher(n) {
    const r = [];
    for (let s = t.length - 1; s >= 0; s--) {
      const o = t[s], a = o.matcher(n);
      if (!a) return null;
      r.unshift({ ...a, route: o });
    }
    return r;
  } };
}
function te(t) {
  return Array.isArray(t) ? t : [t];
}
function Oe(t, e = "", n = [], r = []) {
  const s = te(t);
  for (let o = 0, a = s.length; o < a; o++) {
    const c = s[o];
    if (c && typeof c == "object") {
      c.hasOwnProperty("path") || (c.path = "");
      const f = Le(c, e);
      for (const h of f) {
        n.push(h);
        const l = Array.isArray(c.children) && c.children.length === 0;
        if (c.children && !l) Oe(c.children, h.pattern, n, r);
        else {
          const m = Se([...n], r.length);
          r.push(m);
        }
        n.pop();
      }
    }
  }
  return n.length ? r : r.sort((o, a) => a.score - o.score);
}
function I(t, e) {
  for (let n = 0, r = t.length; n < r; n++) {
    const s = t[n].matcher(e);
    if (s) return s;
  }
  return [];
}
function Fe(t, e, n) {
  const r = new URL(ve), s = createMemo((l) => {
    const m = t();
    try {
      return new URL(m, r);
    } catch {
      return console.error(`Invalid path ${m}`), l;
    }
  }, r, { equals: (l, m) => l.href === m.href }), o = createMemo(() => s().pathname), a = createMemo(() => s().search, true), c = createMemo(() => s().hash), f = () => "", h = on(a, () => V(s()));
  return { get pathname() {
    return o();
  }, get search() {
    return a();
  }, get hash() {
    return c();
  }, get state() {
    return e();
  }, get key() {
    return f();
  }, query: n ? n(h) : Y(h) };
}
let R;
function De() {
  return R;
}
function Ue(t, e, n, r = {}) {
  const { signal: [s, o], utils: a = {} } = t, c = a.parsePath || ((i) => i), f = a.renderPath || ((i) => i), h = a.beforeLeave || ge(), l = q("", r.base || "");
  if (l === void 0) throw new Error(`${l} is not a valid base path`);
  l && !s().value && o({ value: l, replace: true, scroll: false });
  const [m, d] = createSignal(false);
  let p;
  const y = (i, u) => {
    u.value === v() && u.state === L() || (p === void 0 && d(true), R = i, p = u, startTransition(() => {
      p === u && (C(p.value), ne(p.state), resetErrorBoundaries(), isServer || U[1]((g) => g.filter((P) => P.pending)));
    }).finally(() => {
      p === u && batch(() => {
        R = void 0, i === "navigate" && ae(p), d(false), p = void 0;
      });
    }));
  }, [v, C] = createSignal(s().value), [L, ne] = createSignal(s().state), S = Fe(v, L, a.queryWrapper), O = [], U = createSignal(isServer ? ce() : []), z = createMemo(() => typeof r.transformUrl == "function" ? I(e(), r.transformUrl(S.pathname)) : I(e(), S.pathname)), H = () => {
    const i = z(), u = {};
    for (let g = 0; g < i.length; g++) Object.assign(u, i[g].params);
    return u;
  }, re = a.paramsWrapper ? a.paramsWrapper(H, e) : Y(H), K = { pattern: l, path: () => l, outlet: () => null, resolvePath(i) {
    return q(l, i);
  } };
  return createRenderEffect(on(s, (i) => y("native", i), { defer: true })), { base: K, location: S, params: re, isRouting: m, renderPath: f, parsePath: c, navigatorFactory: oe, matches: z, beforeLeave: h, preloadRoute: ie, singleFlight: r.singleFlight === void 0 ? true : r.singleFlight, submissions: U };
  function se(i, u, g) {
    untrack(() => {
      if (typeof u == "number") {
        u && (a.go ? a.go(u) : console.warn("Router integration does not support relative routing"));
        return;
      }
      const P = !u || u[0] === "?", { replace: F, resolve: x, scroll: j, state: b } = { replace: false, resolve: !P, scroll: true, ...g }, A = x ? i.resolvePath(u) : q(P && S.pathname || "", u);
      if (A === void 0) throw new Error(`Path '${u}' is not a routable path`);
      if (O.length >= Ae) throw new Error("Too many redirects");
      const N = v();
      if (A !== N || b !== L()) if (isServer) {
        const T = getRequestEvent();
        T && (T.response = { status: 302, headers: new Headers({ Location: A }) }), o({ value: A, replace: F, scroll: j, state: b });
      } else h.confirm(A, g) && (O.push({ value: N, replace: F, scroll: j, state: L() }), y("navigate", { value: A, state: b }));
    });
  }
  function oe(i) {
    return i = i || useContext(ee) || K, (u, g) => se(i, u, g);
  }
  function ae(i) {
    const u = O[0];
    u && (o({ ...i, replace: u.replace, scroll: u.scroll }), O.length = 0);
  }
  function ie(i, u) {
    const g = I(e(), i.pathname), P = R;
    R = "preload";
    for (let F in g) {
      const { route: x, params: j } = g[F];
      x.component && x.component.preload && x.component.preload();
      const { preload: b } = x;
      u && b && runWithOwner(n(), () => b({ params: j, location: { pathname: i.pathname, search: i.search, hash: i.hash, query: V(i), state: null, key: "" }, intent: "preload" }));
    }
    R = P;
  }
  function ce() {
    const i = getRequestEvent();
    return i && i.router && i.router.submission ? [i.router.submission] : [];
  }
}
function ze(t, e, n, r) {
  const { base: s, location: o, params: a } = t, { pattern: c, component: f, preload: h } = r().route, l = createMemo(() => r().path);
  f && f.preload && f.preload();
  const m = h ? h({ params: a, location: o, intent: R || "initial" }) : void 0;
  return { parent: e, pattern: c, path: l, outlet: () => f ? createComponent(f, { params: a, location: o, data: m, get children() {
    return n();
  } }) : n(), resolvePath(p) {
    return q(s.path(), p, l());
  } };
}

export { $e as $, Ce as C, De as D, E, Ie as I, Me as M, Oe as O, Q, Ue as U, We as W, _e as _, I as a, ee as e, ge as g, qe as q, ve as v, ze as z };
//# sourceMappingURL=routing-CD52x9Vs.mjs.map
