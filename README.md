# FinanceGameinator

A mobile-first, Portuguese-language property-trading board game inspired by Banco Imobiliario. React + TypeScript on the web; NestJS + Socket.IO + SQLite on the server.

## Run locally

Requires Node.js 24 or newer and npm. Node 24.3 reports `node:sqlite` as experimental; this implementation is tested on that version.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` and `/socket.io` to NestJS on port 3001. If 5173 is occupied, Vite prints its next available port. For a phone on the same network, open `http://YOUR_COMPUTER_LAN_IP:5173` using that actual port. The firewall must allow access; do not expose the development server to the public internet. A mobile WebView can load the same URL. Clipboard copying may require HTTPS on mobile; the code remains visible.

1. Choose **Criar sala**, enter a player name and a password (4-64 characters), then save the recovery code shown after the room is created.
2. The server generates a six-character room code. Share the room code and password with friends; keep your personal recovery code private.
3. In another browser/device, choose **Entrar na sala** and supply a name, code, and password.
4. Choose a unique token color. The host selects a JSON-configured board and can start with 2-8 connected players.
5. Take turns rolling server-generated dice, move around the circular board, buy and develop properties, make owner-approved offers on other players' properties, pay rent, handle loans or bankruptcy, and resolve holiday and jail spaces. After resolving the landing, the active player can take other actions or explicitly finish their turn. The account and property details are available in the bottom navigation.

Room identity is stored in `sessionStorage`: refreshes/reconnections restore the same player. A different browser or device provides an independent player. Each player receives a private saved-game recovery code when creating or joining; choose **Continuar jogo salvo** on the home screen to reclaim that exact seat, even after the game has started. Recovery rotates the session token and disconnects the old session. Keep the recovery code outside the browser; it is shown once, can be replaced from the room header while signed in, and cannot be recovered if both it and the browser session are lost. Alternatively, **Entrar na sala** can reclaim a seat in a started room with the same room code, password, and original player name. Because the room password is shared, the recovery code is the stronger seat-specific credential; use it if names are duplicated.

Room and game snapshots have no automatic expiry: they remain available across browser closures and server restarts while the same SQLite database is retained. Months-later resumption therefore requires keeping `DATABASE_PATH` on durable storage and backing up that database. An owner leaving explicitly closes and deletes the room for everyone; deleting or losing the database also deletes saved games. Closing a non-owner tab only disconnects it; in a waiting room its offline seat must reconnect before the host can start.

## Build and serve

```sh
npm run build
npm start
```

Open http://localhost:3001. NestJS serves the compiled React app with SPA route fallback as well as the API and sockets on one origin. For production, terminate HTTPS at a reverse proxy that supports Socket.IO/WebSocket upgrades. Run one server process with a persistent database volume. Do not use multiple server replicas with this presence model.

Optional server environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP/socket port |
| `DATABASE_PATH` | `data/finance-gameinator.sqlite` | SQLite file, relative to server working directory |

The default file is `apps/server/data/finance-gameinator.sqlite`, not an in-memory mock. Passwords use salted scrypt hashes. Reconnect tokens and saved-game recovery codes are random bearer secrets; only their SHA-256 hashes are stored in SQLite. Neither is included in public room snapshots. Protect and back up the database, and do not publish it. HTTP room creation/join/recovery, connections, and socket commands are rate limited locally.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

Tests run actual NestJS HTTP and Socket.IO clients, covering invalid input/passwords, creation, joining, presence, unique colors, owner-selected boards, authoritative dice, owner authorization, disconnect/reconnect, multi-tab identity, starting, leaving, and on-disk lobby/game persistence after restart. Deterministic game-rule tests cover config validation, circular movement, start bonuses, purchases and ownership conflicts, rent by development level, even house/hotel construction, sale proceeds, debt and purchase financing, jail/bail escalation, transaction idempotency, loan repayment, bankruptcy transfers, and victory. No AWS commands or cloud services are needed.

## Scope and layout

- `apps/web`: responsive home, lobby, saved-game recovery, game board, turn/actions, wallet, bank, investments, wellbeing goals, and properties screens.
- `apps/server`: authoritative room/game rules, SQLite storage, JSON board loader, REST, and sockets.
- `apps/server/boards`: one JSON file per board. Add supported spaces and property data here; restart the server to load a new board.
- `docs/decisions/game-rules.md`: initial rules and explicit assumptions.
- `legacy/finance_gameinator` and `legacy/ServerSide`: original Flutter/.NET implementations, preserved as reference.
- `docs/decisions/project intiation.md`: architecture and scope decisions.

Windows denied moving two hidden `.vs` cache directories; the original `ServerSide` path still contains those caches and generated `obj` remnants. All application source was relocated to `legacy/ServerSide`. Close tools using the old solution before moving the remaining caches; they were left untouched rather than forcibly deleted.

Game snapshots are persisted in SQLite and restored after server restart. Saved-game discovery is by the player's private recovery code, not by listing all rooms or creating a permanent account. Trading, cards, loan-default collection, and flexible liquidation of developed property are not implemented yet; see [docs/TODO.md](docs/TODO.md) and [docs/decisions/game-rules.md](docs/decisions/game-rules.md).