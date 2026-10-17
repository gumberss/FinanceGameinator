import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, OnModuleDestroy, ConflictException, HttpException } from '@nestjs/common';
import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { BoardsService } from './boards.service';
import { acceptPlayerLoan, buildProperty, buyProperty, cancelPlayerLoanRequest, claimFixedIncomeInvestment, createFixedIncomeInvestment, declareBankruptcy, declineBail, depositEmergencyFund, finishTurn, GameState, payBail, repayLoan, requestPlayerLoan, respondPlayerLoan, respondPropertyOffer, resolveRent, roll, sellBuilding, sellProperty, sendPropertyOffer, startGame, takeBankLoan, TOKEN_COLORS, withdrawEmergencyFund, withdrawFixedIncomeEarly } from './game-engine';

export interface RoomView {
    code: string;
    status: 'waiting' | 'started';
    ownerId: string;
    players: { id: string; name: string; online: boolean; color: string }[];
    game: GameState | null;
}
interface RoomRow { code: string; owner_id: string; password_hash: string; salt: string; status: 'waiting' | 'started'; game_json: string | null }
interface PlayerRow { id: string; room_code: string; name: string; token_hash: string; online: number; token_color: string }
export interface Identity { code: string; playerId: string }

@Injectable()
export class RoomsService implements OnModuleDestroy {
    private readonly db: DatabaseSync;
    private readonly connections = new Map<string, Set<string>>();
    private readonly attempts = new Map<string, { count: number; until: number }>();
    private closed = false;

