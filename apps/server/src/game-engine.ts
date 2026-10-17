import { randomInt, randomUUID } from 'node:crypto';

export type BoardSpace =
    | { id: string; type: 'start' | 'holiday' | 'jail' | 'goToJail'; name: string }
    | { id: string; type: 'property'; name: string; propertyId: string }
    | { id: string; type: 'tax' | 'bonus'; name: string; amount: number };

export interface PropertyDefinition {
    id: string; name: string; image: string; color: string; group: string;
    price: number; rent: number; houseCost: number; hotelCost: number;
    rentSchedule: number[];
}

export interface DevelopmentRules {
    maxHousesPerProperty: number;
    requireCompleteColorGroup: boolean;
    requireEvenBuilding: boolean;
    hotelRequiresMaxHouses: boolean;
    rentMultipliers: number[];
    jailFeeIncreaseRate: number;
    maxBuildsPerTurn: number;
}

export interface LoanRules {
    maxActiveLoans: number;
    maxInstallments: number;
}

export interface FixedIncomeProductDefinition {
    id: string; name: string; nameTranslations?: Partial<Record<'en', string>>;
    explanation: string; explanationTranslations?: Partial<Record<'en', string>>;
    rateBpsPerCycle: number; availableTermsCycles: number[]; interestMethod: 'simple' | 'compound';
    allowEarlyWithdrawal: boolean; earlyWithdrawalPenaltyBps: number; maturityBehavior: 'claimWithConfirmation'; maturityPayout: 'together' | 'separate';
}

export interface FinancialEducationRules {
    emergencyFundInterestRateBpsPerCycle: number;
    fixedIncomeProducts: FixedIncomeProductDefinition[];
    goalTargets: PersonalGoalTargets;
}

export interface PersonalGoalTargets {
    emergencyFundTarget: number;
    financialSecurityTarget: number;
    maxOutstandingDebt: number;
    leisureEventCount: number;
}

export interface QualityOfLifeAttributes {
    happiness: number; financialSecurity: number; wellBeing: number; personalDevelopment: number; socialLife: number;
}

export interface PersonalGoalProgress {
    id: string; progress: number; target: number; completed: boolean;
}

export interface BoardDefinition {
    id: string; name: string; description: string; currency: string;
    startingBalance: number; startBonus: number; jailFee: number;
    bankInterestRate: number; spaces: BoardSpace[]; properties: PropertyDefinition[];
    developmentRules: DevelopmentRules; loanRules: LoanRules; financialEducation: FinancialEducationRules; victoryCondition: 'lastSolventPlayer';
    bankruptcyRule: 'transferToCreditor';
}

export interface GamePlayer {
    id: string; name: string; color: string; position: number; balance: number;
    jailed: boolean; jailAttempts: number; currentJailFee: number; skipTurns: number; active: boolean; loanAvailableThisCycle: boolean;
    emergencyFundBalance: number; emergencyFundInterestPrevious: number; emergencyFundInterestTotal: number; emergencyFundLastProcessedCycle: number;
    qualityOfLife: QualityOfLifeAttributes; leisureEventCount: number; completedGoals: string[]; qualityOfLifeProcessedEventSequence: number;
}

export interface Loan {
    id: string; type: 'bank' | 'player'; lenderId: string | 'bank'; borrowerId: string;
    principal: number; interestRate: number; installmentsTotal: number; installmentsRemaining: number; installmentAmount: number; outstanding: number;
}

export interface PendingAction {
    type: 'buy' | 'rent' | 'tax' | 'loanInstallment' | 'bail'; playerId: string; propertyId?: string; amount: number; ownerId?: string; paymentId?: string; loanId?: string;
}

export interface PendingPayment {
    id: string; type: 'rent' | 'tax' | 'loanInstallment'; playerId: string; recipientId: string | 'bank';
    amount: number; description: string; propertyId?: string; loanId?: string;
}

export interface LoanProposal {
    id: string; lenderId: string; borrowerId: string; requestedAmount: number; installmentsTotal: number; requestedInterestRate: number;
    principal: number | null; interestRate: number | null; status: 'requested' | 'offered';
}

export interface PropertyOffer {
    id: string; propertyId: string; buyerId: string; ownerId: string; amount: number;
}

export interface FixedIncomeInvestment {
    id: string; investorId: string; productId: string; productName: string; productNameEnglish: string; principal: number;
    rateBpsPerCycle: number; interestMethod: 'simple' | 'compound'; termCycles: number;
    allowEarlyWithdrawal: boolean; earlyWithdrawalPenaltyBps: number; maturityBehavior: 'claimWithConfirmation'; maturityPayout: 'together' | 'separate';
    creationCycle: number; maturityCycle: number; lastAccruedCycle: number; accruedInterest: number;
    estimatedMaturityAmount: number; maturityAmount: number | null; principalClaimed: boolean; interestClaimed: boolean; status: 'active' | 'matured' | 'claimed' | 'withdrawnEarly';
}

export interface GameState {
    boardId: string; status: 'playing' | 'finished'; players: GamePlayer[];
    currentPlayerId: string; winnerId: string | null;
    phase: 'awaitingRoll' | 'awaitingAction' | 'awaitingDebtResolution' | 'awaitingLoanResponse' | 'awaitingPropertyResponse' | 'finished';
    propertyOwners: Record<string, string>; houses: Record<string, number>;
    loans: Loan[]; investments: FixedIncomeInvestment[]; pendingAction: PendingAction | null; pendingLoan: LoanProposal | null; pendingOffer: PropertyOffer | null;
    pendingPayments: PendingPayment[]; pendingLandingPosition: number | null; offersThisTurn: number; builtThisTurn: boolean; startCrossings: Record<string, number>;
    lastRoll: [number, number] | null; log: string[]; events: GameEvent[];
    transactions: FinancialTransaction[]; transactionKeys: string[];
}

export type GameEventType = 'gameStarted' | 'turn' | 'roll' | 'move' | 'purchase' | 'rent' | 'tax' | 'bonus' | 'holiday' | 'jail' | 'jailEscape' | 'bail' | 'loan' | 'build' | 'sale' | 'repayment' | 'paymentDue' | 'propertyOffer' | 'propertyTransfer' | 'bankruptcy' | 'victory' | 'pass' | 'emergencyFundDeposit' | 'emergencyFundWithdrawal' | 'emergencyFundInterest' | 'investmentCreated' | 'investmentMatured' | 'investmentClaimed' | 'investmentEarlyWithdrawal' | 'goalCompleted' | 'qualityOfLifeChanged';
export interface GameEvent { id: string; sequence: number; type: GameEventType; playerId: string | null; message: string; details: Record<string, string | number | boolean | null>; }
export interface FinancialTransaction { id: string; type: GameEventType; from: string | 'bank'; to: string | 'bank'; amount: number; description: string; details?: Record<string, string | number | boolean | null>; }

export const TOKEN_COLORS = ['#e98570', '#547c9b', '#76955f', '#bb925b', '#9275a3', '#4caaa1', '#d16c94', '#5b6676'] as const;

const defaultFixedIncomeProducts: FixedIncomeProductDefinition[] = [
    { id: 'liquid-note', name: 'Nota de Rendimento Liquida', nameTranslations: { en: 'Liquid Income Note' }, explanation: 'Juros simples e resgate antecipado; o resgate antes do vencimento perde os juros acumulados.', explanationTranslations: { en: 'Simple interest with flexible early withdrawal; early access forfeits all earned interest.' }, rateBpsPerCycle: 150, availableTermsCycles: [2, 4], interestMethod: 'simple', allowEarlyWithdrawal: true, earlyWithdrawalPenaltyBps: 10000, maturityBehavior: 'claimWithConfirmation', maturityPayout: 'together' },
    { id: 'term-certificate', name: 'Certificado de Crescimento', nameTranslations: { en: 'Term Growth Certificate' }, explanation: 'Juros compostos e retorno estimado maior; o dinheiro fica bloqueado ate o vencimento.', explanationTranslations: { en: 'Compound interest for a higher estimated return; funds stay locked until maturity.' }, rateBpsPerCycle: 250, availableTermsCycles: [3, 6], interestMethod: 'compound', allowEarlyWithdrawal: false, earlyWithdrawalPenaltyBps: 0, maturityBehavior: 'claimWithConfirmation', maturityPayout: 'together' },
];

