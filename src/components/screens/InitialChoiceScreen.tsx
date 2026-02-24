import React from 'react';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/context/AppContext';
import { WizardMode, WizardType } from '@/types';
import Button from '../ui/Button';

const ChoiceButton: React.FC<{ icon: string, title: string, description: string, onClick: () => void }> =
    ({ icon, title, description, onClick }) => (
    <div
        onClick={onClick}
        className="p-5 border-2 border-border-main rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-primary/10 hover:-translate-y-1"
    >
        <span className="text-3xl block mb-2">{icon}</span>
        <span className="font-bold text-lg">{title}</span>
        <p className="text-sm opacity-80 mt-2">{description}</p>
    </div>
);

const InitialChoiceScreen: React.FC = () => {
    const { dispatch, t } = useStore();

    const startWizard = (mode: WizardMode, type: WizardType) => {
        dispatch({ type: 'START_WIZARD', payload: { type, mode } });
    };

    const goBack = () => {
        dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' });
    };

    return (
        <Modal isOpen={true} closeOnClickOutside={false} className="text-center">
            <h3 className="text-2xl font-bold text-primary mb-6">{t('programType')}</h3>
            <div className="flex flex-col gap-5">
                <ChoiceButton
                    icon="🚀"
                    title={t('startNew')}
                    description={t('startNewDesc')}
                    onClick={() => startWizard('new', 'full')}
                />
                <ChoiceButton
                    icon="🔄"
                    title={t('resumeProgram')}
                    description={t('resumeProgramDesc')}
                    onClick={() => startWizard('resume', 'full')}
                />
            </div>
            <Button variant="ghost" className="mt-6" onClick={goBack}>
                {t('back')}
            </Button>
        </Modal>
    );
};

export default InitialChoiceScreen;