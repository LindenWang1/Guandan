# Run and Publish Your Own Guandan Website

For a quick playable preview, run `pnpm build:demo` and open **demo/guandan-demo.html** in your browser, or use the GitHub Pages link in the README. For the full website with online 2v2, follow the setup below. **docs/FILES.md** describes every part of the project, including the English/Chinese toggle and manual card grouping.

You do not need to buy a domain first. Hosting runs the game; a domain is the optional address people type to reach it. This project uses a Cloudflare Worker for the website and game API, and a Cloudflare D1 database for online rooms. A plain static-file upload alone will not provide working online multiplayer.

The repo contains the game, server, database schema and migrations, tests, dependency lockfile, and a deployment template. Installed dependencies, local test databases and your Cloudflare settings stay out of git. Deploying creates your own website and database in your Cloudflare account.

## 1. Install the Tools

Install Node.js 24 or newer from https://nodejs.org/ . Open a terminal in the repo folder, where package.json is located, and run:

```sh
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
```

## 2. Try It on Your Computer

```sh
pnpm start
```

Open http://127.0.0.1:4174 . Keep the terminal running. Press Ctrl+C to stop it. This local address is only available on your computer; use the published address to invite friends on other devices. Local rooms are saved separately in .local/rooms.sqlite.

For verification:

```sh
pnpm test
```

## 3. Create Your Hosting Account and Database

Create a Cloudflare account, then run:

```sh
pnpm dlx wrangler login
pnpm dlx wrangler d1 create guandan-rooms
```

The database command prints a database ID. Copy wrangler.example.toml to a new file named wrangler.toml, and replace REPLACE_WITH_YOUR_D1_DATABASE_ID with that ID. Keep the binding name DB: the game code expects it. You may change the Worker name guandan-game to another available name.

## 4. Set Up the Tables and Publish

Apply the included migration to your newly created database, then deploy:

```sh
pnpm dlx wrangler d1 migrations apply DB --remote
pnpm dlx wrangler deploy
```

Wrangler builds the game using pnpm build and prints the deployed URL. It will look like https://guandan-game.YOUR-SUBDOMAIN.workers.dev . Open the actual URL printed by Wrangler. Create a room and share the invite with three friends.

Do not reuse another person's database ID or account credentials. wrangler.toml is git-ignored so your database ID stays out of the repo.

## 5. Add a Custom Domain Later (Optional)

You can keep the workers.dev address. If you want an address such as play.yourdomain.com, buy or use a domain you own, add it to your Cloudflare account, and connect it to the Worker as a Custom Domain. You do not upload the game to the domain registrar: the domain points to the hosting service running it.

## Make Changes Later

Edit the HTML, CSS, and JavaScript under dist/ (except generated dist/server/). The shared rules are in dist/engine.js; server/rooms.js handles online multiplayer. Run pnpm test and pnpm dlx wrangler deploy to publish changes. If changing the database schema, generate a new migration with pnpm db:generate, review it, and apply it before deploying. Preserve previously applied migration files.

The code is supplied; hosting and domain registration are separate services. Check your provider's current quotas and pricing as traffic grows. No paid domain is necessary to begin.

## Official References

- D1 setup: https://developers.cloudflare.com/d1/get-started/
- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Host-provided address: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Custom domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

The supplied Wrangler configuration has been prepared for this code but has not been deployed into your personal Cloudflare account.
