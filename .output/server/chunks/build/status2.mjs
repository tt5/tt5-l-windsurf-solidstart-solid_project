import { u } from '../nitro/nitro.mjs';
import { d } from './game.service-rW1J-678.mjs';
import { l } from './auth-BVUYsDc62.mjs';
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
import 'solid-js/web';
import 'solid-js/web/storage';
import 'sqlite3';
import 'sqlite';
import 'fs';
import 'path';
import 'pako';
import 'perf_hooks';
import 'events';
import 'crypto';
import './jwt-CO0ye28h2.mjs';
import 'jsonwebtoken';

const Y = l(async (o) => {
  const { user: s } = o;
  try {
    const t = await u(), e = await new d(t).getGameStatus(s.userId);
    if (!e) return new Response(JSON.stringify({ success: true, gameJoined: false, homeX: 0, homeY: 0, message: "User has not joined the game yet" }), { status: 200, headers: { "Content-Type": "application/json" } });
    const r = { success: true, gameJoined: e.gameJoined, homeX: e.homeX, homeY: e.homeY, message: e.gameJoined ? `Your home base is at (${e.homeX}, ${e.homeY})` : "You have not joined the game yet" };
    return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (t) {
    return console.error("Error in game status endpoint:", t), new Response(JSON.stringify({ success: false, gameJoined: false, homeX: 0, homeY: 0, error: "An unexpected error occurred while fetching game status", message: "Failed to load game status. Please try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

export { Y as GET };
//# sourceMappingURL=status2.mjs.map
