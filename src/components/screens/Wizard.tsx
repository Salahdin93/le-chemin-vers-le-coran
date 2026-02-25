import { useState, useMemo, FC } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { WizardData, RevisionFrequency } from '@/types';
import { LOGO_URL_DARK } from '@/constants/ui';
import Button from '@/components/ui/Button';
import { generateUUID } from '@/utils/uuid';

import StepInitialChoice from './wizard/StepInitialChoice';
import StepProfileInfo from './wizard/StepProfileInfo';
import StepReadingGoals from './wizard/StepReadingGoals';
import StepRevisionPlan from './wizard/StepRevisionPlan';
import StepRevisionSelection from './wizard/StepRevisionSelection';
import StepAppearance from './wizard/StepAppearance';
import StepSecurity from './wizard/StepSecurity';
import StepTerms from './wizard/StepTerms';
import StepResumeStart from './wizard/StepResumeStart';
import StepReadingHistory from './wizard/StepReadingHistory';
import StepResumeRevision from './wizard/StepResumeRevision';
import StepRevisionHistory from './wizard/StepRevisionHistory';
import StepResumeExisting from './wizard/StepResumeExisting';
import StepHadithPlan from './wizard/StepHadithPlan';
import StepHadithSelection from './wizard/StepHadithSelection';

