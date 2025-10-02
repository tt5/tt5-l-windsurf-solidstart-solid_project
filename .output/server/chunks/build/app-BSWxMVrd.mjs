import { createComponent, isServer, getRequestEvent, delegateEvents } from 'solid-js/web';
import { I } from './index-BdnVf8ln.mjs';
import { T as Tt } from '../nitro/nitro.mjs';
import { Suspense, createSignal, onCleanup, children, createMemo, getOwner, sharedConfig, untrack, Show, on, createRoot } from 'solid-js';
import { E, I as I$1 } from './AuthContext-D3kPq5an.mjs';
import { U } from './UserContext-DYj2Vavi.mjs';
import { O as Oe, U as Ue, C as Ce, v as ve, D as De, z as ze, a as I$2, e as ee, g as ge, _ as _e, Q, q as qe } from './routing-CD52x9Vs.mjs';
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
import 'solid-js/web/storage';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import 'perf_hooks';
import 'events';
import 'crypto';

const T = (t) => (r) => {
  const { base: o } = r, n = children(() => r.children), e = createMemo(() => Oe(n(), r.base || ""));
  let s;
  const u = Ue(t, e, () => s, { base: o, singleFlight: r.singleFlight, transformUrl: r.transformUrl });
  return t.create && t.create(u), createComponent(Ce.Provider, { value: u, get children() {
    return createComponent(nt, { routerState: u, get root() {
      return r.root;
    }, get preload() {
      return r.rootPreload || r.rootLoad;
    }, get children() {
      return [(s = getOwner()) && null, createComponent(ot, { routerState: u, get branches() {
        return e();
      } })];
    } });
  } });
};
function nt(t) {
  const r = t.routerState.location, o = t.routerState.params, n = createMemo(() => t.preload && untrack(() => {
    t.preload({ params: o, location: r, intent: De() || "initial" });
  }));
  return createComponent(Show, { get when() {
    return t.root;
  }, keyed: true, get fallback() {
    return t.children;
  }, children: (e) => createComponent(e, { params: o, location: r, get data() {
    return n();
  }, get children() {
    return t.children;
  } }) });
}
function ot(t) {
  if (isServer) {
    const e = getRequestEvent();
    if (e && e.router && e.router.dataOnly) {
      at(e, t.routerState, t.branches);
      return;
    }
    e && ((e.router || (e.router = {})).matches || (e.router.matches = t.routerState.matches().map(({ route: s, path: u, params: f }) => ({ path: s.originalPath, pattern: s.pattern, match: u, params: f, info: s.info }))));
  }
  const r = [];
  let o;
  const n = createMemo(on(t.routerState.matches, (e, s, u) => {
    let f = s && e.length === s.length;
    const m = [];
    for (let l = 0, w = e.length; l < w; l++) {
      const p = s && s[l], g = e[l];
      u && p && g.route.key === p.route.key ? m[l] = u[l] : (f = false, r[l] && r[l](), createRoot((v) => {
        r[l] = v, m[l] = ze(t.routerState, m[l - 1] || t.routerState.base, k(() => n()[l + 1]), () => t.routerState.matches()[l]);
      }));
    }
    return r.splice(e.length).forEach((l) => l()), u && f ? u : (o = m[0], m);
  }));
  return k(() => n() && o)();
}
const k = (t) => () => createComponent(Show, { get when() {
  return t();
}, keyed: true, children: (r) => createComponent(ee.Provider, { value: r, get children() {
  return r.outlet();
} }) });
function at(t, r, o) {
  const n = new URL(t.request.url), e = I$2(o, new URL(t.router.previousUrl || t.request.url).pathname), s = I$2(o, n.pathname);
  for (let u = 0; u < s.length; u++) {
    (!e[u] || s[u].route !== e[u].route) && (t.router.dataOnly = true);
    const { route: f, params: m } = s[u];
    f.preload && f.preload({ params: m, location: r.location, intent: "preload" });
  }
}
function it([t, r], o, n) {
  return [t, n ? (e) => r(n(e)) : r];
}
function st(t) {
  let r = false;
  const o = (e) => typeof e == "string" ? { value: e } : e, n = it(createSignal(o(t.get()), { equals: (e, s) => e.value === s.value && e.state === s.state }), void 0, (e) => (!r && t.set(e), sharedConfig.registry && !sharedConfig.done && (sharedConfig.done = true), e));
  return t.init && onCleanup(t.init((e = t.get()) => {
    r = true, n[1](o(e)), r = false;
  })), T({ signal: n, create: t.create, utils: t.utils });
}
function ut(t, r, o) {
  return t.addEventListener(r, o), () => t.removeEventListener(r, o);
}
function ct(t, r) {
  const o = t && document.getElementById(t);
  o ? o.scrollIntoView() : r && window.scrollTo(0, 0);
}
function lt(t) {
  const r = new URL(t);
  return r.pathname + r.search;
}
function dt(t) {
  let r;
  const o = { value: t.url || (r = getRequestEvent()) && lt(r.request.url) || "" };
  return T({ signal: [() => o, (n) => Object.assign(o, n)] })(t);
}
const ht = /* @__PURE__ */ new Map();
function mt(t = true, r = false, o = "/_server", n) {
  return (e) => {
    const s = e.base.path(), u = e.navigatorFactory(e.base);
    let f, m;
    function l(a) {
      return a.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function w(a) {
      if (a.defaultPrevented || a.button !== 0 || a.metaKey || a.altKey || a.ctrlKey || a.shiftKey) return;
      const i = a.composedPath().find((E) => E instanceof Node && E.nodeName.toUpperCase() === "A");
      if (!i || r && !i.hasAttribute("link")) return;
      const d = l(i), c = d ? i.href.baseVal : i.href;
      if ((d ? i.target.baseVal : i.target) || !c && !i.hasAttribute("state")) return;
      const b = (i.getAttribute("rel") || "").split(/\s+/);
      if (i.hasAttribute("download") || b && b.includes("external")) return;
      const R = d ? new URL(c, document.baseURI) : new URL(c);
      if (!(R.origin !== window.location.origin || s && R.pathname && !R.pathname.toLowerCase().startsWith(s.toLowerCase()))) return [i, R];
    }
    function p(a) {
      const i = w(a);
      if (!i) return;
      const [d, c] = i, A = e.parsePath(c.pathname + c.search + c.hash), b = d.getAttribute("state");
      a.preventDefault(), u(A, { resolve: false, replace: d.hasAttribute("replace"), scroll: !d.hasAttribute("noscroll"), state: b ? JSON.parse(b) : void 0 });
    }
    function g(a) {
      const i = w(a);
      if (!i) return;
      const [d, c] = i;
      n && (c.pathname = n(c.pathname)), e.preloadRoute(c, d.getAttribute("preload") !== "false");
    }
    function v(a) {
      clearTimeout(f);
      const i = w(a);
      if (!i) return m = null;
      const [d, c] = i;
      m !== d && (n && (c.pathname = n(c.pathname)), f = setTimeout(() => {
        e.preloadRoute(c, d.getAttribute("preload") !== "false"), m = d;
      }, 20));
    }
    function S(a) {
      if (a.defaultPrevented) return;
      let i = a.submitter && a.submitter.hasAttribute("formaction") ? a.submitter.getAttribute("formaction") : a.target.getAttribute("action");
      if (!i) return;
      if (!i.startsWith("https://action/")) {
        const c = new URL(i, ve);
        if (i = e.parsePath(c.pathname + c.search), !i.startsWith(o)) return;
      }
      if (a.target.method.toUpperCase() !== "POST") throw new Error("Only POST forms are supported for Actions");
      const d = ht.get(i);
      if (d) {
        a.preventDefault();
        const c = new FormData(a.target, a.submitter);
        d.call({ r: e, f: a.target }, a.target.enctype === "multipart/form-data" ? c : new URLSearchParams(c));
      }
    }
    delegateEvents(["click", "submit"]), document.addEventListener("click", p), t && (document.addEventListener("mousemove", v, { passive: true }), document.addEventListener("focusin", g, { passive: true }), document.addEventListener("touchstart", g, { passive: true })), document.addEventListener("submit", S), onCleanup(() => {
      document.removeEventListener("click", p), t && (document.removeEventListener("mousemove", v), document.removeEventListener("focusin", g), document.removeEventListener("touchstart", g)), document.removeEventListener("submit", S);
    });
  };
}
function ft(t) {
  if (isServer) return dt(t);
  const r = () => {
    const n = window.location.pathname.replace(/^\/+/, "/") + window.location.search, e = window.history.state && window.history.state._depth && Object.keys(window.history.state).length === 1 ? void 0 : window.history.state;
    return { value: n + window.location.hash, state: e };
  }, o = ge();
  return st({ get: r, set({ value: n, replace: e, scroll: s, state: u }) {
    e ? window.history.replaceState(_e(u), "", n) : window.history.pushState(u, "", n), ct(decodeURIComponent(window.location.hash.slice(1)), s), Q();
  }, init: (n) => ut(window, "popstate", qe(n, (e) => {
    if (e && e < 0) return !o.confirm(e);
    {
      const s = r();
      return !o.confirm(s.value, { state: s.state });
    }
  })), create: mt(t.preload, t.explicitLinks, t.actionBase, t.transformUrl), utils: { go: (n) => window.history.go(n), beforeLeave: o } })(t);
}
function gt() {
  const [t, r] = createSignal(false);
  return I$1(), null;
}
const Ut = () => createComponent(ft, { root: (t) => createComponent(I, { get children() {
  return createComponent(E, { get children() {
    return createComponent(U, { get children() {
      return createComponent(Suspense, { get children() {
        return [t.children, createComponent(gt, {})];
      } });
    } });
  } });
} }), get children() {
  return createComponent(Tt, {});
} });

export { Ut as default };
//# sourceMappingURL=app-BSWxMVrd.mjs.map
