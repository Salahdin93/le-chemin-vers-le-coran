import { useState, useMemo, FC } from 'react';
import { useStore } from '@/context/AppContext';
import { WizardData, RevisionFrequency } from '@/types';
import { LOGO_URL } from '@/constants/ui';
import Button from '@/components/ui/Button';

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
    });

    const updateData = (data: Partial<WizardData>) => setFormData(prev => ({ ...prev, ...data }));

    const stepsConfig = useMemo(() => [
        { id: 'resumeStart', titleKey: 'resumeDayPrompt', component: StepResumeStart, condition: mode === 'resume' },
        { id: 'readingHistory', titleKey: 'history', component: StepReadingHistory, condition: mode === 'resume' && wantsReading && (formData.resumeDay ?? 1) > 1 },
        { id: 'profileInfo', titleKey: 'profileInfo', component: StepProfileInfo, condition: flow === 'full', requiredFields: ['name'] },
        { id: 'initialChoice', titleKey: 'planChoice', component: StepInitialChoice, condition: flow === 'full' },
        { id: 'readingGoals', titleKey: 'readingGoals', component: StepReadingGoals, condition: wantsReading },
        { id: 'revisionPlan', titleKey: 'revisionPlan', component: StepRevisionPlan, condition: wantsRevision },
        { id: 'revisionSelection', titleKey: 'revisionSelection', component: StepRevisionSelection, condition: wantsRevision, requiredFields: ['revisionSelection'] },
        { id: 'resumeRevision', titleKey: 'resumeRevisionPoint', component: StepResumeRevision, condition: mode === 'resume' && wantsRevision && (formData.revisionSelection?.length ?? 0) > 0 },
        { id: 'revisionHistory', titleKey: 'revisionHistory', component: StepRevisionHistory, condition: mode === 'resume' && wantsRevision && (formData.resumeRevisionIndex ?? 0) > 0 },
        { id: 'appearance', titleKey: 'appearance', component: StepAppearance, condition: flow === 'full' },
        { id: 'security', titleKey: 'security', component: StepSecurity, condition: flow === 'full' },
        { id: 'terms', titleKey: 'termsOfUse', component: StepTerms, condition: flow === 'full', requiredFields: ['termsAccepted'] },
    ], [mode, flow, wantsReading, wantsRevision, formData.resumeDay, formData.revisionSelection?.length, formData.resumeRevisionIndex]);

    const activeSteps = useMemo(() => stepsConfig.filter(s => s.condition), [stepsConfig]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const isStepValid = useMemo(() => {
        const currentStepConfig = activeSteps[currentStepIndex];
        if (!currentStepConfig?.requiredFields) return true;
        return currentStepConfig.requiredFields.every(field => {
            const value = formData[field as keyof WizardData];
            if (field === 'passwordConfirm') return formData.password === formData.passwordConfirm && (formData.password?.length || 0) >= 4;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'boolean') return value === true;
            if (typeof value === 'string') return value.trim() !== '';
            return value != null;
        });
    }, [currentStepIndex, activeSteps, formData]);

    const nextStep = () => { if (currentStepIndex < activeSteps.length - 1) setCurrentStepIndex(currentStepIndex + 1); };
    const prevStep = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1);
        else dispatch({ type: 'SET_APP_SCREEN', payload: 'initial-choice' });
    };

    const handleFinish = () => {
        if (!isStepValid) return;
        const profileId = `profile_${Date.now()}`;
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
        <div className="fixed inset-0 bg-bg-main z-[100] flex flex-col">
            <div className="flex-grow overflow-y-auto p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    <header className="text-center mb-6">
                        <img src={LOGO_URL} alt="Logo" className="w-20 h-20 md:w-28 md:h-28 mx-auto object-contain mb-4" />
                        {currentStepInfo && (
                            <h3 className="text-lg md:text-xl font-bold mb-4">
                                {t('step', { current: currentStepIndex + 1, total: activeSteps.length })} - {t(currentStepInfo.titleKey)}
                            </h3>
                        )}
                        <div className="w-full bg-border-main rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-500"
                                style={{ width: `${((currentStepIndex + 1) / activeSteps.length) * 100}%` }}
                            ></div>
                        </div>
                    </header>

                    <main className="min-h-[200px]">
                        {renderStepContent()}
                    </main>
                </div>
            </div>

            <footer className="w-full p-4 bg-card-bg border-t border-border-main">
                <div className="flex justify-between items-center w-full max-w-2xl mx-auto">
                    <Button variant="ghost" onClick={prevStep}>
                        {t('back')}
                    </Button>
                    {currentStepIndex < activeSteps.length - 1 ? (
                        <Button onClick={nextStep} disabled={!isStepValid}>{t('next')}</Button>
                    ) : (
                        <Button onClick={handleFinish} variant="success" disabled={!isStepValid}>
                            {t('finish')}
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default Wizard;