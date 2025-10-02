function c(t, { status: n = 200, headers: r = {}, requestId: e, duration: s } = {}) {
  const a = { success: n >= 200 && n < 300, data: t, timestamp: Date.now() };
  e && (a.requestId = e);
  const o = { "Content-Type": "application/json", ...r };
  return e && (o["X-Request-ID"] = e), s !== void 0 && (o["X-Process-Time"] = `${s}ms`), new Response(JSON.stringify(a), { status: n, headers: o });
}
function i(t, n = 500, r, e = {}) {
  const s = { success: false, error: t, timestamp: Date.now() };
  return r && (s.data = r), e.requestId && (s.requestId = e.requestId), c(s, { ...e, status: n });
}
function p() {
  return Math.random().toString(36).substring(2, 9);
}

export { c, i, p };
//# sourceMappingURL=api-D3monypt2.mjs.map
