import { EventEmitter } from 'events';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const _d = class _d {
  constructor() {
    __publicField(this, "eventEmitter");
    __publicField(this, "clients", /* @__PURE__ */ new Map());
    this.eventEmitter = new EventEmitter(), this.eventEmitter.setMaxListeners(50);
  }
  static getInstance() {
    return _d.instance || (_d.instance = new _d()), _d.instance;
  }
  on(e, t) {
    this.eventEmitter.on(e, t);
  }
  off(e, t) {
    this.eventEmitter.off(e, t);
  }
  getClientId(e) {
    if (e.__clientId) return e.__clientId;
    const t = `${e.userId}@${e.ip || "unknown"}-${Date.now()}`;
    return e.__clientId = t, t;
  }
  registerClient(e) {
    const t = this.getClientId(e), n = () => {
      this.clients.delete(t);
    };
    return this.clients.set(t, { client: e, cleanup: n }), { id: t, cleanup: n };
  }
  unregisterClient(e) {
    let t = 0;
    if (e.__clientId) {
      const r = e.__clientId, s = this.clients.get(r);
      s && (s.cleanup(), t++);
    }
    const n = `${e.userId}@${e.ip || "unknown"}`, i = Array.from(this.clients.entries()).filter(([r]) => r.startsWith(n));
    for (const [r, s] of i) s.cleanup(), t++;
    return t;
  }
  broadcast(e, t) {
    const n = `event: ${e}
data: ${JSON.stringify(t)}

`, i = Array.from(this.clients.entries());
    for (const [r, { client: s }] of i) if (this.clients.has(r)) try {
      s.send(n);
    } catch (c) {
      console.error(`[EventService] Error sending to client ${s.userId}:`, c);
    }
  }
  emitCreated(e) {
    this.eventEmitter.emit("created", e), this.broadcast("created", { type: "basePointChanged", event: "created", point: { id: e.id, x: e.x, y: e.y, userId: e.userId, timestamp: e.createdAtMs || Date.now() } });
  }
  emitUpdated(e) {
    this.eventEmitter.emit("updated", e), this.broadcast("updated", { type: "basePointChanged", event: "updated", point: { id: e.id, x: e.x, y: e.y, userId: e.userId, timestamp: e.createdAtMs || Date.now() } });
  }
  emitDeleted(e) {
    this.eventEmitter.emit("deleted", e);
    const t = e.count || 1;
    this.broadcast("basePointDeleted", { type: "basePointDeleted", event: "basePointDeleted", point: { id: e.id, x: e.x, y: e.y, userId: e.userId, timestamp: Date.now() }, count: t });
  }
  getListeners(e) {
    return this.eventEmitter.listeners(e);
  }
  getClients() {
    return Array.from(this.clients.entries()).map(([e, t]) => ({ ...t.client, clientId: e }));
  }
  getConnectionStats() {
    const e = this.getClients();
    return { total: e.length, byUser: e.reduce((n, i) => (n[i.userId] = (n[i.userId] || 0) + 1, n), {}), connections: e.map((n) => ({ userId: n.userId, ip: n.ip, clientId: n.__clientId || "none", connectedAt: n.connectedAt })) };
  }
};
__publicField(_d, "instance");
let d = _d;
const l = d.getInstance();

export { d as BasePointEventService, l as basePointEventService };
//# sourceMappingURL=base-point-events-C2UNy6C4.mjs.map