export function validateBoard(input: unknown): BoardDefinition {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Board must be a JSON object.');
    const board = input as Record<string, unknown>;
    const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
    const isAmount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
    if (!isText(board.id) || !isText(board.name) || !isText(board.description) || !isText(board.currency)) throw new Error('Board id, name, description, and currency are required.');
    for (const field of ['startingBalance', 'startBonus', 'jailFee'] as const) if (!isAmount(board[field])) throw new Error(`Board ${field} must be a nonnegative safe integer.`);
    if (typeof board.bankInterestRate !== 'number' || !Number.isFinite(board.bankInterestRate) || board.bankInterestRate < 0 || board.bankInterestRate > 1) throw new Error('Bank interest rate must be between 0 and 1.');
    if (!Array.isArray(board.spaces) || board.spaces.length < 4 || !Array.isArray(board.properties)) throw new Error('Board needs an ordered list of at least 4 spaces and a property list.');
    const ids = new Set<string>();
    for (const value of board.spaces) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Every board space must be an object.');
        const space = value as Record<string, unknown>;
        if (!isText(space.id) || !isText(space.name) || ids.has(space.id)) throw new Error('Board space ids and names must be unique and nonempty.');
        ids.add(space.id);
        if (space.type === 'property') { if (!isText(space.propertyId)) throw new Error(`Property space ${space.id} needs a propertyId.`); }
        else if (space.type === 'tax' || space.type === 'bonus') { if (!isAmount(space.amount)) throw new Error(`Space ${space.id} needs a nonnegative amount.`); }
        else if (!['start', 'holiday', 'jail', 'goToJail'].includes(String(space.type))) throw new Error(`Unknown space type: ${String(space.type)}.`);
    }
    if (board.spaces.filter(space => (space as Record<string, unknown>).type === 'start').length !== 1) throw new Error('Board must contain exactly one start space.');
    if (!board.spaces.some(space => (space as Record<string, unknown>).type === 'jail')) throw new Error('Board must contain a jail space.');
    const properties = new Set<string>();
    for (const value of board.properties) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Every property must be an object.');
        const property = value as Record<string, unknown>;
        if (!isText(property.id) || !isText(property.name) || !isText(property.image) || !isText(property.color) || !isText(property.group) || properties.has(property.id)) throw new Error('Property ids, names, image, color, and group must be unique and nonempty.');
        properties.add(property.id);
        for (const field of ['price', 'rent', 'houseCost', 'hotelCost'] as const) if (!isAmount(property[field])) throw new Error(`Property ${property.id} ${field} must be a nonnegative safe integer.`);
    }
    for (const value of board.spaces) if ((value as Record<string, unknown>).type === 'property' && !properties.has((value as Record<string, unknown>).propertyId as string)) throw new Error(`Board space references an unknown property: ${String((value as Record<string, unknown>).propertyId)}.`);
    if (board.spaces.some(space => (space as Record<string, unknown>).type === 'start' && (space as Record<string, unknown>).id !== (board.spaces as Record<string, unknown>[])[0].id)) throw new Error('Start must be the first space in the circular board.');
    const development = board.developmentRules && typeof board.developmentRules === 'object'
        ? board.developmentRules as Record<string, unknown>
        : {};
    const maxHousesPerProperty = development.maxHousesPerProperty ?? 4;
    const rentMultipliers = development.rentMultipliers ?? [1, 2, 3, 4, 6, 8];
    if (!Number.isSafeInteger(maxHousesPerProperty) || (maxHousesPerProperty as number) < 1 || (maxHousesPerProperty as number) > 10) throw new Error('Maximum houses per property must be between 1 and 10.');
    if (!Array.isArray(rentMultipliers) || rentMultipliers.length !== (maxHousesPerProperty as number) + 2 || rentMultipliers.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0) || rentMultipliers[0] !== 1) throw new Error('Rent multipliers must define base rent, every house level, and hotel rent.');
    const jailFeeIncreaseRate = development.jailFeeIncreaseRate ?? 0.1;
    if (typeof jailFeeIncreaseRate !== 'number' || !Number.isFinite(jailFeeIncreaseRate) || jailFeeIncreaseRate < 0 || jailFeeIncreaseRate > 1) throw new Error('Jail fee increase rate must be between 0 and 1.');
    const maxBuildsPerTurn = development.maxBuildsPerTurn ?? 1;
    if (maxBuildsPerTurn !== 1) throw new Error('The current rules support exactly one construction per turn.');
    const developmentRules: DevelopmentRules = {
        maxHousesPerProperty: maxHousesPerProperty as number,
        requireCompleteColorGroup: development.requireCompleteColorGroup !== false,
        requireEvenBuilding: development.requireEvenBuilding !== false,
        hotelRequiresMaxHouses: development.hotelRequiresMaxHouses !== false,
        rentMultipliers: rentMultipliers as number[],
        jailFeeIncreaseRate,
        maxBuildsPerTurn,
    };
    const loanConfig = board.loanRules && typeof board.loanRules === 'object' ? board.loanRules as Record<string, unknown> : {};
    const maxActiveLoans = loanConfig.maxActiveLoans ?? 3;
    const maxInstallments = loanConfig.maxInstallments ?? 12;
    if (!Number.isSafeInteger(maxActiveLoans) || (maxActiveLoans as number) < 1 || (maxActiveLoans as number) > 3) throw new Error('Active loans must be limited to a maximum of three.');
    if (!Number.isSafeInteger(maxInstallments) || (maxInstallments as number) < 1 || (maxInstallments as number) > 120) throw new Error('Maximum installments must be between 1 and 120.');
    const loanRules: LoanRules = { maxActiveLoans: maxActiveLoans as number, maxInstallments: maxInstallments as number };
    const educationConfig = board.financialEducation && typeof board.financialEducation === 'object' ? board.financialEducation as Record<string, unknown> : {};
    const emergencyFundInterestRateBpsPerCycle = educationConfig.emergencyFundInterestRateBpsPerCycle ?? 50;
    if (!Number.isSafeInteger(emergencyFundInterestRateBpsPerCycle) || (emergencyFundInterestRateBpsPerCycle as number) < 0 || (emergencyFundInterestRateBpsPerCycle as number) > 10000) throw new Error('Emergency fund rate must be integer basis points between 0 and 10000.');
    const productsInput = educationConfig.fixedIncomeProducts ?? defaultFixedIncomeProducts;
    if (!Array.isArray(productsInput) || productsInput.length === 0) throw new Error('At least one fixed-income product is required.');
    const productIds = new Set<string>();
    const fixedIncomeProducts = (productsInput as unknown[]).map(value => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Every fixed-income product must be an object.');
        const product = value as Record<string, unknown>;
        if (!isText(product.id) || !isText(product.name) || productIds.has(product.id)) throw new Error('Fixed-income product ids and names must be unique and nonempty.');
        productIds.add(product.id);
        if (!isText(product.explanation)) throw new Error(`Product ${product.id} needs an educational explanation.`);
        if (!Number.isSafeInteger(product.rateBpsPerCycle) || (product.rateBpsPerCycle as number) < 0 || (product.rateBpsPerCycle as number) > 10000) throw new Error(`Product ${product.id} rate must be integer basis points between 0 and 10000.`);
        if (!Array.isArray(product.availableTermsCycles) || product.availableTermsCycles.length === 0 || product.availableTermsCycles.some(term => !Number.isSafeInteger(term) || (term as number) < 1 || (term as number) > 120) || new Set(product.availableTermsCycles).size !== product.availableTermsCycles.length) throw new Error(`Product ${product.id} needs unique terms between 1 and 120 cycles.`);
        if (product.interestMethod !== 'simple' && product.interestMethod !== 'compound') throw new Error(`Product ${product.id} has an unsupported interest method.`);
        if (typeof product.allowEarlyWithdrawal !== 'boolean') throw new Error(`Product ${product.id} must define early-withdrawal availability.`);
        if (!Number.isSafeInteger(product.earlyWithdrawalPenaltyBps) || (product.earlyWithdrawalPenaltyBps as number) < 0 || (product.earlyWithdrawalPenaltyBps as number) > 10000) throw new Error(`Product ${product.id} penalty must be integer basis points between 0 and 10000.`);
        if (product.maturityBehavior !== 'claimWithConfirmation' || !['together', 'separate'].includes(String(product.maturityPayout))) throw new Error(`Product ${product.id} must define a supported confirmed maturity payout.`);
        return product as unknown as FixedIncomeProductDefinition;
    });
    const goalsConfig = educationConfig.personalGoalTargets && typeof educationConfig.personalGoalTargets === 'object' ? educationConfig.personalGoalTargets as Record<string, unknown> : {};
    const personalGoalTargets = {
        emergencyFundTarget: goalsConfig.emergencyFundTarget ?? Math.round((board.startingBalance as number) / 6),
        financialSecurityTarget: goalsConfig.financialSecurityTarget ?? 75,
        maxOutstandingDebt: goalsConfig.maxOutstandingDebt ?? 0,
        leisureEventCount: goalsConfig.leisureEventCount ?? 2,
    };
    if (!isAmount(personalGoalTargets.emergencyFundTarget) || !isAmount(personalGoalTargets.maxOutstandingDebt) || !Number.isSafeInteger(personalGoalTargets.financialSecurityTarget) || (personalGoalTargets.financialSecurityTarget as number) < 0 || (personalGoalTargets.financialSecurityTarget as number) > 100 || !Number.isSafeInteger(personalGoalTargets.leisureEventCount) || (personalGoalTargets.leisureEventCount as number) < 1 || (personalGoalTargets.leisureEventCount as number) > 100) throw new Error('Personal goal targets are invalid.');
    const financialEducation: FinancialEducationRules = { emergencyFundInterestRateBpsPerCycle: emergencyFundInterestRateBpsPerCycle as number, fixedIncomeProducts, goalTargets: personalGoalTargets as PersonalGoalTargets };
    if (board.victoryCondition !== undefined && board.victoryCondition !== 'lastSolventPlayer') throw new Error('Unsupported victory condition.');
    if (board.bankruptcyRule !== undefined && board.bankruptcyRule !== 'transferToCreditor') throw new Error('Unsupported bankruptcy rule.');
    const normalizedProperties = (board.properties as Record<string, unknown>[]).map(property => ({
        ...property,
        rentSchedule: Array.isArray(property.rentSchedule)
            ? property.rentSchedule
            : developmentRules.rentMultipliers.map(multiplier => Math.round((property.rent as number) * multiplier)),
    }));
    if (normalizedProperties.some(property => !Array.isArray(property.rentSchedule) || property.rentSchedule.length !== developmentRules.rentMultipliers.length || property.rentSchedule.some(value => !isAmount(value)))) throw new Error('Each property rentSchedule must define base, each house level, and hotel rent as nonnegative integers.');
    return { ...board, properties: normalizedProperties, developmentRules, loanRules, financialEducation, victoryCondition: 'lastSolventPlayer', bankruptcyRule: 'transferToCreditor' } as unknown as BoardDefinition;
}

export function startGame(board: BoardDefinition, players: { id: string; name: string; online: boolean; color: string }[]): GameState {
    if (players.length < 2 || players.some(player => !player.online)) throw new Error('At least two connected players are required to start.');
    const colors = new Set<string>();
    for (const player of players) {
        if (!TOKEN_COLORS.includes(player.color as typeof TOKEN_COLORS[number]) || colors.has(player.color)) throw new Error('Every player must have a unique token color.');
        colors.add(player.color);
    }
    const start = board.spaces.findIndex(space => space.type === 'start');
    const state: GameState = {
        boardId: board.id, status: 'playing', players: players.map(player => ({ id: player.id, name: player.name, color: player.color, position: start, balance: board.startingBalance, jailed: false, jailAttempts: 0, currentJailFee: board.jailFee, skipTurns: 0, active: true, loanAvailableThisCycle: true, emergencyFundBalance: 0, emergencyFundInterestPrevious: 0, emergencyFundInterestTotal: 0, emergencyFundLastProcessedCycle: 0, qualityOfLife: { happiness: 55, financialSecurity: 60, wellBeing: 55, personalDevelopment: 40, socialLife: 50 }, leisureEventCount: 0, completedGoals: [], qualityOfLifeProcessedEventSequence: 0 })),
        currentPlayerId: players[0].id, winnerId: null, phase: 'awaitingRoll', propertyOwners: {}, houses: {}, loans: [], investments: [], pendingAction: null, pendingLoan: null, pendingOffer: null, pendingPayments: [], pendingLandingPosition: null, offersThisTurn: 0, builtThisTurn: false, startCrossings: {}, lastRoll: null, log: [], events: [], transactions: [], transactionKeys: [],
    };
    recordEvent(state, 'gameStarted', players[0].id, `${players[0].name} inicia uma partida em ${board.name}.`, { boardId: board.id, playerCount: players.length });
    recordEvent(state, 'turn', players[0].id, `A vez de ${players[0].name}.`);
    return state;
}

