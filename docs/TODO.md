# Project TODO

Items to review for future gameplay and hosting iterations. The implemented core game does not yet address these follow-ups.

- [ ] **Resume a saved game another day:** The active game snapshot is stored in SQLite and a live session reconnects after refresh/server restart. Add a saved-games screen and persistent player identity so the host and original players can find and resume the game after closing the app or losing session storage. Decide what happens if the host does not return.
- [ ] **Expand the ruleset:** Add cards, counteroffers/multi-property trades, alternate victory/bankruptcy strategies, and other Banco Imobiliario-inspired rules. Single-property owner-approved purchase offers are implemented; current rules are documented in `decisions/game-rules.md`.
- [ ] **Expand loan terms:** Add installments, due dates, collateral, partial repayments, and default/collection policies. Current repayment requires paying the full outstanding balance during the borrower's turn.
- [ ] **Improve property liquidity:** Define a building-removal/refund rule so developed properties can be sold without selling the entire color group.
- [ ] **Improve active-game departure handling:** Non-host players currently cannot explicitly leave once a game starts, but can temporarily disconnect and reconnect. Define pause, forfeit, and asset/debt/turn handling before supporting removal.
- [ ] **Choose production database and hosting:** Decide whether SQLite with persistent disk is sufficient or to move to a managed database such as DynamoDB. Define backups, migrations, recovery, and retention for saved games.
- [ ] **Define account and player identity:** Decide whether anonymous room names are enough or players need accounts and a way to recover access to saved games.
- [ ] **Define room and saved-game lifecycle:** Decide when waiting rooms and finished or abandoned games expire, who can resume them, and how offline players or a missing host are handled.
- [ ] **Review production security and operations:** Require HTTPS, assess rate limits and password/token handling, and plan monitoring and recovery. If the server runs multiple instances, use shared socket presence and a Socket.IO adapter.
- [ ] **Test mobile distribution:** Verify the web app in a real mobile browser and any intended app WebView, including reconnects, backgrounding, and sharing/copying the room code.
