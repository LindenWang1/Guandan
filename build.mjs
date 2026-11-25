import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { clientFiles as files, contentTypes as types } from "./assets.mjs";
const assets = Object.fromEntries(
  files.map((file) => [
    "/" + file,
    {
      body: readFileSync("dist/" + file, "utf8"),
      type: types[file.split(".").pop()],
    },
  ]),
);
await build({
  entryPoints: ["server/worker.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "dist/server/index.js",
  plugins: [
    {
      name: "assets",
      setup(b) {
        b.onResolve({ filter: /assets\.generated\.js$/ }, () => ({
          path: "assets",
          namespace: "inline",
        }));
        b.onLoad({ filter: /.*/, namespace: "inline" }, () => ({
          contents: "export const assets=" + JSON.stringify(assets),
          loader: "js",
        }));
      },
    },
  ],
});
console.log("Built Guandan with online rooms.");
