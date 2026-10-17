import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/app';
import { BoardsService } from '../src/boards.service';
import { RoomView, RoomsService } from '../src/rooms.service';

type Session = { token: string; playerId: string; room: RoomView };
const action = (socket: Socket, event: string, payload: Record<string, unknown> = {}) => socket.timeout(2500).emitWithAck(event, payload);
const update = (socket: Socket, predicate: (room: RoomView) => boolean) => new Promise<RoomView>((resolve, reject) => {
    const timer = setTimeout(() => { socket.off('room:update', listener); reject(new Error('Room update timed out')); }, 4000);
    const listener = (room: RoomView) => { if (predicate(room)) { clearTimeout(timer); socket.off('room:update', listener); resolve(room); } };
    socket.on('room:update', listener);
});

test('real HTTP + sockets: passwords, presence, authorization, reconnect, start and leave', async () => {
    const app = await createApplication(':memory:');
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const sockets: Socket[] = [];
    const post = async (path: string, body: unknown) => fetch(`${url}/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const connect = (session: Session) => {
        const socket = io(url, { auth: { code: session.room.code, token: session.token }, transports: ['websocket'], forceNew: true });
        sockets.push(socket);
        return socket;
    };
    try {
        assert.equal((await post('rooms', { name: 'A', password: '1234' })).status, 400);
        const owner = await (await post('rooms', { name: 'Owner', password: 'safe-pass' })).json() as Session;
        assert.match(owner.room.code, /^[A-Z2-9]{6}$/);
        assert.equal(owner.room.players[0].color, '#e98570');
        assert.ok((await (await fetch(`${url}/api/boards`)).json() as unknown[]).length > 0);
        const investmentTerms = await (await post('investment-terms', { boardId: 'classic', productId: 'liquid-note', principal: 100000, termCycles: 2 })).json() as { interestAmount: number; maturityAmount: number; rateBpsPerCycle: number };
        assert.deepEqual(investmentTerms, { principal: 100000, interestAmount: 3000, maturityAmount: 103000, rateBpsPerCycle: 150, termCycles: 2, interestMethod: 'simple' });
        assert.equal((await post('investment-terms', { boardId: 'classic', productId: 'liquid-note', principal: 100000, termCycles: 3 })).status, 400);
        assert.equal(JSON.stringify(owner.room).includes('password'), false);
        assert.equal((await post('rooms/join', { name: 'Guest', password: 'wrong', code: owner.room.code })).status, 403);
        assert.equal((await post('rooms/join', { name: 'Guest', password: 'safe-pass', code: 'AAAAAA' })).status, 404);
        const host = connect(owner);
        await update(host, room => room.players[0].online);
        assert.equal((await action(host, 'room:start')).ok, false);
        const guest = await (await post('rooms/join', { name: 'Guest', password: 'safe-pass', code: owner.room.code.toLowerCase() })).json() as Session;
        assert.notEqual(guest.room.players.find(player => player.id === guest.playerId)?.color, owner.room.players[0].color);
        const bothOnline = update(host, room => room.players.length === 2 && room.players.every(player => player.online));
        const visitor = connect(guest);
        await bothOnline;
        assert.equal((await action(visitor, 'room:start')).ok, false);
        const chosenColor = await action(host, 'room:color', { color: '#76955f' });
        assert.equal(chosenColor.ok, true);
        assert.equal(chosenColor.room.players.find(player => player.id === owner.playerId)?.color, '#76955f');
        const takenColor = await action(visitor, 'room:color', { color: '#76955f' });
        assert.equal(takenColor.ok, false);
        const invalidBoard = await action(host, 'room:start', { boardId: '../missing' });
        assert.equal(invalidBoard.ok, false);
        const offline = update(host, room => room.players.some(player => player.id === guest.playerId && !player.online));
        visitor.disconnect();
        await offline;
        assert.equal((await action(host, 'room:start')).ok, false);
        const reconnected = update(host, room => room.players.length === 2 && room.players.every(player => player.online));
        visitor.connect();
        await reconnected;
        const secondTab = connect(guest);
        await update(secondTab, room => room.players.every(player => player.online));
        secondTab.disconnect();
        assert.equal((await action(visitor, 'room:sync')).room.players.length, 2);
        const started = update(visitor, room => room.status === 'started');
        const startResponse = await action(host, 'room:start', { boardId: 'classic' });
        assert.equal(startResponse.ok, true);
        assert.equal(startResponse.room.game.boardId, 'classic');
        assert.equal(startResponse.room.game.players[0].color, '#76955f');
        assert.equal(startResponse.room.game.events[0].type, 'gameStarted');
        await started;
        const unauthorizedBuild = await action(host, 'game:build', { propertyId: 'paulista', building: 'house' });
        assert.equal(unauthorizedBuild.ok, false);
        assert.equal((await action(host, 'room:sync')).room.game.transactions.length, 0);
        const prematureFinish = await action(host, 'game:finish-turn');
        assert.equal(prematureFinish.ok, false);
        const gameRoll = await action(host, 'game:roll', { dice: [6, 6], balance: 999999 });
        assert.equal(gameRoll.ok, true);
        assert.ok(gameRoll.room.game.lastRoll.every(die => die >= 1 && die <= 6));
        assert.notEqual(gameRoll.room.game.players.find(player => player.id === guest.playerId)?.balance, 999999);
        assert.equal((await post('rooms/join', { name: 'Late', password: 'safe-pass', code: owner.room.code })).status, 409);
        const cannotLeave = await action(visitor, 'room:leave');
        assert.equal(cannotLeave.ok, false);
        assert.equal(cannotLeave.error, 'Nao e possivel sair de uma partida em andamento.');
        host.emit('room:leave', {});
        await new Promise<void>(resolve => host.once('room:closed', resolve));
        assert.equal((await post('rooms/join', { name: 'Guest', password: 'safe-pass', code: owner.room.code })).status, 404);
        const impostor = io(url, { auth: { code: owner.room.code, token: guest.token }, transports: ['websocket'], forceNew: true });
        sockets.push(impostor);
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Expected rejection')), 2500);
            impostor.on('session:error', () => { clearTimeout(timer); resolve(); });
        });
    } finally { for (const socket of sockets) socket.disconnect(); await app.close(); }
});

test('SQLite persists membership and hashed secrets; restart resets presence', () => {
    const directory = mkdtempSync(join(tmpdir(), 'finance-gameinator-'));
    const path = join(directory, 'rooms.sqlite');
    const original = new RoomsService(path, new BoardsService());
    const session = original.create({ name: 'Owner', password: 'safe-pass' });
    original.connect({ code: session.room.code, playerId: session.playerId }, 'socket');
    assert.equal(original.view(session.room.code).players[0].online, true);
    original.onModuleDestroy();
    const restored = new RoomsService(path, new BoardsService());
    try {
        assert.equal(restored.authenticate(session.room.code, session.token).playerId, session.playerId);
        assert.equal(restored.view(session.room.code).players[0].online, false);
        assert.throws(() => restored.authenticate(session.room.code, '0'.repeat(64)));
    } finally { restored.onModuleDestroy(); rmSync(directory, { recursive: true }); }
});

test('SQLite restores the selected board, game snapshot, player colors, and balance after restart', () => {
    const directory = mkdtempSync(join(tmpdir(), 'finance-gameinator-game-'));
    const path = join(directory, 'rooms.sqlite');
    const original = new RoomsService(path, new BoardsService());
    const owner = original.create({ name: 'Owner', password: 'safe-pass' });
    const guest = original.join({ name: 'Guest', password: 'safe-pass', code: owner.room.code });
    original.connect({ code: owner.room.code, playerId: owner.playerId }, 'owner-socket');
    original.connect({ code: owner.room.code, playerId: guest.playerId }, 'guest-socket');
    original.start({ code: owner.room.code, playerId: owner.playerId }, 'classic');
    const before = original.gameAction({ code: owner.room.code, playerId: owner.playerId }, 'game:roll');
    original.onModuleDestroy();

    const restored = new RoomsService(path, new BoardsService());
    try {
        const room = restored.view(owner.room.code);
        assert.equal(room.status, 'started');
        assert.equal(room.game?.boardId, 'classic');
        assert.deepEqual(room.game?.lastRoll, before.game?.lastRoll);
        assert.deepEqual(room.game?.players.map(player => player.balance), before.game?.players.map(player => player.balance));
        assert.deepEqual(room.players.map(player => player.online), [false, false]);
        assert.notEqual(room.players[0].color, room.players[1].color);
    } finally { restored.onModuleDestroy(); rmSync(directory, { recursive: true }); }
});

test('SQLite restores emergency-fund balances and active fixed-income investments', () => {
    const directory = mkdtempSync(join(tmpdir(), 'finance-gameinator-education-'));
    const path = join(directory, 'rooms.sqlite');
    const original = new RoomsService(path, new BoardsService());
    const owner = original.create({ name: 'Owner', password: 'safe-pass' });
    const guest = original.join({ name: 'Guest', password: 'safe-pass', code: owner.room.code });
    original.connect({ code: owner.room.code, playerId: owner.playerId }, 'owner-socket');
    original.connect({ code: owner.room.code, playerId: guest.playerId }, 'guest-socket');
    original.start({ code: owner.room.code, playerId: owner.playerId }, 'classic');
    original.gameAction({ code: owner.room.code, playerId: owner.playerId }, 'game:emergency-fund-deposit', { amount: 10000, operationId: 'persist-fund' });

    const database = (original as unknown as { db: DatabaseSync }).db;
    const row = database.prepare('SELECT game_json FROM rooms WHERE code = ?').get(owner.room.code) as { game_json: string };
    const game = JSON.parse(row.game_json) as Record<string, unknown>;
    game.phase = 'awaitingAction';
    database.prepare('UPDATE rooms SET game_json = ? WHERE code = ?').run(JSON.stringify(game), owner.room.code);
    const invested = original.gameAction({ code: owner.room.code, playerId: owner.playerId }, 'game:investment-create', { productId: 'liquid-note', principal: 50000, termCycles: 2, operationId: 'persist-investment' });
    original.onModuleDestroy();

    const restored = new RoomsService(path, new BoardsService());
    try {
        const snapshot = restored.view(owner.room.code).game!;
        assert.equal(snapshot.players[0].emergencyFundBalance, 10000);
        assert.equal(snapshot.players[0].emergencyFundInterestTotal, 0);
        assert.equal(snapshot.players[0].balance, 240000);
        assert.equal(snapshot.investments.length, 1);
        assert.equal(snapshot.investments[0].principal, 50000);
        assert.equal(snapshot.investments[0].estimatedMaturityAmount, 51500);
        assert.equal(snapshot.investments[0].status, 'active');
        assert.equal(invested.game?.investments[0].id, snapshot.investments[0].id);
        assert.deepEqual(snapshot.transactions.map(transaction => transaction.type), ['emergencyFundDeposit', 'investmentCreated']);
    } finally { restored.onModuleDestroy(); rmSync(directory, { recursive: true }); }
});

test('legacy snapshots migrate empty education accounts without retroactive cycle interest', () => {
    const directory = mkdtempSync(join(tmpdir(), 'finance-gameinator-legacy-education-'));
    const path = join(directory, 'rooms.sqlite');
    const original = new RoomsService(path, new BoardsService());
    const owner = original.create({ name: 'Owner', password: 'safe-pass' });
    const guest = original.join({ name: 'Guest', password: 'safe-pass', code: owner.room.code });
    original.connect({ code: owner.room.code, playerId: owner.playerId }, 'owner-socket');
    original.connect({ code: owner.room.code, playerId: guest.playerId }, 'guest-socket');
    original.start({ code: owner.room.code, playerId: owner.playerId }, 'classic');
    const database = (original as unknown as { db: DatabaseSync }).db;
    const row = database.prepare('SELECT game_json FROM rooms WHERE code = ?').get(owner.room.code) as { game_json: string };
    const legacy = JSON.parse(row.game_json) as any;
    for (const player of legacy.players) {
        delete player.emergencyFundBalance;
        delete player.emergencyFundInterestPrevious;
        delete player.emergencyFundInterestTotal;
        delete player.emergencyFundLastProcessedCycle;
    }
    delete legacy.investments;
    delete legacy.startCrossings;
    database.prepare('UPDATE rooms SET game_json = ? WHERE code = ?').run(JSON.stringify(legacy), owner.room.code);
    original.onModuleDestroy();

    const restored = new RoomsService(path, new BoardsService());
    try {
        const game = restored.view(owner.room.code).game!;
        const ownerState = game.players.find(player => player.id === owner.playerId)!;
        assert.equal(ownerState.emergencyFundBalance, 0);
        assert.equal(ownerState.emergencyFundInterestPrevious, 0);
        assert.equal(ownerState.emergencyFundInterestTotal, 0);
        assert.equal(ownerState.emergencyFundLastProcessedCycle, 0);
        assert.deepEqual(game.investments, []);
        assert.deepEqual(game.startCrossings, {});
        assert.equal(guest.room.code, owner.room.code);
    } finally { restored.onModuleDestroy(); rmSync(directory, { recursive: true }); }
});