function recordEvent(state: GameState, type: GameEventType, playerId: string | null, message: string, details: GameEvent['details'] = {}) {
    state.events.push({ id: randomUUID(), sequence: state.events.length + 1, type, playerId, message, details });
    state.log.push(message);
}

export function applyTransaction(state: GameState, type: GameEventType, from: string | 'bank', to: string | 'bank', amount: number, description: string, idempotencyKey: string = randomUUID(), details: Record<string, string | number | boolean> = {}) {
    if (state.status !== 'playing') throw new Error('A partida terminou.');
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('O valor da transacao deve ser um inteiro nao negativo.');
    if (state.transactionKeys.includes(idempotencyKey)) return false;
    const payer = from === 'bank' ? undefined : state.players.find(player => player.id === from && player.active);
    const recipient = to === 'bank' ? undefined : state.players.find(player => player.id === to && player.active);
    if ((from !== 'bank' && !payer) || (to !== 'bank' && !recipient)) throw new Error('Jogador da transacao invalido.');
    if (from !== 'bank' && payer!.balance < amount) throw new Error('Saldo insuficiente para a transacao.');
    if (from === to) throw new Error('A origem e o destino devem ser diferentes.');
    if (recipient && !Number.isSafeInteger(recipient.balance + amount)) throw new Error('Saldo resultante fora do limite permitido.');
    if (payer) payer.balance -= amount;
    if (recipient) recipient.balance += amount;
    state.transactionKeys.push(idempotencyKey);
    state.transactions.push({ id: idempotencyKey, type, from, to, amount, description, details });
    recordEvent(state, type, payer?.id ?? recipient?.id ?? null, description, { ...details, from, to, amount, transactionId: idempotencyKey });
    return true;
}

function recordAccountTransaction(state: GameState, type: GameEventType, playerId: string, amount: number, description: string, idempotencyKey: string, details: GameEvent['details'] = {}) {
    if (state.status !== 'playing') throw new Error('A partida terminou.');
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('O valor da transacao deve ser um inteiro nao negativo.');
    if (state.transactionKeys.includes(idempotencyKey)) return false;
    if (!state.players.some(player => player.id === playerId && player.active)) throw new Error('Jogador da transacao invalido.');
    state.transactionKeys.push(idempotencyKey);
    state.transactions.push({ id: idempotencyKey, type, from: 'bank', to: playerId, amount, description, details });
    recordEvent(state, type, playerId, description, { ...details, amount, transactionId: idempotencyKey });
    return true;
}

function roundedBasisPointAmount(amount: number, rateBps: number) {
    if (!Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(rateBps) || rateBps < 0 || rateBps > 10000) throw new Error('Valor ou taxa financeira invalida.');
    const rounded = (BigInt(amount) * BigInt(rateBps) + 5000n) / 10000n;
    if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Valor financeiro fora do limite permitido.');
    return Number(rounded);
}

function addSafeMoney(left: number, right: number) {
    const total = left + right;
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Saldo resultante fora do limite permitido.');
    return total;
}

function productTerms(product: FixedIncomeProductDefinition, principal: number, termCycles: number) {
    if (!Number.isSafeInteger(principal) || principal <= 0 || !product.availableTermsCycles.includes(termCycles)) throw new Error('Valor ou prazo de investimento invalido.');
    let accruedInterest = 0;
    for (let cycle = 0; cycle < termCycles; cycle++) {
        const interestBase = product.interestMethod === 'simple' ? principal : addSafeMoney(principal, accruedInterest);
        accruedInterest = addSafeMoney(accruedInterest, roundedBasisPointAmount(interestBase, product.rateBpsPerCycle));
    }
    return { principal, interestAmount: accruedInterest, maturityAmount: addSafeMoney(principal, accruedInterest) };
}

export function calculateFixedIncomeTerms(product: FixedIncomeProductDefinition, principal: number, termCycles: number) {
    return { ...productTerms(product, principal, termCycles), rateBpsPerCycle: product.rateBpsPerCycle, termCycles, interestMethod: product.interestMethod };
}

export function calculateEarlyWithdrawalTerms(investment: FixedIncomeInvestment) {
    if (!investment.allowEarlyWithdrawal || investment.status !== 'active') throw new Error('Este investimento nao permite resgate antecipado.');
    const penaltyAmount = roundedBasisPointAmount(investment.accruedInterest, investment.earlyWithdrawalPenaltyBps);
    const netInterest = investment.accruedInterest - penaltyAmount;
    return { principal: investment.principal, accruedInterest: investment.accruedInterest, penaltyAmount, payoutAmount: addSafeMoney(investment.principal, netInterest) };
}

function requireActivePlayer(state: GameState, playerId: string) {
    const player = state.players.find(candidate => candidate.id === playerId && candidate.active);
    if (state.status !== 'playing' || !player) throw new Error('Jogador indisponivel para esta operacao.');
    return player;
}

export function depositEmergencyFund(state: GameState, playerId: string, amount: number, operationId: string) {
    const player = requireActivePlayer(state, playerId);
    if (!Number.isSafeInteger(amount) || amount <= 0 || typeof operationId !== 'string' || operationId.length < 1 || operationId.length > 100) throw new Error('Informe um valor de deposito valido.');
    if (player.balance < amount) throw new Error('Saldo insuficiente para depositar no fundo de emergencia.');
    const nextFundBalance = addSafeMoney(player.emergencyFundBalance, amount);
    const key = `emergency-fund:deposit:${playerId}:${operationId}`;
    if (!applyTransaction(state, 'emergencyFundDeposit', playerId, 'bank', amount, `${player.name} deposita ${amount} no fundo de emergencia.`, key)) return state;
    player.emergencyFundBalance = nextFundBalance;
    return state;
}

export function withdrawEmergencyFund(state: GameState, playerId: string, amount: number, operationId: string) {
    const player = requireActivePlayer(state, playerId);
    if (!Number.isSafeInteger(amount) || amount <= 0 || typeof operationId !== 'string' || operationId.length < 1 || operationId.length > 100) throw new Error('Informe um valor de resgate valido.');
    if (player.emergencyFundBalance < amount) throw new Error('Saldo insuficiente no fundo de emergencia.');
    const nextBalance = addSafeMoney(player.balance, amount);
    const key = `emergency-fund:withdrawal:${playerId}:${operationId}`;
    if (!applyTransaction(state, 'emergencyFundWithdrawal', 'bank', playerId, amount, `${player.name} resgata ${amount} do fundo de emergencia.`, key)) return state;
    player.emergencyFundBalance -= amount;
    if (player.balance !== nextBalance) throw new Error('Saldo de conta inconsistente apos o resgate.');
    return state;
}

function getInvestment(state: GameState, playerId: string, investmentId: string) {
    const investment = state.investments.find(candidate => candidate.id === investmentId && candidate.investorId === playerId);
    if (!investment) throw new Error('Investimento nao encontrado para este jogador.');
    return investment;
}

export function createFixedIncomeInvestment(state: GameState, board: BoardDefinition, playerId: string, productId: string, principal: number, termCycles: number, operationId: string) {
    const player = requireActivePlayer(state, playerId);
    if (state.currentPlayerId !== playerId || state.phase !== 'awaitingAction' || state.pendingAction || state.pendingLoan || state.pendingOffer) throw new Error('Invista durante sua vez, apos resolver as acoes pendentes.');
    if (typeof operationId !== 'string' || operationId.length < 1 || operationId.length > 100) throw new Error('Identificador de operacao invalido.');
    const key = `investment:create:${playerId}:${operationId}`;
    if (state.transactionKeys.includes(key)) return state;
    const product = board.financialEducation.fixedIncomeProducts.find(candidate => candidate.id === productId);
    if (!product) throw new Error('Produto de renda fixa desconhecido.');
    const terms = productTerms(product, principal, termCycles);
    if (player.balance < principal) throw new Error('Saldo insuficiente para este investimento.');
    const cycle = state.startCrossings[playerId] ?? 0;
    const maturityCycle = cycle + termCycles;
    if (!Number.isSafeInteger(maturityCycle)) throw new Error('Ciclo de vencimento fora do limite permitido.');
    const investment: FixedIncomeInvestment = {
        id: randomUUID(), investorId: playerId, productId: product.id, productName: product.name, productNameEnglish: product.nameTranslations?.en ?? product.name, principal,
        rateBpsPerCycle: product.rateBpsPerCycle, interestMethod: product.interestMethod, termCycles,
        allowEarlyWithdrawal: product.allowEarlyWithdrawal, earlyWithdrawalPenaltyBps: product.earlyWithdrawalPenaltyBps,
        maturityBehavior: product.maturityBehavior, maturityPayout: product.maturityPayout,
        creationCycle: cycle, maturityCycle, lastAccruedCycle: cycle, accruedInterest: 0,
        estimatedMaturityAmount: terms.maturityAmount, maturityAmount: null, principalClaimed: false, interestClaimed: false, status: 'active',
    };
    if (!applyTransaction(state, 'investmentCreated', playerId, 'bank', principal, `${player.name} investe ${principal} em ${product.name} por ${termCycles} ciclo(s).`, key, { investmentId: investment.id, productId, productName: product.name, productNameEnglish: investment.productNameEnglish, termCycles, rateBpsPerCycle: product.rateBpsPerCycle, estimatedMaturityAmount: terms.maturityAmount })) return state;
    state.investments.push(investment);
    return state;
}

