import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { acceptPlayerLoan, applyTransaction, buildProperty, buyProperty, calculateBankInterestRate, calculateEarlyWithdrawalTerms, calculateFixedIncomeTerms, cancelPlayerLoanRequest, calculateLoanTerms, claimFixedIncomeInvestment, createFixedIncomeInvestment, declineBail, declareBankruptcy, depositEmergencyFund, finishTurn, GameState, payBail, repayLoan, requestPlayerLoan, respondPlayerLoan, respondPropertyOffer, resolveRent, roll, sellBuilding, sellProperty, sendPropertyOffer, startGame, takeBankLoan, TOKEN_COLORS, validateBoard, withdrawEmergencyFund, withdrawFixedIncomeEarly } from '../src/game-engine';

const board = validateBoard(JSON.parse(readFileSync(resolve(__dirname, '../boards/classic.json'), 'utf8')));
const players = [{ id: 'one', name: 'Ana', online: true, color: TOKEN_COLORS[0] }, { id: 'two', name: 'Bia', online: true, color: TOKEN_COLORS[1] }];

test('board data validates and game starts at configured first space with selected colors', () => {
    const state = startGame(board, players);
    assert.equal(state.players[0].position, 0);
    assert.equal(state.players[0].color, TOKEN_COLORS[0]);
    assert.equal(state.players[0].balance, board.startingBalance);
    assert.equal(state.currentPlayerId, 'one');
    assert.equal(board.properties[0].price / 2, 40000);
});

test('configuration rejects duplicate spaces, missing properties, and multiple start locations', () => {
    const source = JSON.parse(readFileSync(resolve(__dirname, '../boards/classic.json'), 'utf8')) as Record<string, any>;
    assert.throws(() => validateBoard({ ...source, spaces: [...source.spaces, source.spaces[1]] }), /unique/);
    assert.throws(() => validateBoard({ ...source, spaces: source.spaces.map((space: any) => space.type === 'property' ? { ...space, propertyId: 'missing' } : space) }), /unknown property/);
    assert.throws(() => validateBoard({ ...source, spaces: [...source.spaces, { id: 'start-2', type: 'start', name: 'Start' }] }), /exactly one start/);
});

test('movement wraps circularly, pays start bonus, buys property, and transfers rent', () => {
    const state = startGame(board, players);
    state.players[0].position = board.spaces.length - 2;
    const wrapped = roll(state, board, 'one', [2, 1]);
    assert.equal(wrapped.players[0].position, 1);
    assert.equal(wrapped.players[0].balance, board.startingBalance + board.startBonus);
    const purchaseTurn = startGame(board, players);
    purchaseTurn.players[0].position = board.spaces.length - 1;
    const bought = roll(purchaseTurn, board, 'one', [1, 1]);
    assert.equal(bought.pendingAction?.type, 'buy');
    buyProperty(bought, 'one', true);
    assert.equal(bought.propertyOwners.paulista, 'one');
    assert.equal(bought.currentPlayerId, 'one');
    finishTurn(bought, 'one');
    assert.equal(bought.currentPlayerId, 'two');
    const duplicatePurchase = structuredClone(bought);
    duplicatePurchase.phase = 'awaitingAction';
    duplicatePurchase.pendingAction = { type: 'buy', playerId: 'two', propertyId: 'paulista', amount: 80000 };
    const duplicateBefore = structuredClone(duplicatePurchase);
    assert.throws(() => buyProperty(duplicatePurchase, 'two', true), /ja pertence/);
    assert.deepEqual(duplicatePurchase, duplicateBefore);
    bought.players[1].position = board.spaces.length - 1;
    const renter = roll(bought, board, 'two', [1, 1]);
    assert.equal(renter.pendingAction?.type, 'rent');
    assert.equal(renter.players[1].balance, board.startingBalance + board.startBonus);
    resolveRent(renter, board, 'two');
    assert.equal(renter.players[0].balance, board.startingBalance + board.startBonus - 80000 + 12000);
    assert.equal(renter.players[1].balance, board.startingBalance + board.startBonus - 12000);
});

