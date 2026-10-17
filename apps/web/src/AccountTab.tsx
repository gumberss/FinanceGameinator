import { useEffect, useState } from 'react';
import { Banknote, Check, HandCoins, LoaderCircle, Wallet, X } from 'lucide-react';
import type { Locale, TranslationKey } from './i18n';

type Loan = { id: string; type: string; lenderId: string; principal: number; interestRate: number; installmentsTotal: number; installmentsRemaining: number; installmentAmount: number; outstanding: number };
type Payment = { id: string; type: 'rent' | 'tax' | 'loanInstallment'; amount: number; recipientName: string; installmentNumber?: number; installmentsTotal?: number; outstanding?: number };
type PendingLoan = { id: string; status: string; lenderId: string; borrowerId: string; requestedAmount: number; installmentsTotal: number; requestedInterestRate: number; principal: number | null; interestRate: number | null };
type LoanTerms = { principal: number; interestRate: number; installmentsTotal: number; installmentAmount: number; totalRepayment: number };
type PlayerOption = { id: string; name: string; balance: number };
type Transaction = { id: string; description: string; amount: number };
type Action = (event: string, payload?: Record<string, unknown>) => void;
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

interface AccountTabProps {
    locale: Locale;
    t: Translate;
    money: (amount: number) => string;
    balance: number;
    phase: string;
    activeLoans: Loan[];
    transactions: Transaction[];
    payment: Payment | null;
    pendingLoan: PendingLoan | null;
    playerId: string;
    playerName: string;
    players: PlayerOption[];
    canRequestLoan: boolean;
    loanAvailableThisCycle: boolean;
    maxActiveLoans: number;
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
    const {
        t, money, balance, phase, activeLoans, transactions, payment, pendingLoan, playerId, playerName,
        players, canRequestLoan, loanAvailableThisCycle, maxActiveLoans, maxInstallments, busy, loanAmount, onLoanAmount,
        installments, onInstallments, interestPercent, onInterestPercent, lenderId, onLenderId,
        bankTerms, requestTerms, offerPrincipal, onOfferPrincipal, offerInterest, onOfferInterest,
        offerTerms, onAction,
    } = props;
    const currentLender = lenderId || players.find(player => player.id !== playerId)?.id || '';
    const loanRequestValid = Number.isSafeInteger(Number(loanAmount)) && Number(loanAmount) > 0 && Number.isSafeInteger(Number(installments)) && Number(installments) > 0 && Number(installments) <= maxInstallments;
    const offerValid = Number.isSafeInteger(Number(offerPrincipal || pendingLoan?.requestedAmount)) && Number(offerPrincipal || pendingLoan?.requestedAmount) >= (pendingLoan?.requestedAmount ?? 1) && Number(offerPrincipal || pendingLoan?.requestedAmount) <= balance;

    useEffect(() => setConfirmPayment(false), [payment?.id]);

    return <section className="asset-panel account-panel">
        <div className="asset-header"><span className="asset-icon"><Wallet size={24} /></span><div><div className="eyebrow">{t('account.balance')}</div><h2>{money(balance)}</h2></div></div>
        <p className="asset-description">{t('account.description')}</p>

        {payment && <section className="account-section pending-payment"><div className="eyebrow">{payment.type === 'loanInstallment' ? t('payment.installment') : t('payment.pending')}</div><h3>{money(payment.amount)}</h3><p>{payment.type === 'rent' ? t('payment.rentTo', { player: payment.recipientName }) : payment.type === 'tax' ? t('payment.bankTax') : t('payment.installmentDetails', { number: payment.installmentNumber ?? 1, total: payment.installmentsTotal ?? 1, balance: money(payment.outstanding ?? 0) })}</p>{balance >= payment.amount ? <button className="button primary" disabled={busy || confirmPayment} onClick={() => setConfirmPayment(true)}><Check size={18} />{t('payment.payNow')}</button> : <p>{t('payment.shortfall', { amount: money(payment.amount - balance) })}</p>}{confirmPayment && <div className="payment-confirm"><p>{t('payment.confirmPrompt', { amount: money(payment.amount) })}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={() => { onAction('game:pay', { paymentId: payment.id }); setConfirmPayment(false); }}><Check size={18} />{t('payment.confirm')}</button><button className="button secondary" disabled={busy} onClick={() => setConfirmPayment(false)}><X size={16} />{t('leave.cancel')}</button></div></div>}</section>}

