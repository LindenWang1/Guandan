import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// A reproducible offline practice demo built from the same UI and engine as the website.
const { outputFiles } = await build({
  entryPoints: ["dist/app.js"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  write: false,
});
let html = readFileSync("dist/index.html", "utf8");
html = html.replace(
  /<link[^>]+href="style.css"[^>]*>/,
  "<style>" + readFileSync("dist/style.css", "utf8") + "</style>",
);
html = html.replace(
  /<script type="module" src="boot.js"><\/script>/,
  () =>
    "<script>" +
    outputFiles[0].text.replace(/<\/script/gi, "<\\/script") +
    "</script>",
);
html = html.replace(
  'id="online-mode"',
  'disabled title="Online rooms require the local or hosted server." id="online-mode"',
);
html = html.replace(
  '<main id="main">',
  '<main id="main"><p class="practice-notice">Offline Demo · AI Practice / 离线演示 · 人机练习</p>',
);
mkdirSync("demo", { recursive: true });
writeFileSync("demo/guandan-demo.html", html);
console.log("Built demo/guandan-demo.html");
