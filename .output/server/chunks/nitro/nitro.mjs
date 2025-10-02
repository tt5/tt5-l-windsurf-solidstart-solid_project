import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http, { Server as Server$1 } from 'node:http';
import https, { Server } from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve as resolve$1, dirname as dirname$1, join } from 'node:path';
import { createHash } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import invariant from 'vinxi/lib/invariant';
import { virtualId, handlerModule, join as join$1 } from 'vinxi/lib/path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { fromJSON, crossSerializeStream, getCrossReferenceHeader } from 'seroval';
import { CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin } from 'seroval-plugins/web';
import { sharedConfig, lazy, createComponent, createUniqueId, useContext, createContext as createContext$1, createRenderEffect, onCleanup, createSignal, createEffect, onMount, createMemo, on, runWithOwner, getOwner, startTransition, resetErrorBoundaries, batch, untrack, catchError, ErrorBoundary, Suspense, children, Show, createRoot } from 'solid-js';
import { renderToString, getRequestEvent, isServer, ssrElement, escape, mergeProps, ssr, createComponent as createComponent$1, useAssets, spread, renderToStream, ssrHydrationKey, NoHydration, Hydration, ssrAttribute, HydrationScript, delegateEvents } from 'solid-js/web';
import { provideRequestEvent } from 'solid-js/web/storage';
import c$4 from 'sqlite3';
import { open } from 'sqlite';
import { promises as promises$1 } from 'fs';
import { dirname as dirname$2, join as join$2 } from 'path';
import { inflate, deflate } from 'pako';
import { performance as performance$1 } from 'perf_hooks';
import { EventEmitter as EventEmitter$1 } from 'events';
import { randomInt } from 'crypto';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode$1(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode$1(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    return input;
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o$2(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o$2("Readable.asyncIterator")}iterator(e){throw o$2("Readable.iterator")}map(e,t){throw o$2("Readable.map")}filter(e,t){throw o$2("Readable.filter")}forEach(e,t){throw o$2("Readable.forEach")}reduce(e,t,r){throw o$2("Readable.reduce")}find(e,t){throw o$2("Readable.find")}findIndex(e,t){throw o$2("Readable.findIndex")}some(e,t){throw o$2("Readable.some")}toArray(e){throw o$2("Readable.toArray")}every(e,t){throw o$2("Readable.every")}flatMap(e,t){throw o$2("Readable.flatMap")}drop(e,t){throw o$2("Readable.drop")}take(e,t){throw o$2("Readable.take")}asIndexedPairs(e){throw o$2("Readable.asIndexedPairs")}};let l$4 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c$3=class c{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$4){Object.assign(this,e),Object.assign(this,t),this._destroy=m$1(e._destroy,t._destroy);}};function _$1(){return Object.assign(c$3.prototype,i$1.prototype),Object.assign(c$3.prototype,l$4.prototype),c$3}function m$1(...n){return function(...e){for(const t of n)t(...e);}}const g$1=_$1();let A$2 = class A extends g$1{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}};let y$2 = class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A$2;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p$4(this.headers)}get trailersDistinct(){return p$4(this.trailers)}};function p$4(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}let w$3 = class w extends l$4{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}};const E$4=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R$2(n={}){const e=new E$4,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v$2(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S$2=new Set([101,204,205,304]);async function b$3(n,e){const t=new y$2,r=new w$3(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R$2(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S$2.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C$2(n,e,t={}){try{const r=await b$3(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v$2(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp$1(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

let H3Error$1 = class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode$1(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage$1(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
};
function createError$2(input) {
  if (typeof input === "string") {
    return new H3Error$1(input);
  }
  if (isError$1(input)) {
    return input;
  }
  const err = new H3Error$1(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp$1(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode$1(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode$1(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage$1(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError$1(error) ? error : createError$2(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus$1(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES$1.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError$1(input) {
  return input?.constructor?.__h3_error__ === true;
}
function isMethod$1(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod$1(event, expected, allowHead) {
  if (!isMethod$1(event, expected)) {
    throw createError$2({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders$1(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader$1(event, name) {
  const headers = getRequestHeaders$1(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost$1(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol$1(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL$1(event, opts = {}) {
  const host = getRequestHost$1(event, opts);
  const protocol = getRequestProtocol$1(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol$1 = Symbol.for("h3RawBody");
const PayloadMethods$1$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody$1(event, encoding = "utf8") {
  assertMethod$1(event, PayloadMethods$1$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol$1] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !String(event.node.req.headers["transfer-encoding"] ?? "").split(",").map((e) => e.trim()).filter(Boolean).includes("chunked")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol$1] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream$1(event) {
  if (!PayloadMethods$1$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol$1 in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody$1(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES$1 = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS$1 = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage$1(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS$1, "");
}
function sanitizeStatusCode$1(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString$1(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString$1(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer$1 = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send$1(event, data, type) {
  if (type) {
    defaultContentType$1(event, type);
  }
  return new Promise((resolve) => {
    defer$1(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode$1(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus$1(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode$1(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage$1(text);
  }
}
function defaultContentType$1(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect$1(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode$1(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send$1(event, html, MIMES$1.html);
}
function getResponseHeader$1(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader$1(event, name, value) {
  event.node.res.setHeader(name, value);
}
function appendResponseHeader$1(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader$1(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream$1(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp$1(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp$1(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse$1(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString$1(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode$1(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage$1(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream$1(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream$1(event);
      duplex = "half";
    } else {
      body = await readRawBody$1(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$2({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode$1(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage$1(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString$1(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders$1(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

let H3Event$1 = class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders$1(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse$1(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
};
function isEvent(input) {
  return hasProp$1(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event$1(req, res);
}
function _normalizeNodeHeaders$1(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler$1(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray$1(handler.onRequest),
    onBeforeResponse: _normalizeArray$1(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler$1(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray$1(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler$1(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler$1 = defineEventHandler$1;
function isEventHandler(input) {
  return hasProp$1(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler$1((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler$1(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$2({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse$1(event, val);
    }
    if (isStream(val)) {
      return sendStream$1(event, val);
    }
    if (val.buffer) {
      return send$1(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send$1(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$2(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send$1(event, val, MIMES$1.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send$1(event, JSON.stringify(val, void 0, jsonSpace), MIMES$1.json);
  }
  if (valType === "bigint") {
    return send$1(event, val.toString(), MIMES$1.json);
  }
  throw createError$2({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$2({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$2({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler$1((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$2(_error);
      if (!isError$1(_error)) {
        error.unhandled = true;
      }
      setResponseStatus$1(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s$2=globalThis.Headers,i=globalThis.AbortController,l$3=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        context.options.body = typeof context.options.body === "string" ? context.options.body : JSON.stringify(context.options.body);
        context.options.headers = new Headers(context.options.headers || {});
        if (!context.options.headers.has("content-type")) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l$3;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l$3(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch$1 = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$2;
const AbortController = globalThis.AbortController || i;
createFetch({ fetch: fetch$1, Headers: Headers$1, AbortController });

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError$1(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError$1);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError$1(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError$1(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError$1(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const e$1=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r$1="sha256",s$1="base64url";function digest(t){if(e$1)return e$1(r$1,t,s$1);const o=createHash(r$1).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s$1):o.digest(s$1)}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize$1(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize$1(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler$1(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString$1(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {};



const appConfig$1 = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/"
  },
  "nitro": {
    "routeRules": {
      "/_build/assets/**": {
        "headers": {
          "cache-control": "public, immutable, max-age=31536000"
        }
      }
    }
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  {
    return _sharedRuntimeConfig;
  }
}
_deepFreeze(klona(appConfig$1));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());

const nitroAsyncContext = getContext("nitro-app", {
  asyncContext: true,
  AsyncLocalStorage: AsyncLocalStorage 
});

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler$1((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect$1(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString$1(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$0 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus$1(event, res.status, res.statusText);
    return send$1(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL$1(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus$1(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader$1(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const appConfig = {"name":"vinxi","routers":[{"name":"public","type":"static","base":"/","dir":"./public","root":"/home/n/data/l/windsurf/solidstart/solid-project","order":0,"outDir":"/home/n/data/l/windsurf/solidstart/solid-project/.vinxi/build/public"},{"name":"ssr","type":"http","link":{"client":"client"},"handler":"src/entry-server.tsx","extensions":["js","jsx","ts","tsx"],"target":"server","root":"/home/n/data/l/windsurf/solidstart/solid-project","base":"/","outDir":"/home/n/data/l/windsurf/solidstart/solid-project/.vinxi/build/ssr","order":1},{"name":"client","type":"client","base":"/_build","handler":"src/entry-client.tsx","extensions":["js","jsx","ts","tsx"],"target":"browser","root":"/home/n/data/l/windsurf/solidstart/solid-project","outDir":"/home/n/data/l/windsurf/solidstart/solid-project/.vinxi/build/client","order":2},{"name":"server-fns","type":"http","base":"/_server","handler":"node_modules/@solidjs/start/dist/runtime/server-handler.js","target":"server","root":"/home/n/data/l/windsurf/solidstart/solid-project","outDir":"/home/n/data/l/windsurf/solidstart/solid-project/.vinxi/build/server-fns","order":3}],"server":{"compressPublicAssets":{"brotli":true},"routeRules":{"/_build/assets/**":{"headers":{"cache-control":"public, immutable, max-age=31536000"}}},"experimental":{"asyncContext":true}},"root":"/home/n/data/l/windsurf/solidstart/solid-project"};
					const buildManifest = {"ssr":{"_AuthContext-D3kPq5an.js":{"file":"assets/AuthContext-D3kPq5an.js","name":"AuthContext"},"_Login-BUJWZuiV.css":{"file":"assets/Login-BUJWZuiV.css","src":"_Login-BUJWZuiV.css"},"_Login.module-Ci4nll34.js":{"file":"assets/Login.module-Ci4nll34.js","name":"Login.module","css":["assets/Login-BUJWZuiV.css"]},"_UserContext-DYj2Vavi.js":{"file":"assets/UserContext-DYj2Vavi.js","name":"UserContext"},"_api-D3monypt.js":{"file":"assets/api-D3monypt.js","name":"api"},"_auth-BVUYsDc6.js":{"file":"assets/auth-BVUYsDc6.js","name":"auth","imports":["_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"_components-D3RSgNPK.js":{"file":"assets/components-D3RSgNPK.js","name":"components","imports":["_routing-CWq3BRWv.js"]},"_db-PRkUVS-C.js":{"file":"assets/db-PRkUVS-C.js","name":"db","isDynamicEntry":true,"imports":["_utils-AQpNWTN2.js"],"dynamicImports":["src/lib/server/events/base-point-events.ts","src/lib/server/events/base-point-events.ts"]},"_game-eWeYT9Is.js":{"file":"assets/game-eWeYT9Is.js","name":"game"},"_game.service-rW1J-678.js":{"file":"assets/game.service-rW1J-678.js","name":"game.service","imports":["_db-PRkUVS-C.js","src/utils/randomSlopes.ts"]},"_index-BdnVf8ln.js":{"file":"assets/index-BdnVf8ln.js","name":"index"},"_jwt-CO0ye28h.js":{"file":"assets/jwt-CO0ye28h.js","name":"jwt"},"_performance-CpMIxBac.js":{"file":"assets/performance-CpMIxBac.js","name":"performance"},"_routing-CWq3BRWv.js":{"file":"assets/routing-CWq3BRWv.js","name":"routing"},"_tile-cache.service-CfnteglI.js":{"file":"assets/tile-cache.service-CfnteglI.js","name":"tile-cache.service","imports":["_db-PRkUVS-C.js"]},"_utils-AQpNWTN2.js":{"file":"assets/utils-AQpNWTN2.js","name":"utils"},"src/lib/server/events/base-point-events.ts":{"file":"assets/base-point-events-C2UNy6C4.js","name":"base-point-events","src":"src/lib/server/events/base-point-events.ts","isDynamicEntry":true},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"_...404_.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js"]},"src/routes/api/admin/performance.ts?pick=GET":{"file":"performance.js","name":"performance","src":"src/routes/api/admin/performance.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_performance-CpMIxBac.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/auth/index.ts?pick=POST":{"file":"index.js","name":"index","src":"src/routes/api/auth/index.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/auth/login.ts?pick=POST":{"file":"login.js","name":"login","src":"src/routes/api/auth/login.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_jwt-CO0ye28h.js","_utils-AQpNWTN2.js"]},"src/routes/api/auth/logout.ts?pick=POST":{"file":"logout.js","name":"logout","src":"src/routes/api/auth/logout.ts?pick=POST","isEntry":true,"isDynamicEntry":true},"src/routes/api/auth/register.ts?pick=POST":{"file":"register.js","name":"register","src":"src/routes/api/auth/register.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_utils-AQpNWTN2.js"]},"src/routes/api/auth/verify.ts?pick=GET":{"file":"verify.js","name":"verify","src":"src/routes/api/auth/verify.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_jwt-CO0ye28h.js","_utils-AQpNWTN2.js"]},"src/routes/api/base-points.ts?pick=DELETE":{"file":"base-points.js","name":"base-points","src":"src/routes/api/base-points.ts?pick=DELETE","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_auth-BVUYsDc6.js","_api-D3monypt.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/base-points.ts?pick=GET":{"file":"base-points2.js","name":"base-points","src":"src/routes/api/base-points.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/base-points.ts?pick=POST":{"file":"base-points3.js","name":"base-points","src":"src/routes/api/base-points.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_auth-BVUYsDc6.js","_api-D3monypt.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/base-points/count.ts?pick=GET":{"file":"count.js","name":"count","src":"src/routes/api/base-points/count.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_auth-BVUYsDc6.js","_api-D3monypt.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/calculate-squares.ts?pick=POST":{"file":"calculate-squares.js","name":"calculate-squares","src":"src/routes/api/calculate-squares.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_game-eWeYT9Is.js","_performance-CpMIxBac.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/events.ts?pick=GET":{"file":"events.js","name":"events","src":"src/routes/api/events.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_auth-BVUYsDc6.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/game/join.ts?pick=POST":{"file":"join.js","name":"join","src":"src/routes/api/game/join.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_game.service-rW1J-678.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","src/utils/randomSlopes.ts","_jwt-CO0ye28h.js"]},"src/routes/api/game/leave.ts?pick=POST":{"file":"leave.js","name":"leave","src":"src/routes/api/game/leave.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_game.service-rW1J-678.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","src/utils/randomSlopes.ts","_jwt-CO0ye28h.js"]},"src/routes/api/game/status.ts?pick=GET":{"file":"status.js","name":"status","src":"src/routes/api/game/status.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_game.service-rW1J-678.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","src/utils/randomSlopes.ts","_jwt-CO0ye28h.js"]},"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET":{"file":"_tileY_.js","name":"_tileY_","src":"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_tile-cache.service-CfnteglI.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS":{"file":"_tileY_2.js","name":"_tileY_","src":"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS","isEntry":true,"isDynamicEntry":true},"src/routes/api/reset-game-progress.ts?pick=POST":{"file":"reset-game-progress.js","name":"reset-game-progress","src":"src/routes/api/reset-game-progress.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-PRkUVS-C.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/game/index.tsx?pick=default&pick=$css":{"file":"index2.js","name":"index","src":"src/routes/game/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_AuthContext-D3kPq5an.js","_game-eWeYT9Is.js","_UserContext-DYj2Vavi.js","_routing-CWq3BRWv.js"],"css":["assets/index-D5DiZI5g.css"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index3.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_components-D3RSgNPK.js","_routing-CWq3BRWv.js"],"css":["assets/index-BV-KZHQ3.css"]},"src/routes/login.tsx?pick=default&pick=$css":{"file":"login2.js","name":"login","src":"src/routes/login.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_AuthContext-D3kPq5an.js","_Login.module-Ci4nll34.js","_routing-CWq3BRWv.js","_components-D3RSgNPK.js"]},"src/routes/register.tsx?pick=default&pick=$css":{"file":"register2.js","name":"register","src":"src/routes/register.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_Login.module-Ci4nll34.js","_routing-CWq3BRWv.js","_components-D3RSgNPK.js"]},"src/utils/randomSlopes.ts":{"file":"assets/randomSlopes-izTC2X1N.js","name":"randomSlopes","src":"src/utils/randomSlopes.ts","isDynamicEntry":true},"virtual:$vinxi/handler/ssr":{"file":"ssr.js","name":"ssr","src":"virtual:$vinxi/handler/ssr","isEntry":true,"imports":["_index-BdnVf8ln.js","_AuthContext-D3kPq5an.js","_UserContext-DYj2Vavi.js","_routing-CWq3BRWv.js","_db-PRkUVS-C.js","src/utils/randomSlopes.ts","_tile-cache.service-CfnteglI.js","src/lib/server/events/base-point-events.ts","_game-eWeYT9Is.js","_utils-AQpNWTN2.js"],"dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/[...404].tsx?pick=default&pick=$css","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/auth/index.ts?pick=POST","src/routes/api/auth/index.ts?pick=POST","src/routes/api/auth/login.ts?pick=POST","src/routes/api/auth/login.ts?pick=POST","src/routes/api/auth/logout.ts?pick=POST","src/routes/api/auth/logout.ts?pick=POST","src/routes/api/auth/register.ts?pick=POST","src/routes/api/auth/register.ts?pick=POST","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points.ts?pick=DELETE","src/routes/api/base-points.ts?pick=DELETE","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=POST","src/routes/api/base-points.ts?pick=POST","src/routes/api/calculate-squares.ts?pick=POST","src/routes/api/calculate-squares.ts?pick=POST","src/routes/api/events.ts?pick=GET","src/routes/api/events.ts?pick=GET","src/routes/api/events.ts?pick=GET","src/routes/api/events.ts?pick=GET","src/routes/api/game/join.ts?pick=POST","src/routes/api/game/join.ts?pick=POST","src/routes/api/game/leave.ts?pick=POST","src/routes/api/game/leave.ts?pick=POST","src/routes/api/game/status.ts?pick=GET","src/routes/api/game/status.ts?pick=GET","src/routes/api/game/status.ts?pick=GET","src/routes/api/game/status.ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS","src/routes/api/reset-game-progress.ts?pick=POST","src/routes/api/reset-game-progress.ts?pick=POST","src/routes/game/index.tsx?pick=default&pick=$css","src/routes/game/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/login.tsx?pick=default&pick=$css","src/routes/login.tsx?pick=default&pick=$css","src/routes/register.tsx?pick=default&pick=$css","src/routes/register.tsx?pick=default&pick=$css","_db-PRkUVS-C.js","_db-PRkUVS-C.js","src/utils/randomSlopes.ts","src/lib/server/events/base-point-events.ts","src/utils/randomSlopes.ts","src/lib/server/events/base-point-events.ts"]}},"client":{"_AuthContext-CwAE7fDx.js":{"file":"assets/AuthContext-CwAE7fDx.js","name":"AuthContext","imports":["_index-BtiM2clC.js"]},"_Login-BUJWZuiV.css":{"file":"assets/Login-BUJWZuiV.css","src":"_Login-BUJWZuiV.css"},"_Login.module-Ci4nll34.js":{"file":"assets/Login.module-Ci4nll34.js","name":"Login.module","css":["assets/Login-BUJWZuiV.css"]},"_UserContext-C63u1NZh.js":{"file":"assets/UserContext-C63u1NZh.js","name":"UserContext","imports":["_index-BtiM2clC.js"]},"_components-DShUfCzN.js":{"file":"assets/components-DShUfCzN.js","name":"components","imports":["_index-BtiM2clC.js","_routing-DQha3BAi.js"]},"_index-BtiM2clC.js":{"file":"assets/index-BtiM2clC.js","name":"index"},"_routing-DQha3BAi.js":{"file":"assets/routing-DQha3BAi.js","name":"routing","imports":["_index-BtiM2clC.js"]},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"assets/_...404_-CBu9U2Z7.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BtiM2clC.js"]},"src/routes/game/index.tsx?pick=default&pick=$css":{"file":"assets/index-D83bvv4o.js","name":"index","src":"src/routes/game/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BtiM2clC.js","_AuthContext-CwAE7fDx.js","_UserContext-C63u1NZh.js","_routing-DQha3BAi.js"],"css":["assets/index-D5DiZI5g.css"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"assets/index-CrzCVw3d.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BtiM2clC.js","_components-DShUfCzN.js","_routing-DQha3BAi.js"],"css":["assets/index-BV-KZHQ3.css"]},"src/routes/login.tsx?pick=default&pick=$css":{"file":"assets/login-Br8uk7LU.js","name":"login","src":"src/routes/login.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BtiM2clC.js","_AuthContext-CwAE7fDx.js","_Login.module-Ci4nll34.js","_routing-DQha3BAi.js","_components-DShUfCzN.js"]},"src/routes/register.tsx?pick=default&pick=$css":{"file":"assets/register-Dt9tAu_a.js","name":"register","src":"src/routes/register.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BtiM2clC.js","_Login.module-Ci4nll34.js","_routing-DQha3BAi.js","_components-DShUfCzN.js"]},"virtual:$vinxi/handler/client":{"file":"assets/client-BpVt01AN.js","name":"client","src":"virtual:$vinxi/handler/client","isEntry":true,"imports":["_index-BtiM2clC.js","_AuthContext-CwAE7fDx.js","_UserContext-C63u1NZh.js","_routing-DQha3BAi.js"],"dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/game/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/login.tsx?pick=default&pick=$css","src/routes/register.tsx?pick=default&pick=$css"]}},"server-fns":{"_AuthContext-D3kPq5an.js":{"file":"assets/AuthContext-D3kPq5an.js","name":"AuthContext"},"_Login-BUJWZuiV.css":{"file":"assets/Login-BUJWZuiV.css","src":"_Login-BUJWZuiV.css"},"_Login.module-Ci4nll34.js":{"file":"assets/Login.module-Ci4nll34.js","name":"Login.module","css":["assets/Login-BUJWZuiV.css"]},"_UserContext-DYj2Vavi.js":{"file":"assets/UserContext-DYj2Vavi.js","name":"UserContext"},"_api-D3monypt.js":{"file":"assets/api-D3monypt.js","name":"api"},"_auth-BVUYsDc6.js":{"file":"assets/auth-BVUYsDc6.js","name":"auth","imports":["_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"_components-B3DHEvEg.js":{"file":"assets/components-B3DHEvEg.js","name":"components","imports":["_routing-CD52x9Vs.js"]},"_db-97-DOlOW.js":{"file":"assets/db-97-DOlOW.js","name":"db","imports":["_utils-AQpNWTN2.js"],"dynamicImports":["src/lib/server/events/base-point-events.ts","src/lib/server/events/base-point-events.ts"]},"_game-eWeYT9Is.js":{"file":"assets/game-eWeYT9Is.js","name":"game"},"_game.service-Bf9Z8hov.js":{"file":"assets/game.service-Bf9Z8hov.js","name":"game.service","imports":["_db-97-DOlOW.js"]},"_index-BdnVf8ln.js":{"file":"assets/index-BdnVf8ln.js","name":"index"},"_jwt-CO0ye28h.js":{"file":"assets/jwt-CO0ye28h.js","name":"jwt"},"_performance-CpMIxBac.js":{"file":"assets/performance-CpMIxBac.js","name":"performance"},"_routing-CD52x9Vs.js":{"file":"assets/routing-CD52x9Vs.js","name":"routing"},"_server-fns-CUjvqORG.js":{"file":"assets/server-fns-CUjvqORG.js","name":"server-fns","dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/[...404].tsx?pick=default&pick=$css","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/admin/performance.ts?pick=GET","src/routes/api/auth/index.ts?pick=POST","src/routes/api/auth/index.ts?pick=POST","src/routes/api/auth/login.ts?pick=POST","src/routes/api/auth/login.ts?pick=POST","src/routes/api/auth/logout.ts?pick=POST","src/routes/api/auth/logout.ts?pick=POST","src/routes/api/auth/register.ts?pick=POST","src/routes/api/auth/register.ts?pick=POST","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/auth/verify.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points/count.ts?pick=GET","src/routes/api/base-points.ts?pick=DELETE","src/routes/api/base-points.ts?pick=DELETE","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=GET","src/routes/api/base-points.ts?pick=POST","src/routes/api/base-points.ts?pick=POST","src/routes/api/calculate-squares.ts?pick=POST","src/routes/api/calculate-squares.ts?pick=POST","src/routes/api/events.ts?pick=GET","src/routes/api/events.ts?pick=GET","src/routes/api/events.ts?pick=GET","src/routes/api/events.ts?pick=GET","src/routes/api/game/join.ts?pick=POST","src/routes/api/game/join.ts?pick=POST","src/routes/api/game/leave.ts?pick=POST","src/routes/api/game/leave.ts?pick=POST","src/routes/api/game/status.ts?pick=GET","src/routes/api/game/status.ts?pick=GET","src/routes/api/game/status.ts?pick=GET","src/routes/api/game/status.ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS","src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS","src/routes/api/reset-game-progress.ts?pick=POST","src/routes/api/reset-game-progress.ts?pick=POST","src/routes/game/index.tsx?pick=default&pick=$css","src/routes/game/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/login.tsx?pick=default&pick=$css","src/routes/login.tsx?pick=default&pick=$css","src/routes/register.tsx?pick=default&pick=$css","src/routes/register.tsx?pick=default&pick=$css","src/app.tsx"]},"_utils-AQpNWTN2.js":{"file":"assets/utils-AQpNWTN2.js","name":"utils"},"src/app.tsx":{"file":"assets/app-BSWxMVrd.js","name":"app","src":"src/app.tsx","isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_server-fns-CUjvqORG.js","_AuthContext-D3kPq5an.js","_UserContext-DYj2Vavi.js","_routing-CD52x9Vs.js"]},"src/lib/server/events/base-point-events.ts":{"file":"assets/base-point-events-C2UNy6C4.js","name":"base-point-events","src":"src/lib/server/events/base-point-events.ts","isDynamicEntry":true},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"_...404_.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js"]},"src/routes/api/admin/performance.ts?pick=GET":{"file":"performance.js","name":"performance","src":"src/routes/api/admin/performance.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_performance-CpMIxBac.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/auth/index.ts?pick=POST":{"file":"index.js","name":"index","src":"src/routes/api/auth/index.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/auth/login.ts?pick=POST":{"file":"login.js","name":"login","src":"src/routes/api/auth/login.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_jwt-CO0ye28h.js","_utils-AQpNWTN2.js"]},"src/routes/api/auth/logout.ts?pick=POST":{"file":"logout.js","name":"logout","src":"src/routes/api/auth/logout.ts?pick=POST","isEntry":true,"isDynamicEntry":true},"src/routes/api/auth/register.ts?pick=POST":{"file":"register.js","name":"register","src":"src/routes/api/auth/register.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_utils-AQpNWTN2.js"]},"src/routes/api/auth/verify.ts?pick=GET":{"file":"verify.js","name":"verify","src":"src/routes/api/auth/verify.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_jwt-CO0ye28h.js","_utils-AQpNWTN2.js"]},"src/routes/api/base-points.ts?pick=DELETE":{"file":"base-points.js","name":"base-points","src":"src/routes/api/base-points.ts?pick=DELETE","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_auth-BVUYsDc6.js","_api-D3monypt.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/base-points.ts?pick=GET":{"file":"base-points2.js","name":"base-points","src":"src/routes/api/base-points.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/base-points.ts?pick=POST":{"file":"base-points3.js","name":"base-points","src":"src/routes/api/base-points.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_auth-BVUYsDc6.js","_api-D3monypt.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/base-points/count.ts?pick=GET":{"file":"count.js","name":"count","src":"src/routes/api/base-points/count.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_auth-BVUYsDc6.js","_api-D3monypt.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/calculate-squares.ts?pick=POST":{"file":"calculate-squares.js","name":"calculate-squares","src":"src/routes/api/calculate-squares.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_game-eWeYT9Is.js","_performance-CpMIxBac.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/events.ts?pick=GET":{"file":"events.js","name":"events","src":"src/routes/api/events.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_auth-BVUYsDc6.js","src/lib/server/events/base-point-events.ts","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/game/join.ts?pick=POST":{"file":"join.js","name":"join","src":"src/routes/api/game/join.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_game.service-Bf9Z8hov.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/game/leave.ts?pick=POST":{"file":"leave.js","name":"leave","src":"src/routes/api/game/leave.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_game.service-Bf9Z8hov.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/game/status.ts?pick=GET":{"file":"status.js","name":"status","src":"src/routes/api/game/status.ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_game.service-Bf9Z8hov.js","_auth-BVUYsDc6.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET":{"file":"_tileY_.js","name":"_tileY_","src":"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS":{"file":"_tileY_2.js","name":"_tileY_","src":"src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS","isEntry":true,"isDynamicEntry":true},"src/routes/api/reset-game-progress.ts?pick=POST":{"file":"reset-game-progress.js","name":"reset-game-progress","src":"src/routes/api/reset-game-progress.ts?pick=POST","isEntry":true,"isDynamicEntry":true,"imports":["_db-97-DOlOW.js","_auth-BVUYsDc6.js","_api-D3monypt.js","_utils-AQpNWTN2.js","_jwt-CO0ye28h.js"]},"src/routes/game/index.tsx?pick=default&pick=$css":{"file":"index2.js","name":"index","src":"src/routes/game/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_AuthContext-D3kPq5an.js","_game-eWeYT9Is.js","_UserContext-DYj2Vavi.js","_routing-CD52x9Vs.js"],"css":["assets/index-D5DiZI5g.css"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index3.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_components-B3DHEvEg.js","_routing-CD52x9Vs.js"],"css":["assets/index-BV-KZHQ3.css"]},"src/routes/login.tsx?pick=default&pick=$css":{"file":"login2.js","name":"login","src":"src/routes/login.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_AuthContext-D3kPq5an.js","_Login.module-Ci4nll34.js","_routing-CD52x9Vs.js","_components-B3DHEvEg.js"]},"src/routes/register.tsx?pick=default&pick=$css":{"file":"register2.js","name":"register","src":"src/routes/register.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BdnVf8ln.js","_Login.module-Ci4nll34.js","_routing-CD52x9Vs.js","_components-B3DHEvEg.js"]},"virtual:$vinxi/handler/server-fns":{"file":"server-fns.js","name":"server-fns","src":"virtual:$vinxi/handler/server-fns","isEntry":true,"imports":["_server-fns-CUjvqORG.js"]}}};

					const routeManifest = {"ssr":{},"client":{},"server-fns":{}};

        function createProdApp(appConfig) {
          return {
            config: { ...appConfig, buildManifest, routeManifest },
            getRouter(name) {
              return appConfig.routers.find(router => router.name === name)
            }
          }
        }

        function plugin$2(app) {
          const prodApp = createProdApp(appConfig);
          globalThis.app = prodApp;
        }

function plugin$1(app) {
	globalThis.$handle = (event) => app.h3App.handler(event);
}

/**
 * Traverses the module graph and collects assets for a given chunk
 *
 * @param {any} manifest Client manifest
 * @param {string} id Chunk id
 * @param {Map<string, string[]>} assetMap Cache of assets
 * @param {string[]} stack Stack of chunk ids to prevent circular dependencies
 * @returns Array of asset URLs
 */
function findAssetsInViteManifest(manifest, id, assetMap = new Map(), stack = []) {
	if (stack.includes(id)) {
		return [];
	}

	const cached = assetMap.get(id);
	if (cached) {
		return cached;
	}
	const chunk = manifest[id];
	if (!chunk) {
		return [];
	}

	const assets = [
		...(chunk.assets?.filter(Boolean) || []),
		...(chunk.css?.filter(Boolean) || [])
	];
	if (chunk.imports) {
		stack.push(id);
		for (let i = 0, l = chunk.imports.length; i < l; i++) {
			assets.push(...findAssetsInViteManifest(manifest, chunk.imports[i], assetMap, stack));
		}
		stack.pop();
	}
	assets.push(chunk.file);
	const all = Array.from(new Set(assets));
	assetMap.set(id, all);

	return all;
}

/** @typedef {import("../app.js").App & { config: { buildManifest: { [key:string]: any } }}} ProdApp */

function createHtmlTagsForAssets(router, app, assets) {
	return assets
		.filter(
			(asset) =>
				asset.endsWith(".css") ||
				asset.endsWith(".js") ||
				asset.endsWith(".mjs"),
		)
		.map((asset) => ({
			tag: "link",
			attrs: {
				href: joinURL(app.config.server.baseURL ?? "/", router.base, asset),
				key: join$1(app.config.server.baseURL ?? "", router.base, asset),
				...(asset.endsWith(".css")
					? { rel: "stylesheet", fetchPriority: "high" }
					: { rel: "modulepreload" }),
			},
		}));
}

/**
 *
 * @param {ProdApp} app
 * @returns
 */
function createProdManifest(app) {
	const manifest = new Proxy(
		{},
		{
			get(target, routerName) {
				invariant(typeof routerName === "string", "Bundler name expected");
				const router = app.getRouter(routerName);
				const bundlerManifest = app.config.buildManifest[routerName];

				invariant(
					router.type !== "static",
					"manifest not available for static router",
				);
				return {
					handler: router.handler,
					async assets() {
						/** @type {{ [key: string]: string[] }} */
						let assets = {};
						assets[router.handler] = await this.inputs[router.handler].assets();
						for (const route of (await router.internals.routes?.getRoutes()) ??
							[]) {
							assets[route.filePath] = await this.inputs[
								route.filePath
							].assets();
						}
						return assets;
					},
					async routes() {
						return (await router.internals.routes?.getRoutes()) ?? [];
					},
					async json() {
						/** @type {{ [key: string]: { output: string; assets: string[]} }} */
						let json = {};
						for (const input of Object.keys(this.inputs)) {
							json[input] = {
								output: this.inputs[input].output.path,
								assets: await this.inputs[input].assets(),
							};
						}
						return json;
					},
					chunks: new Proxy(
						{},
						{
							get(target, chunk) {
								invariant(typeof chunk === "string", "Chunk expected");
								const chunkPath = join$1(
									router.outDir,
									router.base,
									chunk + ".mjs",
								);
								return {
									import() {
										if (globalThis.$$chunks[chunk + ".mjs"]) {
											return globalThis.$$chunks[chunk + ".mjs"];
										}
										return import(
											/* @vite-ignore */ pathToFileURL(chunkPath).href
										);
									},
									output: {
										path: chunkPath,
									},
								};
							},
						},
					),
					inputs: new Proxy(
						{},
						{
							ownKeys(target) {
								const keys = Object.keys(bundlerManifest)
									.filter((id) => bundlerManifest[id].isEntry)
									.map((id) => id);
								return keys;
							},
							getOwnPropertyDescriptor(k) {
								return {
									enumerable: true,
									configurable: true,
								};
							},
							get(target, input) {
								invariant(typeof input === "string", "Input expected");
								if (router.target === "server") {
									const id =
										input === router.handler
											? virtualId(handlerModule(router))
											: input;
									return {
										assets() {
											return createHtmlTagsForAssets(
												router,
												app,
												findAssetsInViteManifest(bundlerManifest, id),
											);
										},
										output: {
											path: join$1(
												router.outDir,
												router.base,
												bundlerManifest[id].file,
											),
										},
									};
								} else if (router.target === "browser") {
									const id =
										input === router.handler && !input.endsWith(".html")
											? virtualId(handlerModule(router))
											: input;
									return {
										import() {
											return import(
												/* @vite-ignore */ joinURL(
													app.config.server.baseURL ?? "",
													router.base,
													bundlerManifest[id].file,
												)
											);
										},
										assets() {
											return createHtmlTagsForAssets(
												router,
												app,
												findAssetsInViteManifest(bundlerManifest, id),
											);
										},
										output: {
											path: joinURL(
												app.config.server.baseURL ?? "",
												router.base,
												bundlerManifest[id].file,
											),
										},
									};
								}
							},
						},
					),
				};
			},
		},
	);

	return manifest;
}

function plugin() {
	globalThis.MANIFEST =
		createProdManifest(globalThis.app)
			;
}

const chunks = {};
			 



			 function app() {
				 globalThis.$$chunks = chunks;
			 }

const plugins = [
  plugin$2,
plugin$1,
plugin,
app
];

const assets = {
  "/favicon.svg": {
    "type": "image/svg+xml",
    "etag": "\"15f-HnFGNDKGajgqHQfpDZ5B489x3vs\"",
    "mtime": "2025-09-28T18:42:57.400Z",
    "size": 351,
    "path": "../public/favicon.svg"
  },
  "/assets/Login-BUJWZuiV.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"117c-R/Awd+tZ1GSq7v0zfcogKpULLxw\"",
    "mtime": "2025-09-28T18:42:57.403Z",
    "size": 4476,
    "path": "../public/assets/Login-BUJWZuiV.css"
  },
  "/assets/Login-BUJWZuiV.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"43b-iALDipuyXNZmKZhvUuY4hO8Wdy4\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1083,
    "path": "../public/assets/Login-BUJWZuiV.css.br"
  },
  "/assets/Login-BUJWZuiV.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"4f6-6AIciez9gI2R/gyzM/Ez5SJ+BJA\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1270,
    "path": "../public/assets/Login-BUJWZuiV.css.gz"
  },
  "/assets/index-BV-KZHQ3.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"d6b-LGKG2XBQOJeD5FDuk0NPNOmkpKc\"",
    "mtime": "2025-09-28T18:42:57.403Z",
    "size": 3435,
    "path": "../public/assets/index-BV-KZHQ3.css"
  },
  "/assets/index-BV-KZHQ3.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"3be-SPDi6ZLG9yBoLWfP6OloNi0oDpQ\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 958,
    "path": "../public/assets/index-BV-KZHQ3.css.br"
  },
  "/assets/index-BV-KZHQ3.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"466-JvZmUTCvtF3WO0+HPJSQp4jCjpQ\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1126,
    "path": "../public/assets/index-BV-KZHQ3.css.gz"
  },
  "/assets/index-D5DiZI5g.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"5c8e-TRQHP/CiYDwgadc6x1rskUiHexw\"",
    "mtime": "2025-09-28T18:42:57.403Z",
    "size": 23694,
    "path": "../public/assets/index-D5DiZI5g.css"
  },
  "/assets/index-D5DiZI5g.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"1384-0d9rJUEhp0bvZE2JD7zb2CJzCT8\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 4996,
    "path": "../public/assets/index-D5DiZI5g.css.br"
  },
  "/assets/index-D5DiZI5g.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"15f5-rIPjzO6FW6DTGjKfreyWQqXwJgs\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 5621,
    "path": "../public/assets/index-D5DiZI5g.css.gz"
  },
  "/_build/.vite/manifest.json": {
    "type": "application/json",
    "etag": "\"ddb-YH6Q2KW1tNaR/Is7XUnxw8eLNPs\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 3547,
    "path": "../public/_build/.vite/manifest.json"
  },
  "/_build/.vite/manifest.json.br": {
    "type": "application/json",
    "encoding": "br",
    "etag": "\"222-dGRyaavojPgAnj0kDLCo8idnT5s\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 546,
    "path": "../public/_build/.vite/manifest.json.br"
  },
  "/_build/.vite/manifest.json.gz": {
    "type": "application/json",
    "encoding": "gzip",
    "etag": "\"25a-A+ZYVmmmUrA52ovURB0XamOlcj8\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 602,
    "path": "../public/_build/.vite/manifest.json.gz"
  },
  "/_server/assets/Login-BUJWZuiV.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"117c-R/Awd+tZ1GSq7v0zfcogKpULLxw\"",
    "mtime": "2025-09-28T18:42:57.408Z",
    "size": 4476,
    "path": "../public/_server/assets/Login-BUJWZuiV.css"
  },
  "/_server/assets/Login-BUJWZuiV.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"43b-iALDipuyXNZmKZhvUuY4hO8Wdy4\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1083,
    "path": "../public/_server/assets/Login-BUJWZuiV.css.br"
  },
  "/_server/assets/Login-BUJWZuiV.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"4f6-6AIciez9gI2R/gyzM/Ez5SJ+BJA\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1270,
    "path": "../public/_server/assets/Login-BUJWZuiV.css.gz"
  },
  "/_server/assets/index-BV-KZHQ3.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"d6b-LGKG2XBQOJeD5FDuk0NPNOmkpKc\"",
    "mtime": "2025-09-28T18:42:57.408Z",
    "size": 3435,
    "path": "../public/_server/assets/index-BV-KZHQ3.css"
  },
  "/_server/assets/index-BV-KZHQ3.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"3be-SPDi6ZLG9yBoLWfP6OloNi0oDpQ\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 958,
    "path": "../public/_server/assets/index-BV-KZHQ3.css.br"
  },
  "/_server/assets/index-BV-KZHQ3.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"466-JvZmUTCvtF3WO0+HPJSQp4jCjpQ\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1126,
    "path": "../public/_server/assets/index-BV-KZHQ3.css.gz"
  },
  "/_server/assets/index-D5DiZI5g.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"5c8e-TRQHP/CiYDwgadc6x1rskUiHexw\"",
    "mtime": "2025-09-28T18:42:57.408Z",
    "size": 23694,
    "path": "../public/_server/assets/index-D5DiZI5g.css"
  },
  "/_server/assets/index-D5DiZI5g.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"1384-0d9rJUEhp0bvZE2JD7zb2CJzCT8\"",
    "mtime": "2025-09-28T18:42:57.499Z",
    "size": 4996,
    "path": "../public/_server/assets/index-D5DiZI5g.css.br"
  },
  "/_server/assets/index-D5DiZI5g.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"15f5-rIPjzO6FW6DTGjKfreyWQqXwJgs\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 5621,
    "path": "../public/_server/assets/index-D5DiZI5g.css.gz"
  },
  "/_build/assets/AuthContext-CwAE7fDx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"947-ce95g4SHGsvXJQamBB6Mpcx/I04\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 2375,
    "path": "../public/_build/assets/AuthContext-CwAE7fDx.js"
  },
  "/_build/assets/AuthContext-CwAE7fDx.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"352-PPkF+3N89S1FsCAo8LkDi6yyDPo\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 850,
    "path": "../public/_build/assets/AuthContext-CwAE7fDx.js.br"
  },
  "/_build/assets/AuthContext-CwAE7fDx.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"3e1-PTBNsvwWslYP2ut9i9GP/Al0Jmw\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 993,
    "path": "../public/_build/assets/AuthContext-CwAE7fDx.js.gz"
  },
  "/_build/assets/Login-BUJWZuiV.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"117c-R/Awd+tZ1GSq7v0zfcogKpULLxw\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 4476,
    "path": "../public/_build/assets/Login-BUJWZuiV.css"
  },
  "/_build/assets/Login-BUJWZuiV.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"43b-iALDipuyXNZmKZhvUuY4hO8Wdy4\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1083,
    "path": "../public/_build/assets/Login-BUJWZuiV.css.br"
  },
  "/_build/assets/Login-BUJWZuiV.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"4f6-6AIciez9gI2R/gyzM/Ez5SJ+BJA\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1270,
    "path": "../public/_build/assets/Login-BUJWZuiV.css.gz"
  },
  "/_build/assets/Login.module-Ci4nll34.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"129-O9B8Vp9SEthpfMaySfX319OhMaM\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 297,
    "path": "../public/_build/assets/Login.module-Ci4nll34.js"
  },
  "/_build/assets/UserContext-C63u1NZh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25d-4uWFSysFVmFO1UJCkHDFBhdfkW8\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 605,
    "path": "../public/_build/assets/UserContext-C63u1NZh.js"
  },
  "/_build/assets/_...404_-CBu9U2Z7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"110-9ZYjjAlzWhASUHP+yjHaXIzK4Yc\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 272,
    "path": "../public/_build/assets/_...404_-CBu9U2Z7.js"
  },
  "/_build/assets/client-BpVt01AN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3fe7-sfFLPf6hTCLT3NwoCEenaSn5cHQ\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 16359,
    "path": "../public/_build/assets/client-BpVt01AN.js"
  },
  "/_build/assets/client-BpVt01AN.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"1671-s2MA90HiApqHbLVzyN/z0r0/jZQ\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 5745,
    "path": "../public/_build/assets/client-BpVt01AN.js.br"
  },
  "/_build/assets/client-BpVt01AN.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"18f7-7mu16zrq311eMJSHdFnxI6tBF3c\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 6391,
    "path": "../public/_build/assets/client-BpVt01AN.js.gz"
  },
  "/_build/assets/components-DShUfCzN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34a-lC/neX/+07ZJq+I1c0/ijwXpHVY\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 842,
    "path": "../public/_build/assets/components-DShUfCzN.js"
  },
  "/_build/assets/index-BV-KZHQ3.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"d6b-LGKG2XBQOJeD5FDuk0NPNOmkpKc\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 3435,
    "path": "../public/_build/assets/index-BV-KZHQ3.css"
  },
  "/_build/assets/index-BV-KZHQ3.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"3be-SPDi6ZLG9yBoLWfP6OloNi0oDpQ\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 958,
    "path": "../public/_build/assets/index-BV-KZHQ3.css.br"
  },
  "/_build/assets/index-BV-KZHQ3.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"466-JvZmUTCvtF3WO0+HPJSQp4jCjpQ\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1126,
    "path": "../public/_build/assets/index-BV-KZHQ3.css.gz"
  },
  "/_build/assets/index-BtiM2clC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6c89-CQIs0nyIwdtY94A1wW+sdH1H63U\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 27785,
    "path": "../public/_build/assets/index-BtiM2clC.js"
  },
  "/_build/assets/index-BtiM2clC.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"2586-PRHXZ6h3ONw9pqJTVvIwUWYuM64\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 9606,
    "path": "../public/_build/assets/index-BtiM2clC.js.br"
  },
  "/_build/assets/index-BtiM2clC.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"2931-C/Z27EwLphnuzp0C+tJneCQh9GM\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 10545,
    "path": "../public/_build/assets/index-BtiM2clC.js.gz"
  },
  "/_build/assets/index-CrzCVw3d.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"49f-UtFLoJVUPw48YolDkh9du9sLj8M\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 1183,
    "path": "../public/_build/assets/index-CrzCVw3d.js"
  },
  "/_build/assets/index-CrzCVw3d.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"1fc-QcWYw/8pehbT93t+0mnzova6k5k\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 508,
    "path": "../public/_build/assets/index-CrzCVw3d.js.br"
  },
  "/_build/assets/index-CrzCVw3d.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"259-AEEsWp4i833HQxLjT8bxj00aPzY\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 601,
    "path": "../public/_build/assets/index-CrzCVw3d.js.gz"
  },
  "/_build/assets/index-D5DiZI5g.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"5c8e-TRQHP/CiYDwgadc6x1rskUiHexw\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 23694,
    "path": "../public/_build/assets/index-D5DiZI5g.css"
  },
  "/_build/assets/index-D5DiZI5g.css.br": {
    "type": "text/css; charset=utf-8",
    "encoding": "br",
    "etag": "\"1384-0d9rJUEhp0bvZE2JD7zb2CJzCT8\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 4996,
    "path": "../public/_build/assets/index-D5DiZI5g.css.br"
  },
  "/_build/assets/index-D5DiZI5g.css.gz": {
    "type": "text/css; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"15f5-rIPjzO6FW6DTGjKfreyWQqXwJgs\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 5621,
    "path": "../public/_build/assets/index-D5DiZI5g.css.gz"
  },
  "/_build/assets/index-D83bvv4o.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11d3d-HxOucJOr7NfoOlfS3fYj1L9Awck\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 73021,
    "path": "../public/_build/assets/index-D83bvv4o.js"
  },
  "/_build/assets/index-D83bvv4o.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"57ab-nkKkn7cXXLedI+kzLWjtQLIkZSM\"",
    "mtime": "2025-09-28T18:42:57.519Z",
    "size": 22443,
    "path": "../public/_build/assets/index-D83bvv4o.js.br"
  },
  "/_build/assets/index-D83bvv4o.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"64c8-p88gEfVzaNw3lzpev/567jwe7Mw\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 25800,
    "path": "../public/_build/assets/index-D83bvv4o.js.gz"
  },
  "/_build/assets/login-Br8uk7LU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"90d-HpiEtRxPPFuK6QxbKb0jkMazaxU\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 2317,
    "path": "../public/_build/assets/login-Br8uk7LU.js"
  },
  "/_build/assets/login-Br8uk7LU.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"402-lrW8UoRKT3ZtgaYG0ELBs1rIlq4\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1026,
    "path": "../public/_build/assets/login-Br8uk7LU.js.br"
  },
  "/_build/assets/login-Br8uk7LU.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"4be-D2PFVzW8xSbofLvQe2Rs5J9zRlI\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1214,
    "path": "../public/_build/assets/login-Br8uk7LU.js.gz"
  },
  "/_build/assets/register-Dt9tAu_a.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"883-ru1wbWhWApqfXwdFKuNjP5Mpm1o\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 2179,
    "path": "../public/_build/assets/register-Dt9tAu_a.js"
  },
  "/_build/assets/register-Dt9tAu_a.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"3e2-h4Tn2M8YQKKP+5HcPrn4egi4mFs\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 994,
    "path": "../public/_build/assets/register-Dt9tAu_a.js.br"
  },
  "/_build/assets/register-Dt9tAu_a.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"48f-N+YApRGuUjcTzRZU1LDomHtcblA\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 1167,
    "path": "../public/_build/assets/register-Dt9tAu_a.js.gz"
  },
  "/_build/assets/routing-DQha3BAi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d04-dMaWANDS8tAnicd4YkY9vj117YE\"",
    "mtime": "2025-09-28T18:42:57.405Z",
    "size": 7428,
    "path": "../public/_build/assets/routing-DQha3BAi.js"
  },
  "/_build/assets/routing-DQha3BAi.js.br": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "br",
    "etag": "\"c6c-g+VV+besdIaAGd8Q9/K/pwSbzrY\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 3180,
    "path": "../public/_build/assets/routing-DQha3BAi.js.br"
  },
  "/_build/assets/routing-DQha3BAi.js.gz": {
    "type": "text/javascript; charset=utf-8",
    "encoding": "gzip",
    "etag": "\"d9d-fu+7UmpRi3BA59uNh3G4wusp46Y\"",
    "mtime": "2025-09-28T18:42:57.483Z",
    "size": 3485,
    "path": "../public/_build/assets/routing-DQha3BAi.js.gz"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _FOfmEv = eventHandler$1((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader$1(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    appendResponseHeader$1(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader$1(event, "Cache-Control");
      throw createError$2({ statusCode: 404 });
    }
    return;
  }
  const ifNotMatch = getRequestHeader$1(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus$1(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader$1(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus$1(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader$1(event, "Content-Type")) {
    setResponseHeader$1(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader$1(event, "ETag")) {
    setResponseHeader$1(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader$1(event, "Last-Modified")) {
    setResponseHeader$1(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader$1(event, "Content-Encoding")) {
    setResponseHeader$1(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader$1(event, "Content-Length")) {
    setResponseHeader$1(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

function parse(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  const obj = {};
  const opt = {};
  const dec = opt.decode || decode;
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) {
      break;
    }
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (opt?.filter && !opt?.filter(key)) {
      index = endIdx + 1;
      continue;
    }
    if (void 0 === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode(val, dec);
    }
    index = endIdx + 1;
  }
  return obj;
}
function decode(str) {
  return str.includes("%") ? decodeURIComponent(str) : str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch {
    return str;
  }
}

const fieldContentRegExp = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
function serialize(name, value, options) {
  const opt = options || {};
  const enc = opt.encode || encodeURIComponent;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  const encodedValue = enc(value);
  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError("argument val is invalid");
  }
  let str = name + "=" + encodedValue;
  if (void 0 !== opt.maxAge && opt.maxAge !== null) {
    const maxAge = opt.maxAge - 0;
    if (Number.isNaN(maxAge) || !Number.isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (!isDate(opt.expires) || Number.isNaN(opt.expires.valueOf())) {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.priority) {
    const priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
    switch (priority) {
      case "low": {
        str += "; Priority=Low";
        break;
      }
      case "medium": {
        str += "; Priority=Medium";
        break;
      }
      case "high": {
        str += "; Priority=High";
        break;
      }
      default: {
        throw new TypeError("option priority is invalid");
      }
    }
  }
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true: {
        str += "; SameSite=Strict";
        break;
      }
      case "lax": {
        str += "; SameSite=Lax";
        break;
      }
      case "strict": {
        str += "; SameSite=Strict";
        break;
      }
      case "none": {
        str += "; SameSite=None";
        break;
      }
      default: {
        throw new TypeError("option sameSite is invalid");
      }
    }
  }
  if (opt.partitioned) {
    str += "; Partitioned";
  }
  return str;
}
function isDate(val) {
  return Object.prototype.toString.call(val) === "[object Date]" || val instanceof Date;
}

function parseSetCookie(setCookieValue, options) {
  const parts = (setCookieValue || "").split(";").filter((str) => typeof str === "string" && !!str.trim());
  const nameValuePairStr = parts.shift() || "";
  const parsed = _parseNameValuePair(nameValuePairStr);
  const name = parsed.name;
  let value = parsed.value;
  try {
    value = options?.decode === false ? value : (options?.decode || decodeURIComponent)(value);
  } catch {
  }
  const cookie = {
    name,
    value
  };
  for (const part of parts) {
    const sides = part.split("=");
    const partKey = (sides.shift() || "").trimStart().toLowerCase();
    const partValue = sides.join("=");
    switch (partKey) {
      case "expires": {
        cookie.expires = new Date(partValue);
        break;
      }
      case "max-age": {
        cookie.maxAge = Number.parseInt(partValue, 10);
        break;
      }
      case "secure": {
        cookie.secure = true;
        break;
      }
      case "httponly": {
        cookie.httpOnly = true;
        break;
      }
      case "samesite": {
        cookie.sameSite = partValue;
        break;
      }
      default: {
        cookie[partKey] = partValue;
      }
    }
  }
  return cookie;
}
function _parseNameValuePair(nameValuePairStr) {
  let name = "";
  let value = "";
  const nameValueArr = nameValuePairStr.split("=");
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift();
    value = nameValueArr.join("=");
  } else {
    value = nameValuePairStr;
  }
  return { name, value };
}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const xForwardedHost = event.node.req.headers["x-forwarded-host"];
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}
function getRequestIP(event, opts = {}) {
  if (event.context.clientAddress) {
    return event.context.clientAddress;
  }
  if (opts.xForwardedFor) {
    const xForwardedFor = getRequestHeader(event, "x-forwarded-for")?.split(",").shift()?.trim();
    if (xForwardedFor) {
      return xForwardedFor;
    }
  }
  if (event.node.req.socket.remoteAddress) {
    return event.node.req.socket.remoteAddress;
  }
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !String(event.node.req.headers["transfer-encoding"] ?? "").split(",").map((e) => e.trim()).filter(Boolean).includes("chunked")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

const MIMES = {
  html: "text/html"};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}

function getDistinctCookieKey(name, opts) {
  return [name, opts.domain || "", opts.path || "/"].join(";");
}

function parseCookies(event) {
  return parse(event.node.req.headers.cookie || "");
}
function getCookie(event, name) {
  return parseCookies(event)[name];
}
function setCookie(event, name, value, serializeOptions = {}) {
  if (!serializeOptions.path) {
    serializeOptions = { path: "/", ...serializeOptions };
  }
  const newCookie = serialize(name, value, serializeOptions);
  const currentCookies = splitCookiesString(
    event.node.res.getHeader("set-cookie")
  );
  if (currentCookies.length === 0) {
    event.node.res.setHeader("set-cookie", newCookie);
    return;
  }
  const newCookieKey = getDistinctCookieKey(name, serializeOptions);
  event.node.res.removeHeader("set-cookie");
  for (const cookie of currentCookies) {
    const parsed = parseSetCookie(cookie);
    const key = getDistinctCookieKey(parsed.name, parsed);
    if (key === newCookieKey) {
      continue;
    }
    event.node.res.appendHeader("set-cookie", cookie);
  }
  event.node.res.appendHeader("set-cookie", newCookie);
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeaders(event) {
  return event.node.res.getHeaders();
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
const setHeader = setResponseHeader;
function appendResponseHeader(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;

var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$4 = (obj, key, value) => __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
function qe$2(e) {
  let s;
  const t = J(e), o = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(t, { ...o, body: e.node.req.body }) : new Request(t, { ...o, get body() {
    return s || (s = De$2(e), s);
  } });
}
function Oe$2(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: qe$2(e), url: J(e) }, e.web.request;
}
function Ae$2() {
  return Xe$1();
}
const z$1 = Symbol("$HTTPEvent");
function je$1(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[z$1]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function p$3(e) {
  return function(...s) {
    var _a;
    let t = s[0];
    if (je$1(t)) s[0] = t instanceof H3Event || t.__is_event__ ? t : t[z$1];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (t = Ae$2(), !t) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      s.unshift(t);
    }
    return e(...s);
  };
}
const J = p$3(getRequestURL), Ce$2 = p$3(getRequestIP), R$1 = p$3(setResponseStatus), I$5 = p$3(getResponseStatus), Le$2 = p$3(getResponseStatusText), y$1 = p$3(getResponseHeaders), U$2 = p$3(getResponseHeader), Fe$2 = p$3(setResponseHeader), Y$1 = p$3(appendResponseHeader), Ge$1 = p$3(parseCookies), Ie$2 = p$3(getCookie), Ue$2 = p$3(setCookie), b$2 = p$3(setHeader), De$2 = p$3(getRequestWebStream), _e$2 = p$3(removeResponseHeader), Me$2 = p$3(Oe$2);
function Ne$1() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function Xe$1() {
  return Ne$1().use().event;
}
const S$1 = "Invariant Violation", { setPrototypeOf: We$2 = function(e, s) {
  return e.__proto__ = s, e;
} } = Object;
let C$1 = class C extends Error {
  constructor(s = S$1) {
    super(typeof s == "number" ? `${S$1}: ${s} (see https://github.com/apollographql/invariant-packages)` : s);
    __publicField$4(this, "framesToPop", 1);
    __publicField$4(this, "name", S$1);
    We$2(this, C.prototype);
  }
};
function Be$1(e, s) {
  if (!e) throw new C$1(s);
}
const $$2 = "solidFetchEvent";
function ze$2(e) {
  return { request: Me$2(e), response: Ke$1(e), clientAddress: Ce$2(e), locals: {}, nativeEvent: e };
}
function Je$1(e) {
  return { ...e };
}
function Ye(e) {
  if (!e.context[$$2]) {
    const s = ze$2(e);
    e.context[$$2] = s;
  }
  return e.context[$$2];
}
function D(e, s) {
  for (const [t, o] of s.entries()) Y$1(e, t, o);
}
let Ve$1 = class Ve {
  constructor(s) {
    __publicField$4(this, "event");
    this.event = s;
  }
  get(s) {
    const t = U$2(this.event, s);
    return Array.isArray(t) ? t.join(", ") : t || null;
  }
  has(s) {
    return this.get(s) !== void 0;
  }
  set(s, t) {
    return Fe$2(this.event, s, t);
  }
  delete(s) {
    return _e$2(this.event, s);
  }
  append(s, t) {
    Y$1(this.event, s, t);
  }
  getSetCookie() {
    const s = U$2(this.event, "Set-Cookie");
    return Array.isArray(s) ? s : [s];
  }
  forEach(s) {
    return Object.entries(y$1(this.event)).forEach(([t, o]) => s(Array.isArray(o) ? o.join(", ") : o, t, this));
  }
  entries() {
    return Object.entries(y$1(this.event)).map(([s, t]) => [s, Array.isArray(t) ? t.join(", ") : t])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(y$1(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(y$1(this.event)).map((s) => Array.isArray(s) ? s.join(", ") : s)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
};
function Ke$1(e) {
  return { get status() {
    return I$5(e);
  }, set status(s) {
    R$1(e, s);
  }, get statusText() {
    return Le$2(e);
  }, set statusText(s) {
    R$1(e, I$5(e), s);
  }, headers: new Ve$1(e) };
}
const V$2 = [{ page: true, $component: { src: "src/routes/[...404].tsx?pick=default&pick=$css", build: () => import('../build/_...404_.mjs'), import: () => import('../build/_...404_.mjs') }, path: "/*404", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/[...404].tsx" }, { page: false, $GET: { src: "src/routes/api/admin/performance.ts?pick=GET", build: () => import('../build/performance.mjs'), import: () => import('../build/performance.mjs') }, $HEAD: { src: "src/routes/api/admin/performance.ts?pick=GET", build: () => import('../build/performance.mjs'), import: () => import('../build/performance.mjs') }, path: "/api/admin/performance", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/admin/performance.ts" }, { page: false, $POST: { src: "src/routes/api/auth/index.ts?pick=POST", build: () => import('../build/index.mjs'), import: () => import('../build/index.mjs') }, path: "/api/auth/", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/index.ts" }, { page: false, $POST: { src: "src/routes/api/auth/login.ts?pick=POST", build: () => import('../build/login.mjs'), import: () => import('../build/login.mjs') }, path: "/api/auth/login", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/login.ts" }, { page: false, $POST: { src: "src/routes/api/auth/logout.ts?pick=POST", build: () => import('../build/logout.mjs'), import: () => import('../build/logout.mjs') }, path: "/api/auth/logout", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/logout.ts" }, { page: false, $POST: { src: "src/routes/api/auth/register.ts?pick=POST", build: () => import('../build/register.mjs'), import: () => import('../build/register.mjs') }, path: "/api/auth/register", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/register.ts" }, { page: false, $GET: { src: "src/routes/api/auth/verify.ts?pick=GET", build: () => import('../build/verify.mjs'), import: () => import('../build/verify.mjs') }, $HEAD: { src: "src/routes/api/auth/verify.ts?pick=GET", build: () => import('../build/verify.mjs'), import: () => import('../build/verify.mjs') }, path: "/api/auth/verify", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/verify.ts" }, { page: false, $GET: { src: "src/routes/api/base-points/count.ts?pick=GET", build: () => import('../build/count.mjs'), import: () => import('../build/count.mjs') }, $HEAD: { src: "src/routes/api/base-points/count.ts?pick=GET", build: () => import('../build/count.mjs'), import: () => import('../build/count.mjs') }, path: "/api/base-points/count", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/base-points/count.ts" }, { page: false, $DELETE: { src: "src/routes/api/base-points.ts?pick=DELETE", build: () => import('../build/base-points.mjs'), import: () => import('../build/base-points.mjs') }, $GET: { src: "src/routes/api/base-points.ts?pick=GET", build: () => import('../build/base-points2.mjs'), import: () => import('../build/base-points2.mjs') }, $HEAD: { src: "src/routes/api/base-points.ts?pick=GET", build: () => import('../build/base-points2.mjs'), import: () => import('../build/base-points2.mjs') }, $POST: { src: "src/routes/api/base-points.ts?pick=POST", build: () => import('../build/base-points3.mjs'), import: () => import('../build/base-points3.mjs') }, path: "/api/base-points", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/base-points.ts" }, { page: false, $POST: { src: "src/routes/api/calculate-squares.ts?pick=POST", build: () => import('../build/calculate-squares.mjs'), import: () => import('../build/calculate-squares.mjs') }, path: "/api/calculate-squares", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/calculate-squares.ts" }, { page: false, $GET: { src: "src/routes/api/events.ts?pick=GET", build: () => import('../build/events.mjs'), import: () => import('../build/events.mjs') }, $HEAD: { src: "src/routes/api/events.ts?pick=GET", build: () => import('../build/events.mjs'), import: () => import('../build/events.mjs') }, path: "/api/events", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/events.ts" }, { page: false, $POST: { src: "src/routes/api/game/join.ts?pick=POST", build: () => import('../build/join.mjs'), import: () => import('../build/join.mjs') }, path: "/api/game/join", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/game/join.ts" }, { page: false, $POST: { src: "src/routes/api/game/leave.ts?pick=POST", build: () => import('../build/leave.mjs'), import: () => import('../build/leave.mjs') }, path: "/api/game/leave", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/game/leave.ts" }, { page: false, $GET: { src: "src/routes/api/game/status.ts?pick=GET", build: () => import('../build/status.mjs'), import: () => import('../build/status.mjs') }, $HEAD: { src: "src/routes/api/game/status.ts?pick=GET", build: () => import('../build/status.mjs'), import: () => import('../build/status.mjs') }, path: "/api/game/status", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/game/status.ts" }, { page: false, $GET: { src: "src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET", build: () => import('../build/_tileY_.mjs'), import: () => import('../build/_tileY_.mjs') }, $HEAD: { src: "src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET", build: () => import('../build/_tileY_.mjs'), import: () => import('../build/_tileY_.mjs') }, $OPTIONS: { src: "src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS", build: () => import('../build/_tileY_2.mjs'), import: () => import('../build/_tileY_2.mjs') }, path: "/api/map/tile/:tileX/:tileY", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/map/tile/[tileX]/[tileY].ts" }, { page: false, $POST: { src: "src/routes/api/reset-game-progress.ts?pick=POST", build: () => import('../build/reset-game-progress.mjs'), import: () => import('../build/reset-game-progress.mjs') }, path: "/api/reset-game-progress", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/reset-game-progress.ts" }, { page: true, $component: { src: "src/routes/game/index.tsx?pick=default&pick=$css", build: () => import('../build/index2.mjs'), import: () => import('../build/index2.mjs') }, path: "/game/", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/game/index.tsx" }, { page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index3.mjs'), import: () => import('../build/index3.mjs') }, path: "/", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/index.tsx" }, { page: true, $component: { src: "src/routes/login.tsx?pick=default&pick=$css", build: () => import('../build/login2.mjs'), import: () => import('../build/login2.mjs') }, path: "/login", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/login.tsx" }, { page: true, $component: { src: "src/routes/register.tsx?pick=default&pick=$css", build: () => import('../build/register2.mjs'), import: () => import('../build/register2.mjs') }, path: "/register", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/register.tsx" }], Qe$1 = Ze$1(V$2.filter((e) => e.page));
function Ze$1(e) {
  function s(t, o, i, a) {
    const n = Object.values(t).find((c) => i.startsWith(c.id + "/"));
    return n ? (s(n.children || (n.children = []), o, i.slice(n.id.length)), t) : (t.push({ ...o, id: i, path: i.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), t);
  }
  return e.sort((t, o) => t.path.length - o.path.length).reduce((t, o) => s(t, o, o.path, o.path), []);
}
function et(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
createRouter$1({ routes: V$2.reduce((e, s) => {
  if (!et(s)) return e;
  let t = s.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (o, i) => `**:${i}`).split("/").map((o) => o.startsWith(":") || o.startsWith("*") ? o : encodeURIComponent(o)).join("/");
  if (/:[^/]*\?/g.test(t)) throw new Error(`Optional parameters are not supported in API routes: ${t}`);
  if (e[t]) throw new Error(`Duplicate API routes for "${t}" found at "${e[t].route.path}" and "${s.path}"`);
  return e[t] = { route: s }, e;
}, {}) });
var st$1 = " ";
const rt$1 = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(st$1), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function ot$1(e, s) {
  let { tag: t, attrs: { key: o, ...i } = { key: void 0 }, children: a } = e;
  return rt$1[t]({ attrs: { ...i, nonce: s }, key: o, children: a });
}
function it$1(e, s, t, o = "default") {
  return lazy(async () => {
    var _a;
    {
      const a = (await e.import())[o], c = (await ((_a = s.inputs) == null ? void 0 : _a[e.src].assets())).filter((d) => d.tag === "style" || d.attrs.rel === "stylesheet");
      return { default: (d) => [...c.map((m) => ot$1(m)), createComponent(a, d)] };
    }
  });
}
function K() {
  function e(t) {
    return { ...t, ...t.$$route ? t.$$route.require().route : void 0, info: { ...t.$$route ? t.$$route.require().route.info : {}, filesystem: true }, component: t.$component && it$1(t.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: t.children ? t.children.map(e) : void 0 };
  }
  return Qe$1.map(e);
}
let _;
const Tt$1 = isServer ? () => getRequestEvent().routes : () => _ || (_ = K());
function at$1(e) {
  const s = Ie$2(e.nativeEvent, "flash");
  if (s) try {
    let t = JSON.parse(s);
    if (!t || !t.result) return;
    const o = [...t.input.slice(0, -1), new Map(t.input[t.input.length - 1])], i = t.error ? new Error(t.result) : t.result;
    return { input: o, url: t.url, pending: false, result: t.thrown ? void 0 : i, error: t.thrown ? i : void 0 };
  } catch (t) {
    console.error(t);
  } finally {
    Ue$2(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function nt$1(e) {
  const s = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await s.json(), assets: [...await s.inputs[s.handler].assets()], router: { submission: at$1(e) }, routes: K(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const ct$1 = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function pt(e) {
  return e.status && ct$1.has(e.status) ? e.status : 302;
}
const ut = {};
function lt$1(e) {
  const s = new TextEncoder().encode(e), t = s.length, o = t.toString(16), i = "00000000".substring(0, 8 - o.length) + o, a = new TextEncoder().encode(`;0x${i};`), n = new Uint8Array(12 + t);
  return n.set(a), n.set(s, 12), n;
}
function M$3(e, s) {
  return new ReadableStream({ start(t) {
    crossSerializeStream(s, { scopeId: e, plugins: [CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin], onSerialize(o, i) {
      t.enqueue(lt$1(i ? `(${getCrossReferenceHeader(e)},${o})` : o));
    }, onDone() {
      t.close();
    }, onError(o) {
      t.error(o);
    } });
  } });
}
async function dt(e) {
  const s = Ye(e), t = s.request, o = t.headers.get("X-Server-Id"), i = t.headers.get("X-Server-Instance"), a = t.headers.has("X-Single-Flight"), n = new URL(t.url);
  let c, l;
  if (o) Be$1(typeof o == "string", "Invalid server function"), [c, l] = o.split("#");
  else if (c = n.searchParams.get("id"), l = n.searchParams.get("name"), !c || !l) return new Response(null, { status: 404 });
  const d = ut[c];
  let m;
  if (!d) return new Response(null, { status: 404 });
  m = await d.importer();
  const Q = m[d.functionName];
  let f = [];
  if (!i || e.method === "GET") {
    const r = n.searchParams.get("args");
    if (r) {
      const u = JSON.parse(r);
      (u.t ? fromJSON(u, { plugins: [CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin] }) : u).forEach((h) => f.push(h));
    }
  }
  if (e.method === "POST") {
    const r = t.headers.get("content-type"), u = e.node.req, h = u instanceof ReadableStream, Z = u.body instanceof ReadableStream, L = h && u.locked || Z && u.body.locked, F = h ? u : u.body;
    if ((r == null ? void 0 : r.startsWith("multipart/form-data")) || (r == null ? void 0 : r.startsWith("application/x-www-form-urlencoded"))) f.push(await (L ? t : new Request(t, { ...t, body: F })).formData());
    else if (r == null ? void 0 : r.startsWith("application/json")) {
      const ee = L ? t : new Request(t, { ...t, body: F });
      f = fromJSON(await ee.json(), { plugins: [CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin] });
    }
  }
  try {
    let r = await provideRequestEvent(s, async () => (sharedConfig.context = { event: s }, s.locals.serverFunctionMeta = { id: c + "#" + l }, Q(...f)));
    if (a && i && (r = await X$1(s, r)), r instanceof Response) {
      if (r.headers && r.headers.has("X-Content-Raw")) return r;
      i && (r.headers && D(e, r.headers), r.status && (r.status < 300 || r.status >= 400) && R$1(e, r.status), r.customBody ? r = await r.customBody() : r.body == null && (r = null));
    }
    return i ? (b$2(e, "content-type", "text/javascript"), M$3(i, r)) : N(r, t, f);
  } catch (r) {
    if (r instanceof Response) a && i && (r = await X$1(s, r)), r.headers && D(e, r.headers), r.status && (!i || r.status < 300 || r.status >= 400) && R$1(e, r.status), r.customBody ? r = r.customBody() : r.body == null && (r = null), b$2(e, "X-Error", "true");
    else if (i) {
      const u = r instanceof Error ? r.message : typeof r == "string" ? r : "true";
      b$2(e, "X-Error", u.replace(/[\r\n]+/g, ""));
    } else r = N(r, t, f, true);
    return i ? (b$2(e, "content-type", "text/javascript"), M$3(i, r)) : r;
  }
}
function N(e, s, t, o) {
  const i = new URL(s.url), a = e instanceof Error;
  let n = 302, c;
  return e instanceof Response ? (c = new Headers(e.headers), e.headers.has("Location") && (c.set("Location", new URL(e.headers.get("Location"), i.origin + "").toString()), n = pt(e))) : c = new Headers({ Location: new URL(s.headers.get("referer")).toString() }), e && c.append("Set-Cookie", `flash=${encodeURIComponent(JSON.stringify({ url: i.pathname + i.search, result: a ? e.message : e, thrown: o, error: a, input: [...t.slice(0, -1), [...t[t.length - 1].entries()]] }))}; Secure; HttpOnly;`), new Response(null, { status: n, headers: c });
}
let w$2;
function ft(e) {
  var _a;
  const s = new Headers(e.request.headers), t = Ge$1(e.nativeEvent), o = e.response.headers.getSetCookie();
  s.delete("cookie");
  let i = false;
  return ((_a = e.nativeEvent.node) == null ? void 0 : _a.req) && (i = true, e.nativeEvent.node.req.headers.cookie = ""), o.forEach((a) => {
    if (!a) return;
    const n = a.split(";")[0], [c, l] = n.split("=");
    c && l && (t[c] = l);
  }), Object.entries(t).forEach(([a, n]) => {
    s.append("cookie", `${a}=${n}`), i && (e.nativeEvent.node.req.headers.cookie += `${a}=${n};`);
  }), s;
}
async function X$1(e, s) {
  let t, o = new URL(e.request.headers.get("referer")).toString();
  s instanceof Response && (s.headers.has("X-Revalidate") && (t = s.headers.get("X-Revalidate").split(",")), s.headers.has("Location") && (o = new URL(s.headers.get("Location"), new URL(e.request.url).origin + "").toString()));
  const i = Je$1(e);
  return i.request = new Request(o, { headers: ft(e) }), await provideRequestEvent(i, async () => {
    await nt$1(i), w$2 || (w$2 = (await import('../build/app-BSWxMVrd.mjs')).default), i.router.dataOnly = t || true, i.router.previousUrl = e.request.headers.get("referer");
    try {
      renderToString(() => {
        sharedConfig.context.event = i, w$2();
      });
    } catch (c) {
      console.log(c);
    }
    const a = i.router.data;
    if (!a) return s;
    let n = false;
    for (const c in a) a[c] === void 0 ? delete a[c] : n = true;
    return n && (s instanceof Response ? s.customBody && (a._$value = s.customBody()) : (a._$value = s, s = new Response(null, { status: 200 })), s.customBody = () => a, s.headers.set("X-Single-Flight", "true")), s;
  });
}
const Et$1 = eventHandler(dt);

const y = createContext$1(), v$1 = ["title", "meta"], p$2 = [], f$2 = ["name", "http-equiv", "content", "charset", "media"].concat(["property"]), l$2 = (n, t) => {
  const e = Object.fromEntries(Object.entries(n.props).filter(([r]) => t.includes(r)).sort());
  return (Object.hasOwn(e, "name") || Object.hasOwn(e, "property")) && (e.name = e.name || e.property, delete e.property), n.tag + JSON.stringify(e);
};
function E$3() {
  if (!sharedConfig.context) {
    const e = document.head.querySelectorAll("[data-sm]");
    Array.prototype.forEach.call(e, (r) => r.parentNode.removeChild(r));
  }
  const n = /* @__PURE__ */ new Map();
  function t(e) {
    if (e.ref) return e.ref;
    let r = document.querySelector(`[data-sm="${e.id}"]`);
    return r ? (r.tagName.toLowerCase() !== e.tag && (r.parentNode && r.parentNode.removeChild(r), r = document.createElement(e.tag)), r.removeAttribute("data-sm")) : r = document.createElement(e.tag), r;
  }
  return { addTag(e) {
    if (v$1.indexOf(e.tag) !== -1) {
      const i = e.tag === "title" ? p$2 : f$2, a = l$2(e, i);
      n.has(a) || n.set(a, []);
      let s = n.get(a), u = s.length;
      s = [...s, e], n.set(a, s);
      let c = t(e);
      e.ref = c, spread(c, e.props);
      let d = null;
      for (var r = u - 1; r >= 0; r--) if (s[r] != null) {
        d = s[r];
        break;
      }
      return c.parentNode != document.head && document.head.appendChild(c), d && d.ref && d.ref.parentNode && document.head.removeChild(d.ref), u;
    }
    let o = t(e);
    return e.ref = o, spread(o, e.props), o.parentNode != document.head && document.head.appendChild(o), -1;
  }, removeTag(e, r) {
    const o = e.tag === "title" ? p$2 : f$2, i = l$2(e, o);
    if (e.ref) {
      const a = n.get(i);
      if (a) {
        if (e.ref.parentNode) {
          e.ref.parentNode.removeChild(e.ref);
          for (let s = r - 1; s >= 0; s--) a[s] != null && document.head.appendChild(a[s].ref);
        }
        a[r] = null, n.set(i, a);
      } else e.ref.parentNode && e.ref.parentNode.removeChild(e.ref);
    }
  } };
}
function w$1() {
  const n = [];
  return useAssets(() => ssr(S(n))), { addTag(t) {
    if (v$1.indexOf(t.tag) !== -1) {
      const e = t.tag === "title" ? p$2 : f$2, r = l$2(t, e), o = n.findIndex((i) => i.tag === t.tag && l$2(i, e) === r);
      o !== -1 && n.splice(o, 1);
    }
    return n.push(t), n.length;
  }, removeTag(t, e) {
  } };
}
const I$4 = (n) => {
  const t = isServer ? w$1() : E$3();
  return createComponent$1(y.Provider, { value: t, get children() {
    return n.children;
  } });
}, A$1 = (n, t, e) => (M$2({ tag: n, props: t, setting: e, id: createUniqueId(), get name() {
  return t.name || t.property;
} }), null);
function M$2(n) {
  const t = useContext(y);
  if (!t) throw new Error("<MetaProvider /> should be in the tree");
  createRenderEffect(() => {
    const e = t.addTag(n);
    onCleanup(() => t.removeTag(n, e));
  });
}
function S(n) {
  return n.map((t) => {
    var _a, _b;
    const r = Object.keys(t.props).map((i) => i === "children" ? "" : ` ${i}="${escape(t.props[i], true)}"`).join("");
    let o = t.props.children;
    return Array.isArray(o) && (o = o.join("")), ((_a = t.setting) == null ? void 0 : _a.close) ? `<${t.tag} data-sm="${t.id}"${r}>${((_b = t.setting) == null ? void 0 : _b.escape) ? escape(o) : o || ""}</${t.tag}>` : `<${t.tag} data-sm="${t.id}"${r}/>`;
  }).join("");
}
const k = (n) => A$1("title", n, { escape: true, close: true });

const c$2 = createContext$1(), w = () => {
  const [s, l] = createSignal(null), [u, i] = createSignal(false), n = (t) => {
    l(t);
  };
  createEffect(() => {
    return;
  });
  return { user: s, login: async (t, o) => {
    try {
      const e = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ username: t, password: o }) }), r = await e.json();
      if (!e.ok) throw new Error((r == null ? void 0 : r.error) || "Login failed");
      if (!r.user) throw new Error("Invalid server response: missing user data");
      return n(r.user), r.user;
    } catch (e) {
      throw console.error("Login error:", e), e;
    }
  }, logout: async () => {
    try {
      try {
        const o = await fetch("/api/game/leave", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
        o.ok ? console.log("Successfully left game before logout") : console.warn("Failed to leave game before logout:", await o.text());
      } catch (o) {
        console.warn("Error leaving game before logout:", o);
      }
      if (!(await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" })).ok) throw new Error("Logout failed");
      n(null), window.location.href = "/";
    } catch {
      n(null), window.location.href = "/";
    }
  }, isInitialized: u };
}, E$2 = (s) => createComponent$1(c$2.Provider, { get value() {
  return w();
}, get children() {
  return s.children;
} }), I$3 = () => {
  const s = useContext(c$2);
  if (!s) throw new Error("useAuth must be used within an AuthProvider");
  return s;
};

const s = createContext$1();
function U$1(r) {
  const [a, t] = createSignal(null), [i, u] = createSignal(true);
  return onMount(async () => {
    try {
      const o = await fetch("/api/auth/verify");
      if (o.ok) {
        const e = await o.json();
        e.valid && e.user && t({ id: e.user.id, username: e.user.username, gameJoined: false, homeX: 0, homeY: 0, role: e.user.role });
      }
    } catch (o) {
      console.error("Failed to load user:", o);
    } finally {
      u(false);
    }
  }), createComponent$1(s.Provider, { value: { user: a, setUser: t, loading: i }, get children() {
    return r.children;
  } });
}
function p$1() {
  const r = useContext(s);
  if (!r) throw new Error("useUser must be used within a UserProvider");
  return r;
}

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
let M$1;
function Q() {
  (!window.history.state || window.history.state._depth == null) && window.history.replaceState({ ...window.history.state, _depth: window.history.length - 1 }, ""), M$1 = window.history.state._depth;
}
isServer || Q();
function _e$1(t) {
  return { ...t, _depth: window.history.state && window.history.state._depth };
}
function qe$1(t, e) {
  let n = false;
  return () => {
    const r = M$1;
    Q();
    const s = r == null ? null : M$1 - r;
    if (n) {
      n = false;
      return;
    }
    s && e(s) ? (n = true, window.history.go(-s)) : t();
  };
}
const ye = /^(?:[a-z0-9]+:)?\/\//i, we = /^\/+|(\/)\/+$/g, ve$1 = "http://sr";
function E$1(t, e = false) {
  const n = t.replace(we, "$1");
  return n ? e || /^[?#]/.test(n) ? n : "/" + n : "";
}
function q(t, e, n) {
  if (ye.test(e)) return;
  const r = E$1(t), s = n && E$1(n);
  let o = "";
  return !s || e.startsWith("/") ? o = r : s.toLowerCase().indexOf(r.toLowerCase()) !== 0 ? o = r + s : o = s, (o || "/") + E$1(e, !o);
}
function Re(t, e) {
  if (t == null) throw new Error(e);
  return t;
}
function Pe$1(t, e) {
  return E$1(t).replace(/\/*(\*.*)?$/g, "") + E$1(e);
}
function V$1(t) {
  const e = {};
  return t.searchParams.forEach((n, r) => {
    r in e ? Array.isArray(e[r]) ? e[r].push(n) : e[r] = [e[r], n] : e[r] = n;
  }), e;
}
function xe$1(t, e, n) {
  const [r, s] = t.split("/*", 2), o = r.split("/").filter(Boolean), a = o.length;
  return (c) => {
    const f = c.split("/").filter(Boolean), h = f.length - a;
    if (h < 0 || h > 0 && s === void 0 && !e) return null;
    const l = { path: a ? "" : "/", params: {} }, m = (d) => n === void 0 ? void 0 : n[d];
    for (let d = 0; d < a; d++) {
      const p = o[d], y = p[0] === ":", v = y ? f[d] : f[d].toLowerCase(), C = y ? p.slice(1) : p.toLowerCase();
      if (y && $$1(v, m(C))) l.params[C] = v;
      else if (y || !$$1(v, C)) return null;
      l.path += `/${v}`;
    }
    if (s) {
      const d = h ? f.slice(-h).join("/") : "";
      if ($$1(d, m(s))) l.params[s] = d;
      else return null;
    }
    return l;
  };
}
function $$1(t, e) {
  const n = (r) => r === t;
  return e === void 0 ? true : typeof e == "string" ? n(e) : typeof e == "function" ? e(t) : Array.isArray(e) ? e.some(n) : e instanceof RegExp ? e.test(t) : false;
}
function be$1(t) {
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
function Z$1(t) {
  let e = /(\/?\:[^\/]+)\?/.exec(t);
  if (!e) return [t];
  let n = t.slice(0, e.index), r = t.slice(e.index + e[0].length);
  const s = [n, n += e[1]];
  for (; e = /^(\/\:[^\/]+)\?/.exec(r); ) s.push(n += e[1]), r = r.slice(e[0].length);
  return Z$1(r).reduce((o, a) => [...o, ...s.map((c) => c + a)], []);
}
const Ae$1 = 100, Ce$1 = createContext$1(), ee = createContext$1(), W$1 = () => Re(useContext(Ce$1), "<A> and 'use' router primitives can be only used inside a Route."), Ee = () => useContext(ee) || W$1().base, We$1 = (t) => {
  const e = Ee();
  return createMemo(() => e.resolvePath(t()));
}, $e$1 = (t) => {
  const e = W$1();
  return createMemo(() => {
    const n = t();
    return n !== void 0 ? e.renderPath(n) : n;
  });
}, Ie$1 = () => W$1().navigatorFactory(), Me$1 = () => W$1().location;
function Le$1(t, e = "") {
  const { component: n, preload: r, load: s, children: o, info: a } = t, c = !o || Array.isArray(o) && !o.length, f = { key: t, component: n, preload: r || s, info: a };
  return te(t.path).reduce((h, l) => {
    for (const m of Z$1(l)) {
      const d = Pe$1(e, m);
      let p = c ? d : d.split("/*", 1)[0];
      p = p.split("/").map((y) => y.startsWith(":") || y.startsWith("*") ? y : encodeURIComponent(y)).join("/"), h.push({ ...f, originalPath: l, pattern: p, matcher: xe$1(p, !c, t.matchFilters) });
    }
    return h;
  }, []);
}
function Se$1(t, e = 0) {
  return { routes: t, score: be$1(t[t.length - 1]) * 1e4 - e, matcher(n) {
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
function Oe$1(t, e = "", n = [], r = []) {
  const s = te(t);
  for (let o = 0, a = s.length; o < a; o++) {
    const c = s[o];
    if (c && typeof c == "object") {
      c.hasOwnProperty("path") || (c.path = "");
      const f = Le$1(c, e);
      for (const h of f) {
        n.push(h);
        const l = Array.isArray(c.children) && c.children.length === 0;
        if (c.children && !l) Oe$1(c.children, h.pattern, n, r);
        else {
          const m = Se$1([...n], r.length);
          r.push(m);
        }
        n.pop();
      }
    }
  }
  return n.length ? r : r.sort((o, a) => a.score - o.score);
}
function I$2(t, e) {
  for (let n = 0, r = t.length; n < r; n++) {
    const s = t[n].matcher(e);
    if (s) return s;
  }
  return [];
}
function Fe$1(t, e, n) {
  const r = new URL(ve$1), s = createMemo((l) => {
    const m = t();
    try {
      return new URL(m, r);
    } catch {
      return console.error(`Invalid path ${m}`), l;
    }
  }, r, { equals: (l, m) => l.href === m.href }), o = createMemo(() => s().pathname), a = createMemo(() => s().search, true), c = createMemo(() => s().hash), f = () => "", h = on(a, () => V$1(s()));
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
function De$1() {
  return R;
}
function Ue$1(t, e, n, r = {}) {
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
  }, [v, C] = createSignal(s().value), [L, ne] = createSignal(s().state), S = Fe$1(v, L, a.queryWrapper), O = [], U = createSignal(isServer ? ce() : []), z = createMemo(() => typeof r.transformUrl == "function" ? I$2(e(), r.transformUrl(S.pathname)) : I$2(e(), S.pathname)), H = () => {
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
      if (O.length >= Ae$1) throw new Error("Too many redirects");
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
    const g = I$2(e(), i.pathname), P = R;
    R = "preload";
    for (let F in g) {
      const { route: x, params: j } = g[F];
      x.component && x.component.preload && x.component.preload();
      const { preload: b } = x;
      u && b && runWithOwner(n(), () => b({ params: j, location: { pathname: i.pathname, search: i.search, hash: i.hash, query: V$1(i), state: null, key: "" }, intent: "preload" }));
    }
    R = P;
  }
  function ce() {
    const i = getRequestEvent();
    return i && i.router && i.router.submission ? [i.router.submission] : [];
  }
}
function ze$1(t, e, n, r) {
  const { base: s, location: o, params: a } = t, { pattern: c, component: f, preload: h } = r().route, l = createMemo(() => r().path);
  f && f.preload && f.preload();
  const m = h ? h({ params: a, location: o, intent: R || "initial" }) : void 0;
  return { parent: e, pattern: c, path: l, outlet: () => f ? createComponent(f, { params: a, location: o, data: m, get children() {
    return n();
  } }) : n(), resolvePath(p) {
    return q(s.path(), p, l());
  } };
}

function t(e, n = 200, r = {}) {
  return new Response(JSON.stringify(e), { status: n, headers: { "Content-Type": "application/json", ...r } });
}

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, key + "" , value);
class p {
  constructor(t) {
    this.db = t;
  }
  async getAll() {
    return await this.db.all("SELECT id, user_id as userId, x, y, game_created_at_ms as createdAtMs FROM base_points") || [];
  }
  async getByUser(t) {
    return await this.db.all("SELECT id, user_id as userId, x, y, game_created_at_ms as createdAtMs FROM base_points WHERE user_id = ?", [t]) || [];
  }
  async getTotalCount() {
    var _a;
    return ((_a = await this.db.get("SELECT COUNT(*) as count FROM base_points")) == null ? void 0 : _a.count) || 0;
  }
  async getCountExcludingOrigin() {
    var _a;
    return ((_a = await this.db.get("SELECT COUNT(*) as count FROM base_points WHERE x != 0 OR y != 0")) == null ? void 0 : _a.count) || 0;
  }
  async getPointsInBounds(t, s, e, r) {
    return await this.db.all(`SELECT id, user_id as userId, x, y, game_created_at_ms as createdAtMs 
       FROM base_points 
       WHERE x BETWEEN ? AND ? AND y BETWEEN ? AND ?`, [t, e, s, r]) || [];
  }
  async add(t, s, e) {
    const r = Date.now();
    try {
      await this.db.run("BEGIN TRANSACTION");
      try {
        const a = await this.db.get("SELECT COUNT(*) as count FROM users WHERE id = ?", [t]);
        if (!a || a.count === 0) throw new Error(`User ${t} not found`);
        const i = await this.db.get("SELECT id, x, y, game_created_at_ms as createdAtMs FROM base_points WHERE user_id = ? AND x = ? AND y = ?", [t, s, e]);
        if (i) return await this.db.run("COMMIT"), i;
        const d = await this.db.run("INSERT INTO base_points (user_id, x, y, game_created_at_ms) VALUES (?, ?, ?, ?)", [t, s, e, r]);
        await this.db.run("COMMIT");
        const _ = await this.db.get("SELECT id, user_id as userId, x, y, game_created_at_ms as createdAtMs FROM base_points WHERE id = ?", [d.lastID]);
        if (!_) throw new Error("Failed to retrieve created base point");
        return _;
      } catch (a) {
        throw console.error("[BasePointRepository] Error in transaction:", a), await this.db.run("ROLLBACK"), a;
      }
    } catch (a) {
      throw console.error("[BasePointRepository] Error in add method:", { error: a instanceof Error ? a.message : "Unknown error", stack: a instanceof Error ? a.stack : void 0, userId: t, x: s, y: e, now: r, dbState: { userExists: await this.db.get("SELECT id, username FROM users WHERE id = ?", [t]), basePoints: await this.db.all("SELECT * FROM base_points WHERE user_id = ?", [t]) } }), new Error(`Failed to add base point: ${a instanceof Error ? a.message : "Unknown error"}`);
    }
  }
  async deleteAllBasePointsForUser(t) {
    await this.db.run("DELETE FROM base_points WHERE user_id = ?", [t]);
  }
  async deletePoints(t) {
    if (t.length === 0) return;
    const s = await this.db.get("SELECT id, user_id as userId, x, y, game_created_at_ms as createdAtMs FROM base_points WHERE id = ?", [t[0].id]);
    if (s) {
      await this.db.run("BEGIN TRANSACTION");
      try {
        await this.db.run("DELETE FROM base_points WHERE id IN (" + t.map(() => "?").join(",") + ")", t.map((a) => a.id));
        const { basePointEventService: e } = await Promise.resolve().then(function () { return basePointEventsC2UNy6C4; }), r = { ...s, count: t.length };
        e.emitDeleted(r), await this.db.run("COMMIT");
      } catch (e) {
        throw await this.db.run("ROLLBACK"), console.error(`[BasePointRepository] Failed to delete ${t.length} points:`, e), e;
      }
    }
  }
  async create(t) {
    const { userId: s, x: e, y: r, gameCreatedAtMs: a } = t;
    return { id: (await this.db.run("INSERT INTO base_points (user_id, x, y, game_created_at_ms) VALUES (?, ?, ?, ?)", [s, e, r, a])).lastID, userId: s, x: e, y: r, createdAtMs: a };
  }
  async getOldest() {
    return await this.db.get("SELECT id, user_id as userId, x, y, game_created_at_ms as createdAtMs FROM base_points WHERE x != 0 OR y != 0 ORDER BY game_created_at_ms ASC LIMIT 1") || null;
  }
  async delete(t) {
    return ((await this.db.run("DELETE FROM base_points WHERE id = ?", [t])).changes || 0) > 0;
  }
  async deleteBasePoint(t) {
    const s = await this.db.get("SELECT id, user_id as userId, x, y, game_created_at_ms as createdAtMs FROM base_points WHERE id = ?", [t]);
    if (!s) return null;
    await this.db.run("BEGIN TRANSACTION");
    try {
      await this.db.run("DELETE FROM base_points WHERE id = ?", [t]);
      const { basePointEventService: e } = await Promise.resolve().then(function () { return basePointEventsC2UNy6C4; });
      return e.emitDeleted(s), await this.db.run("COMMIT"), s;
    } catch (e) {
      throw await this.db.run("ROLLBACK"), console.error(`[BasePointRepository] Failed to delete point ${t}:`, e), e;
    }
  }
}
const v = Object.freeze(Object.defineProperty({ __proto__: null, BasePointRepository: p }, Symbol.toStringTag, { value: "Module" })), O = 6;
class M {
  constructor(t) {
    this.db = t;
  }
  async getTile(t, s) {
    const e = await this.db.get("SELECT tile_x, tile_y, data, version, last_updated_ms FROM map_tiles WHERE tile_x = ? AND tile_y = ?", [t, s]);
    if (!e) return null;
    const r = e.data;
    let a;
    if (r.length > 0) {
      const i = r[0], d = r.subarray(1);
      i === 1 ? a = inflate(d) : a = new Uint8Array(d);
    } else a = new Uint8Array(0);
    return { tileX: e.tile_x, tileY: e.tile_y, data: a, compressedData: e.data, version: e.version, lastUpdatedMs: e.last_updated_ms };
  }
  async saveTile(t) {
    const s = Date.now(), e = (t.version || 0) + 1;
    let r = t.compressedData;
    if (!r && t.data) {
      const a = Buffer.alloc(1);
      a[0] = 1;
      const i = deflate(t.data, { level: O });
      r = Buffer.concat([a, Buffer.from(i)]);
    }
    await this.db.run(`INSERT INTO map_tiles (tile_x, tile_y, data, version, last_updated_ms)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(tile_x, tile_y) DO UPDATE SET
         data = excluded.data,
         version = excluded.version,
         last_updated_ms = excluded.last_updated_ms`, [t.tileX, t.tileY, r, e, s]);
  }
  async getTilesInBounds(t, s, e, r) {
    return (await this.db.all("SELECT tile_x, tile_y, data, version, last_updated_ms FROM map_tiles WHERE tile_x BETWEEN ? AND ? AND tile_y BETWEEN ? AND ?", [t, e, s, r])).map((i) => ({ tileX: i.tile_x, tileY: i.tile_y, data: i.data, compressedData: i.data, version: i.version, lastUpdatedMs: i.last_updated_ms }));
  }
  static worldToTileCoords(t, s) {
    return { tileX: Math.floor(t / this.TILE_SIZE), tileY: Math.floor(s / this.TILE_SIZE) };
  }
  static getTileBounds(t, s) {
    return { minX: t * this.TILE_SIZE, minY: s * this.TILE_SIZE, maxX: (t + 1) * this.TILE_SIZE - 1, maxY: (s + 1) * this.TILE_SIZE - 1 };
  }
  async deleteAllTiles() {
    await this.db.run("DELETE FROM map_tiles");
  }
}
__publicField$3(M, "TILE_SIZE", 64);
const A = process.env.DATA_DIR || join$2(process.cwd(), "data"), b$1 = join$2(A, "app.db");
let o$1, l$1 = null, E = null;
async function u$1() {
  if (!o$1) {
    console.log("Initializing database connection...");
    try {
      await promises$1.mkdir(dirname$2(b$1), { recursive: true }), o$1 = await open({ filename: b$1, driver: c$4.Database, mode: c$4.OPEN_READWRITE | c$4.OPEN_CREATE }), await o$1.exec("PRAGMA journal_mode = WAL;"), await o$1.exec("PRAGMA foreign_keys = ON;"), console.log("Database connection established");
    } catch (n) {
      throw console.error("Failed to initialize database:", n), n;
    }
  }
  return o$1;
}
async function f$1() {
  if (!l$1) {
    const n = await u$1();
    l$1 = new p(n);
  }
  return l$1;
}
async function I$1() {
  if (!E) {
    const n = await u$1();
    E = new M(n);
  }
  return E;
}
const B = Object.freeze(Object.defineProperty({ __proto__: null, getBasePointRepository: f$1, getDb: u$1, getMapTileRepository: I$1 }, Symbol.toStringTag, { value: "Module" }));

const dbPRkUVSC = /*#__PURE__*/Object.freeze({
  __proto__: null,
  B: p,
  M: M,
  a: f$1,
  b: I$1,
  c: v,
  d: B,
  g: u$1
});

const c$1 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223, 1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373, 1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511, 1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619, 1621, 1627, 1637, 1657, 1663, 1667, 1669, 1693, 1697, 1699, 1709, 1721, 1723, 1733, 1741, 1747, 1753, 1759, 1777, 1783, 1787, 1789, 1801, 1811, 1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889, 1901, 1907, 1913, 1931, 1933, 1949, 1951, 1973, 1979, 1987, 1993, 1997, 1999], a$1 = /* @__PURE__ */ new Map();
function f(n, t = Date.now()) {
  a$1.set(n, t);
}
function d$1() {
  let n = null;
  for (const t of a$1.values()) t > 0 && (n === null || t < n) && (n = t);
  return n;
}
const m = Date.now();
c$1.forEach((n) => {
  a$1.has(n) || a$1.set(n, m);
});
function h(n = 4) {
  const t = /* @__PURE__ */ new Set(), o = (e) => {
    t.add(e), e !== 0 && t.add(1 / e), t.add(-e), e !== 0 && t.add(-1 / e);
  };
  o(1), o(-1);
  const p = [...c$1], s = Date.now(), i = Math.min(n, p.length);
  for (let e = 0; e < i && p.length > 0; e++) {
    const u = Math.floor(Math.random() * p.length), r = p.splice(u, 1)[0];
    f(r, s), o(r);
  }
  return Array.from(t);
}
function x(n) {
  if (!n || n.length === 0) return "1=0";
  const t = [], o = 1e-10;
  t.push("(p1.x = p2.x)"), t.push("(p1.y = p2.y)"), t.push("(p1.x - p1.y = p2.x - p2.y)"), t.push("(p1.x + p1.y = p2.x + p2.y)");
  for (const p of n) {
    if (typeof p != "number" || isNaN(p)) continue;
    const s = Math.abs(p), i = p < 0 ? -1 : 1;
    t.push(`(ABS((p2.y - p1.y) - (${s * i} * (p2.x - p1.x))) < ${o} AND (p2.x - p1.x) != 0)`), t.push(`(ABS((p2.y - p1.y) - (${-s * i} * (p2.x - p1.x))) < ${o} AND (p2.x - p1.x) != 0)`), p !== 0 && (t.push(`(ABS((p2.x - p1.x) - (${s * i} * (p2.y - p1.y))) < ${o} AND (p2.y - p1.y) != 0)`), t.push(`(ABS((p2.x - p1.x) - (${-s * i} * (p2.y - p1.y))) < ${o} AND (p2.y - p1.y) != 0)`));
  }
  return t.length === 0 ? "1=0" : `(${t.join(" OR ")})`;
}

const randomSlopesIzTC2X1N = /*#__PURE__*/Object.freeze({
  __proto__: null,
  getOldestPrimeTimestamp: d$1,
  getRandomSlopes: h,
  getSlopeConditions: x
});

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
class u {
  constructor(e, a = 1e3, i = 1e4) {
    __publicField$2(this, "cache");
    __publicField$2(this, "maxSize");
    __publicField$2(this, "defaultTTL");
    __publicField$2(this, "tileRepository");
    this.cache = /* @__PURE__ */ new Map(), this.maxSize = a, this.defaultTTL = i, this.tileRepository = e;
  }
  async getOrGenerate(e, a, i) {
    const s = this.get(e, a);
    if (s) return s;
    const h = await this.tileRepository.getTile(e, a);
    if (h) return this.set(h), h;
    const n = await i(e, a);
    return await this.tileRepository.saveTile(n), this.set(n), n;
  }
  getCacheKey(e, a) {
    return `${e},${a}`;
  }
  get(e, a) {
    const i = this.getCacheKey(e, a), s = this.cache.get(i);
    return s ? Date.now() > s.timestamp + s.ttl ? (this.cache.delete(i), null) : s.data : null;
  }
  set(e, a = this.defaultTTL) {
    if (!e || e.tileX == null || e.tileY == null || !e.data) throw new Error("Invalid tile data");
    if (this.cache.size >= this.maxSize) {
      const s = this.cache.keys().next().value;
      s && this.cache.delete(s);
    }
    const i = this.getCacheKey(e.tileX, e.tileY);
    this.cache.set(i, { data: { ...e }, timestamp: Date.now(), ttl: a || this.defaultTTL });
  }
  invalidate(e, a) {
    const i = this.getCacheKey(e, a);
    this.cache.delete(i);
  }
  clear() {
    this.cache.clear();
  }
  getStats() {
    return { size: this.cache.size, maxSize: this.maxSize, defaultTTL: this.defaultTTL };
  }
}
let r = null;
async function c() {
  if (!r) {
    const t = await u$1(), e = new M(t);
    r = new u(e);
  }
  return r;
}
const g = { getOrGenerate: (...t) => c().then((e) => e.getOrGenerate(...t)), get: (...t) => c().then((e) => e.get(...t)), set: (...t) => c().then((e) => e.set(...t)), invalidate: (...t) => c().then((e) => e.invalidate(...t)), clear: () => c().then((t) => t.clear()), getStats: () => c().then((t) => t.getStats()) };

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
const _d = class _d {
  constructor() {
    __publicField$1(this, "eventEmitter");
    __publicField$1(this, "clients", /* @__PURE__ */ new Map());
    this.eventEmitter = new EventEmitter$1(), this.eventEmitter.setMaxListeners(50);
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
__publicField$1(_d, "instance");
let d = _d;
const l = d.getInstance();

const basePointEventsC2UNy6C4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  BasePointEventService: d,
  basePointEventService: l
});

function a(l, t) {
  return [l, t];
}
const e = 1e3, o = { GRID_SIZE: 15, DEFAULT_POSITION: a(0, 0), WORLD_BOUNDS: { MIN_X: -e, MAX_X: e, MIN_Y: -e, MAX_Y: e }, DIRECTION_MAP: { ArrowUp: "down", ArrowDown: "up", ArrowLeft: "right", ArrowRight: "left" }, BUTTONS: [{ label: "Random", className: "randomButton" }, { label: "Clear All", className: "clearButton" }], DIRECTIONS: [{ key: "up", label: "\u2191 Up" }, { key: "down", label: "\u2193 Down" }, { key: "left", label: "\u2190 Left" }, { key: "right", label: "\u2192 Right" }] };

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
function Se(s) {
  let e;
  const t = yt(s), r = { duplex: "half", method: s.method, headers: s.headers };
  return s.node.req.body instanceof ArrayBuffer ? new Request(t, { ...r, body: s.node.req.body }) : new Request(t, { ...r, get body() {
    return e || (e = De(s), e);
  } });
}
function be(s) {
  var _a;
  return (_a = s.web) != null ? _a : s.web = { request: Se(s), url: yt(s) }, s.web.request;
}
function _e() {
  return Le();
}
const gt = Symbol("$HTTPEvent");
function ve(s) {
  return typeof s == "object" && (s instanceof H3Event || (s == null ? void 0 : s[gt]) instanceof H3Event || (s == null ? void 0 : s.__is_event__) === true);
}
function b(s) {
  return function(...e) {
    var _a;
    let t = e[0];
    if (ve(t)) e[0] = t instanceof H3Event || t.__is_event__ ? t : t[gt];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (t = _e(), !t) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      e.unshift(t);
    }
    return s(...e);
  };
}
const yt = b(getRequestURL), Pe = b(getRequestIP), z = b(setResponseStatus), st = b(getResponseStatus), Ae = b(getResponseStatusText), U = b(getResponseHeaders), ot = b(getResponseHeader), Ie = b(setResponseHeader), $e = b(appendResponseHeader), rt = b(sendRedirect), Ce = b(getCookie), xe = b(setCookie), Oe = b(setHeader), De = b(getRequestWebStream), Me = b(removeResponseHeader), ke = b(be);
function Ne() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function Le() {
  return Ne().use().event;
}
const wt = [{ page: true, $component: { src: "src/routes/[...404].tsx?pick=default&pick=$css", build: () => import('../build/_...404_2.mjs'), import: () => import('../build/_...404_2.mjs') }, path: "/*404", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/[...404].tsx" }, { page: false, $GET: { src: "src/routes/api/admin/performance.ts?pick=GET", build: () => import('../build/performance2.mjs'), import: () => import('../build/performance2.mjs') }, $HEAD: { src: "src/routes/api/admin/performance.ts?pick=GET", build: () => import('../build/performance2.mjs'), import: () => import('../build/performance2.mjs') }, path: "/api/admin/performance", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/admin/performance.ts" }, { page: false, $POST: { src: "src/routes/api/auth/index.ts?pick=POST", build: () => import('../build/index4.mjs'), import: () => import('../build/index4.mjs') }, path: "/api/auth/", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/index.ts" }, { page: false, $POST: { src: "src/routes/api/auth/login.ts?pick=POST", build: () => import('../build/login3.mjs'), import: () => import('../build/login3.mjs') }, path: "/api/auth/login", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/login.ts" }, { page: false, $POST: { src: "src/routes/api/auth/logout.ts?pick=POST", build: () => import('../build/logout2.mjs'), import: () => import('../build/logout2.mjs') }, path: "/api/auth/logout", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/logout.ts" }, { page: false, $POST: { src: "src/routes/api/auth/register.ts?pick=POST", build: () => import('../build/register3.mjs'), import: () => import('../build/register3.mjs') }, path: "/api/auth/register", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/register.ts" }, { page: false, $GET: { src: "src/routes/api/auth/verify.ts?pick=GET", build: () => import('../build/verify2.mjs'), import: () => import('../build/verify2.mjs') }, $HEAD: { src: "src/routes/api/auth/verify.ts?pick=GET", build: () => import('../build/verify2.mjs'), import: () => import('../build/verify2.mjs') }, path: "/api/auth/verify", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/auth/verify.ts" }, { page: false, $GET: { src: "src/routes/api/base-points/count.ts?pick=GET", build: () => import('../build/count2.mjs'), import: () => import('../build/count2.mjs') }, $HEAD: { src: "src/routes/api/base-points/count.ts?pick=GET", build: () => import('../build/count2.mjs'), import: () => import('../build/count2.mjs') }, path: "/api/base-points/count", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/base-points/count.ts" }, { page: false, $DELETE: { src: "src/routes/api/base-points.ts?pick=DELETE", build: () => import('../build/base-points4.mjs'), import: () => import('../build/base-points4.mjs') }, $GET: { src: "src/routes/api/base-points.ts?pick=GET", build: () => import('../build/base-points22.mjs'), import: () => import('../build/base-points22.mjs') }, $HEAD: { src: "src/routes/api/base-points.ts?pick=GET", build: () => import('../build/base-points22.mjs'), import: () => import('../build/base-points22.mjs') }, $POST: { src: "src/routes/api/base-points.ts?pick=POST", build: () => import('../build/base-points32.mjs'), import: () => import('../build/base-points32.mjs') }, path: "/api/base-points", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/base-points.ts" }, { page: false, $POST: { src: "src/routes/api/calculate-squares.ts?pick=POST", build: () => import('../build/calculate-squares2.mjs'), import: () => import('../build/calculate-squares2.mjs') }, path: "/api/calculate-squares", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/calculate-squares.ts" }, { page: false, $GET: { src: "src/routes/api/events.ts?pick=GET", build: () => import('../build/events2.mjs'), import: () => import('../build/events2.mjs') }, $HEAD: { src: "src/routes/api/events.ts?pick=GET", build: () => import('../build/events2.mjs'), import: () => import('../build/events2.mjs') }, path: "/api/events", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/events.ts" }, { page: false, $POST: { src: "src/routes/api/game/join.ts?pick=POST", build: () => import('../build/join2.mjs'), import: () => import('../build/join2.mjs') }, path: "/api/game/join", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/game/join.ts" }, { page: false, $POST: { src: "src/routes/api/game/leave.ts?pick=POST", build: () => import('../build/leave2.mjs'), import: () => import('../build/leave2.mjs') }, path: "/api/game/leave", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/game/leave.ts" }, { page: false, $GET: { src: "src/routes/api/game/status.ts?pick=GET", build: () => import('../build/status2.mjs'), import: () => import('../build/status2.mjs') }, $HEAD: { src: "src/routes/api/game/status.ts?pick=GET", build: () => import('../build/status2.mjs'), import: () => import('../build/status2.mjs') }, path: "/api/game/status", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/game/status.ts" }, { page: false, $GET: { src: "src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET", build: () => import('../build/_tileY_3.mjs'), import: () => import('../build/_tileY_3.mjs') }, $HEAD: { src: "src/routes/api/map/tile/[tileX]/[tileY].ts?pick=GET", build: () => import('../build/_tileY_3.mjs'), import: () => import('../build/_tileY_3.mjs') }, $OPTIONS: { src: "src/routes/api/map/tile/[tileX]/[tileY].ts?pick=OPTIONS", build: () => import('../build/_tileY_22.mjs'), import: () => import('../build/_tileY_22.mjs') }, path: "/api/map/tile/:tileX/:tileY", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/map/tile/[tileX]/[tileY].ts" }, { page: false, $POST: { src: "src/routes/api/reset-game-progress.ts?pick=POST", build: () => import('../build/reset-game-progress2.mjs'), import: () => import('../build/reset-game-progress2.mjs') }, path: "/api/reset-game-progress", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/api/reset-game-progress.ts" }, { page: true, $component: { src: "src/routes/game/index.tsx?pick=default&pick=$css", build: () => import('../build/index22.mjs'), import: () => import('../build/index22.mjs') }, path: "/game/", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/game/index.tsx" }, { page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index32.mjs'), import: () => import('../build/index32.mjs') }, path: "/", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/index.tsx" }, { page: true, $component: { src: "src/routes/login.tsx?pick=default&pick=$css", build: () => import('../build/login22.mjs'), import: () => import('../build/login22.mjs') }, path: "/login", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/login.tsx" }, { page: true, $component: { src: "src/routes/register.tsx?pick=default&pick=$css", build: () => import('../build/register22.mjs'), import: () => import('../build/register22.mjs') }, path: "/register", filePath: "/home/n/data/l/windsurf/solidstart/solid-project/src/routes/register.tsx" }], He = Ue(wt.filter((s) => s.page));
function Ue(s) {
  function e(t, r, o, n) {
    const l = Object.values(t).find((a) => o.startsWith(a.id + "/"));
    return l ? (e(l.children || (l.children = []), r, o.slice(l.id.length)), t) : (t.push({ ...r, id: o, path: o.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), t);
  }
  return s.sort((t, r) => t.path.length - r.path.length).reduce((t, r) => e(t, r, r.path, r.path), []);
}
function qe(s, e) {
  const t = Ge.lookup(s);
  if (t && t.route) {
    const r = e === "HEAD" ? t.route.$HEAD || t.route.$GET : t.route[`$${e}`];
    return r === void 0 ? void 0 : { handler: r, params: t.params };
  }
}
function Be(s) {
  return s.$HEAD || s.$GET || s.$POST || s.$PUT || s.$PATCH || s.$DELETE;
}
const Ge = createRouter$1({ routes: wt.reduce((s, e) => {
  if (!Be(e)) return s;
  let t = e.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (r, o) => `**:${o}`).split("/").map((r) => r.startsWith(":") || r.startsWith("*") ? r : encodeURIComponent(r)).join("/");
  if (/:[^/]*\?/g.test(t)) throw new Error(`Optional parameters are not supported in API routes: ${t}`);
  if (s[t]) throw new Error(`Duplicate API routes for "${t}" found at "${s[t].route.path}" and "${e.path}"`);
  return s[t] = { route: e }, s;
}, {}) }), X = "solidFetchEvent";
function Fe(s) {
  return { request: ke(s), response: We(s), clientAddress: Pe(s), locals: {}, nativeEvent: s };
}
function je(s) {
  if (!s.context[X]) {
    const e = Fe(s);
    s.context[X] = e;
  }
  return s.context[X];
}
class Xe {
  constructor(e) {
    __publicField(this, "event");
    this.event = e;
  }
  get(e) {
    const t = ot(this.event, e);
    return Array.isArray(t) ? t.join(", ") : t || null;
  }
  has(e) {
    return this.get(e) !== void 0;
  }
  set(e, t) {
    return Ie(this.event, e, t);
  }
  delete(e) {
    return Me(this.event, e);
  }
  append(e, t) {
    $e(this.event, e, t);
  }
  getSetCookie() {
    const e = ot(this.event, "Set-Cookie");
    return Array.isArray(e) ? e : [e];
  }
  forEach(e) {
    return Object.entries(U(this.event)).forEach(([t, r]) => e(Array.isArray(r) ? r.join(", ") : r, t, this));
  }
  entries() {
    return Object.entries(U(this.event)).map(([e, t]) => [e, Array.isArray(t) ? t.join(", ") : t])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(U(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(U(this.event)).map((e) => Array.isArray(e) ? e.join(", ") : e)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function We(s) {
  return { get status() {
    return st(s);
  }, set status(e) {
    z(s, e);
  }, get statusText() {
    return Ae(s);
  }, set statusText(e) {
    z(s, st(s), e);
  }, headers: new Xe(s) };
}
var ze = " ";
const Ve = { style: (s) => ssrElement("style", s.attrs, () => s.children, true), link: (s) => ssrElement("link", s.attrs, void 0, true), script: (s) => s.attrs.src ? ssrElement("script", mergeProps(() => s.attrs, { get id() {
  return s.key;
} }), () => ssr(ze), true) : null, noscript: (s) => ssrElement("noscript", s.attrs, () => escape(s.children), true) };
function V(s, e) {
  let { tag: t, attrs: { key: r, ...o } = { key: void 0 }, children: n } = s;
  return Ve[t]({ attrs: { ...o, nonce: e }, key: r, children: n });
}
function Ze(s, e, t, r = "default") {
  return lazy(async () => {
    var _a;
    {
      const n = (await s.import())[r], a = (await ((_a = e.inputs) == null ? void 0 : _a[s.src].assets())).filter((h) => h.tag === "style" || h.attrs.rel === "stylesheet");
      return { default: (h) => [...a.map((m) => V(m)), createComponent(n, h)] };
    }
  });
}
function Et() {
  function s(t) {
    return { ...t, ...t.$$route ? t.$$route.require().route : void 0, info: { ...t.$$route ? t.$$route.require().route.info : {}, filesystem: true }, component: t.$component && Ze(t.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: t.children ? t.children.map(s) : void 0 };
  }
  return He.map(s);
}
let nt;
const Je = isServer ? () => getRequestEvent().routes : () => nt || (nt = Et());
function Ke(s) {
  const e = Ce(s.nativeEvent, "flash");
  if (e) try {
    let t = JSON.parse(e);
    if (!t || !t.result) return;
    const r = [...t.input.slice(0, -1), new Map(t.input[t.input.length - 1])], o = t.error ? new Error(t.result) : t.result;
    return { input: r, url: t.url, pending: false, result: t.thrown ? void 0 : o, error: t.thrown ? o : void 0 };
  } catch (t) {
    console.error(t);
  } finally {
    xe(s.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function Qe(s) {
  const e = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, s.response.headers.set("Content-Type", "text/html"), Object.assign(s, { manifest: await e.json(), assets: [...await e.inputs[e.handler].assets()], router: { submission: Ke(s) }, routes: Et(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const ts = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function Z(s) {
  return s.status && ts.has(s.status) ? s.status : 302;
}
function es(s, e, t = {}, r) {
  return eventHandler({ handler: (o) => {
    const n = je(o);
    return provideRequestEvent(n, async () => {
      const l = qe(new URL(n.request.url).pathname, n.request.method);
      if (l) {
        const y = await l.handler.import(), R = n.request.method === "HEAD" ? y.HEAD || y.GET : y[n.request.method];
        n.params = l.params || {}, sharedConfig.context = { event: n };
        const i = await R(n);
        if (i !== void 0) return i;
        if (n.request.method !== "GET") throw new Error(`API handler for ${n.request.method} "${n.request.url}" did not return a response.`);
      }
      const a = await e(n), u = typeof t == "function" ? await t(a) : { ...t }, h = u.mode || "stream";
      if (u.nonce && (a.nonce = u.nonce), h === "sync") {
        const y = renderToString(() => (sharedConfig.context.event = a, s(a)), u);
        if (a.complete = true, a.response && a.response.headers.get("Location")) {
          const R = Z(a.response);
          return rt(o, a.response.headers.get("Location"), R);
        }
        return y;
      }
      if (u.onCompleteAll) {
        const y = u.onCompleteAll;
        u.onCompleteAll = (R) => {
          at(a)(R), y(R);
        };
      } else u.onCompleteAll = at(a);
      if (u.onCompleteShell) {
        const y = u.onCompleteShell;
        u.onCompleteShell = (R) => {
          it(a, o)(), y(R);
        };
      } else u.onCompleteShell = it(a, o);
      const m = renderToStream(() => (sharedConfig.context.event = a, s(a)), u);
      if (a.response && a.response.headers.get("Location")) {
        const y = Z(a.response);
        return rt(o, a.response.headers.get("Location"), y);
      }
      if (h === "async") return m;
      const { writable: _, readable: T } = new TransformStream();
      return m.pipeTo(_), T;
    });
  } });
}
function it(s, e) {
  return () => {
    if (s.response && s.response.headers.get("Location")) {
      const t = Z(s.response);
      z(e, t), Oe(e, "Location", s.response.headers.get("Location"));
    }
  };
}
function at(s) {
  return ({ write: e }) => {
    s.complete = true;
    const t = s.response && s.response.headers.get("Location");
    t && e(`<script>window.location="${t}"<\/script>`);
  };
}
function ss(s, e, t) {
  return es(s, Qe, e);
}
const Tt = (s) => (e) => {
  const { base: t } = e, r = children(() => e.children), o = createMemo(() => Oe$1(r(), e.base || ""));
  let n;
  const l = Ue$1(s, o, () => n, { base: t, singleFlight: e.singleFlight, transformUrl: e.transformUrl });
  return s.create && s.create(l), createComponent$1(Ce$1.Provider, { value: l, get children() {
    return createComponent$1(os, { routerState: l, get root() {
      return e.root;
    }, get preload() {
      return e.rootPreload || e.rootLoad;
    }, get children() {
      return [(n = getOwner()) && null, createComponent$1(rs, { routerState: l, get branches() {
        return o();
      } })];
    } });
  } });
};
function os(s) {
  const e = s.routerState.location, t = s.routerState.params, r = createMemo(() => s.preload && untrack(() => {
    s.preload({ params: t, location: e, intent: De$1() || "initial" });
  }));
  return createComponent$1(Show, { get when() {
    return s.root;
  }, keyed: true, get fallback() {
    return s.children;
  }, children: (o) => createComponent$1(o, { params: t, location: e, get data() {
    return r();
  }, get children() {
    return s.children;
  } }) });
}
function rs(s) {
  if (isServer) {
    const o = getRequestEvent();
    if (o && o.router && o.router.dataOnly) {
      ns(o, s.routerState, s.branches);
      return;
    }
    o && ((o.router || (o.router = {})).matches || (o.router.matches = s.routerState.matches().map(({ route: n, path: l, params: a }) => ({ path: n.originalPath, pattern: n.pattern, match: l, params: a, info: n.info }))));
  }
  const e = [];
  let t;
  const r = createMemo(on(s.routerState.matches, (o, n, l) => {
    let a = n && o.length === n.length;
    const u = [];
    for (let h = 0, m = o.length; h < m; h++) {
      const _ = n && n[h], T = o[h];
      l && _ && T.route.key === _.route.key ? u[h] = l[h] : (a = false, e[h] && e[h](), createRoot((y) => {
        e[h] = y, u[h] = ze$1(s.routerState, u[h - 1] || s.routerState.base, ct(() => r()[h + 1]), () => s.routerState.matches()[h]);
      }));
    }
    return e.splice(o.length).forEach((h) => h()), l && a ? l : (t = u[0], u);
  }));
  return ct(() => r() && t)();
}
const ct = (s) => () => createComponent$1(Show, { get when() {
  return s();
}, keyed: true, children: (e) => createComponent$1(ee.Provider, { value: e, get children() {
  return e.outlet();
} }) });
function ns(s, e, t) {
  const r = new URL(s.request.url), o = I$2(t, new URL(s.router.previousUrl || s.request.url).pathname), n = I$2(t, r.pathname);
  for (let l = 0; l < n.length; l++) {
    (!o[l] || n[l].route !== o[l].route) && (s.router.dataOnly = true);
    const { route: a, params: u } = n[l];
    a.preload && a.preload({ params: u, location: e.location, intent: "preload" });
  }
}
function is([s, e], t, r) {
  return [s, r ? (o) => e(r(o)) : e];
}
function as(s) {
  let e = false;
  const t = (o) => typeof o == "string" ? { value: o } : o, r = is(createSignal(t(s.get()), { equals: (o, n) => o.value === n.value && o.state === n.state }), void 0, (o) => (!e && s.set(o), sharedConfig.registry && !sharedConfig.done && (sharedConfig.done = true), o));
  return s.init && onCleanup(s.init((o = s.get()) => {
    e = true, r[1](t(o)), e = false;
  })), Tt({ signal: r, create: s.create, utils: s.utils });
}
function cs(s, e, t) {
  return s.addEventListener(e, t), () => s.removeEventListener(e, t);
}
function ls(s, e) {
  const t = s && document.getElementById(s);
  t ? t.scrollIntoView() : e && window.scrollTo(0, 0);
}
function us(s) {
  const e = new URL(s);
  return e.pathname + e.search;
}
function ps(s) {
  let e;
  const t = { value: s.url || (e = getRequestEvent()) && us(e.request.url) || "" };
  return Tt({ signal: [() => t, (r) => Object.assign(t, r)] })(s);
}
const ds = /* @__PURE__ */ new Map();
function hs(s = true, e = false, t = "/_server", r) {
  return (o) => {
    const n = o.base.path(), l = o.navigatorFactory(o.base);
    let a, u;
    function h(i) {
      return i.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function m(i) {
      if (i.defaultPrevented || i.button !== 0 || i.metaKey || i.altKey || i.ctrlKey || i.shiftKey) return;
      const c = i.composedPath().find((w) => w instanceof Node && w.nodeName.toUpperCase() === "A");
      if (!c || e && !c.hasAttribute("link")) return;
      const d = h(c), p = d ? c.href.baseVal : c.href;
      if ((d ? c.target.baseVal : c.target) || !p && !c.hasAttribute("state")) return;
      const S = (c.getAttribute("rel") || "").split(/\s+/);
      if (c.hasAttribute("download") || S && S.includes("external")) return;
      const f = d ? new URL(p, document.baseURI) : new URL(p);
      if (!(f.origin !== window.location.origin || n && f.pathname && !f.pathname.toLowerCase().startsWith(n.toLowerCase()))) return [c, f];
    }
    function _(i) {
      const c = m(i);
      if (!c) return;
      const [d, p] = c, g = o.parsePath(p.pathname + p.search + p.hash), S = d.getAttribute("state");
      i.preventDefault(), l(g, { resolve: false, replace: d.hasAttribute("replace"), scroll: !d.hasAttribute("noscroll"), state: S ? JSON.parse(S) : void 0 });
    }
    function T(i) {
      const c = m(i);
      if (!c) return;
      const [d, p] = c;
      r && (p.pathname = r(p.pathname)), o.preloadRoute(p, d.getAttribute("preload") !== "false");
    }
    function y(i) {
      clearTimeout(a);
      const c = m(i);
      if (!c) return u = null;
      const [d, p] = c;
      u !== d && (r && (p.pathname = r(p.pathname)), a = setTimeout(() => {
        o.preloadRoute(p, d.getAttribute("preload") !== "false"), u = d;
      }, 20));
    }
    function R(i) {
      if (i.defaultPrevented) return;
      let c = i.submitter && i.submitter.hasAttribute("formaction") ? i.submitter.getAttribute("formaction") : i.target.getAttribute("action");
      if (!c) return;
      if (!c.startsWith("https://action/")) {
        const p = new URL(c, ve$1);
        if (c = o.parsePath(p.pathname + p.search), !c.startsWith(t)) return;
      }
      if (i.target.method.toUpperCase() !== "POST") throw new Error("Only POST forms are supported for Actions");
      const d = ds.get(c);
      if (d) {
        i.preventDefault();
        const p = new FormData(i.target, i.submitter);
        d.call({ r: o, f: i.target }, i.target.enctype === "multipart/form-data" ? p : new URLSearchParams(p));
      }
    }
    delegateEvents(["click", "submit"]), document.addEventListener("click", _), s && (document.addEventListener("mousemove", y, { passive: true }), document.addEventListener("focusin", T, { passive: true }), document.addEventListener("touchstart", T, { passive: true })), document.addEventListener("submit", R), onCleanup(() => {
      document.removeEventListener("click", _), s && (document.removeEventListener("mousemove", y), document.removeEventListener("focusin", T), document.removeEventListener("touchstart", T)), document.removeEventListener("submit", R);
    });
  };
}
function ms(s) {
  if (isServer) return ps(s);
  const e = () => {
    const r = window.location.pathname.replace(/^\/+/, "/") + window.location.search, o = window.history.state && window.history.state._depth && Object.keys(window.history.state).length === 1 ? void 0 : window.history.state;
    return { value: r + window.location.hash, state: o };
  }, t = ge();
  return as({ get: e, set({ value: r, replace: o, scroll: n, state: l }) {
    o ? window.history.replaceState(_e$1(l), "", r) : window.history.pushState(l, "", r), ls(decodeURIComponent(window.location.hash.slice(1)), n), Q();
  }, init: (r) => cs(window, "popstate", qe$1(r, (o) => {
    if (o && o < 0) return !t.confirm(o);
    {
      const n = e();
      return !t.confirm(n.value, { state: n.state });
    }
  })), create: hs(s.preload, s.explicitLinks, s.actionBase, s.transformUrl), utils: { go: (r) => window.history.go(r), beforeLeave: t } })(s);
}
function fs() {
  const [s, e] = createSignal(false);
  return I$3(), null;
}
const gs = () => createComponent$1(ms, { root: (s) => createComponent$1(I$4, { get children() {
  return createComponent$1(E$2, { get children() {
    return createComponent$1(U$1, { get children() {
      return createComponent$1(Suspense, { get children() {
        return [s.children, createComponent$1(fs, {})];
      } });
    } });
  } });
} }), get children() {
  return createComponent$1(Je, {});
} }), Rt = isServer ? (s) => {
  const e = getRequestEvent();
  return e.response.status = s.code, e.response.statusText = s.text, onCleanup(() => !e.nativeEvent.handled && !e.complete && (e.response.status = 200)), null;
} : (s) => null;
var ys = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">', "</span>"], ws = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">500 | Internal Server Error</span>'];
const Es = (s) => {
  const e = isServer ? "500 | Internal Server Error" : "Error | Uncaught Client Exception";
  return createComponent$1(ErrorBoundary, { fallback: (t) => (console.error(t), [ssr(ys, ssrHydrationKey(), escape(e)), createComponent$1(Rt, { code: 500 })]), get children() {
    return s.children;
  } });
}, Ts = (s) => {
  let e = false;
  const t = catchError(() => s.children, (r) => {
    console.error(r), e = !!r;
  });
  return e ? [ssr(ws, ssrHydrationKey()), createComponent$1(Rt, { code: 500 })] : t;
};
var lt = ["<script", ">", "<\/script>"], Rs = ["<script", ' type="module"', " async", "><\/script>"], Ss = ["<script", ' type="module" async', "><\/script>"];
const bs = ssr("<!DOCTYPE html>");
function St(s, e, t = []) {
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    if (o.path !== s[0].path) continue;
    let n = [...t, o];
    if (o.children) {
      const l = s.slice(1);
      if (l.length === 0 || (n = St(l, o.children, n), !n)) continue;
    }
    return n;
  }
}
function _s(s) {
  const e = getRequestEvent(), t = e.nonce;
  let r = [];
  return Promise.resolve().then(async () => {
    let o = [];
    if (e.router && e.router.matches) {
      const n = [...e.router.matches];
      for (; n.length && (!n[0].info || !n[0].info.filesystem); ) n.shift();
      const l = n.length && St(n, e.routes);
      if (l) {
        const a = globalThis.MANIFEST.client.inputs;
        for (let u = 0; u < l.length; u++) {
          const h = l[u], m = a[h.$component.src];
          o.push(m.assets());
        }
      }
    }
    r = await Promise.all(o).then((n) => [...new Map(n.flat().map((l) => [l.attrs.key, l])).values()].filter((l) => l.attrs.rel === "modulepreload" && !e.assets.find((a) => a.attrs.key === l.attrs.key)));
  }), useAssets(() => r.length ? r.map((o) => V(o)) : void 0), createComponent$1(NoHydration, { get children() {
    return [bs, createComponent$1(Ts, { get children() {
      return createComponent$1(s.document, { get assets() {
        return [createComponent$1(HydrationScript, {}), e.assets.map((o) => V(o, t))];
      }, get scripts() {
        return t ? [ssr(lt, ssrHydrationKey() + ssrAttribute("nonce", escape(t, true), false), `window.manifest = ${JSON.stringify(e.manifest)}`), ssr(Rs, ssrHydrationKey(), ssrAttribute("nonce", escape(t, true), false), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))] : [ssr(lt, ssrHydrationKey(), `window.manifest = ${JSON.stringify(e.manifest)}`), ssr(Ss, ssrHydrationKey(), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))];
      }, get children() {
        return createComponent$1(Hydration, { get children() {
          return createComponent$1(Es, { get children() {
            return createComponent$1(gs, {});
          } });
        } });
      } });
    } })];
  } });
}
async function vs(s, e = []) {
  const t = performance$1.now(), r = await s.all("SELECT game_created_at_ms as id, x, y FROM base_points ORDER BY game_created_at_ms");
  if (console.log(`[Cleanup] Checking ${r.length} points`), r.length <= 1) return console.log("[Cleanup] Not enough points to check for lines"), { points: [], duration: 0 };
  const o = [];
  try {
    let n = [];
    if (e.length > 0) {
      const i = /* @__PURE__ */ new Set(), c = (d) => {
        i.add(d), d !== 0 && i.add(1 / d), i.add(-d), d !== 0 && i.add(-1 / d);
      };
      e.forEach((d) => c(d)), n = Array.from(i);
    } else n = h(2);
    const l = x(n), a = /* @__PURE__ */ new Map();
    n.forEach((i) => {
      const c = Math.round(Math.abs(i) * 100) / 100;
      a.has(c) || a.set(c, []), a.get(c).push(i);
    });
    const u = await s.all(`
      WITH points_with_ts AS (
        SELECT 
          id,
          x,
          y,
          game_created_at_ms,
          ROW_NUMBER() OVER (PARTITION BY x ORDER BY game_created_at_ms) as rn
        FROM base_points
        WHERE (x, y) != (0, 0)  -- Exclude (0,0) from cleanup
      )
      SELECT 
        x,
        GROUP_CONCAT(id) as point_ids,
        GROUP_CONCAT(y) as y_coords,
        GROUP_CONCAT(game_created_at_ms) as timestamps,
        COUNT(*) as point_count
      FROM points_with_ts
      GROUP BY x
      HAVING point_count > 1
      ORDER BY point_count DESC
    `);
    for (const i of u) {
      const c = i.point_ids.split(",").map(Number), d = i.y_coords.split(",").map(Number), p = i.timestamps.split(",").map(Number), g = c.map((f, w) => ({ id: f, x: i.x, y: d[w], game_created_at_ms: p[w] })), S = g.reduce((f, w) => w.game_created_at_ms < f.game_created_at_ms ? w : f);
      for (const f of g) f.id !== S.id && !(f.x === 0 && f.y === 0) && (o.some((w) => w.id === f.id) || o.push(f));
    }
    const h$1 = await s.all(`
      SELECT 
        y,
        GROUP_CONCAT(id) as point_ids,
        GROUP_CONCAT(x) as x_coords,
        GROUP_CONCAT(game_created_at_ms) as timestamps,
        COUNT(*) as point_count
      FROM base_points
      WHERE (x, y) != (0, 0)  -- Exclude (0,0) from cleanup
      GROUP BY y
      HAVING point_count > 1
      ORDER BY point_count DESC
    `);
    for (const i of h$1) {
      const c = i.point_ids.split(",").map(Number), d = i.x_coords.split(",").map(Number), p = i.timestamps.split(",").map(Number), g = c.map((f, w) => ({ id: f, x: d[w], y: i.y, game_created_at_ms: p[w] })), S = g.reduce((f, w) => w.game_created_at_ms < f.game_created_at_ms ? w : f);
      for (const f of g) f.id !== S.id && !(f.x === 0 && f.y === 0) && (o.some((w) => w.id === f.id) || o.push(f));
    }
    const m = 5, _ = [];
    for (let i = 0; i < n.length; i += m) {
      const c = n.slice(i, i + m), d = x(c);
      console.log(`[Cleanup] Processing slopes batch ${i / m + 1}/${Math.ceil(n.length / m)}`);
      try {
        const p = await s.all(`
          SELECT 
            p1.id as p1_id, p1.x as p1_x, p1.y as p1_y, p1.game_created_at_ms as p1_created_at,
            p2.id as p2_id, p2.x as p2_x, p2.y as p2_y, p2.game_created_at_ms as p2_created_at
          FROM base_points p1
          JOIN base_points p2 ON p1.id < p2.id
          WHERE ${d}
            AND NOT (p1.x = 0 AND p1.y = 0)  -- Exclude (0,0) from cleanup
            AND NOT (p2.x = 0 AND p2.y = 0)  -- Exclude (0,0) from cleanup
        `);
        _.push(...p);
      } catch (p) {
        console.error(`[Cleanup] Error processing slopes batch ${i / m + 1}:`, p);
      }
    }
    const T = /* @__PURE__ */ new Map();
    for (const i of _) {
      const c = i.p2_y - i.p1_y, d = i.p1_x - i.p2_x, p = i.p2_x * i.p1_y - i.p1_x * i.p2_y, g = `${c}_${d}_${p}`;
      T.has(g) || T.set(g, []);
      const S = { id: i.p1_id, x: i.p1_x, y: i.p1_y, game_created_at_ms: i.p1_created_at }, f = { id: i.p2_id, x: i.p2_x, y: i.p2_y, game_created_at_ms: i.p2_created_at };
      T.get(g).some((w) => w.id === S.id) || T.get(g).push(S), T.get(g).some((w) => w.id === f.id) || T.get(g).push(f);
    }
    for (const [i, c] of T.entries()) {
      if (c.length < 2) continue;
      const d = c.reduce((p, g) => g.game_created_at_ms < p.game_created_at_ms ? g : p);
      for (const p of c) p.id !== d.id && (o.some((g) => g.id === p.id) || o.push(p));
    }
    const R = performance$1.now() - t;
    return console.log(`[Cleanup] Found ${o.length} points to remove`), { points: o, duration: R };
  } catch (n) {
    const a = performance$1.now() - t;
    return console.error("[Cleanup] Error in getPointsInLines:", { message: n instanceof Error ? n.message : "Unknown error", stack: n instanceof Error ? n.stack : void 0, duration: `${a.toFixed(2)}ms`, timestamp: (/* @__PURE__ */ new Date()).toISOString() }), { points: [], duration: a };
  }
}
const G = 64;
function Ps(s, e) {
  return { tileX: Math.floor(s / G), tileY: Math.floor(e / G) };
}
function As(s, e) {
  const t = Ps(s, e), r = [t], o = (s + 1) % G === 0, n = (e + 1) % G === 0;
  return o && r.push({ tileX: t.tileX + 1, tileY: t.tileY }), n && r.push({ tileX: t.tileX, tileY: t.tileY + 1 }), o && n && r.push({ tileX: t.tileX + 1, tileY: t.tileY + 1 }), r;
}
const _I = class _I {
  constructor() {
    __publicField(this, "isInitialized", false);
  }
  static getInstance() {
    return _I.instance || (_I.instance = new _I()), _I.instance;
  }
  initialize() {
    this.isInitialized || (l.on("created", (e) => this.handleBasePointChange(e)), l.on("updated", (e) => this.handleBasePointChange(e)), l.on("deleted", (e) => this.handleBasePointChange(e)), this.isInitialized = true);
  }
  handleBasePointChange(e) {
    try {
      const t = As(e.x, e.y);
      for (const { tileX: r, tileY: o } of t) g.invalidate(r, o);
    } catch (t) {
      console.error("Error handling base point change:", t);
    }
  }
  invalidateArea(e, t, r, o) {
    const n = this.worldToTileCoords(e, t), l = this.worldToTileCoords(r, o);
    for (let a = Math.min(n.tileY, l.tileY); a <= Math.max(n.tileY, l.tileY); a++) for (let u = Math.min(n.tileX, l.tileX); u <= Math.max(n.tileX, l.tileX); u++) g.invalidate(u, a);
  }
  worldToTileCoords(e, t) {
    return { tileX: Math.floor(e / 64), tileY: Math.floor(t / 64) };
  }
};
__publicField(_I, "instance");
let I = _I;
const bt = I.getInstance();
bt.initialize();
const Is = { up: [0, 0], down: [0, 0], right: [0, 0], left: [0, 0] };
async function $s(s, e, t) {
  try {
    const { getDb: r } = await Promise.resolve().then(function () { return dbPRkUVSC; }).then((y) => y.d), { BasePointRepository: o$1 } = await Promise.resolve().then(function () { return dbPRkUVSC; }).then((y) => y.c), n = await r(), a = await new o$1(n).getAll();
    if (!Array.isArray(a)) throw new Error(`Expected basePoints to be an array, got ${typeof a}`);
    const u = a.length > 0 ? [...new Map(a.map((y) => [`${y.x},${y.y}`, y])).values()] : [], [h, m] = Is[t], _ = s.flatMap((y) => {
      const R = y % o.GRID_SIZE - e[0], i = Math.floor(y / o.GRID_SIZE) - e[1];
      return u.flatMap(({ x: c, y: d }) => {
        if (c === R && d === i) return [];
        const p = Math.abs(R - c), g = Math.abs(i - d);
        if (p === 0 || g === 0 || p === g || 2 * p === g || 2 * g === p || 3 * p === g || 3 * g === p || 5 * p === g || 5 * g === p) {
          const S = R + e[0] + h, f = i + e[1] + m;
          return S >= 0 && S < o.GRID_SIZE && f >= 0 && f < o.GRID_SIZE ? [S + f * o.GRID_SIZE] : [];
        }
        return [];
      });
    }), T = new Set(s);
    return [...new Set(_)].filter((y) => T.has(y));
  } catch (r) {
    return console.error("Error in calculateRestrictedSquaresForSimulation:", r), [];
  }
}
const _$ = class _$ {
  constructor() {
    __publicField(this, "moveDirection");
    __publicField(this, "moveCount", 0);
    __publicField(this, "totalMoves", 0);
    __publicField(this, "isRunning", false);
    __publicField(this, "simulationInterval", null);
    __publicField(this, "GRID_SIZE", 15);
    __publicField(this, "VIEW_RADIUS", Math.floor(this.GRID_SIZE / 2));
    __publicField(this, "MAX_COORDINATE", 1e3);
    __publicField(this, "playerPosition", { x: 0, y: 0 });
    __publicField(this, "placedBasePoints", [{ x: 0, y: 0 }]);
    __publicField(this, "restrictedSquares", []);
    const e = ["right", "left", "up", "down"];
    this.moveDirection = e[Math.floor(Math.random() * e.length)];
  }
  static getInstance() {
    return _$.instance || (_$.instance = new _$()), _$.instance;
  }
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const e = parseInt(process.env.SIMULATION_MOVE_DELAY || "1000", 10), t = parseInt(process.env.SIMULATION_NUM_POINTS || "800", 10);
    process.env.SIMULATION_START_X && process.env.SIMULATION_START_Y ? this.playerPosition = { x: parseInt(process.env.SIMULATION_START_X, 10), y: parseInt(process.env.SIMULATION_START_Y, 10) } : (this.playerPosition = { x: randomInt(-this.MAX_COORDINATE, this.MAX_COORDINATE + 1), y: randomInt(-this.MAX_COORDINATE, this.MAX_COORDINATE + 1) }, console.log(`Using random starting position: [${this.playerPosition.x}, ${this.playerPosition.y}]`)), console.log("\u{1F680} Starting simulation service with:"), console.log(`- Starting position: [${this.playerPosition.x}, ${this.playerPosition.y}]`), console.log(`- Target points: ${t}`), console.log(`- Move delay: ${e}ms`), console.log("\u{1F504} Preparing simulation environment..."), await this.resetBasePoints(), await this.fetchRestrictedSquares(), this.simulationInterval = setInterval(async () => {
      try {
        await this.simulationStep();
      } catch (r) {
        console.error("Error in simulation step:", r);
      }
    }, e);
  }
  stop() {
    this.simulationInterval && (clearInterval(this.simulationInterval), this.simulationInterval = null), this.isRunning = false;
  }
  isSimulationRunning() {
    return this.isRunning;
  }
  async simulationStep() {
    const e = this.playerPosition.x + randomInt(-this.VIEW_RADIUS, this.VIEW_RADIUS) + this.VIEW_RADIUS, t = this.playerPosition.y + randomInt(-this.VIEW_RADIUS, this.VIEW_RADIUS) + this.VIEW_RADIUS;
    if (e < -this.MAX_COORDINATE || e > this.MAX_COORDINATE || t < -this.MAX_COORDINATE || t > this.MAX_COORDINATE) {
      await this.moveToNewPosition();
      return;
    }
    await this.placeBasePoint(e, t), await this.moveToNewPosition();
  }
  async resetBasePoints() {
    const e = await u$1();
    try {
      await e.get("SELECT id FROM users WHERE id = ?", ["simulation"]) || (console.log("Creating simulation user..."), await e.run("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)", ["simulation", "simulation", "simulation_hashed_password"]), console.log("\u2705 Created simulation user")), console.log("\u{1F9F9} Resetting base points for simulation...");
      const r = await f$1(), o = await r.getByUser("simulation");
      for (const n of o) await r.deleteBasePoint(n.id);
      console.log(`\u2705 Successfully deleted ${o.length} base points from database`), this.placedBasePoints = [], console.log("Adding (0,0) base point for simulation..."), await r.add("simulation", 0, 0), this.placedBasePoints = [{ x: 0, y: 0 }], console.log("\u2705 Successfully added (0,0) base point for simulation");
    } catch (t) {
      throw console.error("Error resetting base points:", t), t;
    }
  }
  async fetchRestrictedSquares(e = "up") {
    try {
      const t = this.GRID_SIZE, r = Math.floor(t / 2), o = { left: -this.playerPosition.x, right: -this.playerPosition.x + 15, top: -this.playerPosition.y, bottom: -this.playerPosition.y + 15 }, n = [];
      switch (e) {
        case "up":
          for (let a = o.left; a <= o.right; a++) {
            const u = o.top, h = (a % t + t) % t, m = (u % t + t) % t;
            n.push(m * t + h);
          }
          break;
        case "down":
          for (let a = o.left; a <= o.right; a++) {
            const u = o.bottom, h = (a % t + t) % t, m = (u % t + t) % t;
            n.push(m * t + h);
          }
          break;
        case "left":
          for (let a = o.top; a <= o.bottom; a++) {
            const h = (o.left % t + t) % t, m = (a % t + t) % t;
            n.push(m * t + h);
          }
          break;
        case "right":
          for (let a = o.top; a <= o.bottom; a++) {
            const h = (o.right % t + t) % t, m = (a % t + t) % t;
            n.push(m * t + h);
          }
          break;
      }
      const l = await $s(Array.from({ length: 225 }, (a, u) => u), [-this.playerPosition.x, -this.playerPosition.y], e);
      return this.restrictedSquares = l.map((a$1) => {
        const u = a$1 % t + this.playerPosition.x, h = Math.floor(a$1 / t) + this.playerPosition.y;
        return a(u, h);
      }), this.restrictedSquares;
    } catch (t) {
      return console.error("Error in fetchRestrictedSquares:", t), this.restrictedSquares = [], [];
    }
  }
  isRestricted(e, t) {
    return e === -this.playerPosition.x + this.VIEW_RADIUS && t === -this.playerPosition.y + this.VIEW_RADIUS ? true : this.restrictedSquares.some((r) => r[0] === e && r[1] === t);
  }
  async placeBasePoint(e, t) {
    try {
      return this.placedBasePoints.find((n) => n.x === e && n.y === t) || this.isRestricted(e, t) ? false : (await (await f$1()).add("simulation", e, t), this.placedBasePoints.push({ x: e, y: t }), l.emitCreated({ x: e, y: t, userId: "simulation", id: Date.now(), createdAtMs: Date.now() }), console.log(`\u2705 Placed base point at [${e}, ${t}] (Total: ${this.placedBasePoints.length})`), true);
    } catch (r) {
      return console.error(`Failed to place base point at (${e}, ${t}):`, r), false;
    }
  }
  async moveToNewPosition() {
    let e = 0, t = 0;
    const r = { right: [{ dx: 1, dy: 0 }, { dx: 0, dy: -1 }], left: [{ dx: -1, dy: 0 }, { dx: 0, dy: 1 }], up: [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }], down: [{ dx: 0, dy: 1 }, { dx: 1, dy: 0 }] };
    if (this.moveCount % 200 === 0 && this.moveCount > 0) {
      const m = ["right", "left", "up", "down"].filter((_) => _ !== this.moveDirection);
      this.moveDirection = m[Math.floor(Math.random() * m.length)], console.log(`Changed direction to: ${this.moveDirection} after ${this.moveCount} moves`);
    }
    const o = r[this.moveDirection], n = o[Math.floor(Math.random() * o.length)];
    this.moveCount++, e = n.dx, t = n.dy;
    const l = Math.max(-this.MAX_COORDINATE, Math.min(this.MAX_COORDINATE, -this.playerPosition.x - e)), a = Math.max(-this.MAX_COORDINATE, Math.min(this.MAX_COORDINATE, -this.playerPosition.y - t));
    this.totalMoves++, this.playerPosition = { x: -l, y: -a };
    let u = "up";
    e > 0 ? u = "left" : e < 0 && (u = "right"), t > 0 ? u = "up" : t < 0 && (u = "down"), await this.fetchRestrictedSquares(u);
  }
};
__publicField(_$, "instance");
let $ = _$;
const W = $.getInstance();
const _C = class _C {
  constructor() {
    __publicField(this, "isInitialized", false);
    __publicField(this, "cleanupInterval", null);
  }
  static getInstance() {
    return _C.instance || (_C.instance = new _C()), _C.instance;
  }
  async initialize() {
    if (this.isInitialized) {
      console.log("Server already initialized, skipping...");
      return;
    }
    this.isInitialized = true, console.log("Initializing server...");
    try {
      if (console.log("Skipping migrations in production (already handled during build)"), bt.initialize(), process.env.ENABLE_SIMULATION === "true") try {
        await W.start(), console.log("Simulation service started");
      } catch (e) {
        console.error("Failed to start simulation service:", e);
      }
      this.setupCleanupInterval(), console.log("Server initialization complete");
    } catch (e) {
      console.error("Failed to initialize server:", e), process.exit(1);
    }
  }
  async cleanup() {
    this.cleanupInterval && (clearInterval(this.cleanupInterval), this.cleanupInterval = null), process.env.ENABLE_SIMULATION === "true" && W.isSimulationRunning() && (W.stop(), console.log("Simulation service stopped")), this.isInitialized = false;
  }
  setupCleanupInterval() {
    this.cleanupInterval && clearInterval(this.cleanupInterval), console.log("[Cleanup] Setting up cleanup interval (every 10s)"), this.cleanupInterval = setInterval(async () => {
      console.log("[Cleanup] Cleanup interval triggered");
      const e = performance.now();
      try {
        const t = await u$1(), r = await f$1(), o = h(16), n = performance.now(), l = await r.getCountExcludingOrigin(), a = await r.getTotalCount();
        console.log(`[Cleanup] Initial count: ${l} (excluding origin), ${a} (total)`);
        const h$1 = [...[...new Set(o.filter((c) => Math.abs(c) >= 1).map((c) => Math.round(Math.abs(c))))]].sort((c, d) => c - d);
        console.log(`
          [Cleanup] Starting cleanup with slopes: ${h$1.join(", ")}
        `);
        const { points: m, duration: _ } = await vs(t, o);
        if (m.length > 0) {
          console.log(`[Cleanup] Removing ${m.length} points in batches...`);
          const c = 10, d = await f$1();
          let p = 0;
          const g = performance.now();
          for (let w = 0; w < m.length; w += c) {
            const O = m.slice(w, w + c);
            try {
              O.length > 1 ? await d.deletePoints(O) : O.length === 1 && await d.deleteBasePoint(O[0].id), p += O.length, w % (c * 5) === 0 && console.log(`[Cleanup] Progress: ${p}/${m.length} points...`), w + c < m.length && await new Promise((F) => setTimeout(F, 10));
            } catch (F) {
              console.error(`[Cleanup] Error in batch ${w / c + 1}:`, F);
            }
          }
          const S = performance.now() - g, f = performance.now() - n;
          f > 5e3 && console.warn(`[Cleanup] WARNING: Cleanup took ${(f / 1e3).toFixed(2)}s (over 5s threshold)`), console.log(`[Cleanup] Removed ${p} points in ${S.toFixed(2)}ms (total: ${f.toFixed(2)}ms)`);
        }
        const T = await r.getCountExcludingOrigin(), y = await r.getTotalCount();
        console.log(`[Cleanup] Final count: ${T} (excluding origin), ${y} (total)`);
        const R = 800;
        if (T >= R) {
          console.log(`[World Reset] Triggering world reset - ${T} non-origin points reached the threshold of ${R}`), await t.run("DELETE FROM base_points WHERE x != 0 OR y != 0"), await t.run("DELETE FROM map_tiles");
          const { getOldestPrimeTimestamp: c } = await Promise.resolve().then(function () { return randomSlopesIzTC2X1N; }), d = c(), { basePointEventService: p } = await Promise.resolve().then(function () { return basePointEventsC2UNy6C4; }), g = { type: "worldReset", reason: "base_point_threshold_reached", threshold: R, pointsBeforeReset: T, timestamp: (/* @__PURE__ */ new Date()).toISOString(), oldestPrimeTimestamp: d };
          p.broadcast("worldReset", g), console.log("[World Reset] World has been reset. All non-origin base points and map tiles have been cleared.");
        } else {
          const { getOldestPrimeTimestamp: c } = await Promise.resolve().then(function () { return randomSlopesIzTC2X1N; }), d = c(), { basePointEventService: p } = await Promise.resolve().then(function () { return basePointEventsC2UNy6C4; }), g = { type: "cleanup", initialCount: l, totalBasePoints: T, totalIncludingOrigin: y, timestamp: (/* @__PURE__ */ new Date()).toISOString(), oldestPrimeTimestamp: d };
          p.broadcast("cleanup", g);
        }
        const i = performance.now();
        console.log(`[Cleanup] Cleanup completed in ${(i - e).toFixed(0)}ms`);
      } catch (t) {
        console.error("[Cleanup] Error:", t);
      }
    }, 1e4);
  }
};
__publicField(_C, "instance");
let C = _C;
const Cs = C.getInstance();
var xs = ["<title", ">Superstar</title>"], Os = ['<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg" type="image/svg+xml">', "", "</head>"], Ds = ["<html", ' lang="en">', '<body><div id="app">', "</div><!--$-->", "<!--/--></body></html>"];
Cs.initialize();
const no = ss(() => createComponent$1(_s, { document: ({ assets: s, children: e, scripts: t }) => ssr(Ds, ssrHydrationKey(), createComponent$1(NoHydration, { get children() {
  return ssr(Os, escape(createComponent$1(I$4, { get children() {
    return ssr(xs, ssrHydrationKey());
  } })), escape(s));
} }), escape(e), escape(t)) }));

const handlers = [
  { route: '', handler: _FOfmEv, lazy: false, middleware: true, method: undefined },
  { route: '/_server', handler: Et$1, lazy: false, middleware: true, method: undefined },
  { route: '/', handler: no, lazy: false, middleware: true, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b$3(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C$2(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  {
    const _handler = h3App.handler;
    h3App.handler = (event) => {
      const ctx = { event };
      return nitroAsyncContext.callAsync(ctx, () => _handler(event));
    };
  }
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    debug("received shut down signal", signal);
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((error) => {
      debug("server shut down error occurred", error);
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    debug("Destroy Connections : " + (force ? "forced close" : "close"));
    let counter = 0;
    let secureCounter = 0;
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        counter++;
        destroy(socket);
      }
    }
    debug("Connections destroyed : " + counter);
    debug("Connection Counter    : " + connectionCounter);
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        secureCounter++;
        destroy(socket);
      }
    }
    debug("Secure Connections destroyed : " + secureCounter);
    debug("Secure Connection Counter    : " + secureConnectionCounter);
  }
  server.on("request", (req, res) => {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", () => {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", () => {
    debug("closed");
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      debug("Close http server");
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    debug("shutdown signal - " + sig);
    if (options.development) {
      debug("DEV-Mode - immediate forceful shutdown");
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          debug("executing finally()");
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      debug(`waitForReadyToShutDown... ${totalNumInterval}`);
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        debug("All connections closed. Continue to shutting down");
        return Promise.resolve(false);
      }
      debug("Schedule the next waitForReadyToShutdown");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    debug("shutting down");
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      debug("Do onShutdown now");
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((error) => {
      const errString = typeof error === "string" ? error : JSON.stringify(error);
      debug(errString);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT || "", 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((error) => {
          console.error(error);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
const server = cert && key ? new Server({ key, cert }, toNodeListener(nitroApp.h3App)) : new Server$1(toNodeListener(nitroApp.h3App));
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const path = process.env.NITRO_UNIX_SOCKET;
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const addressInfo = listener.address();
  if (typeof addressInfo === "string") {
    console.log(`Listening on unix socket ${addressInfo}`);
    return;
  }
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${addressInfo.family === "IPv6" ? `[${addressInfo.address}]` : addressInfo.address}:${addressInfo.port}${baseURL}`;
  console.log(`Listening on ${url}`);
});
trapUnhandledNodeErrors();
setupGracefulShutdown(listener, nitroApp);
const nodeServer = {};

export { $e$1 as $, E$1 as E, I$1 as I, Me$1 as M, Tt$1 as T, We$1 as W, I$3 as a, a as b, p$1 as c, d$1 as d, Ie$1 as e, f$1 as f, g, k, l, nodeServer as n, o, p, t, u$1 as u };
//# sourceMappingURL=nitro.mjs.map