test('holiday skips next turn and jail requires doubles or third-attempt bail', () => {
    const state = startGame(board, players);
    const holiday = roll(state, board, 'one', [1, 1]);
    assert.equal(holiday.players[0].skipTurns, 1);
    assert.equal(holiday.currentPlayerId, 'one');
    finishTurn(holiday, 'one');
    assert.equal(holiday.currentPlayerId, 'two');
    const afterSkip = roll(holiday, board, 'two', [2, 3]);
    assert.equal(afterSkip.currentPlayerId, 'two');
    finishTurn(afterSkip, 'two');
    assert.equal(afterSkip.currentPlayerId, 'two');
    assert.equal(afterSkip.players[0].skipTurns, 0);

    const jailed = startGame(board, players);
    jailed.players[0].jailed = true;
    jailed.players[0].position = board.spaces.findIndex(space => space.type === 'jail');
    jailed.currentPlayerId = 'one';
    let result: GameState = roll(jailed, board, 'one', [1, 2]);
    assert.equal(result.players[0].jailed, true);
    result.players[1].position = 3;
    result = roll(result, board, 'two', [1, 1]);
    finishTurn(result, 'two');
    result = roll(result, board, 'one', [2, 3]);
    result.players[1].position = 3;
    result = roll(result, board, 'two', [1, 1]);
    finishTurn(result, 'two');
    result = roll(result, board, 'one', [1, 2]);
    assert.equal(result.players[0].jailAttempts, 3);
    assert.equal(result.players[0].jailed, true);
    assert.equal(result.pendingAction?.type, 'bail');
    const declined = declineBail(structuredClone(result), board, 'one');
    assert.equal(declined.players[0].jailed, true);
    assert.equal(declined.players[0].currentJailFee, 55000);
    const afterOtherPlayer = roll(declined, board, 'two', [1, 1]);
    finishTurn(afterOtherPlayer, 'two');
    const fourthAttempt = roll(afterOtherPlayer, board, 'one', [1, 2]);
    assert.equal(fourthAttempt.players[0].jailAttempts, 3);
    assert.equal(fourthAttempt.pendingAction?.type, 'bail');
    assert.equal(fourthAttempt.pendingAction?.amount, 55000);
    assert.equal(declineBail(fourthAttempt, board, 'one').players[0].currentJailFee, 60500);
    const released = startGame(board, players);
    released.players[0].jailed = true;
    released.players[0].position = board.spaces.findIndex(space => space.type === 'jail');
    released.currentPlayerId = 'one';
    const doubles = roll(released, board, 'one', [1, 1]);
    assert.equal(doubles.players[0].jailed, false);
    assert.equal(doubles.players[0].jailAttempts, 0);
    const thirdTry = startGame(board, players);
    thirdTry.players[0].jailed = true;
    thirdTry.players[0].jailAttempts = 3;
    thirdTry.currentPlayerId = 'one';
    thirdTry.phase = 'awaitingAction';
    thirdTry.pendingAction = { type: 'bail', playerId: 'one', amount: board.jailFee };
    const bailed = payBail(thirdTry, board, 'one');
    assert.equal(bailed.players[0].jailed, false);
    assert.equal(bailed.players[0].balance, board.startingBalance - board.jailFee);
});

test('bank loan is priced from board config and player loans need lender offer plus borrower acceptance', () => {
    assert.ok(Math.abs(calculateBankInterestRate(board, 1) - 0.025) < 1e-12);
    assert.ok(Math.abs(calculateBankInterestRate(board, 6) - 0.15) < 1e-12);
    assert.ok(Math.abs(calculateBankInterestRate(board, 12) - 0.3) < 1e-12);
    const bank = startGame(board, players);
    bank.players[0].balance = 1000;
    bank.pendingAction = { type: 'rent', playerId: 'one', ownerId: 'two', amount: 12000, propertyId: 'paulista', paymentId: 'bank-test-rent' };
    bank.pendingPayments.push({ id: 'bank-test-rent', type: 'rent', playerId: 'one', recipientId: 'two', amount: 12000, propertyId: 'paulista', description: 'Rent due' });
    bank.phase = 'awaitingDebtResolution';
    const afterBank = takeBankLoan(bank, board, 'one');
    assert.equal(afterBank.players[0].balance, 12000);
    assert.equal(afterBank.players[1].balance, board.startingBalance);
    assert.equal(afterBank.loans[0].principal, 11000);
    assert.ok(Math.abs(afterBank.loans[0].interestRate - 0.025) < 1e-12);
    assert.equal(afterBank.loans[0].outstanding, 11275);
    assert.equal(afterBank.loans[0].installmentsTotal, 1);
    resolveRent(afterBank, board, 'one');
    assert.equal(afterBank.players[0].balance, 0);
    assert.equal(afterBank.players[1].balance, board.startingBalance + 12000);

    const betweenPlayers = startGame(board, players);
    betweenPlayers.players[0].balance = 1000;
    betweenPlayers.pendingAction = { type: 'rent', playerId: 'one', ownerId: 'two', amount: 12000, propertyId: 'paulista', paymentId: 'player-test-rent' };
    betweenPlayers.pendingPayments.push({ id: 'player-test-rent', type: 'rent', playerId: 'one', recipientId: 'two', amount: 12000, propertyId: 'paulista', description: 'Rent due' });
    betweenPlayers.phase = 'awaitingDebtResolution';
    requestPlayerLoan(betweenPlayers, board, 'one', 'two', 15000, 3);
    assert.equal(betweenPlayers.loans.length, 0);
    respondPlayerLoan(betweenPlayers, 'two', true, 15000, 0.2);
    assert.equal(betweenPlayers.loans.length, 0);
    const completed = acceptPlayerLoan(betweenPlayers, board, 'one', true);
    assert.equal(completed.loans[0].principal, 15000);
    assert.equal(completed.loans[0].installmentsTotal, 3);
    assert.equal(completed.loans[0].installmentAmount, 6000);
    assert.equal(completed.loans[0].outstanding, 18000);
    assert.equal(completed.players[0].balance, 16000);
    assert.equal(completed.players[1].balance, board.startingBalance - 15000);
    resolveRent(completed, board, 'one');
    assert.equal(completed.players[0].balance, 4000);
    assert.equal(completed.players[1].balance, board.startingBalance - 15000 + 12000);
});

