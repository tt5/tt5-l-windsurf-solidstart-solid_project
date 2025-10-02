var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const _s = class _s {
  constructor() {
    __publicField(this, "metrics", []);
    __publicField(this, "MAX_METRICS", 1e3);
  }
  static getInstance() {
    return _s.instance || (_s.instance = new _s()), _s.instance;
  }
  track(t, e, i = {}) {
    this.metrics.push({ timestamp: Date.now(), operation: t, duration: e, data: i }), this.metrics.length > this.MAX_METRICS && (this.metrics = this.metrics.slice(-this.MAX_METRICS));
  }
  getMetrics(t) {
    return t ? this.metrics.filter((e) => e.operation === t) : [...this.metrics];
  }
  getAverageDuration(t, e = 100) {
    const i = this.getMetrics(t).slice(-e);
    return i.length === 0 ? 0 : i.reduce((n, r) => n + r.duration, 0) / i.length;
  }
  shouldOptimize(t, e) {
    return this.getAverageDuration(t) > e;
  }
};
__publicField(_s, "instance");
let s = _s;
const a = s.getInstance();

export { a };
//# sourceMappingURL=performance-CpMIxBac.mjs.map
