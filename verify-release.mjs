import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "./dist/server/index.js";
import { clientFiles, contentTypes } from "./assets.mjs";

for (const name of clientFiles) {
  const response = await worker.fetch(
    new Request("https://table.example/" + name),
    {},
  );
  assert.equal(response.status, 200, name);
  assert.equal(
    await response.text(),
    readFileSync("dist/" + name, "utf8"),
    name + " has stale build output",
  );
  assert.equal(
    response.headers.get("Content-Type"),
    contentTypes[name.split(".").pop()],
  );
}
assert.equal(
  (await worker.fetch(new Request("https://table.example/private-file"), {}))
    .status,
  404,
);
assert.equal(
  (
    await worker.fetch(
      new Request("https://table.example/", { method: "POST" }),
      {},
    )
  ).status,
  405,
);
const head = await worker.fetch(
  new Request("https://table.example/", { method: "HEAD" }),
  {},
);
assert.equal(await head.text(), "");
const demo = readFileSync("demo/guandan-demo.html", "utf8");
assert(!demo.includes('src="boot.js"'));
assert(!demo.includes('href="style.css"'));
assert(demo.includes("Offline Demo"));
console.log(
  `Release verified: ${clientFiles.length} current assets, Worker routes, standalone demo.`,
);