export function claimFixedIncomeInvestment(state: GameState, playerId: string, investmentId: string, part: 'together' | 'principal' | 'interest' = 'together') {
    const player = requireActivePlayer(state, playerId);
    const investment = getInvestment(state, playerId, investmentId);
    if (investment.status !== 'matured') throw new Error('O investimento ainda nao venceu ou ja foi resgatado.');
    const separate = investment.maturityPayout === 'separate';
    if ((!separate && part !== 'together') || (separate && part === 'together')) throw new Error('Escolha uma parte valida para este resgate.');
    const amount = part === 'principal' ? investment.principal : part === 'interest' ? investment.accruedInterest : investment.maturityAmount ?? addSafeMoney(investment.principal, investment.accruedInterest);
    const key = `investment:claim:${investment.id}:${part}`;
    if (state.transactionKeys.includes(key)) return state;
    if (!applyTransaction(state, 'investmentClaimed', 'bank', playerId, amount, `${player.name} resgata ${amount} do investimento ${investment.productName}.`, key, { investmentId, productName: investment.productName, productNameEnglish: investment.productNameEnglish, part, principal: investment.principal, accruedInterest: investment.accruedInterest })) return state;
    if (part === 'principal' || part === 'together') investment.principalClaimed = true;
    if (part === 'interest' || part === 'together') investment.interestClaimed = true;
    if (investment.principalClaimed && investment.interestClaimed) investment.status = 'claimed';
    return state;
}

export function withdrawFixedIncomeEarly(state: GameState, playerId: string, investmentId: string) {
    const player = requireActivePlayer(state, playerId);
    const investment = getInvestment(state, playerId, investmentId);
    const terms = calculateEarlyWithdrawalTerms(investment);
    const key = `investment:early-withdrawal:${investment.id}`;
    if (state.transactionKeys.includes(key)) return state;
    if (!applyTransaction(state, 'investmentEarlyWithdrawal', 'bank', playerId, terms.payoutAmount, `${player.name} resgata ${terms.payoutAmount} antecipadamente de ${investment.productName}; perde ${terms.penaltyAmount} em juros.`, key, { investmentId, productName: investment.productName, productNameEnglish: investment.productNameEnglish, principal: terms.principal, accruedInterest: terms.accruedInterest, penaltyAmount: terms.penaltyAmount })) return state;
    investment.status = 'withdrawnEarly';
    return state;
}

