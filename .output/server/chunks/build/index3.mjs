import { ssr, ssrHydrationKey, ssrAttribute, escape, createComponent } from 'solid-js/web';
import { k } from './index-BdnVf8ln.mjs';
import { A } from './components-B3DHEvEg.mjs';
import 'solid-js';
import './routing-CD52x9Vs.mjs';

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
//# sourceMappingURL=index3.mjs.map
