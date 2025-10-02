import { createComponent, ssr, ssrHydrationKey, ssrAttribute, escape } from 'solid-js/web';
import { k } from './index-BdnVf8ln.mjs';
import { createSignal } from 'solid-js';
import { I } from './AuthContext-D3kPq5an.mjs';
import { r } from './Login.module-Ci4nll34.mjs';
import { I as Ie, M as Me } from './routing-CD52x9Vs.mjs';
import { A } from './components-B3DHEvEg.mjs';

var h = ["<div", "><div", "><h2>Sign In</h2><!--$-->", "<!--/--><!--$-->", '<!--/--><form><div><label for="username">Username</label><input type="text" id="username"', ' required></div><div><label for="password">Password</label><input type="password" id="password"', ' required></div><div><button type="submit"', ">", "</button></div></form><div", "><p>Don't have an account? <!--$-->", "<!--/--></p></div></div></div>"], $ = ["<div", ">Registration successful! Please sign in.</div>"], y = ["<div", ">", "</div>"];
function L() {
  var _a;
  const [u, S] = createSignal(""), [d, _] = createSignal(""), [l, A$1] = createSignal(""), [o, I$1] = createSignal(false);
  Ie();
  const c = Me();
  I();
  const m = (_a = c.state) == null ? void 0 : _a.registered;
  return ssr(h, ssrHydrationKey() + ssrAttribute("class", escape(r.loginContainer, true), false), ssrAttribute("class", escape(r.loginForm, true), false), m && ssr($, ssrHydrationKey() + ssrAttribute("class", escape(r.successMessage, true), false)), l() && ssr(y, ssrHydrationKey() + ssrAttribute("class", escape(r.errorMessage, true), false), escape(l())), ssrAttribute("value", escape(u(), true), false), ssrAttribute("value", escape(d(), true), false), ssrAttribute("disabled", o(), true) + ssrAttribute("class", o() ? escape(r.buttonLoading, true) : "", false), o() ? "Signing in..." : "Sign In", ssrAttribute("class", escape(r.footer, true), false), escape(createComponent(A, { href: "/register", get class() {
    return r.link;
  }, children: "Register here" })));
}
var w = ["<h1", ">Sign in to your account</h1>"];
function T() {
  return [createComponent(k, { children: "Login - Superstar" }), ssr(w, ssrHydrationKey()), createComponent(L, {})];
}

export { T as default };
//# sourceMappingURL=login2.mjs.map