function clampAttribute(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function processFinancialCycle(state: GameState, board: BoardDefinition, player: GamePlayer, cycle: number) {
    if (cycle > player.emergencyFundLastProcessedCycle) {
        const interest = player.emergencyFundBalance > 0
            ? roundedBasisPointAmount(player.emergencyFundBalance, board.financialEducation.emergencyFundInterestRateBpsPerCycle)
            : 0;
        if (interest > 0) {
            const key = `emergency-fund:interest:${player.id}:${cycle}`;
            if (recordAccountTransaction(state, 'emergencyFundInterest', player.id, interest, `${player.name} recebe ${interest} de juros no fundo de emergencia.`, key, { cycle, rateBpsPerCycle: board.financialEducation.emergencyFundInterestRateBpsPerCycle })) {
                player.emergencyFundBalance = addSafeMoney(player.emergencyFundBalance, interest);
                player.emergencyFundInterestTotal = addSafeMoney(player.emergencyFundInterestTotal, interest);
            }
        }
        player.emergencyFundInterestPrevious = interest;
        player.emergencyFundLastProcessedCycle = cycle;
    }
    for (const investment of state.investments) {
        if (investment.investorId !== player.id || investment.status !== 'active' || cycle <= investment.creationCycle || cycle <= investment.lastAccruedCycle) continue;
        const base = investment.interestMethod === 'simple' ? investment.principal : addSafeMoney(investment.principal, investment.accruedInterest);
        investment.accruedInterest = addSafeMoney(investment.accruedInterest, roundedBasisPointAmount(base, investment.rateBpsPerCycle));
        investment.lastAccruedCycle = cycle;
        if (cycle >= investment.maturityCycle) {
            investment.maturityAmount = addSafeMoney(investment.principal, investment.accruedInterest);
            investment.status = 'matured';
            recordEvent(state, 'investmentMatured', player.id, `${player.name}: ${investment.productName} venceu; ${investment.maturityAmount} aguardam confirmacao de resgate.`, { investmentId: investment.id, productName: investment.productNameEnglish, maturityCycle: cycle, principal: investment.principal, accruedInterest: investment.accruedInterest, maturityAmount: investment.maturityAmount });
        }
    }
}

function scaledAttributeScore(amount: bigint, cap: number, baseline: bigint) {
    const scaled = (amount * BigInt(cap) + baseline / 2n) / baseline;
    return Number(scaled > BigInt(cap) ? BigInt(cap) : scaled);
}

function financialSecurityScore(state: GameState, board: BoardDefinition, player: GamePlayer) {
    const baseline = BigInt(Math.max(board.startingBalance, 1));
    const liquidReserves = BigInt(Math.max(0, player.balance)) + BigInt(player.emergencyFundBalance);
    const outstandingDebt = state.loans.filter(loan => loan.borrowerId === player.id && loan.installmentsRemaining > 0).reduce((sum, loan) => sum + BigInt(loan.outstanding), 0n);
    const lockedPrincipal = state.investments.filter(investment => investment.investorId === player.id && (investment.status === 'active' || (investment.status === 'matured' && !investment.principalClaimed))).reduce((sum, investment) => sum + BigInt(investment.principal), 0n);
    return clampAttribute(25 + scaledAttributeScore(liquidReserves, 35, baseline) + scaledAttributeScore(BigInt(player.emergencyFundBalance), 25, baseline) - scaledAttributeScore(outstandingDebt, 55, baseline) - scaledAttributeScore(lockedPrincipal, 20, baseline));
}

export function getPersonalGoalProgress(state: GameState, board: BoardDefinition, playerId: string): PersonalGoalProgress[] {
    const player = state.players.find(candidate => candidate.id === playerId);
    if (!player) throw new Error('Jogador nao encontrado para avaliar metas.');
    const targets = board.financialEducation.goalTargets;
    const transactions = state.transactions;
    const borrowedTotal = transactions.filter(transaction => transaction.type === 'loan' && transaction.to === playerId).reduce((sum, transaction) => {
        const total = transaction.details?.totalRepayment;
        return sum + (typeof total === 'number' ? total : transaction.amount);
    }, 0);
    const repaidTotal = transactions.filter(transaction => transaction.type === 'repayment' && transaction.from === playerId).reduce((sum, transaction) => sum + transaction.amount, 0);
    const outstandingDebt = state.loans.filter(loan => loan.borrowerId === playerId && loan.installmentsRemaining > 0).reduce((sum, loan) => sum + loan.outstanding, 0);
    const propertyCount = Object.values(state.propertyOwners).filter(ownerId => ownerId === playerId).length;
    const startedInvesting = transactions.some(transaction => transaction.type === 'investmentCreated' && transaction.from === playerId);
    const goals: { id: string; progress: number; target: number; condition: boolean }[] = [
        { id: 'emergency-fund', progress: Math.min(player.emergencyFundBalance, targets.emergencyFundTarget), target: targets.emergencyFundTarget, condition: player.emergencyFundBalance >= targets.emergencyFundTarget },
        { id: 'financial-security', progress: Math.min(player.qualityOfLife.financialSecurity, targets.financialSecurityTarget), target: targets.financialSecurityTarget, condition: player.qualityOfLife.financialSecurity >= targets.financialSecurityTarget },
        { id: 'reduce-debt', progress: borrowedTotal > 0 ? Math.min(borrowedTotal, Math.max(0, borrowedTotal - outstandingDebt)) : 0, target: borrowedTotal || 1, condition: borrowedTotal > 0 && outstandingDebt <= targets.maxOutstandingDebt && repaidTotal >= borrowedTotal - targets.maxOutstandingDebt },
        { id: 'start-investing', progress: startedInvesting ? 1 : 0, target: 1, condition: startedInvesting },
        { id: 'own-property', progress: Math.min(propertyCount, 1), target: 1, condition: propertyCount > 0 },
        { id: 'enjoy-life', progress: Math.min(player.leisureEventCount, targets.leisureEventCount), target: targets.leisureEventCount, condition: player.leisureEventCount >= targets.leisureEventCount },
    ];
    return goals.map(goal => ({ ...goal, completed: player.completedGoals.includes(goal.id) || goal.condition }));
}

export function updateQualityOfLife(state: GameState, board: BoardDefinition) {
    const changes = new Map<string, { attributes: Set<string>; reasons: Set<string> }>();
    const changed = (playerId: string, attribute: keyof QualityOfLifeAttributes, reason: string) => {
        const entry = changes.get(playerId) ?? { attributes: new Set<string>(), reasons: new Set<string>() };
        entry.attributes.add(attribute);
        entry.reasons.add(reason);
        changes.set(playerId, entry);
    };
    const bump = (player: GamePlayer | undefined, attribute: keyof QualityOfLifeAttributes, delta: number, reason: string) => {
        if (!player || delta === 0) return;
        const before = player.qualityOfLife[attribute];
        const after = clampAttribute(before + delta);
        if (after === before) return;
        player.qualityOfLife[attribute] = after;
        changed(player.id, attribute, reason);
    };

    for (const player of state.players) {
        for (const event of state.events) {
            if (event.sequence <= player.qualityOfLifeProcessedEventSequence) continue;
            if (event.type === 'holiday' && event.playerId === player.id && event.details.restfulVisit === true) {
                player.leisureEventCount++;
                bump(player, 'happiness', 3, 'leisure');
                bump(player, 'wellBeing', 2, 'leisure');
                bump(player, 'socialLife', 2, 'leisure');
            } else if (event.type === 'investmentCreated' && event.playerId === player.id) {
                bump(player, 'personalDevelopment', 3, 'investment');
            } else if (event.type === 'investmentMatured' && event.playerId === player.id) {
                bump(player, 'personalDevelopment', 2, 'investment');
            } else if (event.type === 'propertyTransfer') {
                if (event.playerId === player.id) bump(player, 'socialLife', 2, 'trade');
                if (event.details.previousOwnerId === player.id) bump(player, 'socialLife', 1, 'trade');
            }
        }
    }

    for (const player of state.players) {
        const before = player.qualityOfLife.financialSecurity;
        const after = financialSecurityScore(state, board, player);
        if (after !== before) {
            player.qualityOfLife.financialSecurity = after;
            const reason = state.events.slice(-8).some(event => event.playerId === player.id && ['loan', 'repayment'].includes(event.type)) ? 'debt'
                : state.events.slice(-8).some(event => event.playerId === player.id && ['emergencyFundDeposit', 'emergencyFundWithdrawal', 'emergencyFundInterest'].includes(event.type)) ? 'reserve'
                    : state.events.slice(-8).some(event => event.playerId === player.id && ['investmentCreated', 'investmentClaimed', 'investmentEarlyWithdrawal'].includes(event.type)) ? 'investment' : 'financial-event';
            changed(player.id, 'financialSecurity', reason);
        }
    }

    for (const [playerId, change] of changes) {
        const player = state.players.find(candidate => candidate.id === playerId);
        if (player) recordEvent(state, 'qualityOfLifeChanged', playerId, `${player.name}: qualidade de vida atualizada.`, { attributes: [...change.attributes].join(','), reasons: [...change.reasons].join(',') });
    }
    for (const player of state.players) {
        for (const goal of getPersonalGoalProgress(state, board, player.id)) {
            if (goal.completed && !player.completedGoals.includes(goal.id)) {
                player.completedGoals.push(goal.id);
                recordEvent(state, 'goalCompleted', player.id, `${player.name} completou a meta ${goal.id}.`, { goalId: goal.id });
            }
        }
        player.qualityOfLifeProcessedEventSequence = state.events.at(-1)?.sequence ?? player.qualityOfLifeProcessedEventSequence;
    }
}

export function calculateLoanTerms(principal: number, interestRate: number, installments: number) {
    if (!Number.isSafeInteger(principal) || principal <= 0 || !Number.isFinite(interestRate) || interestRate < 0 || interestRate > 1 || !Number.isSafeInteger(installments) || installments < 1) throw new Error('Termos de emprestimo invalidos.');
    const totalRepayment = principal + Math.round(principal * interestRate);
    return { principal, interestRate, installmentsTotal: installments, totalRepayment, installmentAmount: Math.ceil(totalRepayment / installments) };
}

export function calculateBankInterestRate(board: BoardDefinition, installments: number) {
    if (!Number.isSafeInteger(installments) || installments < 1 || installments > board.loanRules.maxInstallments) throw new Error(`O maximo e ${board.loanRules.maxInstallments} parcelas.`);
    return board.bankInterestRate * installments / board.loanRules.maxInstallments;
}

function activeLoanCount(state: GameState, playerId: string) {
    return state.loans.filter(loan => loan.borrowerId === playerId && loan.installmentsRemaining > 0).length;
}

function ensureLoanEligible(state: GameState, board: BoardDefinition, player: GamePlayer) {
    if (!player.loanAvailableThisCycle) throw new Error('Voce ja solicitou um emprestimo neste ciclo do tabuleiro.');
    if (activeLoanCount(state, player.id) >= board.loanRules.maxActiveLoans) throw new Error(`Limite de ${board.loanRules.maxActiveLoans} emprestimos ativos atingido.`);
}

function makeLoan(state: GameState, board: BoardDefinition, borrower: GamePlayer, lenderId: string | 'bank', principal: number, interestRate: number, installments: number, id: string = randomUUID()) {
    ensureLoanEligible(state, board, borrower);
    if (installments > board.loanRules.maxInstallments) throw new Error(`O maximo e ${board.loanRules.maxInstallments} parcelas.`);
    const terms = calculateLoanTerms(principal, interestRate, installments);
    const loan: Loan = { id, type: lenderId === 'bank' ? 'bank' : 'player', lenderId, borrowerId: borrower.id, principal, interestRate, installmentsTotal: installments, installmentsRemaining: installments, installmentAmount: terms.installmentAmount, outstanding: terms.totalRepayment };
    state.loans.push(loan);
    borrower.loanAvailableThisCycle = false;
    return loan;
}

function paymentAction(payment: PendingPayment): PendingAction {
    return { type: payment.type, playerId: payment.playerId, amount: payment.amount, ownerId: payment.type === 'rent' ? payment.recipientId : undefined, propertyId: payment.propertyId, paymentId: payment.id, loanId: payment.loanId };
}

function queuePayment(state: GameState, payment: PendingPayment) {
    state.pendingPayments.push(payment);
    if (!state.pendingAction || ['rent', 'tax', 'loanInstallment'].includes(state.pendingAction.type)) {
        state.pendingAction = paymentAction(state.pendingPayments[0]);
        state.phase = 'awaitingDebtResolution';
    }
    recordEvent(state, 'paymentDue', payment.playerId, payment.description, { paymentId: payment.id, amount: payment.amount, recipientId: payment.recipientId, loanId: payment.loanId ?? null });
}

function queueNextPayment(state: GameState, board: BoardDefinition) {
    const next = state.pendingPayments[0];
    if (next) {
        state.pendingAction = paymentAction(next);
        state.phase = 'awaitingDebtResolution';
        return state;
    }
    state.pendingAction = null;
    state.phase = 'awaitingAction';
    if (state.pendingLandingPosition !== null) {
        const player = state.players.find(candidate => candidate.id === state.currentPlayerId)!;
        player.position = state.pendingLandingPosition;
        state.pendingLandingPosition = null;
        return resolveLanding(state, board, player);
    }
    return state;
}

function finishIfWinner(state: GameState) {
    if (state.status !== 'playing') return true;
    const activePlayers = state.players.filter(player => player.active);
    if (activePlayers.length > 1) return false;
    state.status = 'finished';
    state.phase = 'finished';
    state.winnerId = activePlayers[0]?.id ?? null;
    state.pendingAction = null;
    state.pendingLoan = null;
    state.pendingOffer = null;
    state.pendingPayments = [];
    state.pendingLandingPosition = null;
    recordEvent(state, 'victory', state.winnerId, state.winnerId ? `${activePlayers[0].name} vence a partida.` : 'A partida terminou sem vencedor.', { winnerId: state.winnerId });
    return true;
}

function nextPlayer(state: GameState, message: string): GameState {
    if (finishIfWinner(state)) return state;
    const current = state.players.findIndex(player => player.id === state.currentPlayerId);
    let fallback: GamePlayer | undefined;
    for (let offset = 1; offset <= state.players.length; offset++) {
        const candidate = state.players[(current + offset) % state.players.length];
        if (!candidate.active) continue;
        fallback ??= candidate;
        if (candidate.skipTurns > 0) {
            candidate.skipTurns--;
            recordEvent(state, 'holiday', candidate.id, `${candidate.name} perde esta vez em Ferias.`, { skippedTurnsRemaining: candidate.skipTurns });
            continue;
        }
        state.currentPlayerId = candidate.id;
        state.phase = 'awaitingRoll'; state.pendingAction = null; state.pendingLoan = null;
        state.pendingOffer = null; state.offersThisTurn = 0; state.builtThisTurn = false; state.pendingPayments = []; state.pendingLandingPosition = null;
        recordEvent(state, 'turn', candidate.id, message);
        return state;
    }
    if (fallback) {
        state.currentPlayerId = fallback.id;
        state.phase = 'awaitingRoll'; state.pendingAction = null; state.pendingLoan = null;
        state.pendingOffer = null; state.offersThisTurn = 0; state.builtThisTurn = false; state.pendingPayments = []; state.pendingLandingPosition = null;
        recordEvent(state, 'turn', fallback.id, message);
    }
    return state;
}

function advanceAfterLanding(state: GameState, player: GamePlayer, message = `A vez de ${state.players[(state.players.findIndex(value => value.id === player.id) + 1) % state.players.length].name}.`) {
    state.phase = 'awaitingAction';
    state.pendingAction = null;
    state.pendingLoan = null;
    recordEvent(state, 'turn', player.id, `${player.name} pode realizar outras acoes ou encerrar a vez.`, { landingResolution: message });
    return state;
}

export function finishTurn(state: GameState, actorId: string): GameState {
    if (state.status !== 'playing' || state.phase !== 'awaitingAction' || state.currentPlayerId !== actorId || state.pendingAction || state.pendingLoan || state.pendingOffer || state.pendingPayments.length) throw new Error('Role os dados e resolva as acoes pendentes antes de encerrar a vez.');
    const player = state.players.find(candidate => candidate.id === actorId)!;
    return nextPlayer(state, `${player.name} encerra a vez.`);
}

function resolvePropertyLanding(state: GameState, board: BoardDefinition, player: GamePlayer, propertyId: string): GameState {
    const ownerId = state.propertyOwners[propertyId];
    const property = board.properties.find(value => value.id === propertyId)!;
    if (!ownerId) { state.phase = 'awaitingAction'; state.pendingAction = { type: 'buy', playerId: player.id, propertyId, amount: property.price }; return state; }
    if (ownerId === player.id) return advanceAfterLanding(state, player);
    const rent = property.rentSchedule[state.houses[propertyId] ?? 0];
    queuePayment(state, { id: randomUUID(), type: 'rent', playerId: player.id, recipientId: ownerId, amount: rent, propertyId, description: `${player.name} deve ${rent} de aluguel a ${state.players.find(candidate => candidate.id === ownerId)!.name} por ${property.name}.` });
    return state;
}

function resolveSpecialLanding(state: GameState, board: BoardDefinition, player: GamePlayer, space: Exclude<BoardSpace, { type: 'property' }>): GameState {
    if (space.type === 'goToJail') {
        player.position = board.spaces.findIndex(value => value.type === 'jail');
        player.jailed = true;
        player.jailAttempts = 0;
        return advanceAfterLanding(state, player, `${player.name} vai para a prisao.`);
    }
    if (space.type === 'holiday') player.skipTurns = 1;
    if (space.type === 'tax') {
        queuePayment(state, { id: randomUUID(), type: 'tax', playerId: player.id, recipientId: 'bank', amount: space.amount, description: `${player.name} deve ${space.amount} de imposto.` });
        return state;
    }
    if (space.type === 'bonus') applyTransaction(state, 'bonus', 'bank', player.id, space.amount, `${player.name} recebe bonus de ${space.amount}.`);
    if (space.type === 'holiday') recordEvent(state, 'holiday', player.id, `${player.name} vai perder a proxima vez.`, { restfulVisit: true });
    return advanceAfterLanding(state, player);
}

function resolveLanding(state: GameState, board: BoardDefinition, player: GamePlayer): GameState {
    const space = board.spaces[player.position];
    state.log.push(`${player.name} chega em ${space.name}.`);
    return space.type === 'property'
        ? resolvePropertyLanding(state, board, player, space.propertyId)
        : resolveSpecialLanding(state, board, player, space);
}

export function roll(state: GameState, board: BoardDefinition, actorId: string, dice: [number, number] = [randomInt(1, 7), randomInt(1, 7)]): GameState {
    if (state.status !== 'playing' || state.phase !== 'awaitingRoll' || state.currentPlayerId !== actorId) throw new Error('Nao e possivel rolar os dados agora.');
    if (dice.some(value => !Number.isInteger(value) || value < 1 || value > 6)) throw new Error('Dados invalidos.');
    const player = state.players.find(value => value.id === actorId)!;
    state.lastRoll = dice;
    const total = dice[0] + dice[1];
    recordEvent(state, 'roll', player.id, `${player.name} tira ${dice[0]} e ${dice[1]}.`, { dieOne: dice[0], dieTwo: dice[1], total });
    if (player.jailed) {
        if (dice[0] !== dice[1]) {
            player.jailAttempts = Math.min(player.jailAttempts + 1, 3);
            if (player.jailAttempts >= 3) {
                state.phase = 'awaitingAction';
                state.pendingAction = { type: 'bail', playerId: player.id, amount: player.currentJailFee };
                return state;
            }
            return nextPlayer(state, `${player.name} continua na prisao (${player.jailAttempts}/3 tentativas).`);
        }
        player.jailed = false; player.jailAttempts = 0; player.currentJailFee = board.jailFee;
        recordEvent(state, 'jailEscape', player.id, `${player.name} tira uma dupla, sai da prisao e encerra a vez.`);
        return nextPlayer(state, `A vez de ${state.players[(state.players.findIndex(value => value.id === player.id) + 1) % state.players.length].name}.`);
    }
    const previous = player.position;
    player.position = (player.position + total) % board.spaces.length;
    const crossings = Math.floor((previous + total) / board.spaces.length);
    if (crossings > 0) {
        const crossingCount = state.startCrossings[player.id] ?? 0;
        state.startCrossings[player.id] = crossingCount + crossings;
        player.loanAvailableThisCycle = true;
        const bonus = board.startBonus * crossings;
        if (bonus > 0) applyTransaction(state, 'bonus', 'bank', player.id, bonus, `${player.name} recebe ${bonus} ao cruzar Inicio.`, `start-bonus:${player.id}:${crossingCount + crossings}`);
        recordEvent(state, 'move', player.id, `${player.name} cruzou Inicio ${crossings} vez(es); elegibilidade para novo emprestimo restaurada.`, { startCrossings: crossings, crossingCount: crossingCount + crossings });
        const dueByLoan = state.loans.filter(loan => loan.borrowerId === player.id && loan.installmentsRemaining > 0).map(loan => ({ loan, remaining: loan.outstanding, installments: loan.installmentsRemaining }));
        for (let crossing = 1; crossing <= crossings; crossing++) {
            const crossingId = crossingCount + crossing;
            processFinancialCycle(state, board, player, crossingId);
            for (const due of dueByLoan) {
                if (due.installments <= 0 || due.remaining <= 0) continue;
                const amount = due.installments === 1 ? due.remaining : Math.min(due.loan.installmentAmount, due.remaining);
                queuePayment(state, { id: `start-installment:${player.id}:${crossingId}:${due.loan.id}`, type: 'loanInstallment', playerId: player.id, recipientId: due.loan.lenderId, amount, loanId: due.loan.id, description: `${player.name} deve parcela ${due.loan.installmentsTotal - due.installments + 1}/${due.loan.installmentsTotal} de ${amount} do emprestimo.` });
                due.remaining -= amount;
                due.installments--;
            }
        }
        if (state.pendingPayments.length) {
            state.pendingLandingPosition = player.position;
            return state;
        }
    }
    recordEvent(state, 'move', player.id, `${player.name} avanca ${total} casas.`, { from: previous, to: player.position, spaces: total, startCrossings: crossings });
    if (state.pendingPayments.length) return state;
    return resolveLanding(state, board, player);
}

export function buyProperty(state: GameState, actorId: string, accept: boolean): GameState {
    const action = state.pendingAction;
    if (state.phase !== 'awaitingAction' || action?.type !== 'buy' || action.playerId !== actorId || !action.propertyId) throw new Error('Nenhuma compra disponivel.');
    const player = state.players.find(value => value.id === actorId)!;
    if (accept) {
        if (state.propertyOwners[action.propertyId]) throw new Error('Este imovel ja pertence a outro jogador.');
        if (player.balance < action.amount) throw new Error('Saldo insuficiente para comprar.');
        const propertyName = action.propertyId;
        applyTransaction(state, 'purchase', actorId, 'bank', action.amount, `${player.name} compra ${propertyName} por ${action.amount}.`);
        state.propertyOwners[action.propertyId] = actorId;
    } else recordEvent(state, 'pass', actorId, `${player.name} nao compra o imovel.`);
    return advanceAfterLanding(state, player);
}

export function sendPropertyOffer(state: GameState, board: BoardDefinition, buyerId: string, propertyId: string, amount: number): GameState {
    if (state.status !== 'playing' || state.phase !== 'awaitingAction' || state.currentPlayerId !== buyerId || state.pendingAction || state.pendingLoan || state.pendingOffer) throw new Error('Resolva a acao atual antes de fazer uma oferta.');
    if (state.offersThisTurn >= 2) throw new Error('Voce ja enviou duas ofertas nesta vez.');
    const property = board.properties.find(candidate => candidate.id === propertyId);
    if (!property) throw new Error('Imovel nao encontrado.');
    const ownerId = state.propertyOwners[propertyId];
    const owner = state.players.find(player => player.id === ownerId && player.active);
    const buyer = state.players.find(player => player.id === buyerId && player.active);
    if (!owner || !buyer || owner.id === buyerId) throw new Error('Este imovel nao pertence a outro jogador ativo.');
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > buyer.balance) throw new Error('A oferta deve ser positiva e caber no seu saldo disponivel.');
    state.pendingOffer = { id: randomUUID(), propertyId, buyerId, ownerId, amount };
    state.offersThisTurn++;
    state.phase = 'awaitingPropertyResponse';
    recordEvent(state, 'propertyOffer', buyerId, `${buyer.name} oferece ${amount} por ${property.name}.`, { offerId: state.pendingOffer.id, propertyId, ownerId, amount, offersThisTurn: state.offersThisTurn });
    return state;
}

