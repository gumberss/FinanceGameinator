import { useEffect, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import type { TranslationKey } from './i18n';

type Terms = { originalPrice: number; payout: number; interest: number; settlement: number; negotiatedPrice?: number; sellerProceeds?: number; mortgaged: boolean; bankSalePrice: number; bankSaleNet: number };
type Props = {
    code: string; token: string; propertyId: string; amount?: number;
    t: (key: TranslationKey) => string; money: (amount: number) => string;
    busy: boolean; bankSale?: boolean; onConfirm?: () => void;
};

export function PropertyFinance({ code, token, propertyId, amount, t, money, busy, bankSale = false, onConfirm }: Props) {
    const requestId = JSON.stringify([code, token, propertyId, amount]);
    const [quote, setQuote] = useState<{ requestId: string; terms: Terms } | null>(null);
    const terms = quote?.requestId === requestId ? quote.terms : null;
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        setQuote(null); setFailed(false);
        const timer = setTimeout(() => {
            void fetch('/api/rooms/property-terms', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, token, propertyId, amount }), signal: controller.signal,
            }).then(async response => {
                if (!response.ok) throw new Error('Invalid property terms');
                return await response.json() as Terms;
            }).then(result => { if (!controller.signal.aborted) setQuote({ requestId, terms: result }); })
                .catch(() => { if (!controller.signal.aborted) setFailed(true); });
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [code, token, propertyId, amount, requestId]);

    return <section className="property-finance" aria-label={t('mortgage.preview')}>
        {!terms ? <p role="status">{failed ? t('mortgage.invalid') : <><LoaderCircle size={14} className="spin" />{t('mortgage.loading')}</>}</p> : <>
            <dl className="financial-summary">
                {amount !== undefined && <div><dt>{t('mortgage.price')}</dt><dd>{money(terms.negotiatedPrice ?? 0)}</dd></div>}
                <div><dt>{t('mortgage.original')}</dt><dd>{money(terms.originalPrice)}</dd></div>
                <div><dt>{t('mortgage.payout')}</dt><dd>{money(terms.payout)}</dd></div>
                <div><dt>{t('mortgage.interest')}</dt><dd>{money(terms.interest)}</dd></div>
                <div><dt>{t('mortgage.settlement')}</dt><dd>{money(terms.settlement)}</dd></div>
                {bankSale && <><div><dt>{t('mortgage.bankGross')}</dt><dd>{money(terms.bankSalePrice)}</dd></div><div className="featured"><dt>{t('mortgage.bankNet')}</dt><dd>{money(terms.bankSaleNet)}</dd></div></>}
                {amount !== undefined && <div className="featured"><dt>{t('mortgage.proceeds')}</dt><dd>{money(terms.sellerProceeds ?? 0)}</dd></div>}
            </dl>
            <p>{bankSale ? t('mortgage.bankRule') : amount === undefined ? t('mortgage.zeroRent') : t('mortgage.netRule')}</p>
            {!bankSale && <p>{amount === undefined ? t('mortgage.updatedWarning') : t('mortgage.clear')}</p>}
        </>}
        {onConfirm && <button className="button primary" disabled={busy || !terms} onClick={onConfirm}><Check size={16} />{t(bankSale ? 'mortgage.bankConfirm' : amount === undefined ? 'mortgage.confirm' : 'mortgage.offer')}</button>}
    </section>;
}