test('houses and hotels require the configured color group, even progression, and rent schedule', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    state.players[0].balance = 2_000_000;
    state.propertyOwners.paulista = 'one';
    state.propertyOwners.ibirapuera = 'one';
    const build = (propertyId: string, kind: 'house' | 'hotel') => {
        state.phase = 'awaitingAction';
        state.builtThisTurn = false;
        state.players[0].position = board.spaces.findIndex(space => space.type === 'property' && space.propertyId === propertyId);
        buildProperty(state, board, 'one', propertyId, kind);
    };
    build('paulista', 'house');
    const afterOneHouse = structuredClone(state);
    assert.throws(() => buildProperty(state, board, 'one', 'paulista', 'house'), /vez/);
    assert.deepEqual(state, afterOneHouse);
    state.builtThisTurn = false;
    const beforeUnevenBuild = structuredClone(state);
    assert.throws(() => buildProperty(state, board, 'one', 'paulista', 'house'), /por igual/);
    assert.deepEqual(state, beforeUnevenBuild);
    build('ibirapuera', 'house');
    for (let level = 1; level < 4; level++) {
        build('paulista', 'house');
        build('ibirapuera', 'house');
    }
    build('paulista', 'hotel');
    assert.equal(state.houses.paulista, 5);
    assert.equal(board.properties.find(property => property.id === 'paulista')!.rentSchedule[state.houses.paulista], 96000);
    const ownerBeforeRent = state.players[0].balance;
    const renterBeforeRent = state.players[1].balance;
    state.players[1].position = board.spaces.length - 1;
    state.currentPlayerId = 'two';
    state.phase = 'awaitingRoll';
    const charged = roll(state, board, 'two', [1, 1]);
    assert.equal(charged.pendingAction?.type, 'rent');
    assert.equal(charged.players[0].balance, ownerBeforeRent);
    assert.equal(charged.players[1].balance, renterBeforeRent + board.startBonus);
    resolveRent(charged, board, 'two');
    assert.equal(charged.players[0].balance, ownerBeforeRent + 96000);
    assert.equal(charged.players[1].balance, renterBeforeRent + board.startBonus - 96000);
    assert.equal(charged.transactions.filter(transaction => transaction.type === 'rent').length, 1);
    charged.currentPlayerId = 'one';
    assert.throws(() => sellProperty(charged, board, 'one', 'paulista'), /edificios/);
});

test('bank sale returns exactly half the purchase price and removes ownership', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    state.propertyOwners.pinheiros = 'one';
    const before = state.players[0].balance;
    sellProperty(state, board, 'one', 'pinheiros');
    assert.equal(state.players[0].balance - before, 32500);
    assert.equal(state.propertyOwners.pinheiros, undefined);
    assert.equal(state.transactions.at(-1)?.amount, 32500);
});

test('purchase financing preserves the pending purchase and allows retry', () => {
    const state = startGame(board, players);
    state.players[0].balance = 1000;
    state.pendingAction = { type: 'buy', playerId: 'one', propertyId: 'paulista', amount: 80000 };
    state.phase = 'awaitingAction';
    takeBankLoan(state, board, 'one');
    assert.equal(state.pendingAction?.type, 'buy');
    assert.equal(state.phase, 'awaitingAction');
    assert.equal(state.players[0].balance, 80000);
    buyProperty(state, 'one', true);
    assert.equal(state.propertyOwners.paulista, 'one');
    assert.equal(state.players[0].balance, 0);
});

test('mandatory rent cannot create a negative balance and bankruptcy transfers assets and ends the game', () => {
    const state = startGame(board, players);
    state.players[0].balance = 20000;
    state.pendingAction = { type: 'rent', playerId: 'one', ownerId: 'two', propertyId: 'paulista', amount: 50000, paymentId: 'bankruptcy-rent' };
    state.pendingPayments.push({ id: 'bankruptcy-rent', type: 'rent', playerId: 'one', recipientId: 'two', amount: 50000, propertyId: 'paulista', description: 'Rent due' });
    state.phase = 'awaitingDebtResolution';
    const before = structuredClone(state);
    assert.throws(() => resolveRent(state, board, 'one'), /Saldo insuficiente/);
    assert.deepEqual(state, before);
    state.propertyOwners.pinheiros = 'one';
    state.houses.pinheiros = 1;
    state.loans.push({ id: 'debt', type: 'bank', lenderId: 'bank', borrowerId: 'one', principal: 10000, interestRate: 0.1, installmentsTotal: 1, installmentsRemaining: 1, installmentAmount: 11000, outstanding: 11000 });
    declareBankruptcy(state, board, 'one');
    assert.equal(state.status, 'finished');
    assert.equal(state.phase, 'finished');
    assert.equal(state.winnerId, 'two');
    assert.equal(state.players[0].active, false);
    assert.equal(state.players[0].balance, 0);
    assert.equal(state.players[1].balance, board.startingBalance + 20000);
    assert.equal(state.propertyOwners.pinheiros, 'two');
    assert.equal(state.houses.pinheiros, undefined);
    assert.equal(state.loans.length, 0);
    assert.equal(state.events.at(-1)?.type, 'victory');
    assert.throws(() => roll(state, board, 'two', [1, 1]), /Nao e possivel/);
});