export function respondPropertyOffer(state: GameState, ownerId: string, accept: boolean, board: BoardDefinition): GameState {
    const offer = state.pendingOffer;
    if (state.status !== 'playing' || state.phase !== 'awaitingPropertyResponse' || !offer || offer.ownerId !== ownerId) throw new Error('Nao ha oferta de imovel para este jogador.');
    const property = board.properties.find(candidate => candidate.id === offer.propertyId);
    const buyer = state.players.find(player => player.id === offer.buyerId && player.active);
    if (!property || state.propertyOwners[offer.propertyId] !== ownerId || !buyer) throw new Error('A propriedade ou um dos jogadores nao esta mais disponivel.');
    if (!accept) {
        state.pendingOffer = null;
        state.phase = 'awaitingAction';
        recordEvent(state, 'propertyOffer', ownerId, `${state.players.find(player => player.id === ownerId)!.name} recusou a oferta por ${property.name}.`, { offerId: offer.id, propertyId: property.id, buyerId: buyer.id, amount: offer.amount, accepted: false });
        return state;
    }
    applyTransaction(state, 'propertyTransfer', buyer.id, ownerId, offer.amount, `${buyer.name} compra ${property.name} de ${state.players.find(player => player.id === ownerId)!.name} por ${offer.amount}.`, offer.id);
    state.propertyOwners[offer.propertyId] = buyer.id;
    state.pendingOffer = null;
    state.phase = 'awaitingAction';
    recordEvent(state, 'propertyTransfer', buyer.id, `${property.name} muda de proprietario.`, { propertyId: property.id, previousOwnerId: ownerId, ownerId: buyer.id, amount: offer.amount, houses: state.houses[property.id] ?? 0 });
    return state;
}

export function resolveRent(state: GameState, board: BoardDefinition, actorId: string, paymentId?: string): GameState {
    const action = state.pendingAction;
    const payment = state.pendingPayments[0];
    if (state.phase !== 'awaitingDebtResolution' || !action || !['rent', 'tax', 'loanInstallment'].includes(action.type) || action.playerId !== actorId || !payment || payment.playerId !== actorId || action.paymentId !== payment.id || (paymentId !== undefined && payment.id !== paymentId)) throw new Error('Nenhum pagamento pendente.');
    const player = state.players.find(value => value.id === actorId)!;
    if (player.balance < payment.amount) throw new Error('Saldo insuficiente. Solicite um emprestimo ou liquide um ativo antes de pagar.');
    const installmentLoan = payment.type === 'loanInstallment' && payment.loanId ? state.loans.find(candidate => candidate.id === payment.loanId) : undefined;
    if (payment.type === 'loanInstallment' && (!installmentLoan || installmentLoan.installmentsRemaining <= 0)) throw new Error('Este emprestimo nao possui parcelas pendentes.');
    const transactionType = payment.type === 'loanInstallment' ? 'repayment' : payment.type;
    if (!applyTransaction(state, transactionType, actorId, payment.recipientId, payment.amount, `${player.name} confirma e paga ${payment.amount}.`, payment.id)) throw new Error('Este pagamento ja foi processado.');
    if (installmentLoan) {
        installmentLoan.installmentsRemaining--;
        installmentLoan.outstanding = Math.max(0, installmentLoan.outstanding - payment.amount);
        recordEvent(state, 'repayment', actorId, `Parcela processada. Restam ${installmentLoan.installmentsRemaining} parcela(s).`, { loanId: installmentLoan.id, installmentsRemaining: installmentLoan.installmentsRemaining, outstanding: installmentLoan.outstanding, paymentId: payment.id });
    }
    state.pendingPayments.shift();
    state.pendingAction = null;
    return queueNextPayment(state, board);
}

