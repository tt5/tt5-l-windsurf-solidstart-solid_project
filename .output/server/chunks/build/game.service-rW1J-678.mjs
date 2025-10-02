import { p, u as u$1, d as d$1 } from '../nitro/nitro.mjs';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class u {
  constructor(t) {
    __publicField(this, "setGameJoinedStatus", this.setGameJoined);
    __publicField(this, "getUserGameStatus", this.getGameStatus);
    this.db = t;
  }
  async setGameJoined(t, e) {
    await this.db.run('UPDATE users SET game_joined = ?, updated_at_ms = strftime("%s", "now") * 1000 WHERE id = ?', [e, t]);
  }
  async setHomePosition(t, e, s) {
    await this.db.run('UPDATE users SET home_x = ?, home_y = ?, updated_at_ms = strftime("%s", "now") * 1000 WHERE id = ?', [e, s, t]);
  }
  async getGameStatus(t) {
    const e = await this.db.get("SELECT game_joined, home_x, home_y FROM users WHERE id = ?", [t]);
    return e ? { gameJoined: e.game_joined, homeX: e.home_x, homeY: e.home_y } : null;
  }
  async getUserById(t) {
    const e = await this.db.get("SELECT * FROM users WHERE id = ?", [t]);
    return e ? { id: e.id, username: e.username, email: e.email || void 0, createdAt: new Date(e.created_at_ms).toISOString(), updatedAt: new Date(e.updated_at_ms).toISOString(), gameJoined: e.game_joined, homeX: e.home_x, homeY: e.home_y } : null;
  }
}
class d {
  constructor(t) {
    __publicField(this, "userRepository");
    __publicField(this, "basePointRepository");
    this.userRepository = new u(t), this.basePointRepository = new p(t);
  }
  async executeTransaction(t) {
    const e = await u$1();
    try {
      await e.run("BEGIN TRANSACTION");
      const s = await t();
      return await e.run("COMMIT"), s;
    } catch (s) {
      throw await e.run("ROLLBACK"), s;
    }
  }
  async joinGame(t) {
    try {
      return await this.executeTransaction(async () => {
        var _a;
        const e = await this.userRepository.getGameStatus(t);
        if (console.log(`[joinGame] currentStatus: ${JSON.stringify(e)}`), !e) return { success: false, gameJoined: false, homeX: 0, homeY: 0, error: "User not found", message: "User account could not be found." };
        if (e.gameJoined) return { success: true, gameJoined: true, homeX: e.homeX, homeY: e.homeY, message: "You have already joined the game." };
        const s = await this.basePointRepository.getOldest();
        let o = 0, a = 0;
        return s && (console.log(`[joinGame] oldestBase: ${JSON.stringify(s)}`), s.x < 0 ? o = s.x + 3 : o = s.x - 3, s.y < 0 ? a = s.y + 2 : a = s.y - 2, await this.basePointRepository.delete(s.id), console.log(`[joinGame] Deleted oldest base point ${s.id} at (${s.x}, ${s.y})`)), await this.userRepository.setHomePosition(t, o, a), await this.userRepository.setGameJoined(t, true), await this.basePointRepository.create({ userId: t, x: o, y: a, gameCreatedAtMs: ((_a = d$1()) != null ? _a : Date.now()) - 1 }), console.log(`[joinGame] Created new base point for ${t} at (${o}, ${a})`), { success: true, gameJoined: true, homeX: o, homeY: a, message: "Successfully joined the game! Your home base has been established." };
      });
    } catch (e) {
      return console.error("Error in joinGame:", e), { success: false, gameJoined: false, homeX: 0, homeY: 0, error: "Failed to join game", message: "An unexpected error occurred while joining the game." };
    }
  }
  async leaveGame(t) {
    try {
      return await this.executeTransaction(async () => {
        const e = await this.userRepository.getGameStatus(t);
        return e ? e.gameJoined ? (await this.userRepository.setGameJoined(t, false), { success: true, message: "You have left the game. Your base remains on the map." }) : { success: true, message: "You have not joined the game yet." } : { success: false, error: "User not found", message: "User account could not be found." };
      });
    } catch (e) {
      return console.error("Error in leaveGame:", e), { success: false, error: "Failed to leave game", message: "An unexpected error occurred while leaving the game." };
    }
  }
  async getGameStatus(t) {
    try {
      const e = await this.userRepository.getGameStatus(t);
      return e ? { success: true, gameJoined: e.gameJoined, homeX: e.homeX, homeY: e.homeY, message: e.gameJoined ? `Your home base is at (${e.homeX}, ${e.homeY})` : "You have not joined the game yet." } : { success: false, gameJoined: false, homeX: 0, homeY: 0, error: "User not found", message: "User account could not be found." };
    } catch (e) {
      return console.error("Error in getGameStatus:", e), { success: false, gameJoined: false, homeX: 0, homeY: 0, error: "Failed to retrieve game status", message: "An error occurred while retrieving your game status." };
    }
  }
}

export { d };
//# sourceMappingURL=game.service-rW1J-678.mjs.map
