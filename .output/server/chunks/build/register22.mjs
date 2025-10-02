import { createComponent, ssr, ssrHydrationKey, ssrAttribute, escape } from 'solid-js/web';
import { k, e as Ie } from '../nitro/nitro.mjs';
import { createSignal } from 'solid-js';
import { r } from './Login.module-Ci4nll342.mjs';
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
import 'solid-js/web/storage';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import 'perf_hooks';
import 'events';
import 'crypto';

var f = ["<div", "><div", "><h2>Create an Account</h2><!--$-->", '<!--/--><form><div><label for="username">Username</label><input type="text" id="username"', ' required></div><div><label for="password">Password</label><input type="password" id="password"', ' required></div><div><button type="submit"', ">", "</button></div></form><div", "><span>Already have an account? </span><!--$-->", "<!--/--></div></div></div>"], v = ["<div", ">", "</div>"];
function g() {
  const [u, h] = createSignal(""), [d, y] = createSignal(""), [l, w] = createSignal(""), [a, $] = createSignal(false);
  return Ie(), ssr(f, ssrHydrationKey() + ssrAttribute("class", escape(r.loginContainer, true), false), ssrAttribute("class", escape(r.loginForm, true), false), l() && ssr(v, ssrHydrationKey() + ssrAttribute("class", escape(r.errorMessage, true), false), escape(l())), ssrAttribute("value", escape(u(), true), false), ssrAttribute("value", escape(d(), true), false), ssrAttribute("disabled", a(), true) + ssrAttribute("class", a() ? escape(r.buttonLoading, true) : "", false), a() ? "Creating Account..." : "Sign Up", ssrAttribute("class", escape(r.footer, true), false), escape(createComponent(A, { href: "/login", get class() {
    return r.link;
  }, children: "Sign in" })));
}
var b = ["<h1", ">Create your account</h1>"];
function _() {
  return [createComponent(k, { children: "Register - Superstar" }), ssr(b, ssrHydrationKey()), createComponent(g, {})];
}

export { _ as default };
//# sourceMappingURL=register22.mjs.map