        {canRequestLoan && <section className="account-section loan-request-section"><div className="debt-heading"><h3>{t('loan.request')}</h3><span>{t('loan.activeCount', { count: activeLoans.length })}</span></div><p className="account-hint">{t('loan.cycleAvailable')} {t('loan.activeLimit', { max: maxActiveLoans })}</p>
            <label htmlFor="account-loan-amount">{t('loan.amount')}</label><input id="account-loan-amount" type="number" min="1" step="1" value={loanAmount} onChange={event => onLoanAmount(event.target.value)} />
            <label htmlFor="account-loan-installments">{t('loan.installments')}</label><input id="account-loan-installments" type="number" min="1" max={maxInstallments} step="1" value={installments} onChange={event => onInstallments(event.target.value)} />
            <div className="loan-preview"><strong>{t('loan.rate')}: {bankTerms ? `${(bankTerms.interestRate * 100).toFixed(1)}%` : '...'}</strong><span>{t('loan.installmentAmount')}: {bankTerms ? money(bankTerms.installmentAmount) : '...'}</span><span>{t('loan.total')}: {bankTerms ? money(bankTerms.totalRepayment) : '...'}</span></div>
            <button className="button primary" disabled={busy || !loanRequestValid || !bankTerms || activeLoans.length >= maxActiveLoans || !loanAvailableThisCycle} onClick={() => onAction('game:bank-loan', { amount: Number(loanAmount), installments: Number(installments) })}><Banknote size={18} />{t('loan.requestBank')}</button>
            {players.filter(player => player.id !== playerId).length > 0 && <div className="player-loan-request"><label htmlFor="account-loan-lender">{t('loan.selectLender')}</label><select id="account-loan-lender" value={currentLender} onChange={event => onLenderId(event.target.value)}>{players.filter(player => player.id !== playerId).map(player => <option key={player.id} value={player.id}>{player.name} · {money(player.balance)}</option>)}</select><label htmlFor="account-loan-rate">{t('loan.proposedRate')}</label><input id="account-loan-rate" type="number" min="0" max="100" step="0.1" value={interestPercent} onChange={event => onInterestPercent(event.target.value)} /><div className="loan-preview"><strong>{t('loan.installmentAmount')}: {requestTerms ? money(requestTerms.installmentAmount) : '...'}</strong><span>{t('loan.total')}: {requestTerms ? money(requestTerms.totalRepayment) : '...'}</span></div><button className="button secondary" disabled={busy || !loanRequestValid || !requestTerms || activeLoans.length >= maxActiveLoans || !loanAvailableThisCycle} onClick={() => onAction('game:request-player-loan', { lenderId: currentLender, amount: Number(loanAmount), installments: Number(installments), interestRate: Number(interestPercent) / 100 })}><HandCoins size={18} />{t('loan.requestPlayer')}</button></div>}
            {!loanAvailableThisCycle && <p className="account-hint">{t('loan.cycleUsed')}</p>}{activeLoans.length >= maxActiveLoans && <p className="account-hint">{t('loan.maxActive')}</p>}
        </section>}

