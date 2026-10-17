import { Check, HeartHandshake, ShieldCheck, Sparkles, Sprout, UserRound } from 'lucide-react';
import type { Locale, TranslationKey } from './i18n';

type Attributes = { happiness: number; financialSecurity: number; wellBeing: number; personalDevelopment: number; socialLife: number };
type Loan = { borrowerId: string; installmentsRemaining: number; outstanding: number };
type Transaction = { type: string; from: string; to: string; amount: number; details?: Record<string, string | number | boolean | null> };
type GoalTargets = { emergencyFundTarget: number; financialSecurityTarget: number; maxOutstandingDebt: number; leisureEventCount: number };
type Translate = (key: TranslationKey, values?: Record<string, string | number | boolean>) => string;

type QualityOfLifeTabProps = {
    t: Translate;
    money: (amount: number) => string;
    playerId: string;
    attributes: Attributes;
    completedGoals: string[];
    emergencyFundBalance: number;
    leisureEventCount: number;
    loans: Loan[];
    transactions: Transaction[];
    propertyCount: number;
    targets: GoalTargets;
};

export function QualityOfLifeTab({ t, money, playerId, attributes, completedGoals, emergencyFundBalance, leisureEventCount, loans, transactions, propertyCount, targets }: QualityOfLifeTabProps) {
    const currentDebt = loans.filter(loan => loan.borrowerId === playerId && loan.installmentsRemaining > 0).reduce((sum, loan) => sum + loan.outstanding, 0);
    const borrowedTotal = transactions.filter(transaction => transaction.type === 'loan' && transaction.to === playerId).reduce((sum, transaction) => {
        const total = transaction.details?.totalRepayment;
        return sum + (typeof total === 'number' ? total : transaction.amount);
    }, 0);
    const goals = [
        { id: 'emergency-fund', label: 'qol.goal.emergencyFund', description: 'qol.goal.emergencyFundHint', progress: Math.min(emergencyFundBalance, targets.emergencyFundTarget), target: targets.emergencyFundTarget, completed: completedGoals.includes('emergency-fund'), format: 'money' as const },
        { id: 'financial-security', label: 'qol.goal.financialSecurity', description: 'qol.goal.financialSecurityHint', progress: Math.min(attributes.financialSecurity, targets.financialSecurityTarget), target: targets.financialSecurityTarget, completed: completedGoals.includes('financial-security'), format: 'number' as const },
        { id: 'reduce-debt', label: 'qol.goal.reduceDebt', description: 'qol.goal.reduceDebtHint', progress: borrowedTotal > 0 ? Math.min(borrowedTotal, Math.max(0, borrowedTotal - currentDebt)) : 0, target: borrowedTotal || 1, completed: completedGoals.includes('reduce-debt'), format: 'money' as const },
        { id: 'start-investing', label: 'qol.goal.startInvesting', description: 'qol.goal.startInvestingHint', progress: transactions.some(transaction => transaction.type === 'investmentCreated' && transaction.from === playerId) ? 1 : 0, target: 1, completed: completedGoals.includes('start-investing'), format: 'number' as const },
        { id: 'own-property', label: 'qol.goal.ownProperty', description: 'qol.goal.ownPropertyHint', progress: Math.min(propertyCount, 1), target: 1, completed: completedGoals.includes('own-property'), format: 'number' as const },
        { id: 'enjoy-life', label: 'qol.goal.enjoyLife', description: 'qol.goal.enjoyLifeHint', progress: Math.min(leisureEventCount, targets.leisureEventCount), target: targets.leisureEventCount, completed: completedGoals.includes('enjoy-life'), format: 'number' as const },
    ];
    const attributesList = [
        { id: 'happiness', value: attributes.happiness, icon: Sparkles },
        { id: 'financialSecurity', value: attributes.financialSecurity, icon: ShieldCheck },
        { id: 'wellBeing', value: attributes.wellBeing, icon: HeartHandshake },
        { id: 'personalDevelopment', value: attributes.personalDevelopment, icon: Sprout },
        { id: 'socialLife', value: attributes.socialLife, icon: UserRound },
    ];
    const progressLabel = (goal: typeof goals[number]) => goal.format === 'money'
        ? `${money(goal.progress)} / ${money(goal.target)}`
        : `${goal.progress} / ${goal.target}`;

    return <section className="quality-workspace">
        <header className="quality-overview">
            <div><div className="eyebrow">{t('qol.optional')}</div><p>{t('qol.nonCompetitive')}</p></div>
        </header>
        <section className="quality-section">
            <div className="quality-section-heading"><div><div className="eyebrow">{t('qol.attributes')}</div><p>{t('qol.attributeIntro')}</p></div></div>
            <div className="quality-attribute-list">{attributesList.map(attribute => {
                const Icon = attribute.icon;
                return <article className="quality-attribute" key={attribute.id}>
                    <div className="quality-attribute-heading"><span className="quality-icon"><Icon size={18} /></span><div><strong>{t(`qol.attribute.${attribute.id}` as TranslationKey)}</strong><p>{t(`qol.attribute.${attribute.id}Hint` as TranslationKey)}</p></div><span className="quality-score">{attribute.value}</span></div>
                    <div className="quality-meter" role="progressbar" aria-label={t(`qol.attribute.${attribute.id}` as TranslationKey)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={attribute.value}><span style={{ width: `${attribute.value}%` }} /></div>
                </article>;
            })}</div>
        </section>
        <section className="quality-section">
            <div className="quality-section-heading"><div><div className="eyebrow">{t('qol.goals')}</div><p>{t('qol.goalsIntro')}</p></div></div>
            <div className="quality-goal-list">{goals.map(goal => <article className={`quality-goal ${goal.completed ? 'completed' : ''}`} key={goal.id}>
                <div className="quality-goal-heading"><div><strong>{t(goal.label as TranslationKey)}</strong><p>{t(goal.description as TranslationKey)}</p></div>{goal.completed && <span className="quality-complete"><Check size={14} />{t('qol.completed')}</span>}</div>
                <div className="quality-goal-progress"><div className="quality-meter" role="progressbar" aria-label={t(goal.label as TranslationKey)} aria-valuemin={0} aria-valuemax={Math.max(goal.target, 1)} aria-valuenow={Math.min(goal.progress, goal.target)}><span style={{ width: `${goal.target > 0 ? Math.min(100, goal.progress / goal.target * 100) : 0}%` }} /></div><span>{progressLabel(goal)}</span></div>
            </article>)}</div>
        </section>
    </section>;
}