test('central transaction ledger is idempotent and leaves state untouched on invalid actions', () => {
    const state = startGame(board, players);
    const before = structuredClone(state);
    assert.throws(() => applyTransaction(state, 'purchase', 'one', 'bank', board.startingBalance + 1, 'invalid'), /Saldo insuficiente/);
    assert.deepEqual(state, before);
    assert.equal(applyTransaction(state, 'loan', 'bank', 'one', 5000, 'loan proceeds', 'loan:one'), true);
    const balanceAfterFirst = state.players[0].balance;
    const countAfterFirst = state.transactions.length;
    assert.equal(applyTransaction(state, 'loan', 'bank', 'one', 5000, 'duplicate', 'loan:one'), false);
    assert.equal(state.players[0].balance, balanceAfterFirst);
    assert.equal(state.transactions.length, countAfterFirst);
});

test('loan repayment transfers the full outstanding debt exactly once', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    state.loans.push({ id: 'loan-1', type: 'player', lenderId: 'two', borrowerId: 'one', principal: 10000, interestRate: 0.2, installmentsTotal: 1, installmentsRemaining: 1, installmentAmount: 12000, outstanding: 12000 });
    const borrowerBefore = state.players[0].balance;
    const lenderBefore = state.players[1].balance;
    repayLoan(state, 'one', 'loan-1');
    assert.equal(state.players[0].balance, borrowerBefore - 12000);
    assert.equal(state.players[1].balance, lenderBefore + 12000);
    assert.equal(state.loans.length, 0);
    assert.throws(() => repayLoan(state, 'one', 'loan-1'), /nao encontrado/);
});

test('voluntary payoff cannot remove a loan with an installment awaiting confirmation', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingDebtResolution';
    const terms = calculateLoanTerms(10000, 0.1, 2);
    state.loans.push({ id: 'loan-pending', type: 'bank', lenderId: 'bank', borrowerId: 'one', ...terms, installmentsRemaining: 2, outstanding: terms.totalRepayment });
    const payment = { id: 'installment-pending', type: 'loanInstallment' as const, playerId: 'one', recipientId: 'bank' as const, amount: terms.installmentAmount, loanId: 'loan-pending', description: 'Installment due' };
    state.pendingPayments.push(payment);
    state.pendingAction = { type: 'loanInstallment', playerId: 'one', amount: payment.amount, paymentId: payment.id, loanId: 'loan-pending' };
    const before = structuredClone(state);

    assert.throws(() => repayLoan(state, 'one', 'loan-pending'), /Role os dados/);
    assert.deepEqual(state, before);
});

test('older board JSON remains valid and receives compatible rent/development defaults', () => {
    const source = JSON.parse(readFileSync(resolve(__dirname, '../boards/classic.json'), 'utf8')) as Record<string, any>;
    const legacy = structuredClone(source);
    delete legacy.victoryCondition;
    delete legacy.bankruptcyRule;
    delete legacy.developmentRules;
    delete legacy.financialEducation;
    for (const property of legacy.properties) delete property.rentSchedule;
    const loaded = validateBoard(legacy);
    assert.equal(loaded.victoryCondition, 'lastSolventPlayer');
    assert.equal(loaded.developmentRules.maxHousesPerProperty, 4);
    assert.equal(loaded.developmentRules.jailFeeIncreaseRate, 0.1);
    assert.equal(loaded.financialEducation.emergencyFundInterestRateBpsPerCycle, 50);
    assert.deepEqual(loaded.financialEducation.fixedIncomeProducts.map(product => product.interestMethod), ['simple', 'compound']);
    assert.deepEqual(loaded.properties[0].rentSchedule, [12000, 24000, 36000, 48000, 72000, 96000]);
});

test('player loan for a purchase requires the lender offer and borrower acceptance before retry', () => {
    const state = startGame(board, players);
    state.players[0].balance = 1000;
    state.pendingAction = { type: 'buy', playerId: 'one', propertyId: 'paulista', amount: 80000 };
    state.phase = 'awaitingAction';
    requestPlayerLoan(state, board, 'one', 'two');
    respondPlayerLoan(state, 'two', true, 79000, 0.1);
    assert.equal(state.loans.length, 0);
    acceptPlayerLoan(state, board, 'one', true);
    assert.equal(state.pendingAction?.type, 'buy');
    assert.equal(state.propertyOwners.paulista, undefined);
    assert.equal(state.players[0].balance, 80000);
    buyProperty(state, 'one', true);
    assert.equal(state.propertyOwners.paulista, 'one');
    assert.equal(state.players[0].balance, 0);
    assert.equal(state.players[1].balance, board.startingBalance - 79000);
});

test('player can take optional actions and explicitly finish only after resolving landing prompts', () => {
    const state = startGame(board, players);
    assert.throws(() => finishTurn(state, 'one'), /Role os dados/);
    state.phase = 'awaitingAction';
    state.players[0].position = 1;
    state.propertyOwners.paulista = 'one';
    const loaned = takeBankLoan(state, board, 'one', 20000);
    assert.equal(loaned.currentPlayerId, 'one');
    assert.equal(loaned.players[0].balance, board.startingBalance + 20000);
    assert.equal(loaned.phase, 'awaitingAction');
    finishTurn(loaned, 'one');
    assert.equal(loaned.currentPlayerId, 'two');

    const pending = startGame(board, players);
    pending.pendingAction = { type: 'buy', playerId: 'one', propertyId: 'paulista', amount: 80000 };
    pending.phase = 'awaitingAction';
    assert.throws(() => finishTurn(pending, 'one'), /pendentes/);
});

