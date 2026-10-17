# Project Initiation

Date: 2026-10-14

## Context

Read the existing idea, Game Room RFC, Execution Planning, Decision Matrix, and Tasks documents in `docs/FinanceGameinator`. They describe a Banco Imobiliario/Monopoly-inspired game whose initial room workflow creates a room, shares its code, connects players, broadcasts presence, and lets only the admin start when everyone is online. The historical architecture proposed Flutter, .NET, Cognito, Lambda, API Gateway, and DynamoDB; the current request supersedes that stack with a JavaScript/TypeScript web app and server and brings password protection into the initial scope.

The decision matrix is an externally hosted image rather than local textual decisions. This implementation uses the written RFC and execution plan as the behavioral reference without claiming to have analyzed that image. Broader player dashboards, historical games, durable accounts, player reordering, and complete game lifecycle rules remain future work.

## Decisions

### Preserve the previous applications

Move the original `finance_gameinator` and `ServerSide` folders to `legacy/`, without rewriting their source. The new application lives in `apps/`. Keep relocated credentials and generated build artifacts ignored. Do not reuse or read legacy cloud credentials. No AWS commands, provisioning, or resource modifications are authorized or performed.

Execution note: Windows denied moving/removing two hidden `.vs` cache directories, leaving those caches and generated `obj` files under the original `ServerSide` path. The source, solution, and other application files are in `legacy/ServerSide`. An atomic move of the residual directory was also denied. Do not forcibly delete or change permissions on these leftovers; close the tools holding the old solution before completing that cache relocation.

### React, Vite, and TypeScript

Use React with Vite for a small client-rendered app. This lobby does not need SSR. Portuguese screens are designed mobile-first with touch targets, readable inputs, responsive layouts, loading/error states, password visibility, and live status. Lucide supplies control icons. A procedural canvas drawing supplies original board-game artwork without third-party product imagery. The app can be opened in a mobile browser or loaded by a native WebView; a native app binary is not part of this request.

### NestJS and Socket.IO

Use NestJS for structured REST controllers, dependency injection, and WebSocket gateways. Socket.IO provides rooms, heartbeat detection, reconnection, and acknowledgements. REST creates/joins rooms; authenticated sockets deliver complete public snapshots and handle start/leave. The server, never the client, decides membership, presence, permissions, and state changes. Complete snapshots simplify recovery after reconnecting and prevent clients from missing a join/leave delta.

### SQLite for the initial database

Choose a real, file-backed SQLite database using Node's built-in `node:sqlite`, with WAL, foreign keys, and transactional room creation. The user allowed another database. SQLite makes the application runnable without AWS credentials, Docker, a paid service, or cloud provisioning. Node 24+ is required; Node 24.3 emits an experimental SQLite warning. Rooms, hashed credentials, membership, and start status survive server restarts. Presence resets to offline on startup and is restored only by authenticated active sockets.

DynamoDB remains a plausible deployment choice, especially given the historical game-partition design. Do not add an untested DynamoDB adapter now. Before adopting it, define room-code conditional writes, atomic membership/capacity and start operations, TTL cleanup, and strongly consistent reads where needed. Multiple server instances also require shared presence and a Socket.IO adapter (typically Redis); swapping the database alone does not solve that.

### Identity and security

Each room gets an unbiased cryptographically generated six-character code, excluding confusing characters. A player supplies a 2-24 character name and the owner supplies a 4-64 character room password. Store passwords as salted scrypt hashes. After create/join, return a 256-bit random reconnect token and store only its hash in the database. Authenticate every socket and socket command against persisted membership. Public snapshots contain no credentials.

Keep the bearer token in tab-scoped `sessionStorage`, allowing refresh and transport reconnects without adding duplicate players. All active sockets for one identity count as one online player; one socket disconnecting cannot mark another active socket offline. This is lightweight anonymous identity, not an account system. Credentials cannot be recovered after session storage is lost. No password is retained in the browser after successful entry. HTTPS is required for a public deployment, and persistent rate limits, cleanup policies, monitoring, and an account/recovery strategy are production follow-ups.

### Lobby semantics

- Create: persist room + owner, return generated code and session, navigate to `/room/:code`, connect socket.
- Join: normalize and validate code, verify password, reject full/started rooms, persist player, return session, navigate and connect.
- Presence: server broadcasts every join, socket connect, disconnect, explicit leave, and start. Transport failure keeps the player listed but offline; reconnect uses the same identity.
- Start: owner only, at least two players, all members online, maximum eight players. Persist `started` and notify everyone. New players cannot join a started room.
- Leave: a participant explicitly leaving removes their membership; the owner explicitly leaving closes the room and revokes all tokens. A temporary owner disconnect does not transfer ownership or destroy the room.
- Abandoned offline seats intentionally prevent starting, consistent with the docs. Owner moderation and automated expiration are deferred; reconnect, explicitly leave, or create a new room.
- The first game iteration added JSON-configured boards, server-authoritative turns, token colors, property ownership/rent, configured house/hotel progression, bank sales, escalating bail, loans/repayment, debt resolution, bankruptcy, and last-solvent-player victory. Trades, cards, loan defaults/installments, and cross-day saved-game discovery remain deferred.

### Serving and operational limits

In development, Vite proxies REST and Socket.IO to NestJS so phone clients use the computer's LAN URL rather than their own localhost. Production builds are served by NestJS on one origin, including SPA route fallback. Use an HTTPS reverse proxy and persistent storage for deployment. This release is single-process: SQLite writes and credential derivation are synchronous and local rate limiting is in memory. Scale or public load requires revisiting those limits, worker-based password derivation, distributed rate limiting, session expiration, and shared socket presence.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. HTTP/socket integration tests exercise create/join, invalid credentials, presence, authorization, reconnect, multiple sockets, start, leave, and SQLite restart persistence. Core game-rule tests use deterministic dice for purchases, financing, movement, construction, sale, rent, jail, bankruptcy, transactions, and victory.

Verified locally on Node 24.3:

- HTTP/socket integration and SQLite restart tests pass.
- Fourteen deterministic rules and integration tests pass, including construction, sales, debt/repayment, bankruptcy, and victory.
- Both applications typecheck and build; editor diagnostics are clear.
- Runtime dependency audit reports zero known vulnerabilities.
- Browser screenshots and layout measurements show no horizontal overflow at effective CSS widths of 1280, 390, and 320 pixels. Both entry forms also fit at 320 pixels, with 52-pixel inputs and 54-pixel primary buttons.
- Canvas pixel readback confirms the board artwork is nonblank.
- Two independent browser players join with a shared code/password; wrong passwords are rejected, refresh preserves membership, and the started state reaches the guest. The guest has no start button.
- The built SPA loads directly through NestJS at `/join`; `/api/health` returns JSON and unknown API routes remain HTTP 404 rather than being swallowed by the SPA fallback.

The integrated browser required forced Playwright clicks for a few controls because its stability wait stalled. Server integration tests validate those transitions independently. Desktop and narrow mobile browser layouts are checked; no real-device WebView, public deployment, or multi-instance operation has been certified.