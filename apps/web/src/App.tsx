import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Banknote, Check, Copy, Crown, Dice5, DoorOpen, Eye, EyeOff, HandCoins, House, LoaderCircle, LockKeyhole, LogOut, Map, Play, Plus, Users, Wallet, Wifi, WifiOff, X } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { BoardScene } from './BoardScene';
import { AccountTab } from './AccountTab';
import { translate, translateGameEvent, translateServerError, translateTransaction, type Locale, type TranslationKey } from './i18n';

type PropertyDefinition = { id: string; name: string; nameTranslations?: Partial<Record<Locale, string>>; image: string; color: string; group: string; price: number; rent: number; houseCost: number; hotelCost: number; rentSchedule: number[] };
type BoardSpace = { id: string; name: string; nameTranslations?: Partial<Record<Locale, string>>; type: string; propertyId?: string; amount?: number };
type Board = { id: string; name: string; nameTranslations?: Partial<Record<Locale, string>>; description: string; descriptionTranslations?: Partial<Record<Locale, string>>; currency: string; startingBalance: number; startBonus: number; jailFee: number; bankInterestRate: number; loanRules: { maxActiveLoans: number; maxInstallments: number }; developmentRules: { maxHousesPerProperty: number; requireCompleteColorGroup: boolean; requireEvenBuilding: boolean; hotelRequiresMaxHouses: boolean; rentMultipliers: number[]; jailFeeIncreaseRate: number; maxBuildsPerTurn: number }; spaces: BoardSpace[]; properties: PropertyDefinition[] };
type PlayerGameState = { id: string; name: string; color: string; position: number; balance: number; jailed: boolean; jailAttempts: number; currentJailFee: number; skipTurns: number; active: boolean; loanAvailableThisCycle: boolean };
type Loan = { id: string; type: string; lenderId: string; borrowerId: string; principal: number; interestRate: number; installmentsTotal: number; installmentsRemaining: number; installmentAmount: number; outstanding: number };
type Payment = { id: string; type: 'rent' | 'tax' | 'loanInstallment'; playerId: string; recipientId: string; amount: number; description: string; propertyId?: string; loanId?: string };
type Game = { boardId: string; status: 'playing' | 'finished'; winnerId: string | null; players: PlayerGameState[]; currentPlayerId: string; phase: string; propertyOwners: Record<string, string>; houses: Record<string, number>; loans: Loan[]; pendingAction: { type: string; playerId: string; propertyId?: string; amount: number; ownerId?: string; paymentId?: string; loanId?: string } | null; pendingLoan: { id: string; lenderId: string; borrowerId: string; requestedAmount: number; installmentsTotal: number; requestedInterestRate: number; principal: number | null; interestRate: number | null; status: string } | null; pendingOffer: { id: string; propertyId: string; buyerId: string; ownerId: string; amount: number } | null; pendingPayments: Payment[]; pendingLandingPosition: number | null; offersThisTurn: number; builtThisTurn: boolean; startCrossings: Record<string, number>; lastRoll: [number, number] | null; log: string[]; events: { id: string; sequence: number; type: string; playerId: string | null; message: string; details: Record<string, string | number | boolean | null> }[]; transactions: { id: string; type: string; from: string; to: string; amount: number; description: string }[] };
type Room = { code: string; status: 'waiting' | 'started'; ownerId: string; players: { id: string; name: string; online: boolean; color: string }[]; game: Game | null };
type Session = { token: string; playerId: string; room: Room };
type Reply = { ok: boolean; room?: Room; error?: string };
type Screen = 'home' | 'create' | 'join' | 'room';
const storageKey = 'finance-gameinator.session';
const languageStorageKey = 'finance-gameinator.language';
const tokenColors = ['#e98570', '#547c9b', '#76955f', '#bb925b', '#9275a3', '#4caaa1', '#d16c94', '#5b6676'];

function localizedName(value: { name: string; nameTranslations?: Partial<Record<Locale, string>> }, locale: Locale) {
    return value.nameTranslations?.[locale] ?? value.name;
}

function localizedDescription(value: { description: string; descriptionTranslations?: Partial<Record<Locale, string>> }, locale: Locale) {
    return value.descriptionTranslations?.[locale] ?? value.description;
}

function storedSession(): Session | null {
    try {
        const value = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
        return value && typeof value.token === 'string' && typeof value.playerId === 'string' && typeof value.room?.code === 'string' ? value : null;
    } catch { return null; }
}

function screenForPath(): Screen {
    if (location.pathname === '/create') return 'create';
    if (location.pathname === '/join') return 'join';
    if (location.pathname.startsWith('/room/')) return 'room';
    return 'home';
}

