import { createComponent } from 'solid-js/web';
import { useContext, createContext, createSignal, createEffect } from 'solid-js';

const c = createContext(), w = () => {
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
}, E = (s) => createComponent(c.Provider, { get value() {
  return w();
}, get children() {
  return s.children;
} }), I = () => {
  const s = useContext(c);
  if (!s) throw new Error("useAuth must be used within an AuthProvider");
  return s;
};

export { E, I };
//# sourceMappingURL=AuthContext-D3kPq5an.mjs.map
