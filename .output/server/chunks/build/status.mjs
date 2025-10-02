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

const S = l(async (s) => {
  const { user: o } = s;
  try {
    const t = await b(), e = await new g(t).getGameStatus(o.userId);
    if (!e) return new Response(JSON.stringify({ success: true, gameJoined: false, homeX: 0, homeY: 0, message: "User has not joined the game yet" }), { status: 200, headers: { "Content-Type": "application/json" } });
    const r = { success: true, gameJoined: e.gameJoined, homeX: e.homeX, homeY: e.homeY, message: e.gameJoined ? `Your home base is at (${e.homeX}, ${e.homeY})` : "You have not joined the game yet" };
    return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (t) {
    return console.error("Error in game status endpoint:", t), new Response(JSON.stringify({ success: false, gameJoined: false, homeX: 0, homeY: 0, error: "An unexpected error occurred while fetching game status", message: "Failed to load game status. Please try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

export { S as GET };
//# sourceMappingURL=status.mjs.map
