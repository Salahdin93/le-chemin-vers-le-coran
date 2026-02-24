import React from 'react';
import Modal from './Modal';
import { useStore } from '@/context/AppContext';
import Button from './Button';
import { TOTAL_PAGES } from '@/constants/quranData';

interface EndOfGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EndOfGoalModal: React.FC<EndOfGoalModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch, t, activeProfile } = useStore();

    const handleContinue = () => {
        if (!activeProfile?.goals.reading) return;
        dispatch({ type: 'EXTEND_DURATION', payload: 30 });
        dispatch({ type: 'SET_TOAST', payload: "Objectif prolongé. Qu'Allah vous facilite !" });
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
        dispatch({ type: 'SET_TOAST', payload: "Objectif archivé. Baaraka Allahu fikoum pour vos efforts !" });
        
        dispatch({ type: 'RESET_PROGRESS' }); 
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">Fin de la durée de l'objectif</h3>
            <p className="mb-6">
                Masha'Allah, vous avez atteint la date de fin de votre objectif de {activeProfile?.goals.reading?.duration} jours.
                Il vous reste cependant des pages à lire pour le compléter. Que souhaitez-vous faire ?
            </p>
            <div className="flex flex-col gap-3">
                <Button onClick={handleContinue}>
                    Continuer jusqu'à la fin
                    <span className="text-xs opacity-80 ml-2">(Allahi sahal)</span>
                </Button>
                <Button variant="secondary" onClick={handleStop}>
                    Arrêter et archiver l'objectif
                    <span className="text-xs opacity-80 ml-2">(Jazzak Allahu Khayran)</span>
                </Button>
            </div>
        </Modal>
    );
};

export default EndOfGoalModal;