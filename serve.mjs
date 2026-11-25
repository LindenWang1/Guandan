import { clientFiles } from "./assets.mjs";
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleRooms } from "./server/rooms.js";
import { localDB } from "./server/local-db.mjs";
const base = path.dirname(fileURLToPath(import.meta.url)),
  root = path.join(base, "dist");
await mkdir(path.join(base, ".local"), { recursive: true });
const DB = localDB(path.join(base, ".local", "rooms.sqlite"));
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        let chunks = [],
          size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 4096) {
            res.writeHead(413);
            return res.end();
          }
          chunks.push(chunk);
        }
        const request = new Request(url, {
          method: req.method,
          headers: req.headers,
          ...(req.method === "POST" ? { body: Buffer.concat(chunks) } : {}),
        });
        const response = await handleRooms(request, { DB });
        res.writeHead(response.status, Object.fromEntries(response.headers));
        return res.end(await response.text());
      }
      const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      if (!clientFiles.includes(name)) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.setHeader(
        "Content-Type",
        name.endsWith(".html")
          ? "text/html; charset=utf-8"
          : name.endsWith(".css")
            ? "text/css; charset=utf-8"
            : "text/javascript; charset=utf-8",
      );
      res.setHeader("Cache-Control", "no-cache");
      res.end(await readFile(path.join(root, name)));
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end("Unable to load the game.");
    }
  })
  .listen(Number(process.env.PORT) || 4174, "127.0.0.1", function () {
    console.log("http://127.0.0.1:" + this.address().port);
  });
