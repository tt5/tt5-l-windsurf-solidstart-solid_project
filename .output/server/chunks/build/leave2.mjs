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

const O = l(async (r) => {
  const { user: t } = r;
  try {
    const e = await u(), s = await new d(e).leaveGame(t.userId);
    if (!s.success) return new Response(JSON.stringify({ success: false, message: s.message || "Failed to leave the game", error: s.message || "Failed to leave the game" }), { status: 400, headers: { "Content-Type": "application/json" } });
    const o = { success: true, message: "Successfully left the game. Your base remains on the map." };
    return new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return console.error("Error in leave game endpoint:", e), new Response(JSON.stringify({ success: false, error: "An unexpected error occurred while leaving the game", message: "An unexpected error occurred. Please try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

export { O as POST };
//# sourceMappingURL=leave2.mjs.map