export function payBail(state: GameState, board: BoardDefinition, actorId: string): GameState {
    const player = state.players.find(value => value.id === actorId);
    if (state.phase !== 'awaitingAction' || state.pendingAction?.type !== 'bail' || state.pendingAction.playerId !== actorId || !player?.jailed || player.jailAttempts < 3) throw new Error('A fianca fica disponivel apos 3 tentativas sem dupla.');
    if (player.balance < player.currentJailFee) throw new Error('Saldo insuficiente para pagar a fianca.');
    applyTransaction(state, 'bail', actorId, 'bank', player.currentJailFee, `${player.name} paga ${player.currentJailFee} de fianca.`);
    player.jailed = false; player.jailAttempts = 0; player.currentJailFee = board.jailFee;
    recordEvent(state, 'jailEscape', actorId, `${player.name} paga a fianca e sai da prisao.`);
    return nextPlayer(state, `${player.name} saiu da prisao.`);
}

export function declineBail(state: GameState, board: BoardDefinition, actorId: string): GameState {
    if (state.phase !== 'awaitingAction' || state.pendingAction?.type !== 'bail' || state.pendingAction.playerId !== actorId) throw new Error('Nenhuma fianca pendente.');
    const player = state.players.find(value => value.id === actorId)!;
    player.currentJailFee = Math.round(player.currentJailFee * (1 + board.developmentRules.jailFeeIncreaseRate));
    recordEvent(state, 'jail', actorId, `${player.name} recusa a fianca; o valor aumenta para ${player.currentJailFee}.`, { nextFee: player.currentJailFee });
    return nextPlayer(state, `${player.name} permanece na prisao.`);
}

export function takeBankLoan(state: GameState, board: BoardDefinition, actorId: string, requestedAmount?: number, installments = 1): GameState {
    const action = state.pendingAction;
    const paymentActionPending = action && ['rent', 'tax', 'loanInstallment'].includes(action.type) && action.playerId === actorId && state.phase === 'awaitingDebtResolution';
    const pendingFinancing = action && (action.type === 'buy' ? action.playerId === actorId && state.phase === 'awaitingAction' : paymentActionPending);
    const voluntaryFinancing = !action && state.phase === 'awaitingAction' && state.currentPlayerId === actorId;
    if (!pendingFinancing && !voluntaryFinancing) throw new Error('Nenhuma acao pendente para financiar.');
    const borrower = state.players.find(player => player.id === actorId)!;
    const shortfall = pendingFinancing ? Math.max(0, action.amount - borrower.balance) : 0;
    const principal = requestedAmount ?? shortfall;
    if (!Number.isSafeInteger(principal) || principal! <= 0 || principal! < shortfall) throw new Error('O principal deve cobrir o valor pendente e ser positivo.');
    ensureLoanEligible(state, board, borrower);
    const interestRate = calculateBankInterestRate(board, installments);
    const terms = calculateLoanTerms(principal!, interestRate, installments);
    applyTransaction(state, 'loan', 'bank', actorId, principal!, `${borrower.name} recebe emprestimo bancario de ${principal!}.`);
    const loan = makeLoan(state, board, borrower, 'bank', principal!, interestRate, installments);
    recordEvent(state, 'loan', actorId, `Emprestimo bancario: taxa ${(interestRate * 100).toFixed(1)}% em ${installments} parcela(s) de ate ${terms.installmentAmount}; total ${terms.totalRepayment}.`, { loanId: loan.id, principal: principal!, interestRate, installments, installmentAmount: terms.installmentAmount, totalRepayment: terms.totalRepayment });
    return state;
}

export function requestPlayerLoan(state: GameState, board: BoardDefinition, borrowerId: string, lenderId: string, requestedPrincipal?: number, installments = 1, requestedInterestRate = board.bankInterestRate): GameState {
    const action = state.pendingAction;
    const paymentActionPending = action && ['rent', 'tax', 'loanInstallment'].includes(action.type) && action.playerId === borrowerId && state.phase === 'awaitingDebtResolution';
    const pendingFinancing = action && (action.type === 'buy' ? action.playerId === borrowerId && state.phase === 'awaitingAction' : paymentActionPending);
    const voluntaryFinancing = !action && state.phase === 'awaitingAction' && state.currentPlayerId === borrowerId;
    if (!pendingFinancing && !voluntaryFinancing) throw new Error('Nenhuma acao pendente para financiar.');
    if (borrowerId === lenderId || !state.players.some(player => player.id === lenderId && player.active)) throw new Error('Escolha outro jogador ativo como credor.');
    const borrower = state.players.find(player => player.id === borrowerId)!;
    const shortfall = pendingFinancing ? Math.max(0, action.amount - borrower.balance) : 0;
    const requestedAmount = requestedPrincipal ?? shortfall;
    if (!Number.isSafeInteger(requestedAmount) || requestedAmount! <= 0 || requestedAmount! < shortfall) throw new Error('O principal deve cobrir o valor pendente e ser positivo.');
    if (!Number.isSafeInteger(installments) || installments < 1 || installments > board.loanRules.maxInstallments) throw new Error(`O maximo e ${board.loanRules.maxInstallments} parcelas.`);
    if (!Number.isFinite(requestedInterestRate) || requestedInterestRate < 0 || requestedInterestRate > 1) throw new Error('Taxa de juros invalida.');
    ensureLoanEligible(state, board, borrower);
    state.pendingLoan = { id: randomUUID(), lenderId, borrowerId, requestedAmount: requestedAmount!, installmentsTotal: installments, requestedInterestRate, principal: null, interestRate: null, status: 'requested' };
    state.phase = 'awaitingLoanResponse';
    state.log.push(`${borrower.name} pede um emprestimo a ${state.players.find(player => player.id === lenderId)!.name}.`);
    return state;
}

export function cancelPlayerLoanRequest(state: GameState, borrowerId: string): GameState {
    const proposal = state.pendingLoan;
    if (state.phase !== 'awaitingLoanResponse' || !proposal || proposal.borrowerId !== borrowerId) throw new Error('Nao ha pedido de emprestimo seu para cancelar.');
    state.pendingLoan = null;
    state.phase = state.pendingAction && ['rent', 'tax', 'loanInstallment'].includes(state.pendingAction.type) ? 'awaitingDebtResolution' : 'awaitingAction';
    recordEvent(state, 'loan', borrowerId, `${state.players.find(player => player.id === borrowerId)!.name} cancelou o pedido de emprestimo.`, { requestId: proposal.id });
    return state;
}

export function respondPlayerLoan(state: GameState, lenderId: string, accept: boolean, principal?: number, interestRate?: number): GameState {
    const proposal = state.pendingLoan;
    if (state.phase !== 'awaitingLoanResponse' || !proposal || proposal.lenderId !== lenderId) throw new Error('Nenhum pedido de emprestimo aguarda este jogador.');
    if (!state.players.some(player => player.id === lenderId && player.active)) throw new Error('O credor nao esta mais ativo na partida.');
    if (!accept) {
        state.pendingLoan = null; state.phase = state.pendingAction && ['rent', 'tax', 'loanInstallment'].includes(state.pendingAction.type) ? 'awaitingDebtResolution' : 'awaitingAction';
        recordEvent(state, 'loan', lenderId, `${state.players.find(player => player.id === lenderId)!.name} recusou o emprestimo.`);
        return state;
    }
    if (proposal.status !== 'requested') throw new Error('Esta oferta ja foi enviada.');
    if (!Number.isSafeInteger(principal) || principal! < proposal.requestedAmount || principal! <= 0) throw new Error('O valor deve cobrir o saldo pendente.');
    const offeredRate = interestRate ?? proposal.requestedInterestRate;
    if (!Number.isFinite(offeredRate) || offeredRate < 0 || offeredRate > 1) throw new Error('A taxa deve estar entre 0% e 100%.');
    const lender = state.players.find(player => player.id === lenderId)!;
    if (lender.balance < principal!) throw new Error('O credor nao tem saldo suficiente.');
    proposal.principal = principal!;
    proposal.interestRate = offeredRate;
    proposal.status = 'offered';
    const terms = calculateLoanTerms(principal!, offeredRate, proposal.installmentsTotal);
    recordEvent(state, 'loan', lenderId, `${lender.name} oferece emprestimo de ${principal} a ${offeredRate * 100}% em ${proposal.installmentsTotal} parcela(s).`, { principal: principal!, interestRate: offeredRate, installments: proposal.installmentsTotal, installmentAmount: terms.installmentAmount, totalRepayment: terms.totalRepayment });
    return state;
}

export function acceptPlayerLoan(state: GameState, board: BoardDefinition, borrowerId: string, accept: boolean): GameState {
    const proposal = state.pendingLoan;
    if (state.phase !== 'awaitingLoanResponse' || !proposal || proposal.borrowerId !== borrowerId || proposal.status !== 'offered' || proposal.principal === null || proposal.interestRate === null) throw new Error('Nenhuma oferta aguarda este jogador.');
    if (!accept) {
        state.pendingLoan = null; state.phase = state.pendingAction && ['rent', 'tax', 'loanInstallment'].includes(state.pendingAction.type) ? 'awaitingDebtResolution' : 'awaitingAction';
        recordEvent(state, 'loan', borrowerId, `${state.players.find(player => player.id === borrowerId)!.name} recusou a oferta.`);
        return state;
    }
    const lender = state.players.find(player => player.id === proposal.lenderId)!;
    const borrower = state.players.find(player => player.id === borrowerId)!;
    if (lender.balance < proposal.principal) throw new Error('O credor nao tem mais saldo suficiente.');
    ensureLoanEligible(state, board, borrower);
    if (proposal.installmentsTotal > board.loanRules.maxInstallments) throw new Error(`O maximo e ${board.loanRules.maxInstallments} parcelas.`);
    const terms = calculateLoanTerms(proposal.principal, proposal.interestRate, proposal.installmentsTotal);
    applyTransaction(state, 'loan', lender.id, borrowerId, proposal.principal, `${lender.name} empresta ${proposal.principal} a ${borrower.name}.`, proposal.id);
    makeLoan(state, board, borrower, lender.id, proposal.principal, proposal.interestRate, proposal.installmentsTotal, proposal.id);
    state.pendingLoan = null;
    state.phase = state.pendingAction && ['rent', 'tax', 'loanInstallment'].includes(state.pendingAction.type) ? 'awaitingDebtResolution' : 'awaitingAction';
    recordEvent(state, 'loan', borrowerId, `${borrower.name} aceitou o emprestimo de ${lender.name}.`, { lenderId: lender.id, principal: proposal.principal, interestRate: proposal.interestRate, installments: proposal.installmentsTotal, installmentAmount: terms.installmentAmount, totalRepayment: terms.totalRepayment });
    return state;
}

