import { b } from './db-97-DOlOW.mjs';
import { g } from './game.service-Bf9Z8hov.mjs';
import { l } from './auth-BVUYsDc6.mjs';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import './utils-AQpNWTN2.mjs';
import './jwt-CO0ye28h.mjs';
import 'jsonwebtoken';

const S = l(async (r) => {
  const { user: t } = r;
  try {
    const e = await b(), s = await new g(e).leaveGame(t.userId);
    if (!s.success) return new Response(JSON.stringify({ success: false, message: s.message || "Failed to leave the game", error: s.message || "Failed to leave the game" }), { status: 400, headers: { "Content-Type": "application/json" } });
    const a = { success: true, message: "Successfully left the game. Your base remains on the map." };
    return new Response(JSON.stringify(a), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return console.error("Error in leave game endpoint:", e), new Response(JSON.stringify({ success: false, error: "An unexpected error occurred while leaving the game", message: "An unexpected error occurred. Please try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

export { S as POST };
//# sourceMappingURL=leave.mjs.map
