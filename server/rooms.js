import { Game, chooseAI, returnableCards, sorted } from "../dist/engine.js";
import { chooseTributeReturn } from "../dist/expert-ai.js";
import { nextMatchScorebook, rotateScorebook } from "../dist/scorebook.js";
import {
  TURN_SECONDS,
  syncClock,
  controlClock,
  clockExpired,
  timeoutMove,
} from "../dist/turn-clock.js";
import { validEmote, EMOTE_DURATION, EMOTE_COOLDOWN } from "../dist/emotes.js";
const TTL = 24 * 60 * 60 * 1000;
export const BOT_LEVELS = ["easy", "normal", "hard", "expert"];
const BOT_NAMES = ["River", "Jade", "Lotus", "Willow", "Pine", "Maple"];
const BOT_PACE = 800; // ms between moves by AI seats
const ABSENT_PACE = 1500; // ms between moves made for absent humans
// Lineup changes clear readiness for people; AI seats are always ready.
const unready = (room) =>
  room.members.forEach((m) => {
    if (m) m.ready = !!m.bot;
  });
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
class RoomError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const requireThat = (ok, message, status = 400) => {
  if (!ok) throw new RoomError(message, status);
};
const hash = async (token) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
const secureRandom = () =>
  crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
function validName(name) {
  requireThat(
    typeof name === "string" &&
      name.trim().length >= 1 &&
      name.trim().length <= 18,
    "Use a name between 1 and 18 characters.",
  );
  const clean = name.replace(/[\x00-\x1f\x7f]/g, "").trim();
  requireThat(clean.length > 0, "Use a name between 1 and 18 characters.");
  return clean;
}
const hydrate = (state) =>
  Object.assign(
    new Game({ random: secureRandom, manualTribute: true }),
    state,
    { random: secureRandom },
  );