const Wizard: FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const { mode, type: flow } = state.wizard;

    const [wantsReading, setWantsReading] = useState(flow === 'full' || flow === 'reading');
    const [wantsRevision, setWantsRevision] = useState(flow === 'full' || flow === 'revision');

    const [formData, setFormData] = useState<Partial<WizardData>>({
        name: activeProfile?.name || '',
        gender: activeProfile?.gender || 'male',
        password: '',
        passwordConfirm: '',
        termsAccepted: false,
        duration: activeProfile?.goals.reading?.duration || 30,
        khatmas: activeProfile?.goals.reading?.khatmas || 1,
        kahfOption: activeProfile?.goals.reading?.kahfOption || false,
        kahfPages: activeProfile?.goals.reading?.kahfPages || 0,
        revisionSelection: activeProfile?.goals.revision?.selection || [],
        revisionMode: activeProfile?.goals.revision?.revisionMode || 'hizb',
        unitsPerDay: activeProfile?.goals.revision?.unitsPerDay || 1,
        revisionDuration: activeProfile?.goals.revision?.revisionDuration || 30,
        revisionFrequency: activeProfile?.goals.revision?.frequency || { type: 'daily', value: 1 },
        boosterSurahs: activeProfile?.goals.revision?.boosterSurahs || [],
        boosterSurahFreq: activeProfile?.goals.revision?.boosterSurahFreq || 7,
        resumeDay: 1,
        resumeRevisionIndex: 0,
        accentColor: activeProfile?.accentColor || '#2E7D32',
        theme: activeProfile?.theme || 'light',
        enableNotifications: state.settings.enableNotifications,
        resumeReadingHistory: {},
        resumeRevisionPlan: [],
        wantsReading: flow === 'full' || flow === 'reading',
        wantsRevision: flow === 'full' || flow === 'revision',
        wantsHadith: false,
        hadithType: 'lecture',
        hadithPerDay: 1,
        hadithDuration: 30,
        hadithFrequency: { type: 'daily', value: 1 },
        resumeExistingReading: undefined,
        existingDaysRead: 0,
        existingPagesRead: 0,
    });

    const updateData = (data: Partial<WizardData>) => setFormData(prev => ({ ...prev, ...data }));

    const stepsConfig = useMemo(() => [
        { id: 'resumeStart', titleKey: 'resumeDayPrompt', component: StepResumeStart, condition: mode === 'resume' },
        { id: 'readingHistory', titleKey: 'history', component: StepReadingHistory, condition: mode === 'resume' && wantsReading && (formData.resumeDay ?? 1) > 1 },
        { id: 'profileInfo', titleKey: 'profileInfo', component: StepProfileInfo, condition: flow === 'full', requiredFields: ['name'] },
        { id: 'initialChoice', titleKey: 'planChoice', component: StepInitialChoice, condition: flow === 'full' },
        { id: 'resumeExisting', titleKey: 'resumeExistingReading', component: StepResumeExisting, condition: flow === 'full' && (formData.wantsReading ?? true), requiredFields: ['resumeExistingReading'] },
        { id: 'readingGoals', titleKey: 'readingGoals', component: StepReadingGoals, condition: wantsReading },
        { id: 'revisionPlan', titleKey: 'revisionPlan', component: StepRevisionPlan, condition: wantsRevision },
        { id: 'revisionSelection', titleKey: 'revisionSelection', component: StepRevisionSelection, condition: wantsRevision, requiredFields: ['revisionSelection'] },
        { id: 'hadithSelection', titleKey: 'hadithSelectionTitle', component: StepHadithSelection, condition: flow === 'full' && !!formData.wantsHadith, requiredFields: ['hadithSelection'] },
        { id: 'hadithPlan', titleKey: 'hadithPlan', component: StepHadithPlan, condition: flow === 'full' && !!formData.wantsHadith },
        { id: 'resumeRevision', titleKey: 'resumeRevisionPoint', component: StepResumeRevision, condition: mode === 'resume' && wantsRevision && (formData.revisionSelection?.length ?? 0) > 0 },
        { id: 'revisionHistory', titleKey: 'revisionHistory', component: StepRevisionHistory, condition: mode === 'resume' && wantsRevision && (formData.resumeRevisionIndex ?? 0) > 0 },
        { id: 'appearance', titleKey: 'appearance', component: StepAppearance, condition: flow === 'full' },
        { id: 'security', titleKey: 'security', component: StepSecurity, condition: flow === 'full' },
        { id: 'terms', titleKey: 'termsOfUse', component: StepTerms, condition: flow === 'full', requiredFields: ['termsAccepted'] },
    ], [mode, flow, wantsReading, wantsRevision, formData.wantsHadith, formData.wantsReading, formData.resumeDay, formData.revisionSelection?.length, formData.resumeRevisionIndex, formData.resumeExistingReading, formData.hadithType]);

    const activeSteps = useMemo(() => stepsConfig.filter(s => s.condition), [stepsConfig]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const isStepValid = useMemo(() => {
        const currentStepConfig = activeSteps[currentStepIndex];
        if (!currentStepConfig?.requiredFields) return true;
        return currentStepConfig.requiredFields.every(field => {
            const value = formData[field as keyof WizardData];
            if (field === 'passwordConfirm') return formData.password === formData.passwordConfirm && (formData.password?.length || 0) >= 4;
            if (Array.isArray(value)) return value.length > 0;
            if (field === 'termsAccepted') return value === true;
            if (typeof value === 'string') return value.trim() !== '';
            return value !== undefined && value !== null;
        });
    }, [currentStepIndex, activeSteps, formData]);

    const nextStep = () => { if (currentStepIndex < activeSteps.length - 1) setCurrentStepIndex(currentStepIndex + 1); };
    const prevStep = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1);
        else dispatch({ type: 'SET_APP_SCREEN', payload: 'initial-choice' });
    };

    const handleFinish = () => {
        if (!isStepValid) return;
        const profileId = generateUUID();
        const startDate = new Date().toISOString().split('T')[0];
        dispatch({ type: 'FINISH_WIZARD', payload: { wizardData: formData, mode, profileId, startDate } });
    };

    const CurrentStepComponent = activeSteps[currentStepIndex]?.component;
    const currentStepInfo = activeSteps[currentStepIndex];

    const renderStepContent = () => {
        if (!CurrentStepComponent) return null;
        const props: any = {
            formData, updateData, t,
            wantsReading, setWantsReading,
            wantsRevision, setWantsRevision,
            updateFreq: (freq: Partial<RevisionFrequency>) => updateData({ revisionFrequency: { ...formData.revisionFrequency!, ...freq } }),
            toggleSelection: (id: string, list: 'revisionSelection' | 'boosterSurahs') => {
                const currentSelection = formData[list] || [];
                const newSelection = currentSelection.includes(id) ? currentSelection.filter(item => item !== id) : [...currentSelection, id];
                updateData({ [list]: newSelection });
            },
        };
        return <CurrentStepComponent {...props} />;
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #052e16 0%, #064e3b 35%, #065f46 60%, #047857 100%)' }}
        >
            {/* Geometric Pattern Overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='0.8'%3E%3Cpolygon points='40,5 55,20 75,20 60,35 67,55 40,45 13,55 20,35 5,20 25,20'/%3E%3Ccircle cx='40' cy='40' r='18'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '80px 80px',
                }}
            />

            <div className="flex-grow overflow-y-auto p-4 md:p-10 flex flex-col items-center">
                <div className="w-full max-w-2xl relative z-10 pt-4">
                    <header className="text-center mb-10">
                        <motion.div
                            initial={{ y: -10, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                            className="mb-6 flex justify-center"
                        >
                            {/* Logo container premium — identique à AuthScreen */}
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 0 40px rgba(52,211,153,0.2)',
                                }}
                            >
                                <img src={LOGO_URL_DARK} alt="Logo" className="w-12 h-12 object-contain" />
                            </div>
                        </motion.div>

                        {currentStepInfo && (
                            <div className="space-y-5">
                                {/* Titre de l'étape */}
                                <h3
                                    className="text-xl md:text-2xl font-black tracking-tight"
                                    style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #d1fae5 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    {t(currentStepInfo.titleKey)}
                                </h3>

                                {/* Barre de progression premium */}
                                <div className="flex flex-col gap-2">
                                    {/* Labels Étape / Pourcentage */}
                                    <div className="flex justify-between items-center">
                                        <span
                                            className="text-[10px] font-black uppercase tracking-widest"
                                            style={{ color: 'rgba(167,243,208,0.7)' }}
                                        >
                                            {t('step', { current: currentStepIndex + 1, total: activeSteps.length })}
                                        </span>
                                        <span
                                            className="text-[10px] font-black uppercase tracking-widest"
                                            style={{ color: 'rgba(167,243,208,0.7)' }}
                                        >
                                            {Math.round(((currentStepIndex + 1) / activeSteps.length) * 100)}%
                                        </span>
                                    </div>

                                    {/* Track glassmorphism */}
                                    <div
                                        className="w-full rounded-full overflow-hidden relative"
                                        style={{
                                            height: '10px',
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                                        }}
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentStepIndex + 1) / activeSteps.length) * 100}%` }}
                                            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                                            className="h-full rounded-full relative overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
                                                boxShadow: '0 0 16px rgba(52,211,153,0.7), 0 0 4px rgba(255,255,255,0.3)',
                                            }}
                                        >
                                            {/* Shimmer inside the bar */}
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                                    animation: 'shimmer 2s infinite',
                                                }}
                                            />
                                        </motion.div>
                                    </div>

                                    {/* Dots pour chaque étape */}
                                    <div className="flex justify-between mt-1 px-0.5">
                                        {activeSteps.map((_, i) => (
                                            <div
                                                key={i}
                                                className="rounded-full transition-all duration-500"
                                                style={{
                                                    width: i === currentStepIndex ? '16px' : '6px',
                                                    height: '6px',
                                                    background: i <= currentStepIndex
                                                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                        : 'rgba(255,255,255,0.12)',
                                                    boxShadow: i === currentStepIndex
                                                        ? '0 0 8px rgba(52,211,153,0.7)'
                                                        : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </header>


                    <main className="min-h-[200px]">
                        {renderStepContent()}
                    </main>
                </div>
            </div>

            <footer className="w-full p-6 relative z-10" style={{ background: 'rgba(5, 46, 22, 0.4)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex justify-between items-center w-full max-w-2xl mx-auto">
                    <Button variant="ghost" className="text-emerald-100/40 border-none bg-transparent hover:bg-white/5" onClick={prevStep}>
                        {t('back')}
                    </Button>
                    {currentStepIndex < activeSteps.length - 1 ? (
                        <Button
                            onClick={nextStep}
                            disabled={!isStepValid}
                            className="px-10 py-4 shadow-xl shadow-emerald-900/40"
                        >
                            {t('next')}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            variant="success"
                            disabled={!isStepValid}
                            className="px-10 py-4 shadow-xl shadow-emerald-900/40"
                        >
                            {t('finish')}
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default Wizard;