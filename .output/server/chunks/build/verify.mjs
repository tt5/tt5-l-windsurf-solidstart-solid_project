import { h } from './jwt-CO0ye28h.mjs';
import { t as t$1 } from './utils-AQpNWTN2.mjs';
import 'jsonwebtoken';

const t = async ({ request: s }) => {
  try {
    const r = await h(s);
    return r ? t$1({ valid: true, user: { id: r.userId, username: r.username, role: r.role || "user" } }) : t$1({ valid: false, message: "No valid session found" }, 200);
  } catch (r) {
    return console.error("Error verifying session:", r), t$1({ valid: false, message: "Error verifying session", error: r instanceof Error ? r.message : "Unknown error" }, 500);
  }
};

export { t as GET };
//# sourceMappingURL=verify.mjs.map