test('no property, loan, or repayment action mutates state before the current player rolls', () => {
    const state = startGame(board, players);
    state.propertyOwners.paulista = 'one';
    state.loans.push({ id: 'loan-before-roll', type: 'bank', lenderId: 'bank', borrowerId: 'one', principal: 1000, interestRate: 0.1, installmentsTotal: 1, installmentsRemaining: 1, installmentAmount: 1100, outstanding: 1100 });
    const before = structuredClone(state);
    assert.throws(() => buildProperty(state, board, 'one', 'paulista', 'house'), /Role os dados/);
    assert.throws(() => sellProperty(state, board, 'one', 'paulista'), /Role os dados/);
    assert.throws(() => repayLoan(state, 'one', 'loan-before-roll'), /Role os dados/);
    assert.throws(() => takeBankLoan(state, board, 'one', 5000), /Nenhuma acao pendente/);
    assert.throws(() => requestPlayerLoan(state, board, 'one', 'two', 5000), /Nenhuma acao pendente/);
    assert.deepEqual(state, before);
});

test('property offers pause the buyer turn, count rejections toward the two-offer limit, and transfer on acceptance', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    state.propertyOwners.paulista = 'two';
    state.houses.paulista = 2;
    const ownerBefore = state.players[1].balance;
    sendPropertyOffer(state, board, 'one', 'paulista', 100000);
    assert.equal(state.phase, 'awaitingPropertyResponse');
    assert.equal(state.offersThisTurn, 1);
    assert.throws(() => finishTurn(state, 'one'), /acoes pendentes/);
    assert.throws(() => respondPropertyOffer(state, 'one', true, board), /Nao ha oferta/);
    respondPropertyOffer(state, 'two', false, board);
    assert.equal(state.phase, 'awaitingAction');
    sendPropertyOffer(state, board, 'one', 'paulista', 120000);
    respondPropertyOffer(state, 'two', true, board);
    assert.equal(state.propertyOwners.paulista, 'one');
    assert.equal(state.houses.paulista, 2);
    assert.equal(state.players[0].balance, board.startingBalance - 120000);
    assert.equal(state.players[1].balance, ownerBefore + 120000);
    assert.equal(state.transactions.filter(transaction => transaction.type === 'propertyTransfer').length, 1);
    assert.throws(() => sendPropertyOffer(state, board, 'one', 'liberdade', 50000), /duas ofertas/);
    finishTurn(state, 'one');
    assert.equal(state.offersThisTurn, 0);
});

test('loan terms use one calculation and cancellation does not consume cycle eligibility', () => {
    assert.deepEqual(calculateLoanTerms(10000, 0.1, 3), { principal: 10000, interestRate: 0.1, installmentsTotal: 3, totalRepayment: 11000, installmentAmount: 3667 });
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    requestPlayerLoan(state, board, 'one', 'two', 10000, 3);
    cancelPlayerLoanRequest(state, 'one');
    assert.equal(state.players[0].loanAvailableThisCycle, true);
    assert.equal(state.loans.length, 0);
    requestPlayerLoan(state, board, 'one', 'two', 10000, 3);
    respondPlayerLoan(state, 'two', true, 10000, 0.1);
    acceptPlayerLoan(state, board, 'one', true);
    assert.equal(state.loans[0].installmentsTotal, 3);
    assert.equal(state.loans[0].installmentsRemaining, 3);
    assert.equal(state.loans[0].installmentAmount, 3667);
    assert.equal(state.loans[0].outstanding, 11000);
    assert.equal(state.players[0].loanAvailableThisCycle, false);
});

test('each Start crossing queues one explicit installment per active loan and defers landing resolution', () => {
    const shortBoard = validateBoard({
        ...JSON.parse(readFileSync(resolve(__dirname, '../boards/classic.json'), 'utf8')),
        spaces: [
            { id: 'start', type: 'start', name: 'Inicio' },
            { id: 'jail', type: 'jail', name: 'Prisao' },
            { id: 'holiday', type: 'holiday', name: 'Ferias' },
            { id: 'paulista-end', type: 'property', name: 'Avenida Paulista', propertyId: 'paulista' },
        ],
    });
    const state = startGame(shortBoard, players);
    const terms = calculateLoanTerms(10000, 0.1, 3);
    state.loans.push({ id: 'crossing-loan', type: 'bank', lenderId: 'bank', borrowerId: 'one', ...terms, installmentsRemaining: 3, outstanding: terms.totalRepayment });
    state.players[0].loanAvailableThisCycle = false;
    state.players[0].position = 3;
    const moved = roll(state, shortBoard, 'one', [6, 6]);
    assert.equal(moved.players[0].position, 3);
    assert.equal(moved.players[0].balance, shortBoard.startingBalance + shortBoard.startBonus * 3);
    assert.equal(moved.players[0].loanAvailableThisCycle, true);
    assert.equal(moved.pendingPayments.length, 3);
    assert.equal(new Set(moved.pendingPayments.map(payment => payment.id)).size, 3);
    assert.equal(moved.phase, 'awaitingDebtResolution');
    assert.equal(moved.pendingLandingPosition, 3);
    const first = moved.pendingPayments[0];
    resolveRent(moved, shortBoard, 'one', first.id);
    assert.equal(moved.loans[0].installmentsRemaining, 2);
    assert.equal(moved.pendingPayments.length, 2);
    assert.throws(() => resolveRent(moved, shortBoard, 'one', first.id), /pagamento pendente/);
    resolveRent(moved, shortBoard, 'one');
    resolveRent(moved, shortBoard, 'one');
    assert.equal(moved.loans[0].installmentsRemaining, 0);
    assert.equal(moved.loans[0].outstanding, 0);
    assert.equal(moved.pendingAction?.type, 'buy');
    assert.equal(moved.phase, 'awaitingAction');
});