    constructor(@Inject('DATABASE_PATH') databasePath: string, @Inject(BoardsService) private readonly boards: BoardsService) {
        if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
        this.db = new DatabaseSync(databasePath);
        this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS rooms (
        code TEXT PRIMARY KEY, owner_id TEXT NOT NULL, password_hash TEXT NOT NULL,
        salt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'waiting', created_at TEXT NOT NULL,
        game_json TEXT
      );
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY, room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
        name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, online INTEGER NOT NULL DEFAULT 0,
        token_color TEXT NOT NULL DEFAULT '#e98570',
        joined_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS players_by_room ON players(room_code);
      UPDATE players SET online = 0;
    `);
        const roomColumns = this.db.prepare('PRAGMA table_info(rooms)').all() as { name: string }[];
        const playerColumns = this.db.prepare('PRAGMA table_info(players)').all() as { name: string }[];
        if (!roomColumns.some(column => column.name === 'game_json')) this.db.exec('ALTER TABLE rooms ADD COLUMN game_json TEXT');
        if (!playerColumns.some(column => column.name === 'token_color')) this.db.exec("ALTER TABLE players ADD COLUMN token_color TEXT NOT NULL DEFAULT '#e98570'");
    }

    onModuleDestroy() { this.closed = true; this.db.close(); }

    limit(key: string) {
        const now = Date.now();
        for (const [existingKey, entry] of this.attempts) if (entry.until <= now) this.attempts.delete(existingKey);
        const entry = this.attempts.get(key) ?? { count: 0, until: now + 60_000 };
        entry.count += 1;
        this.attempts.set(key, entry);
        if (entry.count > 30) throw new HttpException('Muitas tentativas. Aguarde um minuto.', 429);
    }

    private fields(input: unknown) {
        if (!input || typeof input !== 'object') throw new BadRequestException('Dados invalidos.');
        const data = input as Record<string, unknown>;
        const name = typeof data.name === 'string' ? data.name.trim() : '';
        const password = typeof data.password === 'string' ? data.password : '';
        if (name.length < 2 || name.length > 24 || /[\x00-\x1f]/.test(name)) throw new BadRequestException('Seu nome deve ter de 2 a 24 caracteres.');
        if (password.length < 4 || password.length > 64) throw new BadRequestException('A senha deve ter de 4 a 64 caracteres.');
        return { name, password, code: this.code(data.code) };
    }

    private code(value: unknown) { return typeof value === 'string' ? value.trim().toUpperCase() : ''; }
    private hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
    private row(code: string) {
        const room = this.db.prepare('SELECT * FROM rooms WHERE code = ?').get(code) as unknown as RoomRow | undefined;
        if (!room) throw new NotFoundException('Sala nao encontrada. Confira o codigo.');
        return room;
    }

    private gameSnapshot(room: RoomRow): GameState | null {
        if (!room.game_json) return null;
        const game = JSON.parse(room.game_json) as GameState;
        let changed = false;
        const board = this.boards.get(game.boardId);
        for (const player of game.players) {
            if (player.active === undefined) { player.active = true; changed = true; }
            if (player.currentJailFee === undefined) { player.currentJailFee = board.jailFee; changed = true; }
            if (player.jailAttempts === undefined) { player.jailAttempts = 0; changed = true; }
            if (player.skipTurns === undefined) { player.skipTurns = 0; changed = true; }
            if (player.loanAvailableThisCycle === undefined) { player.loanAvailableThisCycle = true; changed = true; }
            if (!Number.isSafeInteger(player.emergencyFundBalance)) { player.emergencyFundBalance = 0; changed = true; }
            if (!Number.isSafeInteger(player.emergencyFundInterestPrevious)) { player.emergencyFundInterestPrevious = 0; changed = true; }
            if (!Number.isSafeInteger(player.emergencyFundInterestTotal)) { player.emergencyFundInterestTotal = 0; changed = true; }
            if (!Number.isSafeInteger(player.emergencyFundLastProcessedCycle)) { player.emergencyFundLastProcessedCycle = Number.isSafeInteger(game.startCrossings?.[player.id]) ? game.startCrossings[player.id] : 0; changed = true; }
        }
        if (game.winnerId === undefined) { game.winnerId = null; changed = true; }
        if (!Array.isArray(game.events)) {
            game.events = (game.log ?? []).map((message, index) => ({ id: `legacy:${index}`, sequence: index + 1, type: 'turn' as const, playerId: null, message, details: {} }));
            changed = true;
        }
        if (!Array.isArray(game.transactions)) { game.transactions = []; changed = true; }
        if (!Array.isArray(game.transactionKeys)) { game.transactionKeys = game.transactions.map(transaction => transaction.id); changed = true; }
        if (game.pendingOffer === undefined) { game.pendingOffer = null; changed = true; }
        if (!Array.isArray(game.pendingPayments)) { game.pendingPayments = []; changed = true; }
        if (!Array.isArray(game.investments)) { game.investments = []; changed = true; }
        if (game.pendingLandingPosition === undefined) { game.pendingLandingPosition = null; changed = true; }
        if (!Number.isSafeInteger(game.offersThisTurn)) { game.offersThisTurn = 0; changed = true; }
        if (game.builtThisTurn === undefined) { game.builtThisTurn = false; changed = true; }
        if (!game.startCrossings || typeof game.startCrossings !== 'object') { game.startCrossings = {}; changed = true; }
        for (const loan of game.loans) {
            if (!Number.isSafeInteger(loan.installmentsTotal) || loan.installmentsTotal < 1) { loan.installmentsTotal = 1; changed = true; }
            if (!Number.isSafeInteger(loan.installmentsRemaining) || loan.installmentsRemaining < 0) { loan.installmentsRemaining = loan.outstanding > 0 ? 1 : 0; changed = true; }
            if (!Number.isSafeInteger(loan.installmentAmount) || loan.installmentAmount < 1) { loan.installmentAmount = Math.max(loan.outstanding, 1); changed = true; }
        }
        if (game.pendingPayments.length === 0 && game.pendingAction && ['rent', 'tax', 'loanInstallment'].includes(game.pendingAction.type)) {
            const paymentId = game.pendingAction.paymentId ?? `legacy-payment:${room.code}:${game.currentPlayerId}`;
            const paymentType = game.pendingAction.type === 'rent' ? 'rent' : game.pendingAction.type === 'tax' ? 'tax' : 'loanInstallment';
            game.pendingPayments.push({ id: paymentId, type: paymentType, playerId: game.pendingAction.playerId, recipientId: game.pendingAction.ownerId ?? 'bank', amount: game.pendingAction.amount, propertyId: game.pendingAction.propertyId, loanId: game.pendingAction.loanId, description: game.log.at(-1) ?? 'Pagamento pendente migrado.' });
            game.pendingAction = { ...game.pendingAction, type: paymentType, paymentId };
            game.phase = 'awaitingDebtResolution';
            changed = true;
        }
        if (game.phase === 'awaitingAction' && game.pendingAction?.type === 'rent') {
            const player = game.players.find(candidate => candidate.id === game.pendingAction?.playerId);
            if (player && player.balance < game.pendingAction.amount) { game.phase = 'awaitingDebtResolution'; changed = true; }
        }
        if (game.pendingAction?.type === 'bail') {
            const player = game.players.find(candidate => candidate.id === game.pendingAction?.playerId);
            if (player && game.pendingAction.amount !== player.currentJailFee) { game.pendingAction.amount = player.currentJailFee; changed = true; }
        }
        if (changed) this.db.prepare('UPDATE rooms SET game_json = ? WHERE code = ?').run(JSON.stringify(game), room.code);
        return game;
    }

    view(code: string): RoomView {
        const room = this.row(code);
        const players = this.db.prepare('SELECT * FROM players WHERE room_code = ? ORDER BY joined_at, rowid').all(code) as unknown as PlayerRow[];
        return { code: room.code, status: room.status, ownerId: room.owner_id, players: players.map(player => ({ id: player.id, name: player.name, online: Boolean(player.online), color: player.token_color })), game: this.gameSnapshot(room) };
    }

    create(input: unknown) {
        const { name, password } = this.fields(input);
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code: string;
        do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(''); }
        while (this.db.prepare('SELECT code FROM rooms WHERE code = ?').get(code));
        const playerId = randomUUID();
        const salt = randomBytes(16).toString('hex');
        const passwordHash = scryptSync(password, salt, 64).toString('hex');
        const token = randomBytes(32).toString('hex');
        this.db.exec('BEGIN IMMEDIATE');
        try {
            this.db.prepare('INSERT INTO rooms(code, owner_id, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)').run(code, playerId, passwordHash, salt, new Date().toISOString());
            this.insertPlayer(code, playerId, name, token, TOKEN_COLORS[0]);
            this.db.exec('COMMIT');
        } catch (error) { this.db.exec('ROLLBACK'); throw error; }
        return { token, playerId, room: this.view(code) };
    }

    join(input: unknown) {
        const { name, password, code } = this.fields(input);
        if (!/^[A-Z2-9]{6}$/.test(code)) throw new BadRequestException('Informe o codigo de 6 caracteres.');
        const room = this.row(code);
        if (!timingSafeEqual(scryptSync(password, room.salt, 64), Buffer.from(room.password_hash, 'hex'))) throw new ForbiddenException('Senha incorreta.');
        if (room.status !== 'waiting') throw new ConflictException('Esta partida ja comecou.');
        if (this.view(code).players.length >= 8) throw new ConflictException('A sala esta cheia (8 jogadores).');
        const color = TOKEN_COLORS.find(candidate => !this.view(code).players.some(player => player.color === candidate));
        if (!color) throw new ConflictException('Nao ha cores de token disponiveis.');
        const playerId = randomUUID();
        const token = randomBytes(32).toString('hex');
        this.insertPlayer(code, playerId, name, token, color);
        return { token, playerId, room: this.view(code) };
    }

    private insertPlayer(code: string, playerId: string, name: string, token: string, color: string) {
        this.db.prepare('INSERT INTO players(id, room_code, name, token_hash, token_color, joined_at) VALUES (?, ?, ?, ?, ?, ?)').run(playerId, code, name, this.hashToken(token), color, new Date().toISOString());
    }

    authenticate(codeInput: unknown, token: unknown): Identity {
        const code = this.code(codeInput);
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new ForbiddenException('Sessao invalida. Entre na sala novamente.');
        const player = this.db.prepare('SELECT * FROM players WHERE room_code = ? AND token_hash = ?').get(code, this.hashToken(token)) as unknown as PlayerRow | undefined;
        if (!player) throw new ForbiddenException('Sessao invalida. Entre na sala novamente.');
        return { code, playerId: player.id };
    }

    connect(identity: Identity, socketId: string) {
        const sockets = this.connections.get(identity.playerId) ?? new Set<string>();
        sockets.add(socketId);
        this.connections.set(identity.playerId, sockets);
        this.db.prepare('UPDATE players SET online = 1 WHERE id = ?').run(identity.playerId);
    }

    disconnect(identity: Identity, socketId: string) {
        if (this.closed) return null;
        const sockets = this.connections.get(identity.playerId);
        sockets?.delete(socketId);
        if (!sockets?.size) {
            this.connections.delete(identity.playerId);
            this.db.prepare('UPDATE players SET online = 0 WHERE id = ?').run(identity.playerId);
        }
        if (!this.db.prepare('SELECT code FROM rooms WHERE code = ?').get(identity.code)) return null;
        return this.view(identity.code);
    }

    selectColor(identity: Identity, value: unknown) {
        if (typeof value !== 'string' || !TOKEN_COLORS.includes(value as typeof TOKEN_COLORS[number])) throw new BadRequestException('Escolha uma cor de token disponivel.');
        const room = this.view(identity.code);
        if (!room.players.some(player => player.id === identity.playerId)) throw new ForbiddenException('Sessao invalida.');
        if (room.status !== 'waiting') throw new ConflictException('A cor so pode ser alterada antes do inicio.');
        if (room.players.some(player => player.id !== identity.playerId && player.color === value)) throw new ConflictException('Outro jogador ja escolheu esta cor.');
        this.db.prepare('UPDATE players SET token_color = ? WHERE id = ? AND room_code = ?').run(value, identity.playerId, identity.code);
        return this.view(identity.code);
    }

    start(identity: Identity, boardId: unknown) {
        const room = this.view(identity.code);
        if (!room.players.some(player => player.id === identity.playerId)) throw new ForbiddenException('Sessao invalida.');
        if (identity.playerId !== room.ownerId) throw new ForbiddenException('Somente o anfitriao pode iniciar.');
        if (room.status !== 'waiting') throw new ConflictException('Esta partida ja comecou.');
        if (room.players.length < 2 || room.players.some(player => !player.online)) throw new ConflictException('Aguarde pelo menos 2 jogadores e todos conectados.');
        const board = this.boards.get(boardId);
        const game = startGame(board, room.players);
        this.db.prepare("UPDATE rooms SET status = 'started', game_json = ? WHERE code = ?").run(JSON.stringify(game), identity.code);
        return this.view(identity.code);
    }

    gameAction(identity: Identity, event: string, input: unknown = {}) {
        const room = this.view(identity.code);
        if (room.status !== 'started' || !room.game) throw new ConflictException('A partida ainda nao comecou.');
        const payload = input && typeof input === 'object' ? input as Record<string, unknown> : {};
        const board = this.boards.get(room.game.boardId);
        const game = structuredClone(room.game);
        switch (event) {
            case 'game:roll': roll(game, board, identity.playerId); break;
            case 'game:buy': buyProperty(game, identity.playerId, payload.accept === true); break;
            case 'game:pay': resolveRent(game, board, identity.playerId, payload.paymentId as string | undefined); break;
            case 'game:bail': payload.accept === true ? payBail(game, board, identity.playerId) : declineBail(game, board, identity.playerId); break;
            case 'game:bank-loan': takeBankLoan(game, board, identity.playerId, payload.amount as number | undefined, typeof payload.installments === 'number' ? payload.installments : 1); break;
            case 'game:emergency-fund-deposit': depositEmergencyFund(game, identity.playerId, payload.amount as number, payload.operationId as string); break;
            case 'game:emergency-fund-withdraw': withdrawEmergencyFund(game, identity.playerId, payload.amount as number, payload.operationId as string); break;
            case 'game:investment-create': createFixedIncomeInvestment(game, board, identity.playerId, payload.productId as string, payload.principal as number, payload.termCycles as number, payload.operationId as string); break;
            case 'game:investment-claim': claimFixedIncomeInvestment(game, identity.playerId, payload.investmentId as string, payload.part as 'together' | 'principal' | 'interest' | undefined); break;
            case 'game:investment-early-withdraw': withdrawFixedIncomeEarly(game, identity.playerId, payload.investmentId as string); break;
            case 'game:finish-turn': finishTurn(game, identity.playerId); break;
            case 'game:build': buildProperty(game, board, identity.playerId, payload.propertyId as string, payload.building as 'house' | 'hotel'); break;
            case 'game:sell-building': sellBuilding(game, board, identity.playerId, payload.propertyId as string); break;
            case 'game:sell-property': sellProperty(game, board, identity.playerId, payload.propertyId as string); break;
            case 'game:repay-loan': repayLoan(game, identity.playerId, payload.loanId as string); break;
            case 'game:declare-bankruptcy': declareBankruptcy(game, board, identity.playerId); break;
            case 'game:request-player-loan': requestPlayerLoan(game, board, identity.playerId, payload.lenderId as string, payload.amount as number | undefined, typeof payload.installments === 'number' ? payload.installments : 1, typeof payload.interestRate === 'number' ? payload.interestRate : board.bankInterestRate); break;
            case 'game:cancel-player-loan': cancelPlayerLoanRequest(game, identity.playerId); break;
            case 'game:respond-player-loan': {
                const proposal = game.pendingLoan;
                if (!proposal) throw new ConflictException('Nao ha pedido de emprestimo pendente.');
                if (proposal.status === 'requested') respondPlayerLoan(game, identity.playerId, payload.accept === true, payload.principal as number, typeof payload.interestRate === 'number' ? payload.interestRate : undefined);
                else acceptPlayerLoan(game, board, identity.playerId, payload.accept === true);
                break;
            }
            case 'game:offer-property': sendPropertyOffer(game, board, identity.playerId, payload.propertyId as string, payload.amount as number); break;
            case 'game:respond-property-offer': respondPropertyOffer(game, identity.playerId, payload.accept === true, board); break;
            default: throw new BadRequestException('Acao de jogo desconhecida.');
        }
        this.db.prepare('UPDATE rooms SET game_json = ? WHERE code = ?').run(JSON.stringify(game), identity.code);
        return this.view(identity.code);
    }

    leave(identity: Identity) {
        const room = this.view(identity.code);
        if (identity.playerId === room.ownerId) {
            this.db.prepare('DELETE FROM rooms WHERE code = ?').run(identity.code);
            for (const player of room.players) this.connections.delete(player.id);
            return null;
        }
        if (room.status === 'started') throw new ConflictException('Nao e possivel sair de uma partida em andamento.');
        this.db.prepare('DELETE FROM players WHERE id = ? AND room_code = ?').run(identity.playerId, identity.code);
        this.connections.delete(identity.playerId);
        return this.view(identity.code);
    }
}