import test from "node:test";
import assert from "node:assert/strict";
import { Game, chooseAI, moves } from "./dist/engine.js";
import { preferences, soundEvent } from "./dist/preferences.js";
import { handleRooms, RoomStore } from "./server/rooms.js";
import { localDB } from "./server/local-db.mjs";
import { OnlineRoom } from "./dist/online.js";
import { translate } from "./dist/i18n.js";
import { EMOTES } from "./dist/emotes.js";
import { createTurnClock } from "./dist/turn-clock-ui.js";
import { createScoreboard } from "./dist/scoreboard-ui.js";
test("final scoreboard opens once, waits for other menus, and respects reduced motion", async (t) => {
  const previousDocument = globalThis.document,
    previousMedia = globalThis.matchMedia;
  const dialog = { open: true, addEventListener() {} };
  const nodes = new Map([
    ["modal", dialog],
    ["scoreboard-btn", {}],
    ["scoreboard-back", {}],
    ["scoreboard-again", {}],
  ]);
  let opens = 0,
    html = "",
    created = 0;
  globalThis.document = {
    hidden: false,
    getElementById: (id) => nodes.get(id),
    createElement: () => {
      created++;
      throw Error("Reduced motion must not create confetti");
    },
  };
  globalThis.matchMedia = () => ({ matches: true });
  try {
    const game = new Game();
    game.practiceId = "score-test";
    game.level = 14;
    game.order = [0, 2];
    game.endRound();
    const ui = createScoreboard({
      getGame: () => game,
      getRoom: () => null,
      playerName: (p) => ["You", "River", "Jade", "Lotus"][p],
      escape: (s) => s,
      showModal: (title, body) => {
        opens++;
        html = body;
        dialog.open = true;
        assert.equal(title, "Final Scoreboard");
      },
      closeModal: () => {
        dialog.open = false;
      },
      canDeal: () => true,
      playAgain: () => {},
    });
    ui.observe();
    await Promise.resolve();
    assert.equal(opens, 0);
    dialog.open = false;
    ui.observe();
    ui.observe();
    await Promise.resolve();
    assert.equal(opens, 1);
    assert.equal(created, 0);
    assert.match(html, /Net Points/);
    assert.match(html, /First Finishes/);
    assert.match(html, /Match Winners/);
    dialog.open = false;
    ui.observe();
    await Promise.resolve();
    assert.equal(opens, 1);
    nodes.get("scoreboard-btn").onclick();
    assert.equal(opens, 2);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousMedia === undefined) delete globalThis.matchMedia;
    else globalThis.matchMedia = previousMedia;
  }
});
test("online scoreboard rotates seats and carries earned points into a rematch", async () => {
  const { call, edit } = await fixture();
  await edit((r) => {
    const g = Object.assign(new Game(), r.game);
    g.level = 14;
    g.declarer = 1;
    g.order = [1, 3];
    g.endRound();
    r.game = g;
  });
  const host = (await call(0)).data,
    winner = (await call(1)).data;
  assert.deepEqual(host.game.scorebook.points, [0, 3]);
  assert.deepEqual(winner.game.scorebook.points, [3, 0]);
  assert.deepEqual(winner.game.scorebook.firsts, [1, 0, 0, 0]);
  assert.deepEqual(winner.game.scorebook.matchWins, [1, 0]);
  const next = await call(0, { action: "next", version: host.room.version });
  assert.equal(next.status, 200);
  assert.deepEqual(next.data.game.scorebook.points, [0, 3]);
  assert.equal(next.data.game.scorebook.matchNumber, 2);
  assert.equal(next.data.game.phase, "playing");
});