test('three active loans and one loan per Start cycle are enforced at creation', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    takeBankLoan(state, board, 'one', 10000, 2);
    assert.equal(state.players[0].loanAvailableThisCycle, false);
    assert.throws(() => takeBankLoan(state, board, 'one', 10000, 2), /ciclo do tabuleiro/);
    assert.throws(() => requestPlayerLoan(state, board, 'one', 'two', 10000, 2), /ciclo do tabuleiro/);
    state.players[0].loanAvailableThisCycle = true;
    const terms = calculateLoanTerms(10000, board.bankInterestRate, 2);
    state.loans.push({ id: 'loan-two', type: 'bank', lenderId: 'bank', borrowerId: 'one', ...terms, installmentsRemaining: 2, outstanding: terms.totalRepayment });
    state.loans.push({ id: 'loan-three', type: 'bank', lenderId: 'bank', borrowerId: 'one', ...terms, installmentsRemaining: 2, outstanding: terms.totalRepayment });
    assert.throws(() => takeBankLoan(state, board, 'one', 10000, 2), /Limite de 3/);
    state.loans[0].installmentsRemaining = 0;
    state.loans[0].outstanding = 0;
    assert.doesNotThrow(() => takeBankLoan(state, board, 'one', 10000, 2));
});

test('construction requires standing on the owned complete-group property and can sell buildings for half cost', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    state.players[0].balance = 500000;
    state.propertyOwners.paulista = 'one';
    state.propertyOwners.ibirapuera = 'one';
    const initial = structuredClone(state);
    assert.throws(() => buildProperty(state, board, 'one', 'paulista', 'house'), /estar neste imovel/);
    assert.deepEqual(state, initial);
    state.players[0].position = board.spaces.findIndex(space => space.type === 'property' && space.propertyId === 'paulista');
    buildProperty(state, board, 'one', 'paulista', 'house');
    assert.equal(state.builtThisTurn, true);
    const balanceAfterBuild = state.players[0].balance;
    assert.throws(() => buildProperty(state, board, 'one', 'paulista', 'house'), /ja construiu/);
    assert.equal(state.players[0].balance, balanceAfterBuild);
    sellBuilding(state, board, 'one', 'paulista');
    assert.equal(state.houses.paulista, 0);
    assert.equal(state.players[0].balance, balanceAfterBuild + Math.floor(board.properties.find(property => property.id === 'paulista')!.houseCost / 2));
    assert.equal(state.transactions.at(-1)?.type, 'sale');
    state.houses.paulista = board.developmentRules.maxHousesPerProperty + 1;
    const beforeHotelSale = state.players[0].balance;
    sellBuilding(state, board, 'one', 'paulista');
    assert.equal(state.houses.paulista, board.developmentRules.maxHousesPerProperty);
    assert.equal(state.players[0].balance - beforeHotelSale, Math.floor(board.properties.find(property => property.id === 'paulista')!.hotelCost / 2));
});

test('Start installments are due but do not change balances until explicitly paid', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    const borrower = state.players[0];
    const lender = state.players[1];
    state.loans.push({ id: 'start-loan', type: 'player', lenderId: lender.id, borrowerId: borrower.id, principal: 10000, interestRate: 0.2, installmentsTotal: 2, installmentsRemaining: 2, installmentAmount: 6000, outstanding: 12000 });
    borrower.loanAvailableThisCycle = false;
    borrower.position = board.spaces.length - 2;
    state.phase = 'awaitingRoll';
    const before = borrower.balance;
    const moved = roll(state, board, borrower.id, [1, 1]);
    assert.equal(moved.pendingAction?.type, 'loanInstallment');
    assert.equal(moved.pendingPayments.length, 1);
    assert.equal(moved.players[0].balance, before + board.startBonus);
    assert.equal(moved.players[0].loanAvailableThisCycle, true);
    assert.equal(moved.loans[0].outstanding, 12000);
    resolveRent(moved, board, borrower.id);
    assert.equal(moved.players[0].balance, before + board.startBonus - 6000);
    assert.equal(moved.loans[0].outstanding, 6000);
    assert.equal(moved.loans[0].installmentsRemaining, 1);
});

