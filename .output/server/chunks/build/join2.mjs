import { u, t } from '../nitro/nitro.mjs';
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

const Y = l(async (s) => {
  const { user: m } = s;
  try {
    const r = await u(), e = await new d(r).joinGame(m.userId);
    return e.success ? t({ success: true, gameJoined: true, homeX: e.homeX, homeY: e.homeY, message: "Successfully joined the game!" }) : t({ success: false, gameJoined: e.gameJoined || false, homeX: e.homeX || 0, homeY: e.homeY || 0, message: e.message || "Failed to join the game", error: e.error || "Failed to join the game" }, 400);
  } catch (r) {
    return console.error("Error joining game:", r), t({ success: false, gameJoined: false, homeX: 0, homeY: 0, error: "Internal server error", message: "An unexpected error occurred while joining the game." }, 500);
  }
});

export { Y as POST };
//# sourceMappingURL=join2.mjs.map