test("practice countdown survives a suspended browser tab and expires once after resume", async (t) => {
  const previousDocument = globalThis.document,
    previousStorage = globalThis.localStorage;
  let now = 1000,
    held = false,
    expired = 0;
  const nodes = new Map(
    ["turn-clock-btn", "turn-clock-value"].map((id) => [
      id,
      { textContent: "", setAttribute() {}, classList: { toggle() {} } },
    ]),
  );
  globalThis.document = {
    getElementById: (id) => nodes.get(id),
    addEventListener() {},
  };
  globalThis.localStorage = { getItem: () => '{"seconds":15,"mode":"auto"}' };
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "setInterval", () => 0);
  try {
    const g = new Game();
    g.deal();
    const clock = createTurnClock({
      getGame: () => g,
      getRoom: () => null,
      isHeld: () => held,
      expire: () => {
        expired++;
        timeoutMove(g);
      },
      onError: (e) => {
        throw e;
      },
    });
    clock.tick();
    assert.equal(nodes.get("turn-clock-value").textContent, "0:15");
    now = 6000;
    clock.tick();
    assert.equal(nodes.get("turn-clock-value").textContent, "0:10");
    held = true;
    clock.tick();
    now = 106000;
    held = false;
    clock.tick();
    assert.equal(nodes.get("turn-clock-value").textContent, "0:10");
    now = 116000;
    clock.tick();
    clock.tick();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(expired, 1);
    clock.tick();
    assert.equal(nodes.get("turn-clock-value").textContent, "0:15");
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
import {
  syncClock,
  controlClock,
  clockExpired,
  timeoutMove,
} from "./dist/turn-clock.js";

test("turn clock pauses, resumes, resets per turn, and only expires in auto mode", () => {
  const g = new Game();
  g.deal();
  const c = { seconds: 30, mode: "auto", paused: false };
  syncClock(c, g, 1000);
  assert.equal(c.deadline, 31000);
  controlClock(c, "pause", g, 11000);
  assert.equal(c.remaining, 20000);
  assert.equal(clockExpired(c, g, 100000), false);
  controlClock(c, "resume", g, 100000);
  assert.equal(c.deadline, 120000);
  assert.equal(clockExpired(c, g, 120000), true);
  c.mode = "warn";
  assert.equal(clockExpired(c, g, 130000), false);
  c.mode = "auto";
  const lead = g.turn,
    lowest = [...g.hands[lead]].sort(
      (a, b) =>
        (a.r === g.level ? 16 : a.r >= 15 ? a.r + 2 : a.r) -
        (b.r === g.level ? 16 : b.r >= 15 ? b.r + 2 : b.r),
    )[0].r;
  timeoutMove(g);
  assert.equal(g.trick.move.cards[0].r, lowest);
  syncClock(c, g, 130000);
  assert.equal(c.deadline, 160000);
  const responder = g.turn,
    count = g.hands[responder].length;
  timeoutMove(g);
  assert.equal(g.hands[responder].length, count);
  assert.equal(g.passes, 1);
  c.seconds = 0;
  syncClock(c, g, 140000, true);
  assert.equal(clockExpired(c, g, 999999), false);
  g.phase = "tribute";
  syncClock(c, g, 150000);
  assert.equal(c.deadline, null);
});

test("host timer permissions, warning mode, expiry concurrency and manual actions", async () => {
  const { call, store, edit } = await fixture();
  let v = (await call(0)).data;
  const settings = {
    action: "turn-clock",
    seconds: 15,
    mode: "auto",
    version: v.room.version,
  };
  assert.equal((await call(1, settings)).status, 403);
  assert.equal((await call(0, { ...settings, seconds: -1 })).status, 400);
  assert.equal((await call(0, settings)).status, 200);
  await edit((r) => {
    r.turnClock.deadline = Date.now() - 1;
  });
  const row = await store.get("ABCDEFGH");
  await Promise.all([store.autoPlay(row), store.autoPlay(row)]);
  let after = await store.get("ABCDEFGH");
  assert.equal(after.version, row.version + 1);
  assert.equal(JSON.parse(after.state).game.playedCards.length, 1);
  v = (await call(0)).data;
  assert.equal(
    (
      await call(0, {
        action: "turn-clock",
        command: "pause",
        version: v.room.version,
      })
    ).status,
    200,
  );
  after = await store.get("ABCDEFGH");
  assert.equal(
    (await store.autoPlay(after, Date.now() + 100000)).version,
    after.version,
  );
  v = (await call(0)).data;
  assert.equal(
    (
      await call(0, {
        action: "turn-clock",
        seconds: 15,
        mode: "warn",
        version: v.room.version,
      })
    ).status,
    200,
  );
  await edit((r) => {
    r.turnClock.deadline = Date.now() - 1;
  });
  after = await store.get("ABCDEFGH");
  assert.equal((await store.autoPlay(after)).version, after.version);
  v = (await call(0)).data;
  await call(0, {
    action: "turn-clock",
    seconds: 15,
    mode: "auto",
    version: v.room.version,
  });
  await edit((r) => {
    r.turnClock.deadline = Date.now() - 1;
    r.botMovedAt = 0;
  });
  after = await store.get("ABCDEFGH");
  const p = JSON.parse(after.state).game.turn;
  assert.equal(
    (await call(p, { action: "pass", version: after.version })).status,
    409,
  );
  const final = await store.get("ABCDEFGH");
  assert.equal(final.version, after.version + 1);
  assert.equal(JSON.parse(final.state).game.passes, 1);
});

test("all difficulties finish legal hands and Hard ignores opponents' card identities", () => {
  for (const difficulty of ["easy", "normal", "hard"]) {
    const g = new Game();
    g.deal();
    let steps = 0;
    while (g.phase === "playing" && steps++ < 1000) {
      const p = g.turn,
        m = chooseAI(g, p, difficulty);
      if (m)
        g.play(
          p,
          m.cards.map((c) => c.id),
          m.key,
        );
      else g.pass(p);
    }
    assert.equal(g.phase, "round-over");
  }
  const g = new Game();
  g.deal();
  const p = g.turn;
  const m = chooseAI(g, p, "hard");
  const masked = {
    ...g,
    hands: g.hands.map((h, i) => (i === p ? h : Array(h.length).fill(null))),
  };
  assert.deepEqual(chooseAI(masked, p, "hard"), m);
  const randomMove = chooseAI(g, p, "easy", () => 0);
  assert.ok(moves(g.hands[p], g.level).some((m) => m.key === randomMove.key));
});

test("preferences reject invalid saved values and sound cues do not replay on polling", () => {
  const p = preferences({
    getItem: () => '{"theme":"bad","sound":"on","difficulty":"hard"}',
    setItem: () => {
      throw Error();
    },
  });
  assert.equal(p.value.theme, "jade");
  assert.equal(p.value.difficulty, "hard");
  p.set("theme", "midnight");
  assert.equal(p.value.theme, "midnight");
  p.set("sound", "bad");
  assert.equal(p.value.sound, "on");
  const a = { context: "a:1", plays: 0, myTurn: false, ended: false };
  assert.equal(soundEvent(null, a), null);
  assert.equal(soundEvent(a, { ...a, myTurn: true }), "turn");
  assert.equal(soundEvent(a, { ...a, plays: 1 }), "card");
  assert.equal(soundEvent(a, { ...a, ended: true, won: true }), "win");
  assert.equal(soundEvent(a, a), null);
  assert.equal(soundEvent(a, { ...a, context: "a:2", myTurn: true }), null);
  for (const e of Object.values(EMOTES))
    assert.notEqual(translate(e.label, "zh-CN"), e.label);
});

async function fixture() {
  const db = localDB(),
    tokens = ["1", "2", "3", "4"].map((x) => x.repeat(64));
  async function call(p, body) {
    const r = await handleRooms(
      new Request(
        "https://game.example/api/rooms" +
          (body?.action === "create" ? "" : "/ABCDEFGH"),
        {
          method: body ? "POST" : "GET",
          headers: {
            "X-Seat-Token": tokens[p],
            "Content-Type": "application/json",
          },
          ...(body
            ? {
                body: JSON.stringify({
                  requestId: crypto.randomUUID(),
                  ...body,
                }),
              }
            : {}),
        },
      ),
      { DB: db },
    );
    return { status: r.status, data: await r.json() };
  }
  await call(0, { action: "create", code: "ABCDEFGH", name: "Host" });
  for (let i = 1; i < 4; i++)
    await call(i, { action: "join", name: `Friend ${i}` });
  for (let i = 0; i < 4; i++) {
    const { data } = await call(i);
    await call(i, { action: "ready", ready: true, version: data.room.version });
  }
  const { data } = await call(0);
  await call(0, { action: "start", version: data.room.version });
  const store = new RoomStore(db);
  async function edit(fn) {
    const row = await store.get("ABCDEFGH"),
      room = JSON.parse(row.state);
    fn(room);
    await store.update(row, room);
  }
  async function absent(seat) {
    const seen = [Date.now(), Date.now(), Date.now(), Date.now()];
    seen[seat] = Date.now() - 180000;
    await db
      .prepare("UPDATE rooms SET presence = ? WHERE code = ?")
      .bind(JSON.stringify(seen), "ABCDEFGH")
      .run();
  }
  return { db, call, store, edit, absent };
}

test("spectator links reveal no hands or seat credentials, never claim seats or write presence", async () => {
  const { db, store, call } = await fixture();
  const v = (await call(0)).data;
  const before = await store.get("ABCDEFGH");
  const watch = async (method = "GET", key = v.room.spectatorKey) => {
    const r = await handleRooms(
      new Request(`https://game.example/api/rooms/ABCDEFGH/watch?key=${key}`, {
        method,
      }),
      { DB: db },
    );
    return { status: r.status, data: await r.json() };
  };
  const { data, status } = await watch();
  assert.equal(status, 200);
  assert.equal(data.room.spectator, true);
  assert.deepEqual(data.game.hand, []);
  assert.deepEqual(data.game.returns, []);
  assert.equal(data.game.hands, undefined);
  assert.equal(data.room.spectatorKey, undefined);
  assert.ok(data.room.members.every((m) => !m.tokenHash));
  assert.deepEqual(data.game.counts, [27, 27, 27, 27]);
  assert.equal((await watch("POST")).status, 405);
  assert.equal((await watch("GET", "wrong")).status, 404);
  const after = await store.get("ABCDEFGH");
  assert.equal(after.presence, before.presence);
  assert.equal(after.version, before.version);
});

test("host-only timeout, bot pacing, concurrent polls, and reconnection before substitution", async () => {
  const { call, store, edit, absent } = await fixture();
  let v = (await call(0)).data;
  assert.equal(
    (
      await call(1, {
        action: "settings",
        autoPlayMinutes: 1,
        version: v.room.version,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call(0, {
        action: "settings",
        autoPlayMinutes: 0.1,
        version: v.room.version,
      })
    ).status,
    400,
  );
  await edit((r) => {
    r.game.turn = 1;
  });
  await absent(1);
  let row = await store.get("ABCDEFGH");
  assert.equal((await store.autoPlay(row)).version, row.version);
  v = (await call(0)).data;
  assert.equal(
    (
      await call(0, {
        action: "settings",
        autoPlayMinutes: 1,
        version: v.room.version,
      })
    ).status,
    200,
  );
  row = await store.get("ABCDEFGH");
  await Promise.all([store.autoPlay(row), store.autoPlay(row)]);
  const acted = await store.get("ABCDEFGH");
  assert.equal(acted.version, row.version + 1);
  assert.equal(JSON.parse(acted.state).game.playedCards.length, 1);
  assert.equal((await store.autoPlay(acted)).version, acted.version);
  await edit((r) => {
    r.botMovedAt = 0;
    r.game.turn = 1;
  });
  await absent(1);
  const stale = await store.get("ABCDEFGH");
  const reconnected = await call(1);
  assert.equal(reconnected.data.room.members[1].bot, false);
  await store.autoPlay(stale);
  assert.equal((await store.get("ABCDEFGH")).version, stale.version);
});

test("absent winners return tribute and an absent host does not block the next hand", async () => {
  const { call, store, edit, absent } = await fixture();
  await edit((r) => {
    r.autoPlayMinutes = 1;
    r.game.phase = "tribute";
    r.game.returns = [{ from: 1, to: 2, received: r.game.hands[1][0].id }];
  });
  await absent(1);
  let row = await store.autoPlay(await store.get("ABCDEFGH"));
  assert.equal(JSON.parse(row.state).game.phase, "playing");
  assert.equal(JSON.parse(row.state).game.hands[1].length, 26);
  await edit((r) => {
    r.game.phase = "round-over";
    r.game.result = { order: [0, 2, 1, 3], partnerPlace: 2 };
  });
  await absent(0);
  const v = (await call(2)).data;
  assert.equal(
    (await call(2, { action: "next", version: v.room.version })).status,
    200,
  );
});

test("spectator client preserves a saved playing seat and rejects actions", async () => {
  let erased = false;
  const net = new OnlineRoom(
    () => {},
    () => {},
    {
      storage: {
        removeItem: () => {
          erased = true;
        },
      },
      fetcher: async () =>
        new Response(
          JSON.stringify({ room: { version: 1, spectator: true }, game: null }),
        ),
      setTimer: () => 0,
      clearTimer: () => {},
    },
  );
  await net.watch("ABCDEFGH", "a".repeat(64));
  await assert.rejects(net.action("play"), /only watch/);
  net.forget();
  assert.equal(erased, false);
});