test('emergency fund deposits and withdrawals are bounded, explicit, and idempotent', () => {
    const state = startGame(board, players);
    const player = state.players[0];
    depositEmergencyFund(state, player.id, 10000, 'deposit-once');
    const afterDeposit = structuredClone(state);
    assert.equal(player.balance, board.startingBalance - 10000);
    assert.equal(player.emergencyFundBalance, 10000);
    depositEmergencyFund(state, player.id, 10000, 'deposit-once');
    assert.deepEqual(state, afterDeposit);

    const beforeInvalidDeposit = structuredClone(state);
    assert.throws(() => depositEmergencyFund(state, player.id, player.balance + 1, 'too-much'), /Saldo insuficiente/);
    assert.deepEqual(state, beforeInvalidDeposit);
    withdrawEmergencyFund(state, player.id, 4000, 'withdraw-once');
    const afterWithdrawal = structuredClone(state);
    withdrawEmergencyFund(state, player.id, 4000, 'withdraw-once');
    assert.deepEqual(state, afterWithdrawal);
    assert.equal(player.emergencyFundBalance, 6000);
    assert.equal(player.balance, board.startingBalance - 6000);
    const beforeInvalidWithdrawal = structuredClone(state);
    assert.throws(() => withdrawEmergencyFund(state, player.id, 6001, 'too-much'), /Saldo insuficiente/);
    assert.deepEqual(state, beforeInvalidWithdrawal);
});

test('emergency fund earns one configurable credit per Start crossing and uses the balance at that boundary', () => {
    const state = startGame(board, players);
    const player = state.players[0];
    depositEmergencyFund(state, player.id, 10000, 'before-cycle');

    player.position = 0;
    state.phase = 'awaitingRoll';
    roll(state, board, player.id, [6, 6]);
    assert.equal(player.emergencyFundBalance, 10050);
    assert.equal(player.emergencyFundInterestPrevious, 50);
    assert.equal(player.emergencyFundInterestTotal, 50);
    assert.equal(player.emergencyFundLastProcessedCycle, 1);

    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    const restoredPlayer = restored.players[0];
    depositEmergencyFund(restored, restoredPlayer.id, 10000, 'after-cycle');
    restoredPlayer.position = 0;
    restored.phase = 'awaitingRoll';
    roll(restored, board, restoredPlayer.id, [6, 6]);
    assert.equal(restoredPlayer.emergencyFundBalance, 20150);
    assert.equal(restoredPlayer.emergencyFundInterestPrevious, 100);
    assert.equal(restoredPlayer.emergencyFundInterestTotal, 150);
    assert.equal(restoredPlayer.emergencyFundLastProcessedCycle, 2);
    assert.equal(restored.transactions.filter(transaction => transaction.type === 'emergencyFundInterest').length, 2);
    assert.equal(restored.transactions.find(transaction => transaction.type === 'emergencyFundInterest')?.amount, 50);
});

test('multiple Start crossings process emergency interest once per crossing', () => {
    const shortBoard = validateBoard({
        ...JSON.parse(readFileSync(resolve(__dirname, '../boards/classic.json'), 'utf8')),
        spaces: [
            { id: 'start', type: 'start', name: 'Inicio' },
            { id: 'jail', type: 'jail', name: 'Prisao' },
            { id: 'holiday', type: 'holiday', name: 'Ferias' },
            { id: 'paulista-end', type: 'property', name: 'Avenida Paulista', propertyId: 'paulista' },
        ],
    });
    const state = startGame(shortBoard, players);
    depositEmergencyFund(state, 'one', 10000, 'multi-crossing');
    state.players[0].position = 3;
    state.phase = 'awaitingRoll';
    roll(state, shortBoard, 'one', [6, 6]);
    assert.equal(state.startCrossings.one, 3);
    assert.equal(state.players[0].emergencyFundLastProcessedCycle, 3);
    assert.equal(state.players[0].emergencyFundBalance, 10151);
    assert.equal(state.players[0].emergencyFundInterestTotal, 151);
    const interestTransactions = state.transactions.filter(transaction => transaction.type === 'emergencyFundInterest');
    assert.equal(interestTransactions.length, 3);
    assert.equal(new Set(interestTransactions.map(transaction => transaction.id)).size, 3);
});

test('fixed-income estimates use integer basis points for simple and compound products', () => {
    const [simple, compound] = board.financialEducation.fixedIncomeProducts;
    assert.deepEqual(calculateFixedIncomeTerms(simple, 100000, 2), { principal: 100000, interestAmount: 3000, maturityAmount: 103000, rateBpsPerCycle: 150, termCycles: 2, interestMethod: 'simple' });
    assert.deepEqual(calculateFixedIncomeTerms(compound, 100000, 3), { principal: 100000, interestAmount: 7690, maturityAmount: 107690, rateBpsPerCycle: 250, termCycles: 3, interestMethod: 'compound' });
    assert.throws(() => calculateFixedIncomeTerms(simple, 100000, 3), /prazo/);
});

