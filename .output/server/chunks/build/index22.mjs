import { ssr, ssrHydrationKey, ssrAttribute, escape, createComponent, ssrStyleProperty, ssrStyle, ssrElement, mergeProps } from 'solid-js/web';
import { a as I, k, b as a, o, c as p, e as Ie$1 } from '../nitro/nitro.mjs';
import { createSignal, Show, createContext, onMount, createEffect, onCleanup, on, batch, useContext } from 'solid-js';
import { inflate } from 'pako';
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
import 'perf_hooks';
import 'events';
import 'crypto';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const We = createContext();
function st(o) {
  const [r, n] = createSignal(null), [s, a] = createSignal([]);
  return createComponent(We.Provider, { value: { position: r, setPosition: n, restrictedSquares: s, setRestrictedSquares: a }, get children() {
    return o.children;
  } });
}
function Oe() {
  const o = useContext(We);
  if (!o) throw new Error("usePlayerPosition must be used within a PlayerPositionProvider");
  return o;
}
const nt = "_board_n5ult_4", at = "_positionIndicator_n5ult_38", it = "_boundaryMessage_n5ult_53", ct = "_grid_n5ult_91", lt = "_square_n5ult_106", dt = "_basePoint_n5ult_122", ut = "_selected_n5ult_122", ft = "_restricted_n5ult_122", gt = "_loading_n5ult_11", mt = "_basePointMarker_n5ult_212", ht = "_emptyMarker_n5ult_225", pt = "_errorMessage_n5ult_242", _t = "_playerPosition_n5ult_256", F = { board: nt, positionIndicator: at, boundaryMessage: it, grid: ct, square: lt, basePoint: dt, selected: ut, restricted: ft, "valid-hover": "_valid-hover_n5ult_141", "invalid-hover": "_invalid-hover_n5ult_150", loading: gt, basePointMarker: mt, emptyMarker: ht, errorMessage: pt, playerPosition: _t };
var vt = ["<button", ' class="', '">', "</button>"], yt = ["<div", "></div>"], wt = ["<div", ">\xD7</div>"];
const Tt = (o) => {
  const { position: r, state: n, onHover: s, onClick: a } = o, { x: l, y: p, worldX: h, worldY: g } = r, { isBasePoint: y, isSelected: C, isPlayerPosition: B, isHovered: m, isValid: D, isSaving: q } = n, v = () => {
    const O = [F.square];
    return y && (O.push(F.basePoint), X(h, g) && O.push(F.restricted)), C && O.push(F.selected), B && O.push(F.playerPosition), q && m ? O.push(F.loading) : m && O.push(D ? F["valid-hover"] : F["invalid-hover"]), O.join(" ");
  }, V = (O, R, A, ne) => {
    const b = A - O, z = ne - R;
    return b === 0 && z === 0 ? false : b === 0 || z === 0 || b === z || b === -z || z === 2 * b || b === 2 * z || z === -2 * b || b === -2 * z;
  }, X = (O, R) => !!V(O, R, 0, 0);
  return ssr(vt, ssrHydrationKey(), `${escape(v(), true) || ""} ${escape(escape(F.gridCell, true), true)} ${y ? escape(escape(F.basePoint, true), true) : ""} ${C ? escape(escape(F.selected, true), true) : ""} ${B ? escape(escape(F.playerPosition, true), true) : ""} ${m ? escape(escape(F.hovered, true), true) : ""} ${D && !q ? escape(escape(F.valid, true), true) : ""}`, y ? ssr(yt, ssrHydrationKey() + ssrAttribute("class", escape(F.basePointMarker, true), false)) : C ? escape(null) : ssr(wt, ssrHydrationKey() + ssrAttribute("class", escape(F.emptyMarker, true), false)));
};
async function Me(o) {
  var _a, _b;
  try {
    const n = [];
    for (let l = 0; l < 15; l++) for (let p = 0; p < 15; p++) n.push(l * 15 + p);
    const s = await fetch("/api/calculate-squares", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ borderIndices: n, currentPosition: o, direction: "up" }) });
    if (!s.ok) throw new Error(`HTTP error! status: ${s.status}`);
    return ((_b = (_a = await s.json()) == null ? void 0 : _a.data) == null ? void 0 : _b.squares) || [];
  } catch (r) {
    return console.error("Failed to fetch restricted squares:", r), null;
  }
}
async function $t(o, r, n) {
  try {
    const s = a(Math.floor(o), Math.floor(r)), a$1 = await Me(s);
    return a$1 === null ? (console.error("Failed to fetch restricted squares"), null) : (n(s), console.log(`Jumped to position: [${o}, ${r}] with ${a$1.length} restricted squares`), { position: s, restrictedSquares: a$1 });
  } catch (s) {
    return console.error("Failed to jump to position:", s), null;
  }
}
function bt() {
  const { setPosition: o } = Oe();
  return { jumpToPosition: async (r, n) => {
    try {
      const s = a(r, n);
      console.log(`Jumping to position: [${r}, ${n}]`);
      const a$1 = await Me(s);
      return a$1 === null ? (console.error("Failed to fetch restricted squares"), null) : (console.log(`Jumped to position: [${r}, ${n}] with ${a$1.length} restricted squares`), { restrictedSquares: a$1 });
    } catch (s) {
      return console.error("Failed to jump to position:", s), null;
    }
  }, fetchRestrictedSquares: Me };
}
const pe = o.GRID_SIZE, Ie = (o) => {
  const r = pe - 1;
  switch (o) {
    case "top":
      return Array.from({ length: pe }, (s, a) => a);
    case "bottom":
      return Array.from({ length: pe }, (s, a) => r * pe + a);
    case "left":
      return Array.from({ length: pe }, (s, a) => a * pe);
    case "right":
      return Array.from({ length: pe }, (s, a) => a * pe + r);
    default:
      return o;
  }
}, Pe = { up: { delta: a(0, -1), borderIndices: Ie("bottom") }, down: { delta: a(0, 1), borderIndices: Ie("top") }, left: { delta: a(-1, 0), borderIndices: Ie("right") }, right: { delta: a(1, 0), borderIndices: Ie("left") } }, St = ([o, r], n) => {
  const { delta: [s, a$1] } = Pe[n];
  return a(o + s, r + a$1);
}, It = (o, r, n) => o.map((s) => St(s, r)).filter(([s, a]) => s >= 0 && s < pe && a >= 0 && a < pe), Ct = async ({ x: o$1, y: r, currentUser: n, isSaving: s, setIsSaving: a, setBasePoints: l, isBasePoint: p }) => {
  var _a, _b, _c;
  if (!n) return { success: false, error: "User not authenticated", timestamp: Date.now() };
  if (s()) return { success: false, error: "Operation already in progress", timestamp: Date.now() };
  if (!Be(o$1) || !Be(r)) return { success: false, error: `Coordinates must be integers between ${o.WORLD_BOUNDS.MIN_X} and ${o.WORLD_BOUNDS.MAX_X} (inclusive)`, timestamp: Date.now() };
  const h = await new Promise((g) => {
    l((y) => (g(y), y));
  });
  if (p(o$1, r, h)) return { success: false, error: "Base point already exists at these coordinates", timestamp: Date.now() };
  try {
    a(true);
    const g = await fetch("/api/base-points", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, credentials: "include", body: JSON.stringify({ x: o$1, y: r }) });
    if (!g.ok) return { success: false, error: (await g.json().catch(() => ({}))).error || `Failed to save base point: ${g.status} ${g.statusText}`, timestamp: Date.now() };
    const y = await g.json();
    if (!y.success) return { success: false, error: y.error || "Failed to save base point", timestamp: Date.now() };
    const C = { x: o$1, y: r, userId: ((_a = y.data) == null ? void 0 : _a.userId) || n.id, createdAtMs: ((_b = y.data) == null ? void 0 : _b.createdAtMs) || Date.now(), id: ((_c = y.data) == null ? void 0 : _c.id) || 0 };
    return l((B) => [...B, C]), { success: true, data: C, timestamp: Date.now() };
  } catch (g) {
    return { success: false, error: g instanceof Error ? g.message : "Failed to save base point", timestamp: Date.now() };
  } finally {
    a(false);
  }
}, Et = (o$1, r, n) => {
  const [s, a] = o$1, [l, p] = n, h = o.GRID_SIZE, g = h * h - 1, y = s + l, C = a + p, B = (q) => q >= 0 && q <= g, m = (q, v) => {
    const V = [];
    let X = y + q, O = C + v;
    for (; X >= 0 && X < h && O >= 0 && O < h; ) {
      const R = X + O * h;
      B(R) && V.push(R), X += q, O += v;
    }
    return V;
  }, D = [...m(1, 0), ...m(-1, 0), ...m(0, 1), ...m(0, -1), ...m(1, -1), ...m(-1, -1), ...m(1, 1), ...m(-1, 1), ...m(2, -1), ...m(-2, -1), ...m(1, -2), ...m(-1, -2), ...m(2, 1), ...m(-2, 1), ...m(1, 2), ...m(-1, 2)].filter((q) => q !== s + a * h);
  return [.../* @__PURE__ */ new Set([...r, ...D.filter((q) => q >= 0 && q <= g)])];
};
let xe = 0;
const Ae = 50, Pt = async (o$1, r) => {
  var _a;
  const { isMoving: n, currentPosition: s, setCurrentPosition: a$1, restrictedSquares: l, setRestrictedSquares: p, setIsMoving: h, isBasePoint: g } = r, y = Date.now(), C = y - xe, B = C < 5e3;
  if (!(n() || B && C < Ae)) {
    xe = y, h(true);
    try {
      const [m, D] = s(), [q, v] = Pe[o$1].delta, V = m + q, X = D + v;
      if (V < o.WORLD_BOUNDS.MIN_X || V > o.WORLD_BOUNDS.MAX_X || X < o.WORLD_BOUNDS.MIN_Y || X > o.WORLD_BOUNDS.MAX_Y) return;
      const O = a(V, X), R = Dt([...l()]), A = It(R, o$1, O), ne = Ne(A);
      batch(() => {
        a$1(O), p((J) => [...ne]);
      });
      const b = [...Pe[o$1].borderIndices], z = await fetch("/api/calculate-squares", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ borderIndices: b, currentPosition: O, direction: o$1 }) });
      if (!z.ok) throw new Error(`API call failed with status: ${z.status} ${z.statusText}`);
      const W = await z.json();
      if (!W.success || !((_a = W.data) == null ? void 0 : _a.squares) || !Array.isArray(W.data.squares)) throw new Error(`Invalid API response format: ${JSON.stringify(W)}`);
      const ce = Ne(A), le = ce.filter((J) => W.data.squares.includes(J));
      if (le.length > 0) throw new Error(`Duplicate restricted squares found: ${le.join(", ")}`);
      const me = [...ce, ...W.data.squares], [_e, ee] = s(), ae = me.filter((J) => {
        const d = J % o.GRID_SIZE, u = Math.floor(J / o.GRID_SIZE), f = d - _e, S = u - ee;
        return !g(f, S);
      });
      p(ae);
    } catch (m) {
      throw m instanceof Error ? m : new Error("Failed to process movement", { cause: m });
    } finally {
      const m = Ae - (Date.now() - xe);
      setTimeout(() => {
        h(false);
      }, Math.max(0, m));
    }
  }
}, Dt = (o$1) => o$1.map((r) => a(r % o.GRID_SIZE, Math.floor(r / o.GRID_SIZE))), Ne = (o$1) => o$1.map(([r, n]) => n * o.GRID_SIZE + r), Be = (o$1) => Number.isInteger(o$1) && o$1 >= o.WORLD_BOUNDS.MIN_X && o$1 <= o.WORLD_BOUNDS.MAX_X, Ee = (o, r, n) => n.some((s) => s.x === o && s.y === r), xt = ({ index: o$1, currentUser: r, currentPosition: n, basePoints: s, restrictedSquares: a }) => {
  if (!r) return { isValid: false, reason: "Not logged in" };
  const l = o$1 % o.GRID_SIZE, p = Math.floor(o$1 / o.GRID_SIZE), [h, g] = n, y = l - h, C = p - g;
  return y === 0 && C === 0 ? { isValid: false, reason: "Cannot place on player position" } : Ee(y, C, s) ? { isValid: false, reason: "Base point already exists here" } : a.includes(o$1) ? { isValid: false, reason: "Cannot place in restricted area" } : { isValid: true };
}, Mt = async ({ user: o, currentPosition: r, lastFetchTime: n, isFetching: s, setBasePoints: a, setLastFetchTime: l, setIsFetching: p }) => {
  if (!o()) {
    console.log("[Board:fetchBasePoints] setBasePoints([])"), a([]);
    return;
  }
  const g = Date.now(), y = g - n();
  if (console.log("[Board:fetchBasePoints] setIsFetching(true)"), !(s() || y < 1e3)) {
    p(true);
    try {
      let [C, B] = r();
      C = -C, B = -B;
      const m = await fetch(`/api/base-points?x=${C}&y=${B}`, { credentials: "include", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } });
      if (!m.ok) throw new Error(`HTTP error! status: ${m.status}`);
      const { data: D } = await m.json();
      if (!D || !Array.isArray(D.basePoints)) throw new Error("Invalid response: expected data.basePoints to be an array");
      const q = D.basePoints;
      a(q), l(g);
    } catch (C) {
      console.error("Error fetching base points:", C);
    } finally {
      p(false);
    }
  }
};
var Lt = ["<div", "><!--$-->", "<!--/--><div", ">Position: (<!--$-->", "<!--/-->, <!--$-->", "<!--/-->)</div><div", ">", "</div><!--$-->", "<!--/--></div>"], Ot = ["<div", ">You've reached the edge of the world!</div>"], At = ["<div", ">", "</div>"];
const Nt = () => {
  const { user: o$1 } = I(), r = o$1(), [n, s] = createSignal(a(o.DEFAULT_POSITION[0], o.DEFAULT_POSITION[1])), [a$1, l] = createSignal([]);
  createEffect(() => {
    const d = q();
    if (d) {
      const [u, f] = d, [S, Y] = n();
      (u !== S || f !== Y) && (console.log(`[Board] Syncing position from context: [${u}, ${f}]`), s(a(u, f)));
    }
  });
  const [p, h] = createSignal(0), [g, y] = createSignal(false), [C, B] = createSignal(false), [m, D] = createSignal(false), { position: q, setPosition: v, restrictedSquares: V, setRestrictedSquares: X } = Oe();
  onMount(async () => {
    document.documentElement.style.setProperty("--grid-size", o.GRID_SIZE.toString());
    try {
      const d = await $t(o.DEFAULT_POSITION[0], o.DEFAULT_POSITION[1], v);
      if (!d) throw new Error("Failed to initialize game: Could not determine starting position");
      const { position: u, restrictedSquares: f } = d;
      s(u), X(f), await me();
    } catch (d) {
      throw d instanceof Error ? new Error(`Failed to initialize game: ${d.message}`) : new Error("Failed to initialize game: Unknown error occurred");
    }
  });
  const [O, R] = createSignal(null), [A, ne] = createSignal(null), [b, z] = createSignal(false), W = (d) => xt({ index: d, currentUser: r, currentPosition: n(), basePoints: a$1(), restrictedSquares: V() }), ce = (d) => {
    if (R(d), d === null) ne(null);
    else {
      const u = W(d);
      u.isValid ? ne(null) : ne(u.reason || "Invalid placement");
    }
  };
  let le = null;
  const me = async () => {
    const d = n(), u = Mt({ user: () => r, currentPosition: () => d, lastFetchTime: p, isFetching: g, setBasePoints: l, setLastFetchTime: h, setIsFetching: y });
    return u ? (le = u.finally(() => {
      le = null;
    }), le) : Promise.resolve();
  };
  createEffect(on(() => o$1(), (d) => {
    if (d !== void 0) {
      if (!d) {
        X([]);
        return;
      }
      me().catch(console.error);
    }
  }, { defer: true })), createEffect(() => {
    const [d, u] = n();
    if (!o$1()) return;
    console.log(`[Board] Effect1 - Position changed to [${d}, ${u}], fetching base points`);
    const S = requestIdleCallback(() => {
      me().catch(console.error);
    });
    return () => cancelIdleCallback(S);
  });
  const _e = (d) => {
    if (!((S) => typeof S == "string" && S in o.DIRECTION_MAP)(d.key)) return;
    d.preventDefault();
    const f = o.DIRECTION_MAP[d.key];
    J(f);
  }, ee = (d) => {
  };
  onMount(() => {
    const d = [["keydown", _e], ["keyup", ee]];
    return d.forEach(([u, f]) => {
      window.addEventListener(u, f);
    }), () => {
      d.forEach(([u, f]) => {
        window.removeEventListener(u, f);
      });
    };
  });
  const ae = async (d) => {
    const u = d % o.GRID_SIZE, f = Math.floor(d / o.GRID_SIZE), [S, Y] = n(), Z = u - S, he = f - Y;
    try {
      const t = await Ct({ x: Z, y: he, currentUser: r, isSaving: m, setIsSaving: D, setBasePoints: l, isBasePoint: (i, _) => Ee(i, _, a$1()) });
      if (t.success && t.data) {
        const i = Et(a(Z, he), V(), n());
        X(i);
      } else t.error && ne(t.error);
    } catch (t) {
      const i = t instanceof Error ? t.message : "An unknown error occurred";
      ne(i);
    }
  }, J = async (d) => {
    z(false);
    const u = n(), [f, S] = Pe[d].delta, Y = u[0] + f, Z = u[1] + S, he = a(Y, Z);
    if (Y < o.WORLD_BOUNDS.MIN_X || Y > o.WORLD_BOUNDS.MAX_X || Z < o.WORLD_BOUNDS.MIN_Y || Z > o.WORLD_BOUNDS.MAX_Y) {
      z(true);
      return;
    }
    let t = false;
    t = false;
    try {
      await Pt(d, { isMoving: C, currentPosition: () => n(), setCurrentPosition: (i) => {
        if (t) return console.warn("Position already updated, ignoring duplicate update"), he;
        const _ = typeof i == "function" ? i(n()) : i;
        s(_), v(_), t = true;
      }, restrictedSquares: V, setRestrictedSquares: X, setIsMoving: B, isBasePoint: (i, _) => Ee(i, _, a$1()) });
    } catch (i) {
      throw s(n()), v(n()), i;
    }
  };
  return ssr(Lt, ssrHydrationKey() + ssrAttribute("class", escape(F.board, true), false), b() && ssr(Ot, ssrHydrationKey() + ssrAttribute("class", escape(F.boundaryMessage, true), false)), ssrAttribute("class", escape(F.positionIndicator, true), false), escape(n()[0]), escape(n()[1]), ssrAttribute("class", escape(F.grid, true), false), escape(Array.from({ length: o.GRID_SIZE * o.GRID_SIZE }).map((d, u) => {
    const f = u % o.GRID_SIZE, S = Math.floor(u / o.GRID_SIZE), [Y, Z] = n(), he = f - Y, t = S - Z, i = S * o.GRID_SIZE + f, _ = Ee(he, t, a$1()), I = V().includes(i), w = { isBasePoint: _, isSelected: I, isPlayerPosition: he === 0 && t === 0, isHovered: O() === u, isValid: W(u).isValid && !m(), isSaving: m() };
    return createComponent(Tt, { position: { x: f, y: S, worldX: he, worldY: t }, state: w, onHover: (M) => {
      ce(M ? S * o.GRID_SIZE + f : null);
    }, onClick: (M) => {
      M.stopPropagation(), M.preventDefault(), !(I || m() || _) && ae(i).catch((T) => console.error("Error processing click:", T));
    } });
  })), A() && ssr(At, ssrHydrationKey() + ssrAttribute("class", escape(F.errorMessage, true), false), escape(A())));
}, Bt = "_sidePanel_1sqod_1", qt = "_menuToggle_1sqod_16", Rt = "_open_1sqod_42", kt = "_overlay_1sqod_50", zt = "_tabs_1sqod_63", Ut = "_tab_1sqod_63", jt = "_active_1sqod_84", Vt = "_tabContent_1sqod_90", Ft = "_notificationsSection_1sqod_143", Gt = "_counters_1sqod_158", Xt = "_counter_1sqod_158", Wt = "_counterNumber_1sqod_182", Zt = "_added_1sqod_195", Ht = "_deleted_1sqod_204", Jt = "_counterLabel_1sqod_208", Yt = "_notificationItem_1sqod_241", Qt = "_notificationTime_1sqod_253", Kt = "_notificationText_1sqod_258", eo = "_gameStatusContainer_1sqod_267", to = "_infoTab_1sqod_322", oo = "_settingsTab_1sqod_328", x = { sidePanel: Bt, menuToggle: qt, open: Rt, overlay: kt, tabs: zt, tab: Ut, active: jt, tabContent: Vt, notificationsSection: Ft, counters: Gt, counter: Xt, counterNumber: Wt, added: Zt, deleted: Ht, counterLabel: Jt, notificationItem: Yt, notificationTime: Qt, notificationText: Kt, gameStatusContainer: eo, infoTab: to, settingsTab: oo }, ro = "_gameStatus_13a4o_3", so = "_loading_13a4o_11", no = "_errorMessage_13a4o_18", ao = "_successMessage_13a4o_28", io = "_statusInfo_13a4o_38", co = "_isLoading_13a4o_48", lo = "_statusRow_13a4o_53", uo = "_statusLabel_13a4o_66", fo = "_statusValue_13a4o_71", go = "_actions_13a4o_76", mo = "_joinButton_13a4o_83", ho = "_leaveButton_13a4o_84", se = { gameStatus: ro, loading: so, errorMessage: no, successMessage: ao, statusInfo: io, isLoading: co, statusRow: lo, statusLabel: uo, statusValue: fo, actions: go, joinButton: mo, leaveButton: ho };
var po = ["<div", ">Loading game status...</div>"], qe = ["<div", ">", "</div>"], _o = ["<div", "><span", ">Home Base:</span><span", ">(<!--$-->", "<!--/-->, <!--$-->", "<!--/-->)</span></div>"], Re = ["<button", "", ">", "</button>"], vo = ["<div", "><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", '<!--/--><div class="', '"><div', "><span", ">Game Status:</span><span", ">", "</span></div><!--$-->", "<!--/--></div><div", ">", "</div></div>"];
function yo() {
  const [o, r] = createSignal({ gameJoined: false, homeX: 0, homeY: 0, isLoading: true, error: null, message: null }), n = p();
  I(), Ie$1(), bt();
  const { setPosition: s, setRestrictedSquares: a } = Oe(), l = (h) => {
    r((g) => ({ ...g, ...h, ...h.isLoading === true ? { error: null, message: null } : {} }));
  }, p$1 = async () => {
    if (!n.user()) {
      l({ isLoading: false, error: "You must be logged in to view game status" });
      return;
    }
    l({ isLoading: true });
    try {
      const h = await fetch("/api/game/status", { credentials: "include" }), g = await h.json();
      if (!h.ok) throw new Error(g.error || "Failed to fetch game status");
      l({ isLoading: false, gameJoined: g.gameJoined, homeX: g.homeX, homeY: g.homeY, message: g.message || null });
    } catch (h) {
      console.error("Error fetching game status:", h), l({ isLoading: false, error: h instanceof Error ? h.message : "Failed to load game status", message: "An error occurred while loading the game status." });
    }
  };
  return onMount(() => {
    p$1();
  }), createEffect(() => {
    n.user() && p$1();
  }), ssr(vo, ssrHydrationKey() + ssrAttribute("class", escape(se.gameStatus, true), false), escape(createComponent(Show, { get when() {
    return o().isLoading;
  }, get children() {
    return ssr(po, ssrHydrationKey() + ssrAttribute("class", escape(se.loading, true), false));
  } })), escape(createComponent(Show, { get when() {
    return o().error;
  }, get children() {
    return ssr(qe, ssrHydrationKey() + ssrAttribute("class", escape(se.errorMessage, true), false), escape(o().error));
  } })), escape(createComponent(Show, { get when() {
    return o().message && !o().isLoading;
  }, get children() {
    return ssr(qe, ssrHydrationKey() + ssrAttribute("class", escape(se.successMessage, true), false), escape(o().message));
  } })), `${escape(se.statusInfo, true) || ""} ${o().isLoading ? escape(escape(se.isLoading, true), true) : ""}`, ssrAttribute("class", escape(se.statusRow, true), false), ssrAttribute("class", escape(se.statusLabel, true), false), ssrAttribute("class", escape(se.statusValue, true), false), o().gameJoined ? "\u2705 Joined" : "\u274C Not Joined", escape(createComponent(Show, { get when() {
    return o().gameJoined;
  }, get children() {
    return ssr(_o, ssrHydrationKey() + ssrAttribute("class", escape(se.statusRow, true), false), ssrAttribute("class", escape(se.statusLabel, true), false), ssrAttribute("class", escape(se.statusValue, true), false), escape(o().homeX), escape(o().homeY));
  } })), ssrAttribute("class", escape(se.actions, true), false), escape(createComponent(Show, { get when() {
    return o().gameJoined;
  }, get fallback() {
    return ssr(Re, ssrHydrationKey(), ssrAttribute("disabled", o().isLoading, true) + ssrAttribute("class", escape(se.joinButton, true), false), o().isLoading ? "Joining..." : "Join Game");
  }, get children() {
    return ssr(Re, ssrHydrationKey(), ssrAttribute("disabled", o().isLoading, true) + ssrAttribute("class", escape(se.leaveButton, true), false), o().isLoading ? "Leaving..." : "Leave Game");
  } })));
}
var wo = ["<p", ">Total base points: <!--$-->", "<!--/--></p>"], To = ["<div", ' style="', '"><h4>Oldest Prime Notification</h4><div', "><div", ">", "</div><div", ">", "</div></div></div>"], $o = ["<div", "><h3>Player: <!--$-->", "<!--/--></h3><div", "><h4>Activity Counters</h4><div", "><div", '><span class="', '">', "</span><span", ">Added</span></div><div", '><span class="', '">', "</span><span", ">Removed</span></div></div><div", "><h3>Game Information</h3><div", ">", "</div><!--$-->", "<!--/--><!--$-->", "<!--/--></div></div></div>"];
const bo = (o) => ssr($o, ssrHydrationKey() + ssrAttribute("class", escape(x.infoTab, true), false), escape(o.username), ssrAttribute("class", escape(x.notifications, true), false), ssrAttribute("class", escape(x.counters, true), false), ssrAttribute("class", escape(x.counter, true), false), `${escape(x.counterNumber, true)} ${escape(x.added, true)}`, escape(o.addedCount), ssrAttribute("class", escape(x.counterLabel, true), false), ssrAttribute("class", escape(x.counter, true), false), `${escape(x.counterNumber, true)} ${escape(x.deleted, true)}`, escape(o.deletedCount), ssrAttribute("class", escape(x.counterLabel, true), false), ssrAttribute("class", escape(x.tabContent, true), false), ssrAttribute("class", escape(x.gameStatusContainer, true), false), escape(createComponent(yo, {})), escape(createComponent(Show, { get when() {
  return o.totalBasePoints() !== null;
}, get children() {
  return ssr(wo, ssrHydrationKey(), escape(o.totalBasePoints()));
} })), escape(createComponent(Show, { get when() {
  return o.oldestPrimeNotification;
}, get children() {
  var _a, _b;
  return ssr(To, ssrHydrationKey() + ssrAttribute("class", escape(x.notificationsSection, true), false), ssrStyleProperty("margin-top:", "1rem"), ssrAttribute("class", escape(x.notificationItem, true), false), ssrAttribute("class", escape(x.notificationText, true), false), escape((_a = o.oldestPrimeNotification) == null ? void 0 : _a.message), ssrAttribute("class", escape(x.notificationTime, true), false), escape(new Date(((_b = o.oldestPrimeNotification) == null ? void 0 : _b.timestamp) || 0).toLocaleString()));
} })));
var So = ["<div", "><h3>Settings</h3><div", "><div", "><h4>Account</h4><button", ">Logout</button></div></div></div>"];
const Io = (o) => ssr(So, ssrHydrationKey() + ssrAttribute("class", escape(x.settingsTab, true), false), ssrAttribute("class", escape(x.settingsContent, true), false), ssrAttribute("class", escape(x.settingGroup, true), false), ssrAttribute("class", escape(x.logoutButton, true), false));
var Co = ["<div", ' class="', '"><div', '><button class="', '">Info</button><button class="', '">Settings</button></div><div', ">", "</div><button", ">", '</button><div class="', '"></div></div>'], Eo = ["<div", ">", "</div>"];
const Po = (o) => {
  const [r, n] = createSignal([]), [s, a] = createSignal(null), [l, p] = createSignal(0), [h, g] = createSignal(0), [y, C] = createSignal(null), [B, m] = createSignal(null), [D, q] = createSignal(false);
  let v = null, V = 0;
  const X = 5;
  let O = false, R, A;
  const ne = 5e3;
  let b = true;
  const z = {}, W = () => {
    if (V < X) {
      const ee = Math.min(1e3 * Math.pow(2, V), 3e4);
      R = setTimeout(() => {
        me();
      }, ee);
    } else console.error("[SSE] Max reconnection attempts reached");
  }, ce = (ee) => {
    try {
      if (!ee.data || ee.data.trim() === "") return;
      let ae = ee.type, J = {};
      if (ee.data.startsWith("event: ")) {
        const u = ee.data.match(/^event: (\w+)\s*(\{.*\})?/s);
        if (u && (ae = u[1], u[2])) try {
          J = JSON.parse(u[2].trim());
        } catch (f) {
          console.error("[SSE] Error parsing message data:", f);
        }
      } else try {
        J = JSON.parse(ee.data);
      } catch (u) {
        console.error("[SSE] Error parsing message data as JSON:", u);
        return;
      }
      if (ae === "ping" || (J == null ? void 0 : J.type) === "ping") return;
      const d = J;
      if (d.type === "basePointChanged" || d.event === "basePointChanged" || d.type === "basePointDeleted" || d.event === "basePointDeleted") {
        const u = d.point || d;
        if (u) {
          const f = d.type === "basePointDeleted" || d.event === "basePointDeleted", S = d.count || 1;
          f ? g((Z) => Z + (S || 1)) : p((Z) => Z + (S || 1));
          const Y = { id: u.id || Date.now(), message: f ? `Removed ${S} base point${S > 1 ? "s" : ""} at (${u.x}, ${u.y})` : `Added ${S} base point${S > 1 ? "s" : ""} at (${u.x}, ${u.y})`, timestamp: u.timestamp || Date.now(), userId: u.userId, count: S };
          (u.isPrime || u.message && u.message.toLowerCase().includes("prime")) && a((Z) => !Z || Y.timestamp < Z.timestamp ? Y : Z), n((Z) => [Y, ...Z].slice(0, 50));
        }
      }
      if (d.type === "cleanup" || d.event === "cleanup") {
        if (d.totalBasePoints !== void 0 || d.initialCount !== void 0) {
          const u = d.initialCount !== void 0 ? d.initialCount : d.totalBasePoints;
          C((f) => u);
        }
        d.oldestPrimeTimestamp !== void 0 && (m(d.oldestPrimeTimestamp), s() || a({ id: "system-prime", message: "Initial prime point detected", timestamp: d.oldestPrimeTimestamp }));
      } else if (d.type === "worldReset" || d.event === "worldReset") {
        console.log("[World Reset] Received world reset event:", d), C(0), p(0), g(0), a(null);
        const u = { id: Date.now(), message: `World has been reset! ${d.pointsBeforeReset} points were cleared.`, timestamp: Date.now() };
        n((f) => [u, ...f]), d.oldestPrimeTimestamp !== void 0 && m(d.oldestPrimeTimestamp);
      }
    } catch (ae) {
      console.error("[SSE] Error processing message:", ae);
    }
  }, le = () => {
    A && (clearTimeout(A), A = void 0), v && (v.onopen = null, v.onerror = null, v.onmessage = null, v.close(), v = null);
  }, me = () => {
    if (!b) return;
    le(), R && (clearTimeout(R), R = void 0);
    const ae = `/api/events?_=${Date.now()}`;
    try {
      v = new EventSource(ae, { withCredentials: true }), O = false, A = setTimeout(() => {
        b && (v == null ? void 0 : v.readyState) === EventSource.CONNECTING && (console.error("[SSE] Connection timeout - server is not responding"), fetch(v.url, { method: "GET", credentials: "include", headers: { Accept: "text/event-stream", "Cache-Control": "no-cache" } }).then((f) => f.text().then((S) => ({ status: f.status, statusText: f.statusText, headers: Object.fromEntries(f.headers.entries()), text: S.substring(0, 200) }))).catch((f) => console.error("[SSE] Test fetch error:", f)).finally(() => {
          le(), W();
        }));
      }, ne), v.onopen = (f) => {
        A && (clearTimeout(A), A = void 0);
        const S = (/* @__PURE__ */ new Date()).toISOString();
        O = true, V = 0;
      }, v.onmessage = (f) => {
        ce({ ...f, type: "message", data: f.data });
      };
      const J = v;
      if (!J) {
        console.error("[SSE] Cannot add event listeners: eventSource is null");
        return;
      }
      ["created", "updated", "deleted", "ping", "cleanup"].forEach((f) => {
        const S = (Y) => {
          ce({ ...Y, type: Y.type, data: Y.data });
        };
        z[f] = S, J.addEventListener(f, S);
      });
      const u = () => {
        v && Object.entries(z).forEach(([f, S]) => {
          v == null ? void 0 : v.removeEventListener(f, S);
        }), Object.keys(z).forEach((f) => delete z[f]);
      };
      onCleanup(() => {
        b = false, u(), le(), R && (clearTimeout(R), R = void 0), A && (clearTimeout(A), A = void 0), v && (v.close(), v = null);
      }), v.onerror = (f) => {
        v && (O = false, v.readyState, EventSource.CLOSED, W());
      };
    } catch (J) {
      console.error("[SSE] Error creating EventSource:", J), W();
    }
  };
  onMount(() => (me(), () => {
    if (R && (clearTimeout(R), R = void 0), v) try {
      v.removeEventListener("created", ce), v.removeEventListener("updated", ce), v.removeEventListener("deleted", ce), v.readyState !== EventSource.CLOSED && v.close(), v = null;
    } catch (ee) {
      console.error("Error during cleanup:", ee);
    }
  }));
  const _e = (ee) => {
  };
  return createEffect(() => {
    D() ? document.addEventListener("mousedown", _e) : document.removeEventListener("mousedown", _e), onCleanup(() => {
      document.removeEventListener("mousedown", _e);
    });
  }), createEffect(() => {
    D() && q(false);
  }), ssr(Co, ssrHydrationKey(), `${escape(x.sidePanel, true)} ${D() ? escape(x.open, true) : ""}`, ssrAttribute("class", escape(x.tabs, true), false), `${escape(x.tab, true)} ${o.activeTab === "info" ? escape(x.active, true) : ""}`, `${escape(x.tab, true)} ${o.activeTab === "settings" ? escape(x.active, true) : ""}`, ssrAttribute("class", escape(x.content, true), false), o.activeTab === "info" ? ssr(Eo, ssrHydrationKey(), escape(createComponent(bo, { get username() {
    return o.username;
  }, get addedCount() {
    return l();
  }, get deletedCount() {
    return h();
  }, totalBasePoints: y, get oldestPrimeNotification() {
    return s();
  } }))) : escape(createComponent(Io, { get onLogout() {
    return o.onLogout;
  } })), ssrAttribute("class", escape(x.menuToggle, true), false), D() ? "\xD7" : "\u2630", `${escape(x.overlay, true)} ${D() ? escape(x.open, true) : ""}`);
}, ke = "mapTilesDB", ye = "tiles", ze = 100;
class Ze {
  constructor() {
    __publicField(this, "db", null);
    __publicField(this, "dbName", ke);
    __publicField(this, "storeName", ye);
    __publicField(this, "isInitialized", false);
    __publicField(this, "initPromise", null);
    __publicField(this, "maxAge", 30 * 1e3);
    __publicField(this, "refreshThreshold", 20 * 1e3);
    __publicField(this, "lastUpdateTime", 0);
    __publicField(this, "refreshInterval", null);
    __publicField(this, "accessTimes", /* @__PURE__ */ new Map());
    this.init();
  }
  async init() {
    if (console.log("[TileCache] Initializing IndexedDB..."), this.isInitialized) {
      console.log("[TileCache] Already initialized");
      return;
    }
    return this.initPromise ? (console.log("[TileCache] Initialization already in progress, waiting..."), this.initPromise) : (console.log("[TileCache] Starting new initialization"), this.initPromise = new Promise((r, n) => {
      {
        console.log("[TileCache] Skipping IndexedDB initialization in SSR"), this.isInitialized = true, r();
        return;
      }
    }), this.initPromise);
  }
  getStore(r) {
    return console.error("[TileCache] Not in browser environment"), null;
  }
  async deleteTile(r, n) {
    return new Promise((s, a) => {
      const l = this.getStore("readwrite");
      if (!l) {
        a(new Error("Failed to get store for deletion"));
        return;
      }
      const p = l.delete([r, n]);
      p.onsuccess = () => {
        this.accessTimes.delete(`${r},${n}`), s();
      }, p.onerror = (h) => {
        console.error(`[TileCache] Error deleting tile (${r},${n}):`, h.target.error), a(h.target.error);
      };
    });
  }
  async getTile(r, n, s = false) {
    if (!this.isInitialized) try {
      await this.init();
    } catch (l) {
      return console.error("[TileCache] Error initializing in getTile:", l), null;
    }
    return null;
  }
  async setTile(r, n, s, a) {
    if (!this.isInitialized) try {
      await this.init();
    } catch (h) {
      throw console.error("[TileCache] Error initializing in setTile:", h), h;
    }
    this.lastUpdateTime = Date.now();
    const l = `${r},${n}`;
    this.accessTimes.set(l, Date.now());
    const p = await this.getCacheSize();
    if (p >= ze && await this.evictLRUTiles(p - ze + 1), this.refreshInterval || this.scheduleNextCleanup(), false) ;
  }
  async clear() {
  }
  async cleanupOldTiles() {
    return new Promise((r) => {
      if (!this.db) {
        console.log("[TileCache] No database to clean up"), r();
        return;
      }
      const a = this.db.transaction([ye], "readwrite").objectStore(ye).index("timestamp"), p = Date.now() - this.maxAge, h = a.openCursor(IDBKeyRange.upperBound(p)), g = [];
      h.onsuccess = (y) => {
        const C = y.target.result;
        if (C) g.push([C.value.x, C.value.y]), C.continue();
        else if (g.length > 0) {
          const B = this.db.transaction([ye], "readwrite"), m = B.objectStore(ye);
          g.forEach(([D, q]) => {
            m.delete([D, q]);
          }), B.oncomplete = () => {
            this.scheduleNextCleanup(), r();
          }, B.onerror = (D) => {
            console.error("[TileCache] Error deleting old tiles:", D), r();
          };
        } else this.scheduleNextCleanup(), r();
      }, h.onerror = (y) => {
        console.error("[TileCache] Error cleaning up old tiles:", y), r();
      };
    });
  }
  async evictLRUTiles(r) {
    if (r <= 0) return;
    const s = Array.from(this.accessTimes.entries()).map(([a, l]) => ({ key: a, lastAccess: l, coords: a.split(",").map(Number) })).sort((a, l) => a.lastAccess - l.lastAccess).slice(0, r);
    for (const { coords: [a, l], key: p } of s) await this.deleteTile(a, l), this.accessTimes.delete(p);
  }
  scheduleNextCleanup() {
    this.refreshInterval && clearTimeout(this.refreshInterval), this.refreshInterval = window.setTimeout(() => {
      this.cleanupOldTiles().catch(console.error);
    }, 1e4);
  }
  async getCacheSize() {
    return this.isInitialized || await this.init(), 0 ;
  }
}
new Ze();
const Do = "_mapContainer_10ovn_4", xo = "_mapViewport_10ovn_20", Mo = "_mapViewportDragging_10ovn_29", Lo = "_mapContent_10ovn_35", Oo = "_tileContainer_10ovn_59", Ao = "_tile_10ovn_59", No = "_fallbackTile_10ovn_118", Bo = "_loading_10ovn_137", qo = "_gridLabel_10ovn_173", Ro = "_major_10ovn_188", ko = "_zero_10ovn_194", zo = "_tileLabel_10ovn_201", Uo = "_loadingIndicator_10ovn_218", jo = "_spin_10ovn_1", Vo = "_tileImage_10ovn_234", Fo = "_tileSvg_10ovn_235", Go = "_fallbackTileContent_10ovn_285", Xo = "_error_10ovn_293", Wo = "_gridOverlay_10ovn_321", Zo = "_tileImageScaled_10ovn_365", Ho = "_tileImageScaledDynamic_10ovn_381", Jo = "_tileContent_10ovn_403", Yo = "_coordinateLabel_10ovn_411", Qo = "_loadingOverlay_10ovn_417", Ko = "_errorOverlay_10ovn_418", er = "_controls_10ovn_435", tr = "_coordinates_10ovn_468", L = { mapContainer: Do, mapViewport: xo, mapViewportDragging: Mo, mapContent: Lo, tileContainer: Oo, tile: Ao, fallbackTile: No, loading: Bo, "loading-progress": "_loading-progress_10ovn_1", gridLabel: qo, major: Ro, zero: ko, tileLabel: zo, loadingIndicator: Uo, spin: jo, tileImage: Vo, tileSvg: Fo, fallbackTileContent: Go, error: Xo, gridOverlay: Wo, tileImageScaled: Zo, tileImageScaledDynamic: Ho, tileContent: Jo, coordinateLabel: Yo, loadingOverlay: Qo, errorOverlay: Ko, controls: er, coordinates: tr, "loading-pulse": "_loading-pulse_10ovn_1" };
var Ue = ["<div", "></div>"], je = ["<div", ' class="', '"><div', ">Error<div", "><!--$-->", "<!--/-->,<!--$-->", "<!--/--></div></div></div>"], or = ["<div", ' class="', '" style="', '"><div', "><div", "></div><div", "><!--$-->", "<!--/-->,<!--$-->", "<!--/--></div></div></div>"], Ve = ["<div", ' style="', '"><div', "><div", "><!--$-->", "<!--/-->,<!--$-->", "<!--/--></div></div></div>"], rr = ["<div", "><svg", ' viewBox="', '"', ">", "</svg><div", "><!--$-->", "<!--/-->,<!--$-->", "<!--/--><!--$-->", "<!--/--></div></div>"], sr = ["<div", ' class="', '" style="', '"', ">", "</div>"], nr = ["<div", "><div", "><div", ' style="', '"><div style="', '">', "</div></div></div><!--$-->", "<!--/--><div", "><div", ">Position: <!--$-->", "<!--/-->, <!--$-->", "<!--/--><br>Tiles: <!--$-->", "<!--/--></div></div></div>"], ar = ["<div", ">Loading map...</div>"];
const oe = 64, we = { BATCH_SIZE: 4, MAX_TILES_TO_LOAD: 30, BATCH_DELAY: 100, BATCH_TIMEOUT: 5e3, MAX_TILES_IN_MEMORY: 50 }, Fe = 800, Ge = 600, ir = () => {
  const [o, r] = createSignal({}), n = () => {
    const t = Fe, i = Ge;
    return console.log(`width, height: ${t}, ${i}`), { x: 0, y: 0, width: t, height: i };
  }, [s, a] = createSignal(n());
  r({});
  const [l, p] = createSignal(false), [h, g] = createSignal(null), [y, C] = createSignal({ x: 0, y: 0, startX: 0, startY: 0 }), [B, m] = createSignal(false), D = new Ze();
  let q = false;
  D.init().then(() => {
    q = true;
  }).catch((t) => {
    console.error("[MapView] Failed to initialize tile cache:", t);
  });
  const [v, V] = createSignal([]), [X, O] = createSignal(false), R = /* @__PURE__ */ new Set();
  let A = null, ne = false;
  const [b, z] = createSignal(false), W = Math.floor(Math.random() * 1e6), ce = (t) => !t || t.error ? true : Date.now() - t.timestamp > 20 * 1e3, le = () => {
    if (!b()) return;
    const t = o();
    Object.values(t).forEach((i) => {
      ce(i) && u(i.x, i.y, true).catch((_) => {
        console.error(`[loadVisibleTiles] Error refreshing tile (${i.x}, ${i.y}):`, _);
      });
    });
  };
  onMount(() => {
    z(true), le();
    const t = setInterval(() => {
      b() && le();
    }, 10 * 1e3);
    return () => {
      clearInterval(t), z(false);
    };
  }), createEffect(() => {
    const t = () => {
      if (!b()) return;
      console.log("[MapView] Effect initialLoad");
      const _ = Fe, I = Ge;
      console.log(`[MapView] Effect initialLoad width: ${_}, height: ${I}`), a((w) => ({ ...w, width: _, height: I }));
    }, i = setTimeout(() => {
      b() && t();
    }, 50);
    onCleanup(() => {
      clearTimeout(i);
    });
  });
  const me = (t, i, _) => {
    const I = [];
    I.push({ x: t, y: i, distance: 0 });
    for (let w = 1; w <= _; w++) {
      let k = w, M = -w;
      for (; k >= -w; k--) I.push({ x: t + k, y: i + M, distance: w });
      for (k++, M++; M <= w; M++) I.push({ x: t + k, y: i + M, distance: w });
      for (M--, k++; k <= w; k++) I.push({ x: t + k, y: i + M, distance: w });
      for (k--, M--; M > -w; M--) I.push({ x: t + k, y: i + M, distance: w });
    }
    return I;
  }, _e = (t) => {
    const i = s(), _ = Math.floor(Math.abs(i.x) / 64), I = Math.floor(Math.abs(i.y) / 64);
    if (_ > 16 || I > 16 || ne) return;
    const w = v(), k = w.length;
    if (k >= we.MAX_TILES_TO_LOAD) {
      ae();
      return;
    }
    const M = 2, T = J(i.x, i.y), H = me(T.tileX, T.tileY, M), U = [], Q = new Set(w.map((K) => `${K.x},${K.y}`));
    for (const { x: K, y: re, distance: de } of H) {
      const fe = `${K},${re}`, Te = o()[fe];
      (Te == null ? void 0 : Te.data) || (Te == null ? void 0 : Te.loading) || Q.has(fe) || U.push({ x: K, y: re, priority: de });
    }
    console.log(`visibleTiles: ${U}`), U.sort((K, re) => K.priority - re.priority);
    const j = Math.max(0, we.MAX_TILES_TO_LOAD - k), te = U.slice(0, j);
    te.length > 0 && (V((K) => {
      const re = [...K], de = new Set(re.map((fe) => `${fe.x},${fe.y}`));
      for (const fe of te) {
        const Te = `${fe.x},${fe.y}`;
        de.has(Te) || (re.push({ x: fe.x, y: fe.y }), de.add(Te));
      }
      return re;
    }), X() || setTimeout(ae, 0));
  };
  onCleanup(() => {
    if (!b()) return;
    ne = true, z(false), A !== null && (clearTimeout(A), A = null);
    const t = Array.from(R);
    R.clear(), t.forEach((i) => {
      try {
        i.abort();
      } catch (_) {
        console.warn("Error aborting operation:", _);
      }
    }), batch(() => {
      V([]), r({});
    });
  });
  const ee = () => {
    if (!b()) throw new Error("Cannot create operation - component not mounted");
    const t = new AbortController();
    return R.add(t), { signal: t.signal, cleanup: () => {
      R.delete(t);
    } };
  }, ae = async () => {
    if (!(X() || !b())) {
      A && (clearTimeout(A), A = null);
      try {
        if (O(true), !b()) return;
        const t = v();
        if (t.length === 0) return;
        const i = s(), _ = i.width / 2, I = i.height / 2, w = [...t].sort((U, Q) => {
          const j = Math.sqrt(Math.pow(U.x - _, 2) + Math.pow(U.y - I, 2)), te = Math.sqrt(Math.pow(Q.x - _, 2) + Math.pow(Q.y - I, 2));
          return j - te;
        }), k = Math.min(we.BATCH_SIZE, w.length), M = w.slice(0, k), T = M.map(({ x: U, y: Q }) => u(U, Q).catch((j) => (b() && console.error(`[processTileQueue] Error loading tile (${U},${Q}):`, j), null)));
        if (await Promise.race([Promise.all(T), new Promise((U) => setTimeout(U, we.BATCH_TIMEOUT || 5e3))]), !b()) return;
        V((U) => {
          const Q = new Set(M.map((j) => `${j.x},${j.y}`));
          return U.filter((j) => !Q.has(`${j.x},${j.y}`));
        }), v().length > 0 && b() ? A = window.setTimeout(() => {
          b() && ae();
        }, we.BATCH_DELAY) : console.log("[processTileQueue] Queue processing complete");
      } catch (t) {
        b() && console.error("[processTileQueue] Error in queue processing:", t);
      } finally {
        b() && O(false);
      }
    }
  }, J = (t, i) => ({ tileX: Math.floor(t / oe), tileY: Math.floor(i / oe) }), d = (t, i) => `${t},${i}`, u = async (t, i, _ = false) => {
    var _a;
    const I = o();
    if (Object.keys(I).length >= we.MAX_TILES_IN_MEMORY) {
      const T = s(), H = Math.floor(T.x / 64), U = Math.floor(T.y / 64), Q = Object.entries(I).filter(([j, te]) => !te.loading).sort((j, te) => {
        const K = Math.abs(j[1].x - H) + Math.abs(j[1].y - U), re = Math.abs(te[1].x - H) + Math.abs(te[1].y - U);
        return -(K - re);
      });
      if (Q.length > 0) {
        const [j] = Q[0];
        r((te) => {
          const K = { ...te };
          return delete K[j], K;
        });
      }
    }
    if (!q) try {
      await D.init(), q = true;
    } catch (T) {
      console.error("[loadTile] Error initializing tile cache:", T);
    }
    const w = d(t, i);
    if (((_a = I[w]) == null ? void 0 : _a.loading) && !_ || !b()) return;
    if (!_) try {
      const T = await D.getTile(t, i);
      if (T) {
        const H = Date.now() - T.timestamp;
        r((Q) => ({ ...Q, [w]: { x: t, y: i, data: T.data, loading: false, error: false, timestamp: Date.now(), mountId: W, fromCache: true } }));
        const U = 20 * 1e3;
        H > U && u(t, i, true).catch(console.error);
        return;
      }
    } catch (T) {
      console.error(`[loadTile] Error reading from cache for tile (${t}, ${i}):`, T);
    }
    r((T) => {
      const H = T[w];
      return { ...T, [w]: { x: t, y: i, data: (H == null ? void 0 : H.data) || null, loading: true, error: false, timestamp: (H == null ? void 0 : H.timestamp) || 0, mountId: W } };
    });
    let M = null;
    try {
      const { signal: T, cleanup: H } = ee();
      M = H;
      const U = "undefined" < "u" ? sessionStorage.getItem("token") : null, Q = { Accept: "application/json" };
      U && (Q.Authorization = `Bearer ${U}`);
      const j = await fetch(`/api/map/tile/${t}/${i}`, { signal: T, headers: Q, credentials: "include" });
      if (!j.ok) throw new Error(`HTTP ${j.status}: ${j.statusText}`);
      const te = await j.json();
      if (!b()) {
        console.log(`[loadTile] Component unmounted during fetch for tile (${t}, ${i})`);
        return;
      }
      if (!te.success || !te.data) throw console.error(`[loadTile] Invalid response format for tile (${t}, ${i}):`, te), new Error("Invalid response format");
      const K = te.data;
      let re;
      if (typeof K.data == "string") try {
        const de = K.data.split(",").map(Number);
        if (de.some(isNaN)) throw new Error("Invalid number in tile data");
        re = new Uint8Array(de);
        try {
          await D.setTile(t, i, re);
        } catch (fe) {
          console.error(`[loadTile] Error caching tile (${t}, ${i}):`, fe);
        }
      } catch (de) {
        throw console.error("Error parsing tile data:", de), new Error("Failed to parse tile data");
      }
      else if (Array.isArray(K.data)) {
        re = new Uint8Array(K.data);
        try {
          await D.setTile(t, i, re);
        } catch (de) {
          console.error(`[loadTile] Error caching tile (${t}, ${i}):`, de);
        }
      } else throw new Error("Unexpected tile data format");
      b() && r((de) => ({ ...de, [w]: { x: t, y: i, data: re, loading: false, error: false, timestamp: Date.now(), mountId: W, fromCache: false } }));
    } catch (T) {
      if (T instanceof Error && T.name === "AbortError") return;
      b() && r((H) => ({ ...H, [w]: { ...H[w] || { x: t, y: i }, loading: false, error: true, timestamp: Date.now(), mountId: W } }));
    } finally {
      M && M();
    }
  };
  onCleanup(() => {
    document.body.style.cursor = "", V([]), A && (clearTimeout(A), A = null);
  }), createEffect(() => {
    s();
    const t = setTimeout(() => {
      _e();
    }, 50);
    return () => clearTimeout(t);
  });
  const f = (t, i) => {
    var _a;
    return `hsl(${(t * 13 + i * 7) % 360}, 70%, ${((_a = o()[`${t},${i}`]) == null ? void 0 : _a.data) ? "85%" : "90%"})`;
  }, S = (t) => {
    s();
    const i = (t.x + 16) * oe, _ = (t.y + 16) * oe, I = Math.round(i), w = Math.round(_), k = I, M = w;
    let T = ssr(Ue, ssrHydrationKey());
    if (t.error) T = ssr(je, ssrHydrationKey(), `${escape(L.fallbackTile, true)} ${escape(L.error, true)}`, ssrAttribute("class", escape(L.fallbackTileContent, true), false), ssrAttribute("class", escape(L.tileCoords, true), false), escape(t.x), escape(t.y));
    else if (t.loading && (!t.data || t.data.length === 0)) T = ssr(or, ssrHydrationKey(), `${escape(L.fallbackTile, true)} loading`, ssrStyle(`--tile-bg-color: ${f(t.x, t.y)}`), ssrAttribute("class", escape(L.fallbackTileContent, true), false), ssrAttribute("class", escape(L.loadingSpinner, true), false), ssrAttribute("class", escape(L.tileCoords, true), false), escape(t.x), escape(t.y));
    else if (!t.data || t.data.length === 0) T = ssr(Ve, ssrHydrationKey() + ssrAttribute("class", escape(L.fallbackTile, true), false), ssrStyle(`--tile-bg-color: ${f(t.x, t.y)}`), ssrAttribute("class", escape(L.fallbackTileContent, true), false), ssrAttribute("class", escape(L.tileCoords, true), false), escape(t.x), escape(t.y));
    else try {
      const H = Z(t.data);
      H.length > 0 ? T = ssr(rr, ssrHydrationKey() + ssrAttribute("class", escape(L.tileContent, true), false), ssrAttribute("width", escape(oe, true), false) + ssrAttribute("height", escape(oe, true), false), `0 0 ${escape(oe, true)} ${escape(oe, true)}`, ssrAttribute("class", escape(L.tileSvg, true), false), escape(H.map(({ x: U, y: Q }, j) => {
        const te = { cx: U + 0.5, cy: Q + 0.5, r: 2, fill: "black" };
        return ssrElement("circle", mergeProps(te, { key: j }), void 0, true);
      })), ssrAttribute("class", escape(L.tileLabel, true), false), escape(t.x), escape(t.y), t.loading && ssr(Ue, ssrHydrationKey() + ssrAttribute("class", escape(L.loadingIndicator, true), false))) : T = ssr(Ve, ssrHydrationKey() + ssrAttribute("class", escape(L.fallbackTile, true), false), ssrStyle(`--tile-bg-color: ${f(t.x, t.y)}`), ssrAttribute("class", escape(L.fallbackTileContent, true), false), ssrAttribute("class", escape(L.tileCoords, true), false), escape(t.x), escape(t.y));
    } catch (H) {
      console.error("Error rendering tile:", H), T = ssr(je, ssrHydrationKey(), `${escape(L.fallbackTile, true)} ${escape(L.error, true)}`, ssrAttribute("class", escape(L.fallbackTileContent, true), false), ssrAttribute("class", escape(L.tileCoords, true), false), escape(t.x), escape(t.y));
    }
    return ssr(sr, ssrHydrationKey(), `${escape(L.tileContainer, true)} ${escape(L.tile, true)}`, ssrStyleProperty("--tile-pos-x:", `${escape(k, true)}px`) + ssrStyleProperty(";--tile-pos-y:", `${escape(M, true)}px`) + ssrStyleProperty(";--tile-size:", `${escape(oe, true)}px`) + ssrStyleProperty(";--tile-base-size:", `${escape(oe, true)}px`), ssrAttribute("data-tile-x", escape(t.x, true), false) + ssrAttribute("data-tile-y", escape(t.y, true), false) + ssrAttribute("data-world-x", escape(i, true), false) + ssrAttribute("data-world-y", escape(_, true), false) + ssrAttribute("data-pos-x", escape(k, true), false) + ssrAttribute("data-pos-y", escape(M, true), false), escape(T));
  }, Y = (t) => {
    const i = [];
    let _ = 0;
    for (let I = 0; I < t.length && _ < oe * oe; I++) {
      const w = t[I];
      for (let k = 7; k >= 0 && _ < oe * oe; k--, _++) if (w >> k & 1) {
        const M = _ % oe, T = Math.floor(_ / oe);
        i.push({ x: M, y: T });
      }
    }
    return i;
  }, Z = (t) => {
    if (typeof document > "u") return [];
    if (!(t instanceof Uint8Array) || t.length === 0) return console.log("Invalid or empty tile data"), [];
    if (t[0] !== 1) return console.log("Unsupported data format or missing version byte"), [];
    try {
      const i = t.subarray(1), _ = inflate(i), I = Math.ceil(oe * oe / 8);
      return _.length !== I && console.warn(`Unexpected decompressed size: ${_.length}, expected ${I}`), Y(_);
    } catch (i) {
      return console.error("Failed to process tile data:", i), [];
    }
  }, he = () => {
    const _ = [];
    for (let I = -16; I <= 16; I++) for (let w = -16; w <= 16; w++) {
      const k = `${w},${I}`, T = o()[k] || { x: w, y: I, loading: false, error: false, data: null, mountId: W, timestamp: Date.now(), fromCache: false };
      _.push(S(T));
    }
    return _;
  };
  return ssr(nr, ssrHydrationKey() + ssrAttribute("class", escape(L.mapContainer, true), false), ssrAttribute("class", l() ? escape(L.mapViewportDragging, true) : escape(L.mapViewport, true), false), ssrAttribute("class", escape(L.mapContent, true), false), ssrStyleProperty("--translate-x:", "0px") + ssrStyleProperty(";--translate-y:", "0px") + ssrStyleProperty(";transform:", `translate(${-s().x - 1024}px, ${-s().y - 1024}px)`), ssrStyleProperty("position:", "absolute") + ssrStyleProperty(";top:", 0) + ssrStyleProperty(";left:", 0) + ssrStyleProperty(";width:", "100%") + ssrStyleProperty(";height:", "100%") + ssrStyleProperty(";z-index:", 2), escape(he()), B() && ssr(ar, ssrHydrationKey() + ssrAttribute("class", escape(L.loadingOverlay, true), false)), ssrAttribute("class", escape(L.controls, true), false), ssrAttribute("class", escape(L.coordinates, true), false), escape(Math.round(s().x)), escape(Math.round(s().y)), escape(Object.keys(o()).length));
}, cr = "_container_5fa2b_3", lr = "_gameContainer_5fa2b_11", dr = "_gameBoard_5fa2b_60", ur = "_loadingContainer_5fa2b_67", fr = "_loginContainer_5fa2b_68", $e = { container: cr, gameContainer: lr, gameBoard: dr, loadingContainer: ur, loginContainer: fr };
var gr = ["<div", "><!--$-->", "<!--/--><div", "><!--$-->", "<!--/--><!--$-->", "<!--/--></div></div>"], mr = ["<div", "><!--$-->", "<!--/--><!--$-->", "<!--/--></div>"], hr = ["<div", "><h1>Loading Game...</h1><div>Initializing authentication...</div></div>"], pr = ["<div", "><h1>Not Logged In</h1><p>Please log in to access the game.</p></div>"];
function Ir() {
  const { user: o, isInitialized: r, logout: n } = I(), [s, a] = createSignal("info");
  return ssr(mr, ssrHydrationKey() + ssrAttribute("class", escape($e.container, true), false), escape(createComponent(k, { children: "Game" })), escape(createComponent(Show, { get when() {
    return r();
  }, get fallback() {
    return ssr(hr, ssrHydrationKey() + ssrAttribute("class", escape($e.loadingContainer, true), false));
  }, get children() {
    return createComponent(Show, { get when() {
      return o();
    }, get fallback() {
      return ssr(pr, ssrHydrationKey() + ssrAttribute("class", escape($e.loginContainer, true), false));
    }, get children() {
      return createComponent(st, { get children() {
        return ssr(gr, ssrHydrationKey() + ssrAttribute("class", escape($e.gameContainer, true), false), escape(createComponent(Po, { get activeTab() {
          return s();
        }, onTabChange: (l) => a(l), get username() {
          return o().username;
        }, get userId() {
          return o().id;
        }, onLogout: n })), ssrAttribute("class", escape($e.gameBoard, true), false), escape(createComponent(Show, { get when() {
          return s() === "info";
        }, get children() {
          return createComponent(Nt, {});
        } })), escape(createComponent(Show, { get when() {
          return s() === "settings";
        }, get children() {
          return createComponent(ir, {});
        } })));
      } });
    } });
  } })));
}

export { Ir as default };
//# sourceMappingURL=index22.mjs.map
