import { b } from './db-97-DOlOW.mjs';
import { g } from './game.service-Bf9Z8hov.mjs';
import { l } from './auth-BVUYsDc6.mjs';
import { t } from './utils-AQpNWTN2.mjs';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import './jwt-CO0ye28h.mjs';
import 'jsonwebtoken';

const X = l(async (s) => {
  const { user: m } = s;
  try {
    const r = await b(), e = await new g(r).joinGame(m.userId);
    return e.success ? t({ success: true, gameJoined: true, homeX: e.homeX, homeY: e.homeY, message: "Successfully joined the game!" }) : t({ success: false, gameJoined: e.gameJoined || false, homeX: e.homeX || 0, homeY: e.homeY || 0, message: e.message || "Failed to join the game", error: e.error || "Failed to join the game" }, 400);
  } catch (r) {
    return console.error("Error joining game:", r), t({ success: false, gameJoined: false, homeX: 0, homeY: 0, error: "Internal server error", message: "An unexpected error occurred while joining the game." }, 500);
  }
});

export { X as POST };
//# sourceMappingURL=join.mjs.map