export function App() {
    const [locale, setLocale] = useState<Locale>(() => localStorage.getItem(languageStorageKey) === 'en' ? 'en' : 'pt-BR');
    const [session, setSession] = useState<Session | null>(storedSession);
    const [screen, setScreen] = useState<Screen>(() => storedSession() ? 'room' : screenForPath() === 'room' ? 'join' : screenForPath());
    const [room, setRoom] = useState<Room | null>(() => storedSession()?.room ?? null);
    const [connection, setConnection] = useState<'connecting' | 'online' | 'offline'>('connecting');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [name, setName] = useState(() => localStorage.getItem('finance-gameinator.name') ?? '');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState(() => location.pathname.startsWith('/room/') ? location.pathname.split('/')[2] ?? '' : '');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [gameTab, setGameTab] = useState<'board' | 'account' | 'properties'>('board');
    const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
    const [loanPrincipal, setLoanPrincipal] = useState('');
    const [loanRate, setLoanRate] = useState('10');
    const [loanLender, setLoanLender] = useState('');
    const [voluntaryLoanAmount, setVoluntaryLoanAmount] = useState('50000');
    const [loanInstallments, setLoanInstallments] = useState('6');
    const [loanTerms, setLoanTerms] = useState<{ principal: number; interestRate: number; installmentsTotal: number; installmentAmount: number; totalRepayment: number } | null>(null);
    const [offerTerms, setOfferTerms] = useState<{ principal: number; interestRate: number; installmentsTotal: number; installmentAmount: number; totalRepayment: number } | null>(null);
    const [requestTerms, setRequestTerms] = useState<{ principal: number; interestRate: number; installmentsTotal: number; installmentAmount: number; totalRepayment: number } | null>(null);
    const [termsLoading, setTermsLoading] = useState(false);
    const [inspectedPropertyId, setInspectedPropertyId] = useState<string | null>(null);
    const [propertyOfferAmount, setPropertyOfferAmount] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const t = (key: TranslationKey, values: Record<string, string | number | boolean> = {}) => translate(locale, key, values);

    useEffect(() => { localStorage.setItem(languageStorageKey, locale); document.documentElement.lang = locale; }, [locale]);

    useEffect(() => {
        const loadBoards = async () => {
            try {
                const summaries = await (await fetch('/api/boards')).json() as { id: string }[];
                const configurations = await Promise.all(summaries.map(async summary => await (await fetch(`/api/boards/${encodeURIComponent(summary.id)}`)).json() as Board));
                setBoards(configurations);
                setSelectedBoardId(current => current || configurations[0]?.id || '');
            } catch { setError(translate(locale, 'error.request')); }
        };
        void loadBoards();
    }, []);

    const navigate = (next: Screen, roomCode?: string) => {
        history.pushState(null, '', next === 'home' ? '/' : next === 'room' ? `/room/${roomCode}` : `/${next}`);
        setScreen(next);
        setError('');
        setPassword('');
    };

    useEffect(() => {
        const pop = () => { setScreen(session ? 'room' : screenForPath() === 'room' ? 'join' : screenForPath()); setError(''); };
        window.addEventListener('popstate', pop);
        return () => window.removeEventListener('popstate', pop);
    }, [session]);

    useEffect(() => {
        if (!session) return;
        history.replaceState(null, '', `/room/${session.room.code}`);
        setConnection('connecting');
        const socket = io({ auth: { code: session.room.code, token: session.token }, reconnectionDelay: 700, reconnectionDelayMax: 4000 });
        socketRef.current = socket;
        const clearSession = (message: string) => {
            sessionStorage.removeItem(storageKey);
            setSession(null); setRoom(null); setBusy(false); setConfirmLeave(false);
            history.replaceState(null, '', '/'); setScreen('home'); setError(translateServerError(locale, message));
        };
        socket.on('connect', () => { setConnection('online'); setError(''); });
        socket.on('disconnect', () => setConnection('offline'));
        socket.on('connect_error', () => setConnection('offline'));
        socket.io.on('reconnect_attempt', () => setConnection('connecting'));
        socket.on('room:update', (next: Room) => { setRoom(next); sessionStorage.setItem(storageKey, JSON.stringify({ ...session, room: next })); });
        socket.on('session:error', (message: string) => clearSession(message));
        socket.on('room:closed', () => clearSession('O anfitriao encerrou a sala.'));
        socket.on('session:left', () => clearSession(''));
        return () => { socket.disconnect(); socketRef.current = null; };
    }, [session]);

    useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true); setError('');
        try {
            const response = await fetch(screen === 'create' ? '/api/rooms' : '/api/rooms/join', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, code }), signal: AbortSignal.timeout(10_000),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message ?? 'Nao foi possivel entrar na sala.');
            sessionStorage.setItem(storageKey, JSON.stringify(result));
            localStorage.setItem('finance-gameinator.name', name.trim());
            setSession(result); setRoom(result.room); navigate('room', result.room.code);
        } catch (failure) {
            setError(failure instanceof Error && failure.name !== 'TimeoutError' && failure.name !== 'TypeError' ? translateServerError(locale, failure.message) : t('error.server'));
        } finally { setBusy(false); }
    };

    const start = async () => {
        if (!socketRef.current?.connected) return;
        setBusy(true); setError('');
        try {
            const result = await socketRef.current.timeout(5000).emitWithAck('room:start', { boardId: selectedBoardId }) as Reply;
            if (!result.ok) setError(translateServerError(locale, result.error ?? translate(locale, 'error.request')));
        } catch { setError(translate(locale, 'error.request')); }
        finally { setBusy(false); }
    };

    const gameAction = async (event: string, payload: Record<string, unknown> = {}) => {
        const socket = socketRef.current;
        if (!socket?.connected) { setError(translate(locale, 'error.reconnect')); return; }
        setBusy(true); setError('');
        try {
            const result = await socket.timeout(5000).emitWithAck(event, payload) as Reply;
            if (!result.ok) setError(translateServerError(locale, result.error ?? translate(locale, 'error.action')));
        } catch { setError(translate(locale, 'error.request')); }
        finally { setBusy(false); }
    };

    const confirmGameAction = (promptKey: TranslationKey, event: string, payload: Record<string, unknown>) => {
        if (window.confirm(t(promptKey))) void gameAction(event, payload);
    };

    const selectColor = async (color: string) => {
        const socket = socketRef.current;
        if (!socket?.connected) { setError(translate(locale, 'error.reconnect')); return; }
        const result = await socket.timeout(5000).emitWithAck('room:color', { color }) as Reply;
        if (!result.ok) setError(translateServerError(locale, result.error ?? translate(locale, 'error.action')));
    };

    const leave = async () => {
        if (room?.status === 'started' && !isOwner) { setError(t('leave.activeText')); setConfirmLeave(false); return; }
        const socket = socketRef.current;
        if (!socket?.connected) { setError(t('error.reconnect')); setConfirmLeave(false); return; }
        setBusy(true);
        try {
            const result = await socket.timeout(5000).emitWithAck('room:leave', {}) as Reply;
            if (!result.ok) setError(translateServerError(locale, result.error ?? t('error.request')));
        } catch {
            if (socket.connected) setError(t('error.request'));
        } finally { setBusy(false); setConfirmLeave(false); }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(room!.code);
            setCopied(true);
            if (copiedTimer.current) clearTimeout(copiedTimer.current);
            copiedTimer.current = setTimeout(() => setCopied(false), 2000);
        } catch { setError(`${t('error.copyCode')} ${room!.code}`); }
    };

    const isOwner = room?.ownerId === session?.playerId;
    const online = room?.players.filter(player => player.online).length ?? 0;
    const canStart = room && isOwner && connection === 'online' && room.players.length >= 2 && room.players.every(player => player.online) && room.status === 'waiting';
    const game = room?.game ?? null;
    const board = boards.find(candidate => candidate.id === game?.boardId);
    const boardTitle = board ? localizedName(board, locale) : '';
    const me = game?.players.find(player => player.id === session?.playerId);
    const currentPlayer = game?.players.find(player => player.id === game.currentPlayerId);
    const ownedProperties = game && board ? board.properties.filter(property => game.propertyOwners[property.id] === session?.playerId) : [];
    const money = (amount: number) => `${board?.currency ?? 'R$'} ${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR').format(amount)}`;
    const inspectedProperty = board?.properties.find(property => property.id === inspectedPropertyId);
    const canBuild = game?.status === 'playing' && game.currentPlayerId === session?.playerId && game.phase === 'awaitingAction' && !game.builtThisTurn;
    const canSell = game?.status === 'playing' && game.currentPlayerId === session?.playerId && ['awaitingAction', 'awaitingDebtResolution'].includes(game.phase);
    const canFinishTurn = game?.status === 'playing' && game.currentPlayerId === session?.playerId && game.phase === 'awaitingAction' && !game.pendingAction && !game.pendingLoan && !game.pendingOffer;
    const canSendPropertyOffer = game?.status === 'playing' && game.currentPlayerId === session?.playerId && game.phase === 'awaitingAction' && !game.pendingAction && !game.pendingLoan && !game.pendingOffer && game.offersThisTurn < 2;
    const activeLoans = game?.loans.filter(loan => loan.borrowerId === session?.playerId && loan.installmentsRemaining > 0) ?? [];
    const canRequestLoan = Boolean(game && me && game.currentPlayerId === session?.playerId && ['awaitingAction', 'awaitingDebtResolution'].includes(game.phase) && !game.pendingLoan && !game.pendingOffer && me.loanAvailableThisCycle && activeLoans.length < (board?.loanRules.maxActiveLoans ?? 3));
    const pendingPayment = game?.pendingPayments[0] ?? null;
    const paymentLoan = pendingPayment?.loanId ? game?.loans.find(loan => loan.id === pendingPayment.loanId) : undefined;
    const paymentRecipientName = pendingPayment?.recipientId === 'bank' ? t('property.bank') : game?.players.find(player => player.id === pendingPayment?.recipientId)?.name ?? '';
    const paymentCard = game && pendingPayment && pendingPayment.playerId === session?.playerId && me ? <section className="action-card payment-card"><div className="eyebrow">{pendingPayment.type === 'loanInstallment' ? t('payment.installment') : t('payment.pending')}</div><h2>{money(pendingPayment.amount)}</h2><p>{pendingPayment.type === 'rent' ? t('payment.rentTo', { player: paymentRecipientName }) : pendingPayment.type === 'tax' ? t('payment.bankTax') : t('payment.installmentDetails', { number: paymentLoan ? paymentLoan.installmentsTotal - paymentLoan.installmentsRemaining + 1 : 1, total: paymentLoan?.installmentsTotal ?? 1, balance: money(paymentLoan?.outstanding ?? 0) })}</p>{me.balance >= pendingPayment.amount ? confirmPaymentId === pendingPayment.id ? <div className="payment-confirm"><p>{t('payment.confirmPrompt', { amount: money(pendingPayment.amount) })}</p><div className="action-buttons"><button className="button primary" disabled={busy || game.phase !== 'awaitingDebtResolution'} onClick={() => { void gameAction('game:pay', { paymentId: pendingPayment.id }); setConfirmPaymentId(null); }}><Check size={18} />{t('payment.confirm')}</button><button className="button secondary" disabled={busy} onClick={() => setConfirmPaymentId(null)}><X size={16} />{t('leave.cancel')}</button></div></div> : <button className="button primary full-button" disabled={busy || game.phase !== 'awaitingDebtResolution'} onClick={() => setConfirmPaymentId(pendingPayment.id)}><Check size={18} />{t('payment.payNow')}</button> : <><p>{t('payment.shortfall', { amount: money(pendingPayment.amount - me.balance) })}</p><button className="button secondary full-button" onClick={() => setGameTab('account')}>{t('loan.request')}</button><button className="button danger full-button" disabled={busy} onClick={() => gameAction('game:declare-bankruptcy')}>{t('payment.bankruptcy')}</button></>}</section> : null;
    const playerNames = Object.fromEntries((game?.players ?? []).map(player => [player.id, player.name]));
    const propertyNames = Object.fromEntries((board?.properties ?? []).map(property => [property.id, localizedName(property, locale)]));
    const boardNames = Object.fromEntries(boards.map(candidate => [candidate.id, localizedName(candidate, locale)]));
    const eventText = (entry: Game['events'][number]) => translateGameEvent(locale, entry, playerNames, propertyNames, boardNames, money);
    const accountTransactions = (game?.transactions ?? []).map(transaction => ({ ...transaction, description: translateTransaction(locale, transaction, playerNames, money) }));

    useEffect(() => {
        if (!board || !Number.isSafeInteger(Number(voluntaryLoanAmount)) || Number(voluntaryLoanAmount) <= 0 || !Number.isSafeInteger(Number(loanInstallments)) || Number(loanInstallments) < 1 || Number(loanInstallments) > board.loanRules.maxInstallments) { setLoanTerms(null); return; }
        const controller = new AbortController();
        setTermsLoading(true);
        void fetch('/api/loan-terms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardId: board.id, principal: Number(voluntaryLoanAmount), installments: Number(loanInstallments) }), signal: controller.signal })
            .then(async response => { if (!response.ok) throw new Error('terms'); return await response.json(); })
            .then(setLoanTerms)
            .catch(() => { if (!controller.signal.aborted) setLoanTerms(null); })
            .finally(() => { if (!controller.signal.aborted) setTermsLoading(false); });
        return () => controller.abort();
    }, [board?.id, board?.loanRules.maxInstallments, voluntaryLoanAmount, loanInstallments]);

    useEffect(() => {
        const proposal = game?.pendingLoan;
        const principal = Number(loanPrincipal || proposal?.requestedAmount || 0);
        const interestRate = Number(loanRate) / 100;
        if (!board || !proposal || proposal.status !== 'requested' || proposal.lenderId !== session?.playerId || !Number.isSafeInteger(principal) || principal <= 0 || !Number.isFinite(interestRate) || interestRate < 0 || interestRate > 1) { setOfferTerms(null); return; }
        const controller = new AbortController();
        void fetch('/api/loan-terms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardId: board.id, principal, installments: proposal.installmentsTotal, interestRate }), signal: controller.signal })
            .then(async response => { if (!response.ok) throw new Error('terms'); return await response.json(); })
            .then(setOfferTerms)
            .catch(() => { if (!controller.signal.aborted) setOfferTerms(null); });
        return () => controller.abort();
    }, [board?.id, game?.pendingLoan?.id, game?.pendingLoan?.status, loanPrincipal, loanRate, session?.playerId]);

    useEffect(() => {
        const principal = Number(voluntaryLoanAmount);
        const interestRate = Number(loanRate) / 100;
        const installments = Number(loanInstallments);
        if (!board || !Number.isSafeInteger(principal) || principal <= 0 || !Number.isSafeInteger(installments) || installments < 1 || installments > board.loanRules.maxInstallments || !Number.isFinite(interestRate) || interestRate < 0 || interestRate > 1) { setRequestTerms(null); return; }
        const controller = new AbortController();
        void fetch('/api/loan-terms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardId: board.id, principal, installments, interestRate }), signal: controller.signal })
            .then(async response => { if (!response.ok) throw new Error('terms'); return await response.json(); })
            .then(setRequestTerms)
            .catch(() => { if (!controller.signal.aborted) setRequestTerms(null); });
        return () => controller.abort();
    }, [board?.id, board?.loanRules.maxInstallments, voluntaryLoanAmount, loanInstallments, loanRate]);

    return <div className="app-shell">
        <header className="site-header">
            <button className="brand" onClick={() => !session && navigate('home')} aria-label={t('header.home')}>
                <span className="brand-mark"><Dice5 size={23} /></span><span>finance<span className="brand-light">gameinator</span><span className="brand-dot">.</span></span>
            </button>
            <span className="header-note"><span className="small-dot" /> {session ? t('header.openTable') : t('header.tagline')}</span>
            <label className="language-picker"><span className="sr-only">{t('header.language')}</span><select aria-label={t('header.language')} value={locale} onChange={event => setLocale(event.target.value as Locale)}><option value="pt-BR">Português (Brasil)</option><option value="en">English</option></select></label>
            {session && <button className="icon-button" title="Sair da sala" aria-label="Sair da sala" onClick={() => setConfirmLeave(true)}><LogOut size={20} /></button>}
        </header>

        <main>
            {error && <div className="error-banner" role="alert"><span>{error}</span><button className="icon-button" aria-label={t('error.dismiss')} onClick={() => setError('')}><X size={18} /></button></div>}

            {screen === 'home' && <section className="home-layout">
                <div className="home-copy">
                    <div className="eyebrow"><span className="tiny-line" /> {t('home.eyebrow')}</div>
                    <h1>Finance<span>Gameinator<span className="title-dot">.</span></span></h1>
                    <p className="home-tagline">{t('home.tagline').split('\\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p>
                    <div className="home-actions">
                        <button className="button primary" onClick={() => navigate('create')}><Plus size={21} /> {t('home.create')} <ArrowRight size={19} className="button-end" /></button>
                        <button className="button secondary" onClick={() => navigate('join')}><DoorOpen size={21} /> {t('home.join')} <ArrowRight size={19} className="button-end" /></button>
                    </div>
                    <div className="table-note"><span className="mini-avatars"><span>A</span><span>B</span><span>C</span></span><span>{t('home.players')}<span className="note-separator"> / </span><span className="note-emphasis">{t('home.oneTable')}</span></span></div>
                </div>
                <div className="home-visual"><div className="visual-label"><span>{t('home.visualIndex')}</span><span>{t('home.goodLuck')} <ArrowDownToLine size={13} /></span></div><BoardScene label={t('home.boardAlt')} /><div className="visual-bottom"><span className="visual-chip"><Dice5 size={15} /> {t('home.startGame')}</span><span className="edition">{t('home.edition')}</span></div></div>
            </section>}

            {(screen === 'create' || screen === 'join') && <section className="entry-layout">
                <div className="entry-art"><div className="eyebrow">{screen === 'create' ? t('entry.createEyebrow') : t('entry.joinEyebrow')}</div><h2>{screen === 'create' ? t('entry.createTitle') : t('entry.joinTitle')}</h2><BoardScene label={t('home.boardAlt')} /></div>
                <div className="entry-form">
                    <button className="back-button" onClick={() => navigate('home')}><ArrowLeft size={17} /> {t('entry.back')}</button>
                    <div className="form-heading-icon">{screen === 'create' ? <Plus size={25} /> : <DoorOpen size={25} />}</div>
                    <h1>{screen === 'create' ? t('entry.create') : t('entry.join')}</h1>
                    <form onSubmit={submit}>
                        <label htmlFor="player-name">{t('entry.playerName')}</label>
                        <input id="player-name" autoFocus autoComplete="nickname" placeholder={t('entry.namePlaceholder')} value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={24} required disabled={busy} />
                        {screen === 'join' && <><label htmlFor="room-code">{t('entry.roomCode')}</label><input id="room-code" className="code-input" placeholder={t('entry.codePlaceholder')} value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} minLength={6} maxLength={6} autoComplete="off" autoCapitalize="characters" spellCheck={false} required disabled={busy} /></>}
                        <label htmlFor="room-password">{t('entry.password')}</label>
                        <div className="password-field"><LockKeyhole size={18} /><input id="room-password" type={showPassword ? 'text' : 'password'} autoComplete={screen === 'create' ? 'new-password' : 'current-password'} placeholder={screen === 'create' ? t('entry.createPassword') : t('entry.joinPassword')} value={password} onChange={event => setPassword(event.target.value)} minLength={4} maxLength={64} required disabled={busy} /><button type="button" className="icon-button" title={showPassword ? t('entry.hidePassword') : t('entry.showPassword')} aria-label={showPassword ? t('entry.hidePassword') : t('entry.showPassword')} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                        <button className="button primary submit-button" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={20} /> : screen === 'create' ? <Plus size={20} /> : <DoorOpen size={20} />}{busy ? t('entry.wait') : screen === 'create' ? t('entry.create') : t('entry.join')}<ArrowRight size={19} className="button-end" /></button>
                    </form>
                </div>
            </section>}

            {screen === 'room' && room && session && game?.status === 'finished' && board && <section className="game-over-panel">
                <div className="eyebrow">{t('game.gameOver')}</div><h1>{game.winnerId ? t('game.winner', { player: game.players.find(player => player.id === game.winnerId)?.name ?? '' }) : t('game.finished')}</h1><p>{t('game.finalSummary', { board: localizedName(board, locale) })}</p>
                <div className="final-score-list">{game.players.map(player => <div className={`final-score ${player.id === game.winnerId ? 'winner' : ''}`} key={player.id}><span className="token-mini" style={{ background: player.color }}>{player.name.slice(0, 1)}</span><strong>{player.name}{player.active ? '' : ` · ${t('player.bankrupt')}`}</strong><span>{money(player.balance)}</span><span>{board.properties.filter(property => game.propertyOwners[property.id] === player.id).map(property => localizedName(property, locale)).join(', ') || t('property.noProperties')}</span></div>)}</div>
                {isOwner ? <button className="button primary" onClick={() => setConfirmLeave(true)}><Plus size={19} /> {t('game.createNext')} <ArrowRight size={19} className="button-end" /></button> : <div className="waiting-owner"><Crown size={18} /> {t('game.hostStartsNext')}</div>}
            </section>}

            {screen === 'room' && room && session && game?.status !== 'finished' && (game ? (board ? <section className="game-layout">
                <div className="game-heading"><div><div className="eyebrow">{localizedName(board, locale).toUpperCase()}</div><h1>{gameTab === 'board' ? t('game.heading') : gameTab === 'account' ? t('account.wallet') : t('game.propertiesTitle')}</h1></div><span className={`connection-status ${connection}`}><span className="small-dot" />{connection === 'online' ? t('room.connected') : t('room.reconnecting')}</span></div>
                {gameTab === 'board' && <div className="game-columns">
                    <div className="board-frame"><div className="board-caption"><span>{t('game.round')}</span><span>{board.spaces.length} {t('game.spaces')}</span></div><div className="game-board">{board.spaces.map((space, index) => {
                        const property = space.type === 'property' ? board.properties.find(value => value.id === space.propertyId) : undefined;
                        const tokens = game.players.filter(player => player.position === index);
                        const icon = space.type === 'start' ? t('space.start') : space.type === 'holiday' ? t('space.holiday') : space.type === 'jail' ? t('space.jail') : space.type === 'goToJail' ? t('space.goToJail') : space.type === 'tax' ? t('space.tax') : space.type === 'bonus' ? t('space.bonus') : property?.group;
                        const tileContent = <><span className="tile-index">{index + 1}</span>{property && <span className="tile-band" style={{ background: property.color }} />}
                            <strong>{property ? localizedName(property, locale) : localizedName(space, locale)}</strong><span className="tile-kind">{icon}</span>{property && <span className="tile-price">{money(property.price)}</span>}
                            <span className="tile-tokens">{tokens.map(player => <span key={player.id} className="token-mini" title={player.name} style={{ background: player.color }}>{player.name.slice(0, 1).toUpperCase()}</span>)}</span></>;
                        return property ? <button type="button" key={space.id} className={`board-tile tile-${space.type} ${inspectedPropertyId === property.id ? 'inspected' : ''}`} aria-label={t('property.details', { property: localizedName(property, locale) })} aria-pressed={inspectedPropertyId === property.id} onClick={() => { setInspectedPropertyId(property.id); setPropertyOfferAmount(String(Math.min(property.price, me?.balance ?? 0))); }}>{tileContent}</button> : <div key={space.id} className={`board-tile tile-${space.type}`} aria-label={`${localizedName(space, locale)}${tokens.length ? `, ${tokens.map(player => player.name).join(', ')}` : ''}`}>{tileContent}</div>;
                    })}</div></div>
                    <aside className="game-side">
                        {inspectedProperty && <section className="action-card property-inspector">
                            <button className="icon-button inspector-close" aria-label={t('property.closeDetails')} onClick={() => setInspectedPropertyId(null)}><X size={18} /></button>
                            <img src={`/${inspectedProperty.image}`} alt={t('property.imageAlt', { property: localizedName(inspectedProperty, locale) })} />
                            <div className="eyebrow" style={{ color: inspectedProperty.color }}>{inspectedProperty.group}</div>
                            <h2>{localizedName(inspectedProperty, locale)}</h2>
                            <div className="inspector-values"><span>{t('property.buy')}</span><strong>{money(inspectedProperty.price)}</strong><span>{t('property.currentRent')}</span><strong>{money(inspectedProperty.rentSchedule[game.houses[inspectedProperty.id] ?? 0] ?? inspectedProperty.rentSchedule.at(-1) ?? inspectedProperty.rent)}</strong><span>{t('property.bankSale')}</span><strong>{money(Math.floor(inspectedProperty.price / 2))}</strong><span>{t('property.owner')}</span><strong>{game.propertyOwners[inspectedProperty.id] ? game.players.find(player => player.id === game.propertyOwners[inspectedProperty.id])?.name ?? t('property.unavailable') : t('property.bank')}</strong></div>
                            {game.propertyOwners[inspectedProperty.id] && game.propertyOwners[inspectedProperty.id] !== session.playerId && <><label htmlFor="property-offer-amount">{t('property.yourOffer')}</label><input id="property-offer-amount" type="number" min="1" step="1" max={me?.balance ?? 0} value={propertyOfferAmount} onChange={event => setPropertyOfferAmount(event.target.value)} /><p>{t('property.offerCount', { count: game.offersThisTurn })}</p><button className="button primary full-button" disabled={!canSendPropertyOffer || busy || !Number.isSafeInteger(Number(propertyOfferAmount)) || Number(propertyOfferAmount) <= 0 || Number(propertyOfferAmount) > (me?.balance ?? 0)} onClick={() => gameAction('game:offer-property', { propertyId: inspectedProperty.id, amount: Number(propertyOfferAmount) })}><HandCoins size={18} /> {t('property.sendOffer')}</button></>}
                            {game.propertyOwners[inspectedProperty.id] === session.playerId && <p>{t('property.belongsToYou')}</p>}
                            {!game.propertyOwners[inspectedProperty.id] && <p>{t('property.availableFromBank')}</p>}
                        </section>}
                        {game.pendingOffer && <section className="action-card property-offer-card"><div className="eyebrow">{t('offer.title')}</div><h2>{localizedName(board.properties.find(property => property.id === game.pendingOffer?.propertyId) ?? { name: '' }, locale)}</h2><p>{t('offer.offers', { player: game.players.find(player => player.id === game.pendingOffer?.buyerId)?.name ?? '', amount: money(game.pendingOffer.amount) })}</p>{game.pendingOffer.ownerId === session.playerId ? <div className="action-buttons"><button className="button primary" disabled={busy} onClick={() => gameAction('game:respond-property-offer', { accept: true })}><Check size={18} /> {t('offer.accept')}</button><button className="button secondary" disabled={busy} onClick={() => gameAction('game:respond-property-offer', { accept: false })}>{t('offer.reject')}</button></div> : game.pendingOffer.buyerId === session.playerId ? <p>{t('offer.waiting', { count: game.offersThisTurn })}</p> : <p>{t('offer.inProgress')}</p>}</section>}
                        {gameTab === 'board' && paymentCard}
                        {game.pendingAction?.playerId === session.playerId && game.pendingAction.type === 'buy' && me && me.balance < game.pendingAction.amount && <div className="action-card debt-card"><div className="eyebrow">{t('purchase.finance')}</div><h2>{t('payment.shortfall', { amount: money(game.pendingAction.amount - me.balance) })}</h2><p>{t('purchase.afterLoan')}</p><button className="button secondary full-button" onClick={() => setGameTab('account')}>{t('loan.request')}</button></div>}
                        <div className="turn-card"><div className="eyebrow">{t('game.turn')}</div><div className="turn-player"><span className="token-large" style={{ background: currentPlayer?.color }}>{currentPlayer?.name.slice(0, 1)}</span><div><strong>{currentPlayer?.name}</strong><span>{currentPlayer?.id === session.playerId ? t('game.yourTurn') : t('game.waitingTurn')}</span></div></div>{me?.jailed && <div className="jail-note">{t('game.jail', { attempts: me.jailAttempts })}</div>}
                            <div className="dice-row">{game.lastRoll ? game.lastRoll.map((die, index) => <span className="die-face" key={index}>{die}</span>) : <span className="dice-placeholder"><Dice5 size={18} /> {t('game.rollPrompt')}</span>}</div>
                            <button className="button primary roll-button" disabled={busy || game.currentPlayerId !== session.playerId || game.phase !== 'awaitingRoll' || connection !== 'online'} onClick={() => gameAction('game:roll')}><Dice5 size={20} /> {t('game.roll')} <ArrowRight size={18} className="button-end" /></button>
                        </div>
                        {game.pendingAction?.playerId === session.playerId && game.pendingAction.type === 'buy' && <div className="action-card"><div className="eyebrow">{t('purchase.opportunity')}</div><h2>{localizedName(board.properties.find(property => property.id === game.pendingAction?.propertyId) ?? { name: '' }, locale)}</h2><p>{t('purchase.buyFor', { amount: money(game.pendingAction.amount) })}</p><div className="action-buttons"><button className="button primary" disabled={busy || me!.balance < game.pendingAction.amount} onClick={() => gameAction('game:buy', { accept: true })}><Check size={18} /> {t('purchase.buy')}</button><button className="button secondary" disabled={busy} onClick={() => gameAction('game:buy', { accept: false })}>{t('purchase.pass')}</button></div></div>}
                        {game.pendingAction?.playerId === session.playerId && game.pendingAction.type === 'bail' && <div className="action-card"><div className="eyebrow">{t('bail.title')}</div><h2>{t('bail.attempts')}</h2><p>{t('bail.instructions', { amount: money(game.pendingAction.amount) })}</p><div className="action-buttons"><button className="button primary" disabled={busy || me!.balance < game.pendingAction.amount} onClick={() => gameAction('game:bail', { accept: true })}><Check size={18} /> {t('bail.pay')}</button><button className="button secondary" disabled={busy} onClick={() => gameAction('game:bail', { accept: false })}>{t('bail.stay')}</button></div></div>}
                        {game.pendingLoan && <div className="action-card loan-card"><div className="eyebrow">EMPRESTIMO ENTRE JOGADORES</div>{game.pendingLoan.status === 'requested' && game.pendingLoan.lenderId === session.playerId ? <><h2>{game.players.find(player => player.id === game.pendingLoan?.borrowerId)?.name} pediu {money(game.pendingLoan.requestedAmount)}</h2><label htmlFor="offer-principal">Valor do emprestimo</label><input id="offer-principal" type="number" min={game.pendingLoan.requestedAmount} max={me?.balance} value={loanPrincipal || String(game.pendingLoan.requestedAmount)} onChange={event => setLoanPrincipal(event.target.value)} /><label htmlFor="offer-rate">Juros (%)</label><input id="offer-rate" type="number" min="0" max="100" step="1" value={loanRate} onChange={event => setLoanRate(event.target.value)} /><div className="action-buttons"><button className="button primary" disabled={busy || Number(loanPrincipal || game.pendingLoan.requestedAmount) > (me?.balance ?? 0)} onClick={() => gameAction('game:respond-player-loan', { accept: true, principal: Number(loanPrincipal || game.pendingLoan?.requestedAmount), interestRate: Number(loanRate) / 100 })}>Enviar oferta</button><button className="button secondary" disabled={busy} onClick={() => gameAction('game:respond-player-loan', { accept: false })}>Recusar</button></div></> : game.pendingLoan.status === 'offered' && game.pendingLoan.borrowerId === session.playerId ? <><h2>Oferta de {game.players.find(player => player.id === game.pendingLoan?.lenderId)?.name}</h2><p>{money(game.pendingLoan.principal ?? 0)} · {((game.pendingLoan.interestRate ?? 0) * 100).toFixed(0)}% · total {money(game.pendingLoan.principal! * (1 + game.pendingLoan.interestRate!))}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={() => gameAction('game:respond-player-loan', { accept: true })}>Aceitar</button><button className="button secondary" disabled={busy} onClick={() => gameAction('game:respond-player-loan', { accept: false })}>Recusar</button></div></> : <><h2>Pedido enviado</h2><p>Aguardando acordo entre os jogadores.</p></>}</div>}
                        {game.phase === 'awaitingAction' && game.currentPlayerId === session.playerId && !game.pendingAction && !game.pendingLoan && <div className="action-card optional-actions"><div className="eyebrow">ACOES DA VEZ</div><p>Voce pode fazer emprestimos, construir, vender ou quitar dividas antes de encerrar sua vez.</p><label htmlFor="voluntary-loan-amount">Valor do emprestimo</label><input id="voluntary-loan-amount" type="number" min="1" step="1" value={voluntaryLoanAmount} onChange={event => setVoluntaryLoanAmount(event.target.value)} /><div className="loan-terms"><span>Juros do banco</span><strong>{Math.round(board.bankInterestRate * 100)}%</strong><span>Total a devolver</span><strong>{money(Math.round(Number(voluntaryLoanAmount || 0) * (1 + board.bankInterestRate)))}</strong></div><button className="button primary full-button" disabled={busy || !Number.isSafeInteger(Number(voluntaryLoanAmount)) || Number(voluntaryLoanAmount) <= 0} onClick={() => gameAction('game:bank-loan', { amount: Number(voluntaryLoanAmount) })}><Banknote size={18} /> Solicitar ao banco</button><label htmlFor="voluntary-loan-lender">Ou pedir a outro jogador</label><select id="voluntary-loan-lender" value={loanLender || game.players.find(player => player.id !== session.playerId && player.active)?.id || ''} onChange={event => setLoanLender(event.target.value)}><option value="" disabled>Selecione um credor</option>{game.players.filter(player => player.id !== session.playerId && player.active).map(player => <option key={player.id} value={player.id}>{player.name} · {money(player.balance)}</option>)}</select><button className="button secondary full-button" disabled={busy || !Number.isSafeInteger(Number(voluntaryLoanAmount)) || Number(voluntaryLoanAmount) <= 0 || !game.players.some(player => player.id !== session.playerId && player.active)} onClick={() => gameAction('game:request-player-loan', { lenderId: loanLender || game.players.find(player => player.id !== session.playerId && player.active)?.id, amount: Number(voluntaryLoanAmount) })}><HandCoins size={18} /> Solicitar a um jogador</button></div>}
                        <div className="game-roster"><div className="eyebrow">{t('game.players')}</div>{game.players.map(player => <div className={`roster-player ${player.id === game.currentPlayerId ? 'active' : ''}`} key={player.id}><span className="token-mini" style={{ background: player.color }}>{player.name.slice(0, 1)}</span><span>{player.name}{player.active ? '' : ` · ${t('player.bankrupt')}`}</span><strong>{money(player.balance)}</strong></div>)}</div>
                        <div className="game-log"><div className="eyebrow">{t('game.activity')}</div>{game.events.slice(-6).reverse().map(entry => <p key={entry.id}>{eventText(entry)}</p>)}</div>
                    </aside>
                </div>}
                {gameTab === 'account' && <AccountTab locale={locale} t={t} money={money} balance={me?.balance ?? 0} phase={game.phase} activeLoans={activeLoans} transactions={accountTransactions} payment={pendingPayment && pendingPayment.playerId === session.playerId ? { id: pendingPayment.id, type: pendingPayment.type, amount: pendingPayment.amount, recipientName: pendingPayment.recipientId === 'bank' ? t('property.bank') : game.players.find(player => player.id === pendingPayment.recipientId)?.name ?? '', installmentNumber: paymentLoan ? paymentLoan.installmentsTotal - paymentLoan.installmentsRemaining + 1 : undefined, installmentsTotal: paymentLoan?.installmentsTotal, outstanding: paymentLoan?.outstanding } : null} pendingLoan={game.pendingLoan} playerId={session.playerId} playerName={me?.name ?? ''} players={game.players.filter(player => player.active).map(player => ({ id: player.id, name: player.name, balance: player.balance }))} canRequestLoan={canRequestLoan} loanAvailableThisCycle={me?.loanAvailableThisCycle ?? false} maxActiveLoans={board.loanRules.maxActiveLoans} maxInstallments={board.loanRules.maxInstallments} busy={busy} loanAmount={voluntaryLoanAmount} onLoanAmount={setVoluntaryLoanAmount} installments={loanInstallments} onInstallments={setLoanInstallments} interestPercent={loanRate} onInterestPercent={setLoanRate} lenderId={loanLender} onLenderId={setLoanLender} bankTerms={loanTerms} requestTerms={requestTerms} offerPrincipal={loanPrincipal} onOfferPrincipal={setLoanPrincipal} offerInterest={loanRate} onOfferInterest={setLoanRate} offerTerms={offerTerms} onAction={gameAction} />}
                {gameTab === 'properties' && <section className="asset-panel"><div className="properties-heading"><div><div className="eyebrow">{t('property.assets')}</div><h2>{ownedProperties.length} {ownedProperties.length === 1 ? t('property.one') : t('property.many')}</h2></div><span className="property-total">{money(ownedProperties.reduce((sum, property) => sum + property.price, 0))}</span></div>{ownedProperties.length ? <div className="owned-property-list">{ownedProperties.map(property => {
                    const level = game.houses[property.id] ?? 0;
                    const group = board.properties.filter(candidate => candidate.color === property.color);
                    const groupLevels = group.map(candidate => game.houses[candidate.id] ?? 0);
                    const groupComplete = group.every(candidate => game.propertyOwners[candidate.id] === session.playerId);
                    const hasGroupBuildings = groupLevels.some(value => value > 0);
                    const mayBuildHouse = canBuild && groupComplete && level < board.developmentRules.maxHousesPerProperty && (!board.developmentRules.requireEvenBuilding || level === Math.min(...groupLevels)) && me!.balance >= property.houseCost;
                    const mayBuildHotel = canBuild && groupComplete && level === board.developmentRules.maxHousesPerProperty && (!board.developmentRules.hotelRequiresMaxHouses || groupLevels.every(value => value >= board.developmentRules.maxHousesPerProperty)) && me!.balance >= property.hotelCost;
                    const currentRent = property.rentSchedule[level] ?? property.rentSchedule[property.rentSchedule.length - 1];
                    const maySellBuilding = canSell && level > 0 && (level > board.developmentRules.maxHousesPerProperty || !board.developmentRules.requireEvenBuilding || level === Math.max(...groupLevels));
                    const buildingSaleValue = Math.floor((level > board.developmentRules.maxHousesPerProperty ? property.hotelCost : property.houseCost) / 2);
                    return <article className="owned-property" key={property.id}>
                        <img src={`/${property.image}`} alt={t('property.imageAlt', { property: localizedName(property, locale) })} />
                        <div className="property-info"><span className="property-group" style={{ color: property.color }}>{property.group}</span><h3>{localizedName(property, locale)}</h3><span>{t('property.ownerLine', { player: me?.name ?? '' })} · {level > board.developmentRules.maxHousesPerProperty ? t('property.hotel') : level ? t('property.houseCount', { count: level }) : t('property.noBuildings')}</span></div>
                        <div className="property-values"><span>{t('property.buy')} <strong>{money(property.price)}</strong></span><span>{t('property.currentRent')} <strong>{money(currentRent)}</strong></span><span>{t('property.bankSale')} <strong>{money(Math.floor(property.price / 2))}</strong></span><span>{t('property.house')} <strong>{money(property.houseCost)}</strong></span><span>{t('property.hotel')} <strong>{money(property.hotelCost)}</strong></span></div>
                        <div className="property-controls"><button className="button secondary" disabled={!mayBuildHouse || busy} onClick={() => confirmGameAction('build.confirm', 'game:build', { propertyId: property.id, building: 'house' })}><House size={16} /> {t('property.buildHouse')}</button><button className="button secondary" disabled={!mayBuildHotel || busy} onClick={() => confirmGameAction('build.confirm', 'game:build', { propertyId: property.id, building: 'hotel' })}><House size={16} /> {t('property.buildHotel')}</button>{level > 0 && <button className="button secondary" disabled={!maySellBuilding || busy} onClick={() => confirmGameAction('build.confirmSale', 'game:sell-building', { propertyId: property.id })}><Banknote size={16} /> {level > board.developmentRules.maxHousesPerProperty ? t('build.hotelSold') : t('build.houseSold')} · {t('build.sellFor', { amount: money(buildingSaleValue) })}</button>}<button className="button danger" disabled={!canSell || hasGroupBuildings || busy} onClick={() => confirmGameAction('build.confirmSale', 'game:sell-property', { propertyId: property.id })}><Banknote size={16} /> {t('property.sellFor', { amount: money(Math.floor(property.price / 2)) })}</button></div>
                    </article>;
                })}</div> : <p className="empty-assets">{t('property.noProperties')}</p>}</section>}
                {canFinishTurn && <div className="turn-finish-bar"><button className="button primary" disabled={busy} onClick={() => gameAction('game:finish-turn')}><Check size={18} /> Encerrar minha vez <ArrowRight size={18} className="button-end" /></button></div>}
                <nav className="game-bottom-nav" aria-label={t('nav.board')}><button className={gameTab === 'board' ? 'selected' : ''} onClick={() => setGameTab('board')}><Map size={21} /><span>{t('nav.board')}</span></button><button className={gameTab === 'account' ? 'selected' : ''} onClick={() => setGameTab('account')}><Wallet size={21} /><span>{t('nav.account')}</span><strong>{money(me?.balance ?? 0)}</strong></button><button className={gameTab === 'properties' ? 'selected' : ''} onClick={() => setGameTab('properties')}><House size={21} /><span>{t('nav.properties')}</span><strong>{ownedProperties.length}</strong></button></nav>
            </section> : <section className="game-layout"><div className="eyebrow">{t('generic.loadingBoard')}</div></section>) : <section className="room-layout">
                <div className="room-heading"><div><div className="eyebrow">{t('room.waiting')}</div><h1>{t('room.title')}</h1></div><span className={`connection-status ${connection}`} aria-live="polite">{connection === 'online' ? <Wifi size={16} /> : connection === 'connecting' ? <LoaderCircle size={16} className="spin" /> : <WifiOff size={16} />}{connection === 'online' ? t('room.connected') : connection === 'connecting' ? t('room.connecting') : t('room.reconnecting')}</span></div>
                <div className="room-columns"><div className="players-section"><div className="section-title"><h2><Users size={19} /> {t('room.players')}</h2><span>{online} / {room.players.length} {t('room.online').toLowerCase()}</span></div>
                    <ul className="player-list">{room.players.map((player, index) => <li key={player.id} className="player-row"><span className={`player-avatar avatar-${index % 4}`} style={{ background: player.color }}>{player.name.slice(0, 1).toUpperCase()}</span><div className="player-name"><strong>{player.name} {player.id === session.playerId && <span className="you-tag">{t('room.you')}</span>}</strong><span>{player.id === room.ownerId ? t('room.host') : t('room.player')}</span>{player.id === session.playerId && <div className="token-palette" aria-label={t('room.chooseToken')}>{tokenColors.map(color => <button key={color} title={t('room.tokenColor', { color })} aria-label={t('room.tokenColor', { color })} aria-pressed={player.color === color} disabled={room.status !== 'waiting' || busy || room.players.some(other => other.id !== player.id && other.color === color)} style={{ background: color }} onClick={() => selectColor(color)} />)}</div>}</div>{player.id === room.ownerId && <Crown size={18} className="owner-crown" aria-label={t('room.host')} />}<span className={`player-presence ${player.online ? 'present' : ''}`}><span />{player.online ? t('room.online') : t('room.offline')}</span></li>)}</ul>
                    {room.players.length < 8 && <div className="empty-seat"><span className="empty-avatar"><Plus size={21} /></span><span>{t('room.emptySeat')}</span></div>}
                </div><aside className="room-sidebar"><div className="invite-section"><div className="eyebrow">{t('room.code')}</div><div className="room-code"><span>{room.code}</span><button className="icon-button" title={copied ? t('room.codeCopied') : t('room.copyCode')} aria-label={copied ? t('room.codeCopied') : t('room.copyCode')} onClick={copyCode}>{copied ? <Check size={21} /> : <Copy size={21} />}</button></div><div className="invite-foot"><LockKeyhole size={15} /> {t('room.private')}<span>{t('room.seats', { count: room.players.length })}</span></div></div>
                        {isOwner ? <div className="start-section"><label className="board-select-label" htmlFor="board-select">{t('room.board')}</label><select id="board-select" value={selectedBoardId} onChange={event => setSelectedBoardId(event.target.value)} disabled={room.status !== 'waiting' || boards.length === 0}><option value="" disabled>{t('room.chooseBoard')}</option>{boards.map(candidate => <option key={candidate.id} value={candidate.id}>{localizedName(candidate, locale)} · {candidate.spaces.length} {t('game.spaces').toLowerCase()}</option>)}</select><p className="board-description">{boards.find(candidate => candidate.id === selectedBoardId) ? localizedDescription(boards.find(candidate => candidate.id === selectedBoardId)!, locale) : t('room.boardsJson')}</p><div className="start-indicator"><span className={canStart ? 'small-dot' : 'waiting-dot'} />{room.players.length < 2 ? t('room.waitPlayers') : online !== room.players.length ? t('room.waitConnections') : t('room.everyoneHere')}</div><button className="button primary" onClick={start} disabled={!canStart || busy || !selectedBoardId}>{busy ? <LoaderCircle size={20} className="spin" /> : <Play size={19} />} {t('room.start')} <ArrowRight size={19} className="button-end" /></button></div> : <div className="start-section"><div className="waiting-owner"><Crown size={18} /> {t('room.waitHost')}</div></div>}
                    </aside></div>
            </section>)}
        </main>
        <footer className="site-footer"><span>{t('footer.brand')}</span><span>{t('footer.line')}<span className="footer-dot" /></span></footer>
        {confirmLeave && <div className="modal-backdrop" onClick={() => !busy && setConfirmLeave(false)}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-title" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') setConfirmLeave(false); }}><LogOut size={27} /><h2 id="leave-title">{isOwner ? t('leave.title') : room?.status === 'started' ? t('leave.activeTitle') : t('leave.playerTitle')}</h2><p>{isOwner ? t('leave.ownerText') : room?.status === 'started' ? t('leave.activeText') : t('leave.playerText')}</p><div className="dialog-actions"><button className="button secondary" autoFocus disabled={busy} onClick={() => setConfirmLeave(false)}>{room?.status === 'started' && !isOwner ? t('leave.understood') : t('leave.cancel')}</button>{!(room?.status === 'started' && !isOwner) && <button className="button danger" disabled={busy} onClick={leave}>{busy ? <LoaderCircle size={18} className="spin" /> : <LogOut size={18} />}{isOwner ? t('leave.close') : t('leave.exit')}</button>}</div></section></div>}
    </div>;
}