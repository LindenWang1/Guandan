import test from "node:test";
import assert from "node:assert/strict";
import { handleRooms, publicView } from "./server/rooms.js";
import { localDB } from "./server/local-db.mjs";
import { Game, chooseAI } from "./dist/engine.js";
const tokens = Array.from({ length: 5 }, (_, i) => String(i + 1).repeat(64));
function client(db) {
  return async (p, body, code = "ABCDEFGH", extra = {}) => {
    const response = await handleRooms(
      new Request(
        "https://game.example/api/rooms" +
          (body?.action === "create" ? "" : "/" + code),
        {
          method: body ? "POST" : "GET",
          headers: {
            "X-Seat-Token": tokens[p],
            "Content-Type": "application/json",
            ...extra,
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
async function lobby() {
  const db = localDB(),
    call = client(db);
  let r = await call(0, {
    action: "create",
    code: "ABCDEFGH",
    name: "Host",
    doubleUp: 3,
  });
  assert.equal(r.status, 201);
  for (let i = 1; i < 4; i++)
    assert.equal(
      (await call(i, { action: "join", name: "Friend " + i })).status,
      200,
    );
  return { db, call };
}
async function start(call) {
  for (let i = 0; i < 4; i++) {
    let view = (await call(i)).data;
    assert.equal(
      (
        await call(i, {
          action: "ready",
          ready: true,
          version: view.room.version,
        })
      ).status,
      200,
    );
  }
  let view = (await call(0)).data;
  let r = await call(0, { action: "start", version: view.room.version });
  assert.equal(r.status, 200);
  return r.data;
}

test("emotes are authenticated, preset-only, rate-limited, public and expire without changing gameplay", async () => {
  const { db, call } = await lobby();
  const initial = await start(call);
  const version = initial.room.version;
  assert.equal(
    (await call(4, { action: "emote", emote: "happy", version })).status,
    401,
  );
  assert.equal(
    (await call(0, { action: "emote", emote: "<script>", version })).status,
    400,
  );
  const requestId = crypto.randomUUID();
  const sent = await call(0, {
    action: "emote",
    emote: "happy",
    version,
    requestId,
  });
  assert.equal(sent.status, 200);
  assert.deepEqual(sent.data.game, initial.game);
  const other = (await call(1)).data;
  assert.equal(other.room.members[0].emote.id, "happy");
  assert.equal(other.room.members[0].emote.eventId, requestId);
  assert.ok(other.room.members[0].emote.remainingMs > 0);
  assert.equal(
    (await call(0, { action: "emote", emote: "happy", version, requestId }))
      .status,
    200,
  );
  assert.equal(
    (
      await call(0, {
        action: "emote",
        emote: "angry",
        version: sent.data.room.version,
      })
    ).status,
    429,
  );
  const row = await db
    .prepare("SELECT * FROM rooms WHERE code = ?")
    .bind("ABCDEFGH")
    .first();
  assert.equal(
    publicView(row, 1, Date.now() + 6000).room.members[0].emote,
    null,
  );
});
test("four seats, unique room codes, readiness, host-only start, private hands, reconnect", async () => {
  const { db, call } = await lobby();
  assert.equal((await call(4, { action: "join", name: "Fifth" })).status, 409);
  let r = await call(0);
  assert.equal(
    (await call(0, { action: "start", version: r.data.room.version })).status,
    400,
  );
  await start(call);
  for (let i = 0; i < 4; i++) {
    const { data } = await call(i);
    assert.equal(data.game.hand.length, 27);
    assert.deepEqual(data.game.counts, [27, 27, 27, 27]);
    assert.equal(data.game.hands, undefined);
    assert.equal(
      data.game.names[2],
      i === 2 ? "Host" : "Friend " + ((i + 2) % 4),
    );
    assert(!JSON.stringify(data).includes("tokenHash"));
    assert(!JSON.stringify(data).includes(tokens[i]));
    const reconnect = await call(i);
    assert.deepEqual(reconnect.data.game.hand, data.game.hand);
  }
  assert.equal((await call(4)).status, 401);
  db.sqlite.close();
});
test("turn authority, forged cards, cross-origin requests, and replay protection", async () => {
  const { db, call } = await lobby();
  await start(call);
  const row = await db
      .prepare("SELECT * FROM rooms WHERE code = ?")
      .bind("ABCDEFGH")
      .first(),
    raw = JSON.parse(row.state),
    turn = raw.game.turn;
  const view = (await call(turn)).data;
  assert.equal(
    (
      await call((turn + 1) % 4, {
        action: "play",
        version: view.room.version,
        cardIds: [view.game.hand[0].id],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call(turn, {
        action: "play",
        version: view.room.version,
        cardIds: ["forged"],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call(turn, undefined, "ABCDEFGH", {
        Origin: "https://evil.example",
      })
    ).status,
    403,
  );
  const id = crypto.randomUUID(),
    body = {
      action: "play",
      version: view.room.version,
      cardIds: [view.game.hand[0].id],
      requestId: id,
    };
  const r = await call(turn, body);
  assert.equal(r.status, 200);
  assert.equal(r.data.game.hand.length, 26);
  const replay = await call(turn, body);
  assert.equal(replay.status, 200);
  assert.equal(replay.data.game.hand.length, 26);
  db.sqlite.close();
});
test("simultaneous updates cannot overwrite each other", async () => {
  const { db, call } = await lobby(),
    v = (await call(0)).data.room.version;
  const results = await Promise.all([
    call(0, { action: "ready", ready: true, version: v }),
    call(1, { action: "ready", ready: true, version: v }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const room = (await call(0)).data.room;
  assert.equal(room.members.filter((m) => m.ready).length, 1);
  db.sqlite.close();
});
test("lobby seat changes preserve credentials and opposite partnerships", async () => {
  const db = localDB(),
    call = client(db);
  await call(0, { action: "create", code: "ABCDEFGH", name: "Host" });
  await call(1, { action: "join", name: "Partner" });
  let r = await call(1);
  r = await call(1, { action: "seat", seat: 2, version: r.data.room.version });
  assert.equal(r.data.room.seat, 2);
  assert.equal(r.data.room.members[1], null);
  assert.equal((await call(1)).data.room.seat, 2);
  db.sqlite.close();
});
test("human tribute returns for both winners; no unauthorized return", () => {
  let n = 0;
  const c = (r) => ({ id: String(n++), r, s: "♠" });
  const g = new Game({
    manualTribute: true,
    playerNames: ["A", "B", "C", "D"],
  });
  g.result = { order: [1, 3, 0, 2], partnerPlace: 2 };
  g.hands = [
    [c(15), c(5)],
    [c(3), c(4)],
    [c(14), c(7)],
    [c(9), c(10)],
  ];
  g.phase = "playing";
  g.tribute();
  assert.equal(g.returns.length, 2);
  assert.throws(() => g.returnTribute(g.hands[0][0].id, 0));
  g.returnTribute(g.hands[1][0].id, 1);
  assert.equal(g.phase, "tribute");
  g.returnTribute(g.hands[3][0].id, 3);
  assert.equal(g.phase, "playing");
  assert.deepEqual(
    g.hands.map((h) => h.length),
    [2, 2, 2, 2],
  );
});
test("three full online hands with human actions, tribute and next-hand transitions", async () => {
  const { db, call } = await lobby();
  await start(call);
  for (let hand = 0; hand < 3; hand++) {
    let turns = 0;
    while (turns++ < 650) {
      const row = await db
          .prepare("SELECT * FROM rooms WHERE code = ?")
          .bind("ABCDEFGH")
          .first(),
        raw = JSON.parse(row.state),
        g = Object.assign(new Game(), raw.game);
      if (g.phase === "tribute") {
        for (const item of [...g.returns]) {
          const v = (await call(item.from)).data;
          assert.equal(
            (
              await call(item.from, {
                action: "tribute",
                version: v.room.version,
                cardId: v.game.hand[0].id,
              })
            ).status,
            200,
          );
        }
        continue;
      }
      if (g.phase !== "playing") break;
      const p = g.turn,
        view = (await call(p)).data,
        m = chooseAI(g, p),
        r = await call(p, {
          action: m ? "play" : "pass",
          version: view.room.version,
          ...(m
            ? { cardIds: m.cards.map((c) => c.id), declaration: m.key }
            : {}),
        });
      assert.equal(r.status, 200, JSON.stringify(r.data));
    }
    assert(turns < 650);
    const v = (await call(0)).data;
    assert(["round-over", "game-over"].includes(v.game.phase));
    if (hand < 2)
      assert.equal(
        (await call(0, { action: "next", version: v.room.version })).status,
        200,
      );
  }
  db.sqlite.close();
});
test("leaving ends active matches, expiry invalidates credentials, stale state rejected", async () => {
  const { db, call } = await lobby();
  await start(call);
  let v = (await call(0)).data;
  assert.equal((await call(0, { action: "pass", version: -1 })).status, 409);
  assert.equal(
    (await call(1, { action: "leave", version: v.room.version })).status,
    200,
  );
  v = (await call(0)).data;
  assert.equal(v.room.stage, "closed");
  assert.equal(
    (
      await call(0, {
        action: "play",
        version: v.room.version,
        cardIds: [v.game.hand[0].id],
      })
    ).status,
    410,
  );
  db.sqlite.prepare("UPDATE rooms SET expires_at = 0").run();
  assert.equal((await call(0)).status, 404);
  db.sqlite.close();
});

test("public played history rotates seats without exposing unplayed hands", async () => {
  const { db, call } = await lobby();
  await start(call);
  const raw = JSON.parse(
      (
        await db
          .prepare("SELECT * FROM rooms WHERE code = ?")
          .bind("ABCDEFGH")
          .first()
      ).state,
    ),
    p = raw.game.turn,
    v = (await call(p)).data,
    id = v.game.hand[0].id;
  await call(p, { action: "play", version: v.room.version, cardIds: [id] });
  for (let seat = 0; seat < 4; seat++) {
    const game = (await call(seat)).data.game;
    assert.equal(game.playedCards[0].player, (p - seat + 4) % 4);
    assert.deepEqual(
      game.playedCards[0].move.cards.map((c) => c.id),
      [id],
    );
    assert.equal(game.hands, undefined);
  }
  db.sqlite.close();
});
test("changing partners clears readiness and control-only names are rejected", async () => {
  const db = localDB(),
    call = client(db);
  await call(0, { action: "create", code: "ABCDEFGH", name: "Host" });
  assert.equal(
    (await call(1, { action: "join", name: "\u0001\u0002" })).status,
    400,
  );
  await call(1, { action: "join", name: "Friend" });
  let v = (await call(0)).data;
  await call(0, { action: "ready", ready: true, version: v.room.version });
  v = (await call(1)).data;
  await call(1, { action: "seat", seat: 2, version: v.room.version });
  const after = (await call(0)).data.room;
  assert.equal(after.members[0].ready, false);
  assert.equal(after.members[2].ready, false);
  db.sqlite.close();
});
