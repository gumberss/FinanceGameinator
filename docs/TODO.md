# Project TODO

Items to review for future gameplay and hosting iterations. The implemented core game does not yet address these follow-ups.

- [x] **Resume a saved game another day:** Players can reclaim their exact seat in a started game with a private recovery code after losing browser session storage. Rooms do not expire automatically; the SQLite database must be retained and backed up. The owner can still delete the room explicitly. A room listing and permanent user profiles are not provided.
- [ ] **Expand the ruleset:** Add cards, counteroffers/multi-property trades, alternate victory/bankruptcy strategies, and other Banco Imobiliario-inspired rules. Single-property owner-approved purchase offers are implemented; current rules are documented in `decisions/game-rules.md`.
- [ ] **Expand loan terms:** Add installments, due dates, collateral, partial repayments, and default/collection policies. Current repayment requires paying the full outstanding balance during the borrower's turn.
- [ ] **Improve property liquidity:** Define a building-removal/refund rule so developed properties can be sold without selling the entire color group.
- [ ] **Improve active-game departure handling:** Non-host players currently cannot explicitly leave once a game starts, but can temporarily disconnect and reconnect. Define pause, forfeit, and asset/debt/turn handling before supporting removal.
- [ ] **Choose production database and hosting:** Decide whether SQLite with persistent disk is sufficient or to move to a managed database such as DynamoDB. Automate backups and test restoration; recovery keys cannot restore a lost database.
- [ ] **Define account and player identity:** Recovery is anonymous and per-seat. Decide whether permanent user profiles or account-based room discovery are needed.
- [ ] **Define room and saved-game lifecycle:** Decide when waiting rooms and finished or abandoned games expire, who can resume them, and how offline players or a missing host are handled.
- [ ] **Review production security and operations:** Require HTTPS, assess rate limits and password/token handling, and plan monitoring and recovery. If the server runs multiple instances, use shared socket presence and a Socket.IO adapter.
- [ ] **Test mobile distribution:** Verify the web app in a real mobile browser and any intended app WebView, including reconnects, backgrounding, and sharing/copying the room code.