function newMatch(room) {
  const game = new Game({
    random: secureRandom,
    manualTribute: true,
    doubleUp: room.doubleUp,
    playerNames: room.members.map((m, i) => m?.name || `Seat ${i + 1}`),
  });
  if (room.game) game.scorebook = nextMatchScorebook(room.game.scorebook);
  return game;
}
export function publicView(row, seat, now = Date.now()) {
  const spectator = seat === null;
  if (spectator) seat = 0;
  const room = JSON.parse(row.state),
    g = room.game,
    rel = (p) => (p - seat + 4) % 4,
    indices = [0, 1, 2, 3].map((i) => (i + seat) % 4),
    seen = JSON.parse(row.presence || "[0,0,0,0]");
  const lobby = {
    code: row.code,
    version: row.version,
    seat,
    spectator,
    spectatorKey: spectator ? undefined : room.spectatorKey,
    autoPlayMinutes: room.autoPlayMinutes || 0,
    turnClock: room.turnClock || { seconds: 0, mode: "auto", paused: false },
    serverNow: now,
    host: room.host,
    stage: room.stage,
    doubleUp: room.doubleUp,
    expiresAt: row.expires_at,
    members: room.members.map((m, i) =>
      m
        ? {
            name: m.name,
            ready: m.ready,
            online: !!m.bot || now - seen[i] < 25000,
            ai: !!m.bot,
            level: m.bot ? m.level : undefined,
            bot:
              !!m.bot ||
              (!!room.autoPlayMinutes &&
                now - seen[i] >= room.autoPlayMinutes * 60000),
            emote:
              m.emote && now - m.emote.at < EMOTE_DURATION
                ? {
                    id: m.emote.id,
                    eventId: m.emote.eventId,
                    remainingMs: EMOTE_DURATION - (now - m.emote.at),
                  }
                : null,
          }
        : null,
    ),
  };
  if (!g) return { room: lobby, game: null };
  return {
    room: lobby,
    game: {
      phase: g.phase,
      scorebook: rotateScorebook(g.scorebook, seat),
      round: g.round,
      level: g.level,
      levels: seat % 2 ? [g.levels[1], g.levels[0]] : g.levels,
      failures: seat % 2 ? [g.failures[1], g.failures[0]] : g.failures,
      declarer: (g.declarer - (seat % 2) + 2) % 2,
      turn: rel(g.turn),
      names: indices.map((i) => room.members[i]?.name || `Seat ${i + 1}`),
      hand: spectator ? [] : g.hands[seat],
      counts: indices.map((i) => g.hands[i].length),
      order: g.order.map(rel),
      trick: g.trick ? { ...g.trick, player: rel(g.trick.player) } : null,
      passes: g.passes,
      lastMoves: indices.map((i) => g.lastMoves[i]),
      doubleUp: g.doubleUp,
      history: g.history.slice(-120),
      playedCards: (g.playedCards || []).map((e) => ({
        ...e,
        player: rel(e.player),
      })),
      returns: g.returns
        .filter((x) => !spectator && x.from === seat)
        .map((x) => ({ ...x, from: 0, to: rel(x.to) })),
      result: g.result
        ? {
            ...g.result,
            winner: (g.result.winner - (seat % 2) + 2) % 2,
            order: g.result.order.map(rel),
          }
        : null,
    },
  };
}
export class RoomStore {
  constructor(db) {
    this.db = db;
  }
  async get(code) {
    return this.db
      .prepare("SELECT * FROM rooms WHERE code = ?")
      .bind(code)
      .first();
  }
  async insert(code, state, expiresAt, presence) {
    return this.db
      .prepare(
        "INSERT INTO rooms (code, state, version, expires_at, presence) VALUES (?, ?, 0, ?, ?) ON CONFLICT(code) DO NOTHING",
      )
      .bind(code, JSON.stringify(state), expiresAt, JSON.stringify(presence))
      .run();
  }
  async update(row, state) {
    if (state.turnClock) syncClock(state.turnClock, state.game);
    return this.db
      .prepare(
        "UPDATE rooms SET state = ?, version = version + 1, expires_at = ? WHERE code = ? AND version = ?",
      )
      .bind(JSON.stringify(state), Date.now() + TTL, row.code, row.version)
      .run();
  }
  async touch(code, seat) {
    return this.db
      .prepare(
        "UPDATE rooms SET presence = json_set(presence, ?, ?) WHERE code = ?",
      )
      .bind(`$[${seat}]`, Date.now(), code)
      .run();
  }
  async autoPlay(row, now = Date.now()) {
    const room = JSON.parse(row.state),
      seen = JSON.parse(row.presence);
    const timedOut = clockExpired(room.turnClock, room.game, now);
    const isBot = (p) => !!room.members[p]?.bot;
    const hasBots = room.members.some((m) => m?.bot);
    if (
      (!room.autoPlayMinutes && !timedOut && !hasBots) ||
      room.stage !== "playing" ||
      !room.game
    )
      return row;
    const absent = (p) =>
      isBot(p) ||
      (!!room.autoPlayMinutes && now - seen[p] >= room.autoPlayMinutes * 60000);
    const g = hydrate(room.game);
    // AI seats move at a readable pace; substitutes for absent people wait longer.
    const actor =
      g.phase === "tribute"
        ? g.returns.find((x) => absent(x.from))?.from
        : g.turn;
    const pace = actor !== undefined && isBot(actor) ? BOT_PACE : ABSENT_PACE;
    if (now - (room.botMovedAt || 0) < pace) return row;
    if (timedOut && !isBot(g.turn)) {
      timeoutMove(g);
    } else if (g.phase === "tribute") {
      const item = g.returns.find((x) => absent(x.from));
      if (!item) return row;
      const card = isBot(item.from)
        ? chooseTributeReturn(g.hands[item.from], item.received, g.level)
        : sorted(
            returnableCards(g.hands[item.from], item.received),
            g.level,
          )[0];
      g.returnTribute(card.id, item.from);
    } else if (g.phase === "playing" && absent(g.turn)) {
      const p = g.turn,
        move = chooseAI(g, p, room.members[p]?.level || "normal");
      if (move)
        g.play(
          p,
          move.cards.map((c) => c.id),
          move.key,
        );
      else g.pass(p);
    } else return row;
    room.game = g;
    if (room.turnClock) syncClock(room.turnClock, g, now);
    room.botMovedAt = now;
    // Heartbeats do not change the version. Compare presence too so a reconnect
    // racing this decision cancels it, while concurrent polls cannot double-play.
    await this.db
      .prepare(
        "UPDATE rooms SET state = ?, version = version + 1, expires_at = ? WHERE code = ? AND version = ? AND presence = ?",
      )
      .bind(
        JSON.stringify(room),
        now + TTL,
        row.code,
        row.version,
        row.presence,
      )
      .run();
    return this.get(row.code);
  }
  async prune() {
    return this.db
      .prepare("DELETE FROM rooms WHERE expires_at < ?")
      .bind(Date.now())
      .run();
  }
}
export async function handleRooms(request, env) {
  try {
    const url = new URL(request.url);
    requireThat(
      !request.headers.get("Origin") ||
        request.headers.get("Origin") === url.origin,
      "This request must come from the game website.",
      403,
    );
    requireThat(
      env.DB,
      "Online rooms are temporarily unavailable. Practice mode is still available.",
      503,
    );
    const match = url.pathname.match(
      /^\/api\/rooms(?:\/([A-Z2-9]{8})(\/watch)?)?$/,
    );
    requireThat(match, "Room not found.", 404);
    if (match[2]) {
      requireThat(request.method === "GET", "Spectators can only watch.", 405);
      const row = await new RoomStore(env.DB).get(match[1]);
      const key = url.searchParams.get("key");
      requireThat(
        row &&
          row.expires_at > Date.now() &&
          key &&
          JSON.parse(row.state).spectatorKey === key,
        "Spectator link is invalid or expired.",
        404,
      );
      return json(publicView(row, null));
    }
    const token = request.headers.get("X-Seat-Token");
    requireThat(
      typeof token === "string" && /^[a-f0-9]{64}$/.test(token),
      "Your seat could not be verified. Rejoin the room.",
      401,
    );
    const tokenHash = await hash(token),
      store = new RoomStore(env.DB);
    let input = {};
    if (request.method === "POST") {
      requireThat(
        request.headers.get("Content-Type")?.startsWith("application/json"),
        "Send a JSON request.",
      );
      const raw = await request.text();
      requireThat(raw.length <= 4096, "Request is too large.", 413);
      try {
        input = JSON.parse(raw);
      } catch {
        throw new RoomError("Invalid request.");
      }
      requireThat(
        input && typeof input === "object" && !Array.isArray(input),
        "Invalid request.",
      );
    } else requireThat(request.method === "GET", "Method not allowed.", 405);
    if (!match[1]) {
      requireThat(
        request.method === "POST" && input.action === "create",
        "Choose Create Room to begin.",
      );
      requireThat(/^[A-Z2-9]{8}$/.test(input.code), "Invalid room code.");
      const name = validName(input.name);
      requireThat(
        [3, 4].includes(input.doubleUp ?? 3),
        "Invalid promotion setting.",
      );
      await store.prune();
      const existing = await store.get(input.code);
      if (existing) {
        const r = JSON.parse(existing.state),
          seat = r.members.findIndex((m) => m?.tokenHash === tokenHash);
        if (seat >= 0) return json(publicView(existing, seat));
        throw new RoomError(
          "That room code was just taken. Please create another room.",
          409,
        );
      }
      const room = {
        stage: "lobby",
        host: 0,
        doubleUp: input.doubleUp ?? 3,
        autoPlayMinutes: 0,
        spectatorKey:
          crypto.randomUUID().replaceAll("-", "") +
          crypto.randomUUID().replaceAll("-", ""),
        members: [{ name, tokenHash, ready: false }, null, null, null],
        game: null,
        requests: [],
      };
      const inserted = await store.insert(input.code, room, Date.now() + TTL, [
        Date.now(),
        0,
        0,
        0,
      ]);
      requireThat(
        inserted.meta.changes === 1,
        "That room code was just taken. Please try again.",
        409,
      );
      return json(publicView(await store.get(input.code), 0), 201);
    }
    const code = match[1];
    let row = await store.get(code);
    requireThat(
      row && row.expires_at > Date.now(),
      "This room has expired or does not exist. Check the code or create a new room.",
      404,
    );
    let room = JSON.parse(row.state),
      seat = room.members.findIndex((m) => m?.tokenHash === tokenHash);
    if (request.method === "GET") {
      requireThat(
        seat >= 0,
        "This browser does not have a seat in that room.",
        401,
      );
      // Reads still return fresh room state; heartbeat writes need not happen on every poll.
      if (Date.now() - JSON.parse(row.presence)[seat] >= 8000)
        await store.touch(code, seat);
      row.presence = JSON.stringify(
        JSON.parse(row.presence).map((v, i) => (i === seat ? Date.now() : v)),
      );
      row = await store.autoPlay(await store.get(code));
      return json(publicView(row, seat));
    }
    requireThat(
      typeof input.requestId === "string" &&
        /^[a-f0-9-]{16,64}$/.test(input.requestId),
      "Missing action identifier.",
    );
    if (
      room.requests.some(
        (r) => r.id === input.requestId && r.tokenHash === tokenHash,
      )
    ) {
      requireThat(seat >= 0, "You have left this room.", 401);
      return json(publicView(row, seat));
    }
    if (input.action === "join") {
      if (seat >= 0) return json(publicView(row, seat));
      requireThat(
        room.stage === "lobby",
        "This match has already started. Ask the host for a new room.",
      );
      const name = validName(input.name);
      seat = room.members.findIndex((m) => !m);
      requireThat(seat >= 0, "This room already has four players.", 409);
      requireThat(
        !room.members.some((m) => m?.name.toLowerCase() === name.toLowerCase()),
        "That name is taken at this table. Choose another.",
      );
      room.members[seat] = { name, tokenHash, ready: false };
      unready(room);
    } else {
      requireThat(
        seat >= 0,
        "This browser does not have a seat in that room.",
        401,
      );
      requireThat(
        room.stage !== "closed",
        "This match ended because a player left. Create another room.",
        410,
      );
      requireThat(
        input.version === row.version,
        "The table changed. Your hand has been refreshed; try your action again.",
        409,
      );
      switch (input.action) {
        case "turn-clock": {
          requireThat(
            seat === room.host,
            "Only the host can change room settings.",
            403,
          );
          room.turnClock ||= { seconds: 0, mode: "auto", paused: false };
          if (input.command) {
            requireThat(
              ["pause", "resume", "restart"].includes(input.command),
              "Invalid timer setting.",
            );
            controlClock(room.turnClock, input.command, room.game);
          } else {
            requireThat(
              TURN_SECONDS.includes(input.seconds) &&
                ["auto", "warn"].includes(input.mode),
              "Invalid timer setting.",
            );
            Object.assign(room.turnClock, {
              seconds: input.seconds,
              mode: input.mode,
              paused: false,
            });
            syncClock(room.turnClock, room.game, Date.now(), true);
          }
          break;
        }
        case "settings":
          requireThat(
            seat === room.host,
            "Only the host can change room settings.",
            403,
          );
          requireThat(
            [0, 1, 2, 5].includes(input.autoPlayMinutes),
            "Choose an available timeout.",
          );
          room.autoPlayMinutes = input.autoPlayMinutes;
          break;
        case "spectator-link":
          room.spectatorKey ||=
            crypto.randomUUID().replaceAll("-", "") +
            crypto.randomUUID().replaceAll("-", "");
          break;
        case "emote":
          requireThat(room.stage === "playing", "Start the match first.");
          requireThat(
            typeof input.emote === "string" && validEmote(input.emote),
            "Choose an available emote.",
          );
          requireThat(
            !room.members[seat].emote ||
              Date.now() - room.members[seat].emote.at >= EMOTE_COOLDOWN,
            "Wait a moment before sending another emote.",
            429,
          );
          room.members[seat].emote = {
            id: input.emote,
            eventId: input.requestId,
            at: Date.now(),
          };
          break;
        case "seat":
          requireThat(
            room.stage === "lobby",
            "Seats are fixed once the match starts.",
          );
          requireThat(
            Number.isInteger(input.seat) &&
              input.seat >= 0 &&
              input.seat < 4 &&
              !room.members[input.seat],
            "Choose an open seat.",
          );
          room.members[input.seat] = room.members[seat];
          room.members[input.seat].ready = false;
          room.members[seat] = null;
          if (room.host === seat) room.host = input.seat;
          seat = input.seat;
          unready(room);
          break;
        case "add-bot": {
          requireThat(
            seat === room.host,
            "Only the host can add AI players.",
            403,
          );
          requireThat(
            room.stage === "lobby",
            "Seats are fixed once the match starts.",
          );
          requireThat(
            Number.isInteger(input.seat) &&
              input.seat >= 0 &&
              input.seat < 4 &&
              !room.members[input.seat],
            "Choose an open seat.",
          );
          requireThat(BOT_LEVELS.includes(input.level), "Choose an AI level.");
          const taken = new Set(
            room.members.filter(Boolean).map((m) => m.name.toLowerCase()),
          );
          const base = BOT_NAMES.find(
            (n) => !taken.has(`${n} (AI)`.toLowerCase()),
          );
          room.members[input.seat] = {
            name: `${base} (AI)`,
            tokenHash: null,
            bot: true,
            level: input.level,
            ready: true,
          };
          unready(room);
          break;
        }
        case "remove-bot":
          requireThat(
            seat === room.host,
            "Only the host can remove AI players.",
            403,
          );
          requireThat(
            room.stage === "lobby",
            "Seats are fixed once the match starts.",
          );
          requireThat(
            Number.isInteger(input.seat) && room.members[input.seat]?.bot,
            "That seat is not an AI player.",
          );
          room.members[input.seat] = null;
          unready(room);
          break;
        case "ready":
          requireThat(room.stage === "lobby", "The match has already started.");
          requireThat(
            typeof input.ready === "boolean",
            "Invalid ready status.",
          );
          room.members[seat].ready = input.ready;
          break;
        case "start":
          requireThat(
            room.stage === "lobby" && seat === room.host,
            "Only the host can start the match.",
          );
          requireThat(
            room.members.every((m) => m?.ready),
            "All four players must be seated and ready.",
          );
          room.game = newMatch(room);
          room.game.deal();
          room.stage = "playing";
          break;
        case "play": {
          const current = await store.autoPlay(row);
          requireThat(
            current.version === row.version,
            "The turn timer expired. The table has been refreshed.",
            409,
          );
          requireThat(room.stage === "playing", "Start the match first.");
          requireThat(
            Array.isArray(input.cardIds) &&
              input.cardIds.length >= 1 &&
              input.cardIds.length <= 10 &&
              input.cardIds.every(
                (x) => typeof x === "string" && x.length <= 30,
              ),
            "Select a legal combination.",
          );
          requireThat(
            !input.declaration ||
              (typeof input.declaration === "string" &&
                input.declaration.length < 100),
            "Invalid declaration.",
          );
          const g = hydrate(room.game);
          g.play(seat, input.cardIds, input.declaration);
          room.game = g;
          break;
        }
        case "pass": {
          const current = await store.autoPlay(row);
          requireThat(
            current.version === row.version,
            "The turn timer expired. The table has been refreshed.",
            409,
          );
          requireThat(room.stage === "playing", "Start the match first.");
          const g = hydrate(room.game);
          g.pass(seat);
          room.game = g;
          break;
        }
        case "tribute": {
          requireThat(room.stage === "playing", "Start the match first.");
          requireThat(
            typeof input.cardId === "string",
            "Select a card to return.",
          );
          const g = hydrate(room.game);
          g.returnTribute(input.cardId, seat);
          room.game = g;
          break;
        }
        case "next": {
          requireThat(
            seat === room.host ||
              (room.autoPlayMinutes &&
                Date.now() - JSON.parse(row.presence)[room.host] >=
                  room.autoPlayMinutes * 60000),
            "The host deals the next hand.",
          );
          requireThat(
            room.stage === "playing" &&
              ["round-over", "game-over"].includes(room.game.phase),
            "Finish the current hand first.",
          );
          const g =
            room.game.phase === "game-over"
              ? newMatch(room)
              : hydrate(room.game);
          g.deal();
          room.game = g;
          break;
        }
        case "leave":
          if (room.stage === "lobby") {
            room.members[seat] = null;
            unready(room);
            // The host must be a person; a table of only AI players closes.
            if (room.host === seat)
              room.host = room.members.findIndex((m) => m && !m.bot);
            if (room.host < 0) room.stage = "closed";
          } else room.stage = "closed";
          break;
        default:
          throw new RoomError("Unknown action.");
      }
    }
    room.requests = [
      ...room.requests.slice(-31),
      { id: input.requestId, tokenHash },
    ];
    const updated = await store.update(row, room);
    requireThat(
      updated.meta.changes === 1,
      "Another player acted at the same time. Refreshing the table; please try again.",
      409,
    );
    if (input.action === "leave") return json({ left: true });
    await store.touch(code, seat);
    return json(publicView(await store.get(code), seat));
  } catch (error) {
    if (error instanceof RoomError)
      return json({ error: error.message }, error.status);
    if (
      error.message &&
      /turn|tribute|combination|card|pass|lead|hand/i.test(error.message)
    )
      return json({ error: error.message }, 400);
    console.error("Room request failed", error);
    return json(
      {
        error:
          "The table could not be reached. Please retry; your seat is saved in this browser.",
      },
      503,
    );
  }
}
