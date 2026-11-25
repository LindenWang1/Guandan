import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Game, chooseAI } from "./dist/engine.js";
import { restorePractice, practiceSession } from "./dist/practice-session.js";
import { practiceStats } from "./dist/stats.js";
import { OnlineRoom } from "./dist/online.js";
import { clientFiles } from "./assets.mjs";

const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
const seat = { code: "ABCDEFGH", token: "1".repeat(64) };
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
const view = (version) => ({ room: { version, code: seat.code }, game: {} });
const snapshot = (g) => JSON.stringify({ version: 1, state: g });

test("every frontend import is included in the common development/production asset list", () => {
  for (const file of clientFiles) {
    const source = readFileSync("dist/" + file, "utf8");
    if (file.endsWith(".js"))
      for (const match of source.matchAll(
        /(?:from\s*|import\s*\()\s*['"]\.\/([^'"]+)['"]/g,
      ))
        assert(
          clientFiles.includes(match[1]),
          file + " imports missing " + match[1],
        );
  }
  assert(clientFiles.includes("stats.js"));
  assert.match(readFileSync("serve.mjs", "utf8"), /clientFiles\.includes/);
});

test("practice restoration preserves cards and rules after play, passes, finish and tribute", () => {
  let seed = 71;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  let game = new Game({ random });
  game.deal();
  for (let i = 0; i < 500; i++) {
    const restored = restorePractice(snapshot(game));
    assert(restored, game.phase);
    assert.deepEqual(restored.hands, game.hands);
    assert.deepEqual(restored.playedCards, game.playedCards);
    assert.equal(typeof restored.play, "function");
    if (game.phase === "round-over") {
      restored.deal();
      assert.equal(restored.playedCards.length, 0);
      assert(restorePractice(snapshot(restored)));
      break;
    }
    const move = chooseAI(game, game.turn);
    if (move)
      game.play(
        game.turn,
        move.cards.map((c) => c.id),
        move.key,
      );
    else game.pass(game.turn);
  }
});
test("practice saves reject damaged data, duplicate cards and injected methods", () => {
  assert.equal(restorePractice("bad"), null);
  const game = new Game();
  game.deal();
  game.hands[0][0] = game.hands[0][1];
  assert.equal(restorePractice(snapshot(game)), null);
  game.deal = () => {};
  const valid = new Game();
  valid.deal();
  const data = JSON.parse(snapshot(valid));
  data.state.play = "broken";
  assert.equal(typeof restorePractice(JSON.stringify(data)).play, "function");
});
test("practice writes only when state changes and safely handles disabled storage", () => {
  let writes = 0;
  const storage = { setItem: () => writes++ };
  const s = practiceSession(storage),
    g = new Game();
  g.deal();
  s.save(g);
  s.save(g);
  assert.equal(writes, 1);
  const blocked = practiceSession(null);
  assert.doesNotThrow(() => blocked.save(g));
  assert.equal(blocked.load(), null);
});
test("statistics really accumulate when storage throws or is unavailable", () => {
  for (const storage of [
    null,
    {
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    },
    {
      getItem: () => null,
      setItem() {
        throw Error();
      },
    },
  ]) {
    const s = practiceStats(storage);
    s.record(true);
    s.record(true);
    s.record(false);
    assert.deepEqual(s.get(), {
      matches: 3,
      wins: 2,
      streak: 0,
      bestStreak: 2,
    });
  }
});
test("a definitively rejected join retains the previous seat", async () => {
  const storage = memory();
  storage.setItem("guandan-seat-v2", JSON.stringify(seat));
  const client = new OnlineRoom(
    () => {},
    () => {},
    { storage, fetcher: async () => response({ error: "Full" }, 409) },
  );
  await assert.rejects(client.join("ZZZZZZZZ", "Guest"));
  assert.deepEqual(client.saved(), seat);
});
test("transient resume failure schedules recovery; terminal expiry stops retrying", async () => {
  const storage = memory();
  storage.setItem("guandan-seat-v2", JSON.stringify(seat));
  let scheduled = 0,
    updated = 0,
    fail = true;
  const client = new OnlineRoom(
    () => updated++,
    () => {},
    {
      storage,
      fetcher: async () => {
        if (fail) throw Error("offline");
        return response(view(1));
      },
      setTimer: () => ++scheduled,
      clearTimer: () => {},
    },
  );
  await assert.rejects(client.resume());
  assert.equal(scheduled, 1);
  assert.equal(client.stopped, false);
  fail = false;
  await client.reconnect();
  assert.equal(updated, 1);
  client.fetcher = async () => response({ error: "expired" }, 404);
  await client.reconnect();
  assert.equal(client.stopped, true);
  const count = scheduled;
  client.poll();
  assert.equal(scheduled, count);
});
test("late responses from a stopped client cannot update the new table", async () => {
  let release,
    updates = 0;
  const storage = memory();
  storage.setItem("guandan-seat-v2", JSON.stringify(seat));
  const c = new OnlineRoom(
    () => updates++,
    () => {},
    {
      storage,
      fetcher: () => new Promise((resolve) => (release = resolve)),
      setTimer: () => {},
      clearTimer: () => {},
    },
  );
  const pending = c.resume();
  c.stop();
  release(response(view(1)));
  await pending;
  assert.equal(updates, 0);
});
test("uncertain action retries use the same idempotency key and reject stale responses", async () => {
  const bodies = [];
  let attempt = 0,
    updates = [];
  const c = new OnlineRoom(
    (v) => updates.push(v.room.version),
    () => {},
    {
      storage: memory(),
      fetcher: async (_, options) => {
        bodies.push(JSON.parse(options.body));
        if (attempt++ === 0) throw Error("lost");
        return response(view(3));
      },
    },
  );
  c.credentials = seat;
  c.latest = view(2);
  await c.action("pass");
  assert.equal(bodies[0].requestId, bodies[1].requestId);
  c.accept(view(1));
  assert.deepEqual(updates, [3]);
  assert.equal(c.pending, null);
});

test("native browser fetch retains its global receiver", async (t) => {
  t.mock.method(globalThis, "fetch", function () {
    assert.equal(this, globalThis);
    return Promise.resolve(response(view(1)));
  });
  const c = new OnlineRoom(
    () => {},
    () => {},
    { storage: memory() },
  );
  c.credentials = seat;
  assert.equal((await c.request()).room.version, 1);
});
