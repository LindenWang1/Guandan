import { browserStorage } from "./practice-session.js";
const KEY = "guandan-seat-v2";
const randomHex = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export const roomCode = () =>
  Array.from(
    crypto.getRandomValues(new Uint8Array(8)),
    (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32],
  ).join("");
const validSeat = (s) =>
  s && /^[A-Z2-9]{8}$/.test(s.code) && /^[a-f0-9]{64}$/.test(s.token);
export class OnlineRoom {
  constructor(
    onUpdate,
    onConnection,
    {
      storage = browserStorage(),
      fetcher = (...args) => globalThis.fetch(...args),
      setTimer = (...args) => globalThis.setTimeout(...args),
      clearTimer = (...args) => globalThis.clearTimeout(...args),
    } = {},
  ) {
    Object.assign(this, {
      onUpdate,
      onConnection,
      storage,
      fetcher,
      setTimer,
      clearTimer,
    });
    this.credentials = null;
    this.latest = null;
    this.timer = null;
    this.pending = null;
    this.stopped = false;
    this.failures = 0;
  }
  saved() {
    try {
      const s = JSON.parse(this.storage?.getItem(KEY) || "null");
      return validSeat(s) ? s : null;
    } catch {
      return null;
    }
  }
  save() {
    try {
      if (!this.storage) throw Error();
      this.storage.setItem(KEY, JSON.stringify(this.credentials));
    } catch {
      throw Error("Allow browser storage to keep your seat when reconnecting.");
    }
  }
  async request(body, collection = false) {
    const response = await this.fetcher(
      "/api/rooms" +
        (collection ? "" : "/" + this.credentials.code) +
        (this.watching
          ? "/watch?key=" + encodeURIComponent(this.watchKey)
          : ""),
      {
        method: body ? "POST" : "GET",
        headers: {
          "X-Seat-Token": this.credentials.token,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(12000),
      },
    );
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error(
        "Online rooms are temporarily unavailable. Practice mode is still available.",
      );
    }
    if (!response.ok) {
      const error = new Error(data.error || "Unable to reach the room.");
      error.status = response.status;
      throw error;
    }
    return data;
  }
  accept(data) {
    if (data.left || this.stopped) return;
    if (!this.latest || data.room.version >= this.latest.room.version) {
      this.latest = data;
      this.onUpdate(data);
    }
    this.failures = 0;
    this.onConnection(true);
  }
  async enter(credentials, body, collection) {
    this.watching = false;
    const previous = this.saved();
    this.credentials = credentials;
    this.stopped = false;
    // Save first so an uncertain POST result can be recovered. Only a definitive rejection restores the old seat.
    this.save();
    try {
      const data = await this.request(body, collection);
      this.accept(data);
      this.poll();
    } catch (error) {
      if (error.status) {
        this.credentials = previous;
        try {
          previous
            ? this.storage.setItem(KEY, JSON.stringify(previous))
            : this.storage.removeItem(KEY);
        } catch {}
      }
      throw error;
    }
  }
  create(name, doubleUp) {
    const credentials = { code: roomCode(), token: randomHex() };
    return this.enter(
      credentials,
      { action: "create", code: credentials.code, name, doubleUp },
      true,
    );
  }
  join(code, name) {
    const saved = this.saved();
    return this.enter(
      saved?.code === code ? saved : { code, token: randomHex() },
      { action: "join", name, requestId: crypto.randomUUID() },
      false,
    );
  }
  async resume() {
    const saved = this.saved();
    if (!saved) return false;
    this.credentials = saved;
    this.stopped = false;
    try {
      this.accept(await this.request());
      this.poll();
      return true;
    } catch (error) {
      this.failed(error);
      if (!this.stopped) this.poll();
      throw error;
    }
  }
  async watch(code, key) {
    this.watching = true;
    this.watchKey = key;
    this.credentials = { code, token: "" };
    this.stopped = false;
    this.accept(await this.request());
    this.poll();
  }
  async action(action, payload = {}) {
    if (this.watching) throw Error("Spectators can only watch.");
    if (this.pending)
      throw Error("Your previous action is still being confirmed.");
    if (!this.latest || this.stopped) throw Error("Reconnect before playing.");
    const body = {
      ...payload,
      action,
      version: this.latest.room.version,
      requestId: crypto.randomUUID(),
    };
    this.pending = body;
    try {
      let data;
      try {
        data = await this.request(body);
      } catch (error) {
        if (error.status) throw error;
        data = await this.request(body);
      }
      if (action === "leave") {
        this.forget();
        return data;
      }
      this.accept(data);
      return data;
    } catch (error) {
      if (error.status === 409) {
        try {
          this.accept(await this.request());
        } catch (refreshError) {
          this.failed(refreshError);
        }
      } else if (!error.status || [401, 404, 410].includes(error.status))
        this.failed(error);
      throw error;
    } finally {
      this.pending = null;
    }
  }
  failed(error) {
    if (this.stopped) return;
    this.failures++;
    if ([401, 404, 410].includes(error.status)) this.stop();
    this.onConnection(false, error.message);
  }
  poll() {
    this.clearTimer(this.timer);
    if (this.stopped) return;
    // Poll faster while an AI seat is about to move so its plays appear promptly.
    const g = this.latest?.game,
      r = this.latest?.room,
      aiTurn =
        g &&
        r &&
        ((g.phase === "playing" && r.members[(r.seat + g.turn) % 4]?.ai) ||
          g.phase === "tribute");
    const base = aiTurn ? 900 : 1800;
    const delay = Math.min(base * 2 ** Math.min(this.failures, 4), 15000);
    this.timer = this.setTimer(() => this.reconnect(), delay);
  }
  async reconnect() {
    this.clearTimer(this.timer);
    if (this.stopped || this.refreshing) return;
    this.refreshing = true;
    try {
      this.accept(await this.request());
    } catch (error) {
      this.failed(error);
    } finally {
      this.refreshing = false;
      this.poll();
    }
  }
  stop() {
    this.stopped = true;
    this.clearTimer(this.timer);
  }
  forget() {
    this.stop();
    try {
      if (!this.watching) this.storage?.removeItem(KEY);
    } catch {}
    this.credentials = null;
    this.latest = null;
  }
}