        {pendingLoan && <section className="account-section pending-loan-section"><div className="eyebrow">{t('loan.proposal')}</div>{pendingLoan.status === 'requested' && pendingLoan.lenderId === playerId ? <><h3>{players.find(player => player.id === pendingLoan.borrowerId)?.name} · {money(pendingLoan.requestedAmount)}</h3><p>{t('loan.installments')}: {pendingLoan.installmentsTotal}</p><label htmlFor="lender-offer-principal">{t('loan.principal')}</label><input id="lender-offer-principal" type="number" min={pendingLoan.requestedAmount} max={balance} value={offerPrincipal || String(pendingLoan.requestedAmount)} onChange={event => onOfferPrincipal(event.target.value)} /><label htmlFor="lender-offer-rate">{t('loan.rate')}</label><input id="lender-offer-rate" type="number" min="0" max="100" step="0.1" value={offerInterest} onChange={event => onOfferInterest(event.target.value)} /><div className="loan-preview"><span>{t('loan.installmentAmount')}: {offerTerms ? money(offerTerms.installmentAmount) : '...'}</span><span>{t('loan.total')}: {offerTerms ? money(offerTerms.totalRepayment) : '...'}</span></div><div className="action-buttons"><button className="button primary" disabled={busy || !offerTerms || !offerValid} onClick={() => onAction('game:respond-player-loan', { accept: true, principal: Number(offerPrincipal || pendingLoan.requestedAmount), interestRate: Number(offerInterest) / 100 })}>{t('loan.sendOffer')}</button><button className="button secondary" disabled={busy} onClick={() => onAction('game:respond-player-loan', { accept: false })}>{t('offer.reject')}</button></div></> : pendingLoan.status === 'requested' && pendingLoan.borrowerId === playerId ? <><p>{t('loan.requestPending')}</p><p>{pendingLoan.installmentsTotal} · {money(pendingLoan.requestedAmount)}</p><button className="button secondary" disabled={busy} onClick={() => onAction('game:cancel-player-loan')}>{t('loan.cancel')}</button></> : pendingLoan.status === 'offered' && pendingLoan.borrowerId === playerId ? <><h3>{t('loan.offerFrom', { player: players.find(player => player.id === pendingLoan.lenderId)?.name ?? '' })}</h3><p>{money(pendingLoan.principal ?? 0)} · {((pendingLoan.interestRate ?? 0) * 100).toFixed(1)}% · {pendingLoan.installmentsTotal}</p><p>{t('loan.installmentAmount')}: {money(Math.ceil((pendingLoan.principal! + Math.round(pendingLoan.principal! * pendingLoan.interestRate!)) / pendingLoan.installmentsTotal))}</p><p>{t('loan.total')}: {money(pendingLoan.principal! + Math.round(pendingLoan.principal! * pendingLoan.interestRate!))}</p><div className="action-buttons"><button className="button primary" disabled={busy} onClick={() => onAction('game:respond-player-loan', { accept: true })}>{t('loan.accept')}</button><button className="button secondary" disabled={busy} onClick={() => onAction('game:respond-player-loan', { accept: false })}>{t('offer.reject')}</button></div></> : <p>{t('loan.requestPending')}</p>}</section>}

        <section className="account-section"><div className="debt-heading"><h3>{t('loan.active')}</h3><span>{activeLoans.length}/{maxActiveLoans}</span></div>{activeLoans.length ? activeLoans.map(loan => <div className="loan-row" key={loan.id}><span>{loan.type === 'bank' ? t('loan.bank') : t('loan.fromPlayer', { player: players.find(player => player.id === loan.lenderId)?.name ?? '' })}<small>{loan.installmentsTotal - loan.installmentsRemaining}/{loan.installmentsTotal} · {money(loan.installmentAmount)} {t('loan.perInstallment')}</small></span><strong>{money(loan.outstanding)}</strong><button className="button secondary" disabled={busy || phase !== 'awaitingAction' || balance < loan.outstanding} onClick={() => onAction('game:repay-loan', { loanId: loan.id })}>{t('loan.payoff')}</button></div>) : <p className="empty-assets">{t('loan.noActive')}</p>}</section>

        <section className="account-section"><div className="debt-heading"><h3>{t('account.history')}</h3><span>{transactions.length}</span></div><div className="transaction-list">{transactions.slice(-8).reverse().map(transaction => <div className="transaction-row" key={transaction.id}><span>{transaction.description}</span><strong>{money(transaction.amount)}</strong></div>)}</div></section>
    </section>;
}
