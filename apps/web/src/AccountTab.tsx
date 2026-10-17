import { useEffect, useState } from 'react';
import { Banknote, CalendarDays, Check, ChevronDown, HandCoins, Landmark, LoaderCircle, ShieldCheck, Wallet, X } from 'lucide-react';
import type { Locale, TranslationKey } from './i18n';

type Loan = { id: string; type: string; lenderId: string; principal: number; interestRate: number; installmentsTotal: number; installmentsRemaining: number; installmentAmount: number; outstanding: number };
type Payment = { id: string; type: 'rent' | 'tax' | 'loanInstallment'; amount: number; recipientName: string; installmentNumber?: number; installmentsTotal?: number; outstanding?: number };
type PendingLoan = { id: string; status: string; lenderId: string; borrowerId: string; requestedAmount: number; installmentsTotal: number; requestedInterestRate: number; principal: number | null; interestRate: number | null };
type LoanTerms = { principal: number; interestRate: number; installmentsTotal: number; installmentAmount: number; totalRepayment: number };
type PlayerOption = { id: string; name: string; balance: number };
type Transaction = { id: string; description: string; amount: number };
type EducationProduct = { id: string; name: string; nameTranslations?: Partial<Record<Locale, string>>; explanation: string; explanationTranslations?: Partial<Record<Locale, string>>; rateBpsPerCycle: number; availableTermsCycles: number[]; interestMethod: 'simple' | 'compound'; allowEarlyWithdrawal: boolean; earlyWithdrawalPenaltyBps: number; maturityBehavior: 'claimWithConfirmation'; maturityPayout: 'together' | 'separate' };
type Investment = { id: string; productId: string; productName: string; productNameEnglish: string; principal: number; rateBpsPerCycle: number; interestMethod: 'simple' | 'compound'; termCycles: number; allowEarlyWithdrawal: boolean; earlyWithdrawalPenaltyBps: number; maturityBehavior: 'claimWithConfirmation'; maturityPayout: 'together' | 'separate'; creationCycle: number; maturityCycle: number; lastAccruedCycle: number; accruedInterest: number; estimatedMaturityAmount: number; maturityAmount: number | null; principalClaimed: boolean; interestClaimed: boolean; status: 'active' | 'matured' | 'claimed' | 'withdrawnEarly' };
type InvestmentTerms = { principal: number; interestAmount: number; maturityAmount: number; rateBpsPerCycle: number; termCycles: number; interestMethod: 'simple' | 'compound' };
type Action = (event: string, payload?: Record<string, unknown>) => void;
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;
type SummaryMetric = { label: string; value: string; featured?: boolean };

function FinancialSummary({ items, className = '' }: { items: SummaryMetric[]; className?: string }) {
    return <dl className={`financial-summary ${className}`}>
        {items.map(item => <div className={item.featured ? 'featured' : ''} key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
        </div>)}
    </dl>;
}

interface AccountTabProps {
    view: 'account' | 'bank' | 'investments';
    locale: Locale;
    t: Translate;
    money: (amount: number) => string;
    balance: number;
    phase: string;
    activeLoans: Loan[];
    investments: Investment[];
    transactions: Transaction[];
    payment: Payment | null;
    pendingLoan: PendingLoan | null;
    playerId: string;
    playerName: string;
    players: PlayerOption[];
    canRequestLoan: boolean;
    loanAvailableThisCycle: boolean;
    maxActiveLoans: number;
    boardId: string;
    financialEducation: { emergencyFundInterestRateBpsPerCycle: number; fixedIncomeProducts: EducationProduct[] };
    emergencyFundBalance: number;
    emergencyFundInterestPrevious: number;
    emergencyFundInterestTotal: number;
    emergencyFundLastProcessedCycle: number;
    currentCycle: number;
    pendingObligations: number;
    canCreateInvestment: boolean;
    maxInstallments: number;
    busy: boolean;
    loanAmount: string;
    onLoanAmount: (value: string) => void;
    installments: string;
    onInstallments: (value: string) => void;
    interestPercent: string;
    onInterestPercent: (value: string) => void;
    lenderId: string;
    onLenderId: (value: string) => void;
    bankTerms: LoanTerms | null;
    requestTerms: LoanTerms | null;
    offerPrincipal: string;
    onOfferPrincipal: (value: string) => void;
    offerInterest: string;
    onOfferInterest: (value: string) => void;
    offerTerms: LoanTerms | null;
    onAction: Action;
}

