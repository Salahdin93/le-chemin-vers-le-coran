import React from 'react';
import Modal from './Modal';
import { useStore } from '@/context/AppContext';
import Button from './Button';


interface EndOfGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EndOfGoalModal: React.FC<EndOfGoalModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch, activeProfile, t } = useStore();

    const handleContinue = () => {
        if (!activeProfile?.goals.reading) return;
        dispatch({ type: 'EXTEND_DURATION', payload: 30 });
        dispatch({ type: 'SET_TOAST', payload: t('goalExtendedToast') });
        onClose();
    };

    const handleStop = () => {
        if (!activeProfile?.goals.reading || !state.plans.reading) return;

        const completedGoal = {
            khatmas: activeProfile.goals.reading.khatmas,
            duration: activeProfile.goals.reading.duration,
            completedAt: new Date().toLocaleDateString(state.settings.lang),
            dailyHistory: state.progress.readingHistory,
        };

        dispatch({ type: 'COMPLETE_GOAL', payload: { type: 'reading', goal: completedGoal } });
        dispatch({ type: 'SET_TOAST', payload: t('goalArchivedToast') });

        dispatch({ type: 'RESET_PROGRESS' });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">{t('endOfGoalTitle')}</h3>
            <p className="mb-6">
                {t('endOfGoalMessage', { duration: activeProfile?.goals.reading?.duration || 0 })}
            </p>
            <div className="flex flex-col gap-3">
                <Button onClick={handleContinue}>
                    {t('extendGoal')}
                    <span className="text-xs opacity-80 ml-2">({t('allahEase')})</span>
                </Button>
                <Button variant="secondary" onClick={handleStop}>
                    {t('stopAndArchiveGoal')}
                    <span className="text-xs opacity-80 ml-2">({t('jazzkAllahKhayran')})</span>
                </Button>
            </div>
        </Modal>
    );
};

export default EndOfGoalModal;