test('fixed-income creation reserves cash, accrues per cycle, and requires a confirmed maturity claim', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    const player = state.players[0];
    const simple = board.financialEducation.fixedIncomeProducts[0];
    const compound = board.financialEducation.fixedIncomeProducts[1];
    createFixedIncomeInvestment(state, board, player.id, simple.id, 100000, 2, 'simple-once');
    createFixedIncomeInvestment(state, board, player.id, simple.id, 100000, 2, 'simple-once');
    createFixedIncomeInvestment(state, board, player.id, compound.id, 100000, 3, 'compound-once');
    assert.equal(player.balance, 100000);
    assert.equal(state.investments.length, 2);

    const beforeOverspend = structuredClone(state);
    assert.throws(() => createFixedIncomeInvestment(state, board, player.id, simple.id, 100001, 2, 'overspend'), /Saldo insuficiente/);
    assert.deepEqual(state, beforeOverspend);

    for (let cycle = 0; cycle < 3; cycle++) {
        player.position = 0;
        state.phase = 'awaitingRoll';
        roll(state, board, player.id, [6, 6]);
    }
    const liquid = state.investments.find(investment => investment.productId === simple.id)!;
    const growth = state.investments.find(investment => investment.productId === compound.id)!;
    assert.equal(liquid.creationCycle, 0);
    assert.equal(liquid.maturityCycle, 2);
    assert.equal(liquid.status, 'matured');
    assert.equal(liquid.maturityAmount, 103000);
    assert.equal(growth.status, 'matured');
    assert.equal(growth.maturityAmount, 107690);
    assert.equal(player.balance, 100000 + board.startBonus * 3);

    const balanceBeforeClaim = player.balance;
    claimFixedIncomeInvestment(state, player.id, liquid.id);
    assert.equal(player.balance, balanceBeforeClaim + 103000);
    assert.equal(liquid.status, 'claimed');
    assert.throws(() => claimFixedIncomeInvestment(state, player.id, liquid.id), /ainda nao venceu|ja foi resgatado/);
    assert.equal(player.balance, balanceBeforeClaim + 103000);
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    assert.deepEqual(restored.investments, state.investments);
    assert.equal(restored.players[0].balance, player.balance);
});

test('separate maturity payouts release principal and interest only when each is claimed', () => {
    const separateBoard = structuredClone(board);
    separateBoard.financialEducation.fixedIncomeProducts[0].maturityPayout = 'separate';
    const state = startGame(separateBoard, players);
    state.phase = 'awaitingAction';
    const player = state.players[0];
    createFixedIncomeInvestment(state, separateBoard, player.id, 'liquid-note', 100000, 2, 'separate-payout');
    for (let cycle = 0; cycle < 2; cycle++) {
        player.position = 0;
        state.phase = 'awaitingRoll';
        roll(state, separateBoard, player.id, [6, 6]);
    }
    const investment = state.investments[0];
    const balanceBeforeClaim = player.balance;
    claimFixedIncomeInvestment(state, player.id, investment.id, 'principal');
    assert.equal(player.balance, balanceBeforeClaim + investment.principal);
    assert.equal(investment.status, 'matured');
    assert.equal(investment.principalClaimed, true);
    claimFixedIncomeInvestment(state, player.id, investment.id, 'interest');
    assert.equal(player.balance, balanceBeforeClaim + investment.maturityAmount!);
    assert.equal(investment.status, 'claimed');
});

test('early withdrawal displays and applies configured penalties, while locked products reject it', () => {
    const state = startGame(board, players);
    state.phase = 'awaitingAction';
    const player = state.players[0];
    createFixedIncomeInvestment(state, board, player.id, 'liquid-note', 100000, 4, 'liquid-early');
    player.position = 0;
    state.phase = 'awaitingRoll';
    roll(state, board, player.id, [6, 6]);
    const liquid = state.investments[0];
    assert.deepEqual(calculateEarlyWithdrawalTerms(liquid), { principal: 100000, accruedInterest: 1500, penaltyAmount: 1500, payoutAmount: 100000 });
    const beforeWithdrawal = player.balance;
    withdrawFixedIncomeEarly(state, player.id, liquid.id);
    assert.equal(player.balance, beforeWithdrawal + 100000);
    assert.equal(liquid.status, 'withdrawnEarly');

    state.phase = 'awaitingAction';
    createFixedIncomeInvestment(state, board, player.id, 'term-certificate', 50000, 3, 'locked-note');
    const locked = state.investments[1];
    const beforeRejectedWithdrawal = structuredClone(state);
    assert.throws(() => withdrawFixedIncomeEarly(state, player.id, locked.id), /nao permite resgate/);
    assert.deepEqual(state, beforeRejectedWithdrawal);
});

test('emergency fund withdrawal can cover a pending mandatory tax before explicit payment', () => {
    const state = startGame(board, players);
    const player = state.players[0];
    depositEmergencyFund(state, player.id, 10000, 'tax-reserve');
    const payment = { id: 'emergency-tax', type: 'tax' as const, playerId: player.id, recipientId: 'bank' as const, amount: 15000, description: 'Tax due' };
    state.pendingPayments.push(payment);
    state.pendingAction = { type: 'tax', playerId: player.id, amount: payment.amount, paymentId: payment.id };
    state.phase = 'awaitingDebtResolution';
    withdrawEmergencyFund(state, player.id, 10000, 'tax-withdrawal');
    assert.equal(state.pendingPayments[0].id, payment.id);
    assert.equal(state.phase, 'awaitingDebtResolution');
    assert.equal(player.balance, board.startingBalance);
    assert.equal(player.emergencyFundBalance, 0);
    resolveRent(state, board, player.id, payment.id);
    assert.equal(player.balance, board.startingBalance - payment.amount);
    assert.equal(state.phase, 'awaitingAction');
});