export function AccountTab(props: AccountTabProps) {
    const [confirmPayment, setConfirmPayment] = useState(false);
    const [fundAmount, setFundAmount] = useState('10000');
    const [fundAction, setFundAction] = useState<'deposit' | 'withdraw' | null>(null);
    const [fundOperationId, setFundOperationId] = useState('');
    const [investmentAmount, setInvestmentAmount] = useState('50000');
    const [selectedProductId, setSelectedProductId] = useState(props.financialEducation.fixedIncomeProducts[0]?.id ?? '');
    const [termCycles, setTermCycles] = useState('');
    const [investmentTerms, setInvestmentTerms] = useState<InvestmentTerms | null>(null);
    const [createInvestmentConfirmation, setCreateInvestmentConfirmation] = useState(false);
    const [investmentOperationId, setInvestmentOperationId] = useState('');
    const [investmentAction, setInvestmentAction] = useState<{ investmentId: string; kind: 'claim' | 'early'; part?: 'together' | 'principal' | 'interest' } | null>(null);
    const {
        view, t, money, balance, phase, activeLoans, investments, transactions, payment: providedPayment, pendingLoan, playerId, playerName,
        players, canRequestLoan, loanAvailableThisCycle, maxActiveLoans, maxInstallments, busy, loanAmount, onLoanAmount,
        installments, onInstallments, interestPercent, onInterestPercent, lenderId, onLenderId,
        bankTerms, requestTerms, offerPrincipal, onOfferPrincipal, offerInterest, onOfferInterest,
        offerTerms, onAction,
    } = props;
    const payment = view === 'bank'
        ? providedPayment?.type === 'loanInstallment' ? providedPayment : null
        : view === 'account' && providedPayment?.type !== 'loanInstallment' ? providedPayment : null;
    const currentLender = lenderId || players.find(player => player.id !== playerId)?.id || '';
    const numberLocale = props.locale === 'en' ? 'en-US' : 'pt-BR';
    const formatPercent = (rateBps: number) => `${new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rateBps / 100)}%`;
    const formatFractionPercent = (rate: number) => `${new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rate * 100)}%`;
    const loanRequestValid = Number.isSafeInteger(Number(loanAmount)) && Number(loanAmount) > 0 && Number.isSafeInteger(Number(installments)) && Number(installments) > 0 && Number(installments) <= maxInstallments;
    const offerValid = Number.isSafeInteger(Number(offerPrincipal || pendingLoan?.requestedAmount)) && Number(offerPrincipal || pendingLoan?.requestedAmount) >= (pendingLoan?.requestedAmount ?? 1) && Number(offerPrincipal || pendingLoan?.requestedAmount) <= balance;
    const selectedProduct = props.financialEducation.fixedIncomeProducts.find(product => product.id === selectedProductId);
    const investmentRequestValid = Number.isSafeInteger(Number(investmentAmount)) && Number(investmentAmount) > 0 && Number.isSafeInteger(Number(termCycles)) && Number(termCycles) > 0;
    const investedPrincipal = investments.reduce((sum, investment) => sum + (investment.status === 'active' || (investment.status === 'matured' && !investment.principalClaimed) ? investment.principal : 0), 0);
    const productName = (product: EducationProduct) => product.nameTranslations?.[props.locale] ?? product.name;
    const investmentName = (investment: Investment) => props.locale === 'en' ? investment.productNameEnglish : investment.productName;
    const productExplanation = (product: EducationProduct) => product.explanationTranslations?.[props.locale] ?? product.explanation;
    const earlyTerms = (investment: Investment) => {
        const penaltyAmount = Math.round(investment.accruedInterest * investment.earlyWithdrawalPenaltyBps / 10000);
        return { penaltyAmount, payoutAmount: investment.principal + investment.accruedInterest - penaltyAmount };
    };

    useEffect(() => setConfirmPayment(false), [payment?.id]);

    useEffect(() => {
        if (!selectedProduct || !selectedProduct.availableTermsCycles.includes(Number(termCycles))) {
            setTermCycles(selectedProduct?.availableTermsCycles[0]?.toString() ?? '');
        }
    }, [selectedProductId, props.financialEducation]);

    useEffect(() => {
        if (!selectedProduct || !investmentRequestValid || Number(investmentAmount) > balance) { setInvestmentTerms(null); return; }
        const controller = new AbortController();
        void fetch('/api/investment-terms', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId: props.boardId, productId: selectedProduct.id, principal: Number(investmentAmount), termCycles: Number(termCycles) }),
            signal: controller.signal,
        }).then(async response => { if (!response.ok) throw new Error('terms'); return await response.json() as InvestmentTerms; })
            .then(setInvestmentTerms)
            .catch(() => { if (!controller.signal.aborted) setInvestmentTerms(null); });
        return () => controller.abort();
    }, [props.boardId, selectedProductId, investmentAmount, termCycles, balance, selectedProduct, investmentRequestValid]);

    const beginFundAction = (action: 'deposit' | 'withdraw') => {
        setFundOperationId(crypto.randomUUID());
        setFundAction(action);
    };

    const confirmFundAction = () => {
        if (!fundAction) return;
        onAction(fundAction === 'deposit' ? 'game:emergency-fund-deposit' : 'game:emergency-fund-withdraw', { amount: Number(fundAmount), operationId: fundOperationId });
        setFundAction(null);
    };

    const confirmCreateInvestment = () => {
        if (!selectedProduct || !investmentTerms) return;
        onAction('game:investment-create', { productId: selectedProduct.id, principal: Number(investmentAmount), termCycles: Number(termCycles), operationId: investmentOperationId });
        setCreateInvestmentConfirmation(false);
    };

    const confirmInvestmentAction = () => {
        if (!investmentAction) return;
        if (investmentAction.kind === 'claim') onAction('game:investment-claim', { investmentId: investmentAction.investmentId, part: investmentAction.part ?? 'together' });
        else onAction('game:investment-early-withdraw', { investmentId: investmentAction.investmentId });
        setInvestmentAction(null);
    };

    return <section className={`asset-panel account-panel ${view === 'investments' ? 'investments-panel' : ''}`}>
        {(view === 'account' || view === 'bank') && <>
            {view === 'account' ? <>
                <div className="asset-header"><span className="asset-icon"><Wallet size={24} /></span><div><div className="eyebrow">{t('account.balance')}</div><h2>{money(balance)}</h2></div></div>
                <p className="asset-description">{t('account.description')}</p>
            </> : <>
                <div className="asset-header"><span className="asset-icon"><Landmark size={24} /></span><div><div className="eyebrow">{t('nav.bank')}</div><h2>{t('bank.heading')}</h2></div></div>
                <p className="asset-description">{t('bank.description')}</p>
            </>}

            {payment && <section className="account-section pending-payment"><div className="eyebrow">{payment.type === 'loanInstallment' ? t('payment.installment') : t('payment.pending')}</div><h3>{money(payment.amount)}</h3><p>{payment.type === 'rent' ? t('payment.rentTo', { player: payment.recipientName }) : payment.type === 'tax' ? t('payment.bankTax') : t('payment.installmentDetails', { number: payment.installmentNumber ?? 1, total: payment.installmentsTotal ?? 1, balance: money(payment.outstanding ?? 0) })}</p>{balance >= payment.amount ? <button className="button primary" disabled={busy || confirmPayment} onClick={() => setConfirmPayment(true)}><Check size={18} />{t('payment.payNow')}</button> : <p>{t('payment.shortfall', { amount: money(payment.amount - balance) })}</p>}{confirmPayment && <div className="payment-confirm"><p>{t('payment.confirmPrompt', { amount: money(payment.amount) })}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={() => { onAction('game:pay', { paymentId: payment.id }); setConfirmPayment(false); }}><Check size={18} />{t('payment.confirm')}</button><button className="button secondary" disabled={busy} onClick={() => setConfirmPayment(false)}><X size={16} />{t('leave.cancel')}</button></div></div>}</section>}

            <div className="bank-sections" hidden={view !== 'bank'}>
                {canRequestLoan && <section className="account-section loan-request-section"><div className="debt-heading"><h3>{t('loan.request')}</h3><span>{t('loan.activeCount', { count: activeLoans.length })}</span></div><p className="account-hint">{t('loan.cycleAvailable')} {t('loan.activeLimit', { max: maxActiveLoans })}</p>
                    <label htmlFor="account-loan-amount">{t('loan.amount')}</label><input id="account-loan-amount" type="number" min="1" step="1" value={loanAmount} onChange={event => onLoanAmount(event.target.value)} />
                    <label htmlFor="account-loan-installments">{t('loan.installments')}</label><input id="account-loan-installments" type="number" min="1" max={maxInstallments} step="1" value={installments} onChange={event => onInstallments(event.target.value)} />
                    <FinancialSummary items={[
                        { label: t('loan.rate'), value: bankTerms ? formatFractionPercent(bankTerms.interestRate) : '...' },
                        { label: t('loan.installmentAmount'), value: bankTerms ? money(bankTerms.installmentAmount) : '...' },
                        { label: t('loan.total'), value: bankTerms ? money(bankTerms.totalRepayment) : '...', featured: true },
                    ]} />
                    <button className="button primary" disabled={busy || !loanRequestValid || !bankTerms || activeLoans.length >= maxActiveLoans || !loanAvailableThisCycle} onClick={() => onAction('game:bank-loan', { amount: Number(loanAmount), installments: Number(installments) })}><Banknote size={18} />{t('loan.requestBank')}</button>
                    {players.filter(player => player.id !== playerId).length > 0 && <div className="player-loan-request"><label htmlFor="account-loan-lender">{t('loan.selectLender')}</label><select id="account-loan-lender" value={currentLender} onChange={event => onLenderId(event.target.value)}>{players.filter(player => player.id !== playerId).map(player => <option key={player.id} value={player.id}>{player.name} · {money(player.balance)}</option>)}</select><label htmlFor="account-loan-rate">{t('loan.proposedRate')}</label><input id="account-loan-rate" type="number" min="0" max="100" step="0.1" value={interestPercent} onChange={event => onInterestPercent(event.target.value)} /><div className="loan-preview"><strong>{t('loan.installmentAmount')}: {requestTerms ? money(requestTerms.installmentAmount) : '...'}</strong><span>{t('loan.total')}: {requestTerms ? money(requestTerms.totalRepayment) : '...'}</span></div><button className="button secondary" disabled={busy || !loanRequestValid || !requestTerms || activeLoans.length >= maxActiveLoans || !loanAvailableThisCycle} onClick={() => onAction('game:request-player-loan', { lenderId: currentLender, amount: Number(loanAmount), installments: Number(installments), interestRate: Number(interestPercent) / 100 })}><HandCoins size={18} />{t('loan.requestPlayer')}</button></div>}
                    {!loanAvailableThisCycle && <p className="account-hint">{t('loan.cycleUsed')}</p>}{activeLoans.length >= maxActiveLoans && <p className="account-hint">{t('loan.maxActive')}</p>}
                </section>}

                {pendingLoan && <section className="account-section pending-loan-section"><div className="eyebrow">{t('loan.proposal')}</div>{pendingLoan.status === 'requested' && pendingLoan.lenderId === playerId ? <><h3>{players.find(player => player.id === pendingLoan.borrowerId)?.name} · {money(pendingLoan.requestedAmount)}</h3><p>{t('loan.installments')}: {pendingLoan.installmentsTotal}</p><label htmlFor="lender-offer-principal">{t('loan.principal')}</label><input id="lender-offer-principal" type="number" min={pendingLoan.requestedAmount} max={balance} value={offerPrincipal || String(pendingLoan.requestedAmount)} onChange={event => onOfferPrincipal(event.target.value)} /><label htmlFor="lender-offer-rate">{t('loan.rate')}</label><input id="lender-offer-rate" type="number" min="0" max="100" step="0.1" value={offerInterest} onChange={event => onOfferInterest(event.target.value)} /><div className="loan-preview"><span>{t('loan.installmentAmount')}: {offerTerms ? money(offerTerms.installmentAmount) : '...'}</span><span>{t('loan.total')}: {offerTerms ? money(offerTerms.totalRepayment) : '...'}</span></div><div className="action-buttons"><button className="button primary" disabled={busy || !offerTerms || !offerValid} onClick={() => onAction('game:respond-player-loan', { accept: true, principal: Number(offerPrincipal || pendingLoan.requestedAmount), interestRate: Number(offerInterest) / 100 })}>{t('loan.sendOffer')}</button><button className="button secondary" disabled={busy} onClick={() => onAction('game:respond-player-loan', { accept: false })}>{t('offer.reject')}</button></div></> : pendingLoan.status === 'requested' && pendingLoan.borrowerId === playerId ? <><p>{t('loan.requestPending')}</p><p>{pendingLoan.installmentsTotal} · {money(pendingLoan.requestedAmount)}</p><button className="button secondary" disabled={busy} onClick={() => onAction('game:cancel-player-loan')}>{t('loan.cancel')}</button></> : pendingLoan.status === 'offered' && pendingLoan.borrowerId === playerId ? <><h3>{t('loan.offerFrom', { player: players.find(player => player.id === pendingLoan.lenderId)?.name ?? '' })}</h3><p>{money(pendingLoan.principal ?? 0)} · {((pendingLoan.interestRate ?? 0) * 100).toFixed(1)}% · {pendingLoan.installmentsTotal}</p><p>{t('loan.installmentAmount')}: {money(Math.ceil((pendingLoan.principal! + Math.round(pendingLoan.principal! * pendingLoan.interestRate!)) / pendingLoan.installmentsTotal))}</p><p>{t('loan.total')}: {money(pendingLoan.principal! + Math.round(pendingLoan.principal! * pendingLoan.interestRate!))}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={() => onAction('game:respond-player-loan', { accept: true })}>{t('loan.accept')}</button><button className="button secondary" disabled={busy} onClick={() => onAction('game:respond-player-loan', { accept: false })}>{t('offer.reject')}</button></div></> : <p>{t('loan.requestPending')}</p>}</section>}

                <section className="account-section"><div className="debt-heading"><h3>{t('loan.active')}</h3><span>{activeLoans.length}/{maxActiveLoans}</span></div>{activeLoans.length ? activeLoans.map(loan => <div className="loan-row" key={loan.id}><span>{loan.type === 'bank' ? t('loan.bank') : t('loan.fromPlayer', { player: players.find(player => player.id === loan.lenderId)?.name ?? '' })}<small>{loan.installmentsTotal - loan.installmentsRemaining}/{loan.installmentsTotal} · {money(loan.installmentAmount)} {t('loan.perInstallment')}</small></span><strong>{money(loan.outstanding)}</strong><button className="button secondary" disabled={busy || phase !== 'awaitingAction' || balance < loan.outstanding} onClick={() => onAction('game:repay-loan', { loanId: loan.id })}>{t('loan.payoff')}</button></div>) : <p className="empty-assets">{t('loan.noActive')}</p>}</section>
            </div>

            <div className="wallet-sections" hidden={view !== 'account'}>
                <section className="account-section"><div className="debt-heading"><h3>{t('account.history')}</h3><span>{transactions.length}</span></div><div className="transaction-list">{transactions.slice(-8).reverse().map(transaction => <div className="transaction-row" key={transaction.id}><span>{transaction.description}</span><strong>{money(transaction.amount)}</strong></div>)}</div></section>

                <section className="account-section emergency-fund-section">
                    <header className="emergency-fund-heading"><span className="emergency-fund-icon"><ShieldCheck size={20} /></span><div className="emergency-fund-copy"><h3>{t('education.fundTitle')}</h3><p>{t('education.fundIntro')}</p></div><div className="emergency-fund-balance"><span>{t('education.fundBalance')}</span><strong>{money(props.emergencyFundBalance)}</strong></div></header>
                    <p className="account-hint fund-availability">{t('education.availableNow')}</p>
                    <FinancialSummary className="emergency-fund-metrics" items={[
                        { label: t('education.interestRate'), value: formatPercent(props.financialEducation.emergencyFundInterestRateBpsPerCycle) },
                        { label: t('education.previousInterest'), value: money(props.emergencyFundInterestPrevious) },
                        { label: t('education.totalInterest'), value: money(props.emergencyFundInterestTotal), featured: true },
                    ]} />
                    <p className="account-hint">{t('education.cycleRule')}</p>
                    {props.pendingObligations > 0 && <p className="account-hint">{t('education.pendingObligations', { amount: money(props.pendingObligations) })}</p>}
                    <label htmlFor="emergency-fund-amount">{t('education.fundAmount')}</label><input id="emergency-fund-amount" type="number" min="1" step="1" value={fundAmount} onChange={event => setFundAmount(event.target.value)} />
                    <div className="action-buttons"><button className="button secondary" disabled={busy || !Number.isSafeInteger(Number(fundAmount)) || Number(fundAmount) <= 0 || balance < Number(fundAmount)} onClick={() => beginFundAction('deposit')}>{t('education.deposit')}</button><button className="button secondary" disabled={busy || !Number.isSafeInteger(Number(fundAmount)) || Number(fundAmount) <= 0 || props.emergencyFundBalance < Number(fundAmount)} onClick={() => beginFundAction('withdraw')}>{t('education.withdraw')}</button></div>
                    {fundAction && <div className="payment-confirm"><p>{t(fundAction === 'deposit' ? 'education.confirmDeposit' : 'education.confirmWithdraw', { amount: money(Number(fundAmount)) })}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={confirmFundAction}>{t('payment.confirm')}</button><button className="button secondary" disabled={busy} onClick={() => setFundAction(null)}>{t('leave.cancel')}</button></div></div>}
                </section>
            </div>
        </>}

        {view === 'investments' && <section className="investment-workspace">
            <header className="investment-overview">
                <div className="investment-intro"><div className="eyebrow">{t('education.investmentTitle')}</div><h2>{t('education.investmentIntro')}</h2><p>{t('education.liquidity')} {t('education.fictionalRates')}</p></div>
                <div className="investment-summary"><div><span>{t('account.balance')}</span><strong>{money(balance)}</strong></div><div><span>{t('education.investedPrincipal')}</span><strong>{money(investedPrincipal)}</strong></div><div><span>{t('education.activeInvestmentCount', { count: investments.filter(investment => investment.status === 'active' || investment.status === 'matured').length })}</span><strong>{investments.filter(investment => investment.status === 'matured').length}</strong></div></div>
            </header>
            <section className="investment-catalog">
                <div className="investment-catalog-heading"><div><div className="eyebrow">{t('education.productCatalog')}</div><p>{t('education.productCatalogHint')}</p></div></div>
                <label htmlFor="fixed-income-product">{t('education.chooseProduct')}</label><div className="investment-selector"><Landmark size={19} aria-hidden="true" /><select id="fixed-income-product" className="investment-combobox" value={selectedProductId} onChange={event => setSelectedProductId(event.target.value)}>{props.financialEducation.fixedIncomeProducts.map(product => <option key={product.id} value={product.id}>{t('education.productOptionLabel', { product: productName(product), rate: formatPercent(product.rateBpsPerCycle), method: t(product.interestMethod === 'simple' ? 'education.simple' : 'education.compound') })}</option>)}</select><ChevronDown size={17} aria-hidden="true" /></div>
                {selectedProduct && <>
                    <p>{productExplanation(selectedProduct)}</p>
                    <div className="investment-product-stats"><div><span>{t('education.interestRate')}</span><strong>{formatPercent(selectedProduct.rateBpsPerCycle)}</strong></div><div><span>{t('education.interestMethod')}</span><strong>{t(selectedProduct.interestMethod === 'simple' ? 'education.simple' : 'education.compound')}</strong></div><div><span>{t('education.payoutMode')}</span><strong>{selectedProduct.maturityPayout === 'together' ? t('education.payoutTogether') : t('education.payoutSeparate')}</strong></div></div>
                    <p className="account-hint">{selectedProduct.allowEarlyWithdrawal ? t('education.earlyAllowedLocalized', { penalty: formatPercent(selectedProduct.earlyWithdrawalPenaltyBps) }) : t('education.earlyLocked')} {t('education.earlyDefinition')}</p>
                    <label htmlFor="fixed-income-principal">{t('education.principal')}</label><input id="fixed-income-principal" type="number" min="1" step="1" value={investmentAmount} onChange={event => setInvestmentAmount(event.target.value)} />
                    <label htmlFor="fixed-income-term">{t('education.chooseTerm')}</label><div className="investment-selector term-selector"><CalendarDays size={19} aria-hidden="true" /><select id="fixed-income-term" className="investment-combobox" value={termCycles} onChange={event => setTermCycles(event.target.value)}>{selectedProduct.availableTermsCycles.map(term => <option key={term} value={term}>{t('education.termCycles', { count: term })}</option>)}</select><ChevronDown size={17} aria-hidden="true" /></div>
                    <div className="investment-return"><div><span>{t('education.estimatedInterest')}</span><strong>{investmentTerms ? money(investmentTerms.interestAmount) : '...'}</strong></div><div><span>{t('education.estimatedMaturity')}</span><strong>{investmentTerms ? money(investmentTerms.maturityAmount) : '...'}</strong></div></div>
                    <p className="account-hint">{t('education.estimateNote')}</p>
                    <button className="button primary" disabled={busy || !props.canCreateInvestment || !investmentRequestValid || !investmentTerms || Number(investmentAmount) > balance} onClick={() => { setInvestmentOperationId(crypto.randomUUID()); setCreateInvestmentConfirmation(true); }}>{t('education.createInvestment')}</button>
                    {createInvestmentConfirmation && investmentTerms && <div className="payment-confirm"><p>{t('education.confirmInvestment', { principal: money(investmentTerms.principal), product: productName(selectedProduct), cycles: investmentTerms.termCycles, maturity: money(investmentTerms.maturityAmount) })}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={confirmCreateInvestment}>{t('payment.confirm')}</button><button className="button secondary" disabled={busy} onClick={() => setCreateInvestmentConfirmation(false)}>{t('leave.cancel')}</button></div></div>}
                </>}
            </section>
            <section className="investment-holdings">
                <div className="investment-catalog-heading"><div><div className="eyebrow">{t('education.yourInvestments')}</div><p>{t('education.holdingsHint')}</p></div></div>
                <div className="investment-list">{investments.length === 0 ? <p className="empty-assets">{t('education.noInvestments')}</p> : investments.map(investment => {
                    const expectedAmount = investment.maturityAmount ?? investment.estimatedMaturityAmount;
                    const penalty = earlyTerms(investment);
                    const statusKey = investment.status === 'active' ? 'education.statusActive' : investment.status === 'matured' ? 'education.statusMatured' : investment.status === 'claimed' ? 'education.statusClaimed' : 'education.statusEarly';
                    return <article className="investment-row" key={investment.id}>
                        <div className="debt-heading"><strong>{investmentName(investment)}</strong><span>{t(statusKey)}</span></div>
                        <div className="loan-preview"><span>{t('education.principal')}: {money(investment.principal)}</span><span>{formatPercent(investment.rateBpsPerCycle)} / {t('education.cycleUnit')} · {t(investment.interestMethod === 'simple' ? 'education.simple' : 'education.compound')}</span><span>{t('education.termCycles', { count: investment.termCycles })}</span><span>{t('education.createdAt', { cycle: investment.creationCycle })}</span><span>{t('education.maturityAt', { cycle: investment.maturityCycle })}</span><span>{t('education.estimatedInterest')}: {money(expectedAmount - investment.principal)}</span><strong>{t('education.estimatedMaturity')}: {money(expectedAmount)}</strong></div>
                        {investment.status === 'active' && (investment.allowEarlyWithdrawal ? <button className="button secondary" disabled={busy} onClick={() => setInvestmentAction({ investmentId: investment.id, kind: 'early' })}>{t('education.earlyWithdrawal')}</button> : <p className="account-hint">{t('education.earlyLocked')}</p>)}
                        {investment.status === 'matured' && (investment.maturityPayout === 'together' ? <button className="button primary" disabled={busy} onClick={() => setInvestmentAction({ investmentId: investment.id, kind: 'claim', part: 'together' })}>{t('education.claimMaturity', { amount: money(investment.maturityAmount ?? expectedAmount) })}</button> : <div className="action-buttons">{!investment.principalClaimed && <button className="button primary" disabled={busy} onClick={() => setInvestmentAction({ investmentId: investment.id, kind: 'claim', part: 'principal' })}>{t('education.claimPrincipal', { amount: money(investment.principal) })}</button>}{!investment.interestClaimed && <button className="button secondary" disabled={busy} onClick={() => setInvestmentAction({ investmentId: investment.id, kind: 'claim', part: 'interest' })}>{t('education.claimInterest', { amount: money(investment.accruedInterest) })}</button>}</div>)}
                    </article>;
                })}</div>
                {investmentAction && (() => {
                    const investment = investments.find(candidate => candidate.id === investmentAction.investmentId);
                    if (!investment) return null;
                    const penalty = earlyTerms(investment);
                    const amount = investmentAction.kind === 'early' ? penalty.payoutAmount : investmentAction.part === 'principal' ? investment.principal : investmentAction.part === 'interest' ? investment.accruedInterest : investment.maturityAmount ?? investment.estimatedMaturityAmount;
                    const prompt = investmentAction.kind === 'early' ? t('education.confirmEarly', { product: investmentName(investment), principal: money(investment.principal), interest: money(investment.accruedInterest), penalty: money(penalty.penaltyAmount), payout: money(amount) }) : t('education.confirmMaturity', { amount: money(amount) });
                    return <div className="payment-confirm"><p>{prompt}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={confirmInvestmentAction}>{t('payment.confirm')}</button><button className="button secondary" disabled={busy} onClick={() => setInvestmentAction(null)}>{t('leave.cancel')}</button></div></div>;
                })()}
            </section>
        </section>}
    </section>;
}
