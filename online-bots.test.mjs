import test from "node:test";
import assert from "node:assert/strict";
import { handleRooms, RoomStore } from "./server/rooms.js";
import { localDB } from "./server/local-db.mjs";
import { chooseAI } from "./dist/engine.js";

const tokens = Array.from({ length: 3 }, (_, i) => String(i + 1).repeat(64));
function client(db) {
  return async (p, body) => {
    const response = await handleRooms(
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
    return { status: response.status, data: await response.json() };
  };
}
async function room() {
  const db = localDB(),
    call = client(db);
  await call(0, {
    action: "create",
    code: "ABCDEFGH",
    name: "Host",
    doubleUp: 3,
  });
  const version = async () => (await call(0)).data.room.version;
  return { db, call, version, store: new RoomStore(db) };
}

test("host fills open seats with AI players who are always ready", async () => {
  const { call, version } = await room();
  for (const [seat, level] of [
    [1, "expert"],
    [2, "hard"],
    [3, "easy"],
  ]) {
    const r = await call(0, {
      action: "add-bot",
      seat,
      level,
      version: await version(),
    });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  }
  const { members } = (await call(0)).data.room;
  assert.deepEqual(
    members.map((m) => [m.name, !!m.ai, m.level, m.ready]),
    [
      ["Host", false, undefined, false],
      ["River (AI)", true, "expert", true],
      ["Jade (AI)", true, "hard", true],
      ["Lotus (AI)", true, "easy", true],
    ],
  );
  // AI seats stay ready after the host changes readiness.
  await call(0, { action: "ready", ready: true, version: await version() });
  assert.equal(
    (await call(0, { action: "start", version: await version() })).status,
    200,
  );
});

test("only the host manages AI seats, only in the lobby, only in open seats", async () => {
  const { call, version } = await room();
  await call(1, { action: "join", name: "Friend" });
  const v = await version();
  assert.equal(
    (await call(1, { action: "add-bot", seat: 2, level: "hard", version: v }))
      .status,
    403,
  );
  assert.equal(
    (await call(0, { action: "add-bot", seat: 1, level: "hard", version: v }))
      .status,
    400,
  );
  assert.equal(
    (await call(0, { action: "add-bot", seat: 2, level: "genius", version: v }))
      .status,
    400,
  );
  assert.equal(
    (await call(0, { action: "add-bot", seat: 2, level: "hard", version: v }))
      .status,
    200,
  );
  assert.equal(
    (await call(0, { action: "remove-bot", seat: 1, version: await version() }))
      .status,
    400,
    "a person cannot be removed as if they were an AI",
  );
  assert.equal(
    (await call(0, { action: "remove-bot", seat: 2, version: await version() }))
      .status,
    200,
  );
  assert.equal((await call(0)).data.room.members[2], null);
});

test("a table left with only AI players closes instead of keeping an AI host", async () => {
  const { call, version, store } = await room();
  await call(0, {
    action: "add-bot",
    seat: 1,
    level: "normal",
    version: await version(),
  });
  assert.equal(
    (await call(0, { action: "leave", version: await version() })).status,
    200,
  );
  const state = JSON.parse((await store.get("ABCDEFGH")).state);
  assert.equal(state.stage, "closed");
  assert.notEqual(
    (await call(2, { action: "join", name: "Late" })).status,
    200,
  );
});

test("one person plays a full hand against three AI seats", async () => {
  const { call, version, store } = await room();
  for (const seat of [1, 2, 3])
    await call(0, {
      action: "add-bot",
      seat,
      level: "expert",
      version: await version(),
    });
  await call(0, { action: "ready", ready: true, version: await version() });
  await call(0, { action: "start", version: await version() });
  let guard = 0;
  for (;;) {
    assert.ok(guard++ < 3000, "hand did not finish");
    const row = await store.get("ABCDEFGH"),
      state = JSON.parse(row.state);
    if (state.game.phase !== "playing") break;
    if (state.game.turn === 0) {
      // The person plays like a Medium AI would, through the normal API.
      const view = (await call(0)).data;
      const g = state.game,
        m = chooseAI({ ...g, hands: g.hands }, 0, "normal");
      const r = m
        ? await call(0, {
            action: "play",
            cardIds: m.cards.map((c) => c.id),
            declaration: m.key,
            version: view.room.version,
          })
        : await call(0, { action: "pass", version: view.room.version });
      assert.equal(r.status, 200, JSON.stringify(r.data));
    } else {
      // Skip the real-time pacing so the test runs quickly.
      state.botMovedAt = 0;
      await store.update(row, state);
      const before = (await store.get("ABCDEFGH")).version;
      await call(0); // a poll lets the server move for the AI seat
      assert.ok(
        (await store.get("ABCDEFGH")).version > before,
        "AI did not move",
      );
    }
  }
  const final = (await call(0)).data;
  assert.ok(["round-over", "game-over"].includes(final.game.phase));
  assert.equal(final.game.result.order.length, 4);
});

test("AI seats wait for their pacing interval between moves", async () => {
  const { call, version, store } = await room();
  for (const seat of [1, 2, 3])
    await call(0, {
      action: "add-bot",
      seat,
      level: "normal",
      version: await version(),
    });
  await call(0, { action: "ready", ready: true, version: await version() });
  await call(0, { action: "start", version: await version() });
  const row = await store.get("ABCDEFGH"),
    state = JSON.parse(row.state);
  state.game.turn = 1;
  state.botMovedAt = Date.now();
  await store.update(row, state);
  const v = (await store.get("ABCDEFGH")).version;
  await call(0);
  assert.equal((await store.get("ABCDEFGH")).version, v, "moved too soon");
});