function ownedColorGroup(board: BoardDefinition, property: PropertyDefinition) {
    return board.properties.filter(candidate => candidate.color === property.color);
}

export function buildProperty(state: GameState, board: BoardDefinition, actorId: string, propertyId: string, building: 'house' | 'hotel'): GameState {
    if (state.status !== 'playing' || state.phase !== 'awaitingAction' || state.currentPlayerId !== actorId) throw new Error('Role os dados antes de construir.');
    if (state.builtThisTurn) throw new Error('Voce ja construiu nesta vez.');
    if (state.propertyOwners[propertyId] !== actorId) throw new Error('Voce nao e o proprietario deste imovel.');
    const property = board.properties.find(candidate => candidate.id === propertyId);
    if (!property) throw new Error('Imovel invalido.');
    const propertySpace = board.spaces.findIndex(space => space.type === 'property' && space.propertyId === propertyId);
    if (propertySpace < 0 || state.players.find(player => player.id === actorId)!.position !== propertySpace) throw new Error('Voce precisa estar neste imovel para construir.');
    const currentLevel = state.houses[propertyId] ?? 0;
    const group = ownedColorGroup(board, property);
    if (board.developmentRules.requireCompleteColorGroup && group.some(candidate => state.propertyOwners[candidate.id] !== actorId)) throw new Error('Compre todo o grupo de cor antes de construir.');
    if (building === 'house') {
        if (currentLevel >= board.developmentRules.maxHousesPerProperty) throw new Error('Este imovel ja atingiu o limite de casas.');
        if (board.developmentRules.requireEvenBuilding) {
            const groupLevels = group.map(candidate => state.houses[candidate.id] ?? 0);
            if (currentLevel > Math.min(...groupLevels)) throw new Error('Construa as casas por igual em todo o grupo.');
        }
    } else {
        if (board.developmentRules.hotelRequiresMaxHouses && currentLevel !== board.developmentRules.maxHousesPerProperty) throw new Error('Construa o numero maximo de casas antes do hotel.');
        if (!board.developmentRules.hotelRequiresMaxHouses && currentLevel > board.developmentRules.maxHousesPerProperty) throw new Error('Este imovel ja possui um hotel.');
        if (board.developmentRules.requireEvenBuilding && board.developmentRules.hotelRequiresMaxHouses && group.some(candidate => (state.houses[candidate.id] ?? 0) < board.developmentRules.maxHousesPerProperty)) throw new Error('Complete as casas igualmente em todo o grupo antes de construir um hotel.');
        if (group.some(candidate => candidate.id !== propertyId && (state.houses[candidate.id] ?? 0) > board.developmentRules.maxHousesPerProperty)) throw new Error('O grupo ja possui um hotel.');
    }
    const cost = building === 'house' ? property.houseCost : property.hotelCost;
    applyTransaction(state, 'build', actorId, 'bank', cost, `${state.players.find(player => player.id === actorId)!.name} constroi ${building === 'house' ? 'uma casa' : 'um hotel'} em ${property.name}.`);
    state.houses[propertyId] = building === 'house' ? currentLevel + 1 : board.developmentRules.maxHousesPerProperty + 1;
    state.builtThisTurn = true;
    return state;
}

export function sellBuilding(state: GameState, board: BoardDefinition, actorId: string, propertyId: string): GameState {
    if (state.status !== 'playing' || state.currentPlayerId !== actorId || !['awaitingAction', 'awaitingDebtResolution'].includes(state.phase)) throw new Error('Venda edificios durante sua vez apos rolar os dados.');
    if (state.propertyOwners[propertyId] !== actorId) throw new Error('Voce nao e o proprietario deste imovel.');
    const property = board.properties.find(candidate => candidate.id === propertyId);
    if (!property) throw new Error('Imovel invalido.');
    const level = state.houses[propertyId] ?? 0;
    if (level <= 0) throw new Error('Este imovel nao tem edificios para vender.');
    const maxHouses = board.developmentRules.maxHousesPerProperty;
    const isHotel = level > maxHouses;
    if (!isHotel && board.developmentRules.requireEvenBuilding) {
        const group = ownedColorGroup(board, property);
        if (level < Math.max(...group.map(candidate => state.houses[candidate.id] ?? 0))) throw new Error('Venda primeiro os edificios dos outros imoveis do grupo.');
    }
    const originalCost = isHotel ? property.hotelCost : property.houseCost;
    const proceeds = Math.floor(originalCost / 2);
    applyTransaction(state, 'sale', 'bank', actorId, proceeds, `${state.players.find(player => player.id === actorId)!.name} vende ${isHotel ? 'um hotel' : 'uma casa'} de ${property.name} por ${proceeds}.`);
    state.houses[propertyId] = isHotel ? maxHouses : level - 1;
    return state;
}

export function sellProperty(state: GameState, board: BoardDefinition, actorId: string, propertyId: string): GameState {
    if (state.status !== 'playing' || state.currentPlayerId !== actorId || !['awaitingAction', 'awaitingDebtResolution'].includes(state.phase)) throw new Error('Role os dados antes de vender um imovel.');
    if (state.propertyOwners[propertyId] !== actorId) throw new Error('Voce nao e o proprietario deste imovel.');
    const property = board.properties.find(candidate => candidate.id === propertyId);
    if (!property) throw new Error('Imovel invalido.');
    if ((state.houses[propertyId] ?? 0) > 0) throw new Error('Venda os edificios deste imovel antes de vende-lo ao banco.');
    const price = Math.floor(property.price / 2);
    applyTransaction(state, 'sale', 'bank', actorId, price, `${state.players.find(player => player.id === actorId)!.name} vende ${property.name} ao banco por ${price}.`);
    delete state.propertyOwners[propertyId];
    delete state.houses[propertyId];
    return state;
}

export function repayLoan(state: GameState, actorId: string, loanId: string): GameState {
    if (state.status !== 'playing' || state.currentPlayerId !== actorId || state.phase !== 'awaitingAction') throw new Error('Role os dados antes de quitar emprestimos.');
    const index = state.loans.findIndex(loan => loan.id === loanId && loan.borrowerId === actorId);
    if (index < 0) throw new Error('Emprestimo nao encontrado para este jogador.');
    const loan = state.loans[index];
    const player = state.players.find(candidate => candidate.id === actorId)!;
    if (player.balance < loan.outstanding) throw new Error('Saldo insuficiente para quitar o emprestimo.');
    applyTransaction(state, 'repayment', actorId, loan.lenderId, loan.outstanding, `${player.name} quita emprestimo de ${loan.outstanding}.`, `repay:${loan.id}`);
    state.loans.splice(index, 1);
    return state;
}

export function declareBankruptcy(state: GameState, board: BoardDefinition, actorId: string): GameState {
    const action = state.pendingAction;
    if (state.status !== 'playing' || state.phase !== 'awaitingDebtResolution' || !action || !['rent', 'tax', 'loanInstallment'].includes(action.type) || action.playerId !== actorId || state.currentPlayerId !== actorId) throw new Error('Nao ha divida obrigatoria para declarar falencia.');
    const player = state.players.find(candidate => candidate.id === actorId)!;
    if (player.balance >= action.amount) throw new Error('Voce ainda pode pagar esta divida.');
    const pendingPayment = state.pendingPayments[0];
    const paymentRecipient = action.ownerId ?? pendingPayment?.recipientId;
    const creditor = paymentRecipient && paymentRecipient !== 'bank' && state.players.some(candidate => candidate.id === paymentRecipient && candidate.active) ? paymentRecipient : 'bank';
    if (player.balance > 0) applyTransaction(state, 'rent', actorId, creditor, player.balance, `${player.name} entrega seu saldo de ${player.balance} ao credor na falencia.`);
    for (const [propertyId, ownerId] of Object.entries(state.propertyOwners)) {
        if (ownerId !== actorId) continue;
        if (creditor !== 'bank') {
            state.propertyOwners[propertyId] = creditor;
            recordEvent(state, 'bankruptcy', actorId, `${board.properties.find(property => property.id === propertyId)?.name ?? propertyId} e transferido ao credor.`, { propertyId, creditorId: creditor });
            const property = board.properties.find(candidate => candidate.id === propertyId);
            if (property) {
                for (const groupProperty of board.properties.filter(candidate => candidate.color === property.color && state.propertyOwners[candidate.id] === creditor)) {
                    if ((state.houses[groupProperty.id] ?? 0) > 0) recordEvent(state, 'bankruptcy', actorId, `Edificios de ${groupProperty.name} demolidos sem compensacao.`, { propertyId: groupProperty.id, creditorId: creditor });
                    delete state.houses[groupProperty.id];
                }
            }
        } else {
            delete state.propertyOwners[propertyId];
            recordEvent(state, 'bankruptcy', actorId, `${board.properties.find(property => property.id === propertyId)?.name ?? propertyId} retorna ao banco.`, { propertyId });
        }
        delete state.houses[propertyId];
    }
    state.loans = state.loans.flatMap(loan => {
        if (loan.borrowerId === actorId) {
            recordEvent(state, 'bankruptcy', actorId, `Emprestimo de ${loan.outstanding} e baixado na falencia.`);
            return [];
        }
        if (loan.lenderId === actorId) return [{ ...loan, lenderId: 'bank', type: 'bank' as const }];
        return [loan];
    });
    player.balance = 0;
    player.active = false;
    player.jailed = false;
    player.skipTurns = 0;
    state.pendingAction = null;
    state.pendingLoan = null;
    state.pendingPayments = [];
    state.pendingLandingPosition = null;
    recordEvent(state, 'bankruptcy', actorId, `${player.name} declara falencia. Propriedades transferidas ao credor; edificios demolidos e dividas pessoais baixadas.`, { creditorId: creditor });
    return nextPlayer(state, `${player.name} deixa a partida.`);
}