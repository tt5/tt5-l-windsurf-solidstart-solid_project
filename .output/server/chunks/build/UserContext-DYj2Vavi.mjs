import { createComponent } from 'solid-js/web';
import { createSignal, onMount, createContext, useContext } from 'solid-js';

const s = createContext();
function U(r) {
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
  }), createComponent(s.Provider, { value: { user: a, setUser: t, loading: i }, get children() {
    return r.children;
  } });
}
function p() {
  const r = useContext(s);
  if (!r) throw new Error("useUser must be used within a UserProvider");
  return r;
}

export { U, p };
//# sourceMappingURL=UserContext-DYj2Vavi.mjs.map
