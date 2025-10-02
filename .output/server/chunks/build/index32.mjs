import { ssr, ssrHydrationKey, ssrAttribute, escape, createComponent } from 'solid-js/web';
import { k } from '../nitro/nitro.mjs';
import { A } from './components-D3RSgNPK.mjs';
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
import 'solid-js/web/storage';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import 'perf_hooks';
import 'events';
import 'crypto';

const a = "_container_cvtnb_3", o = "_title_cvtnb_14", m = "_links_cvtnb_21", f = "_link_cvtnb_21", t = { container: a, title: o, links: m, link: f };
var u = ["<div", "><!--$-->", "<!--/--><h1", ">Welcome</h1><div", "><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--></div></div>"];
function v() {
  return ssr(u, ssrHydrationKey() + ssrAttribute("class", escape(t.container, true), false), escape(createComponent(k, { children: "Superstar" })), ssrAttribute("class", escape(t.title, true), false), ssrAttribute("class", escape(t.links, true), false), escape(createComponent(A, { href: "/login", get class() {
    return t.link;
  }, children: "Login" })), escape(createComponent(A, { href: "/register", get class() {
    return t.link;
  }, children: "Create Account" })), escape(createComponent(A, { href: "/game", get class() {
    return t.link;
  }, children: "Enter Game" })), escape(createComponent(A, { href: "/api/admin/performance", get class() {
    return t.link;
  }, children: "Performance Metrics" })));
}

export { v as default };
//# sourceMappingURL=index32.mjs.map
