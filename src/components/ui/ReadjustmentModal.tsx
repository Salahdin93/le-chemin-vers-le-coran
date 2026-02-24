import React from 'react';
import Modal from './Modal';
import { useStore } from '@/context/AppContext';
import Button from './Button';

const ReadjustmentModal: React.FC = () => {
    const { state, dispatch } = useStore();
    const { isOpen, type } = state.readjustmentModal;

    const handleAdjustPace = () => {
        dispatch({ type: 'ADJUST_PACE' });
        dispatch({ type: 'SET_TOAST', payload: "Le rythme a été réajusté. Baaraka Allahu fik !" });
        handleClose();
    };

    const handleExtendDuration = () => {
        // Extend by 5 days for now, this could be made more dynamic
        const extensionDays = 5; 
        dispatch({ type: 'EXTEND_DURATION', payload: extensionDays });
        dispatch({ type: 'SET_TOAST', payload: `L'objectif a été prolongé. Allahi sahal !` });
        handleClose();
    };
    
    // In a real scenario, you might want different logic for getting ahead.
    // For now, we'll just offer to recalculate to read less per day.
    const handleRecalculatePaceAhead = () => {
        dispatch({ type: 'ADJUST_PACE' });
        dispatch({ type: 'SET_TOAST', payload: "Le rythme a été réajusté. Jazzak Allahu Khayran !" });
        handleClose();
    };

    const handleClose = () => {
        dispatch({ type: 'TOGGLE_READJUSTMENT_MODAL', payload: { isOpen: false, type: null } });
    };

    const renderContent = () => {
        if (type === 'behind') {
            return (
                <>
                    <h3 className="text-xl font-bold mb-4">Retard sur l'objectif de lecture</h3>
                    <p className="mb-6">Nous avons remarqué un retard sur votre plan. Que souhaitez-vous faire pour atteindre votre objectif ?</p>
                    <div className="flex flex-col gap-3">
                        <Button onClick={handleAdjustPace}>
                            Réajuster le rythme <span className="text-xs opacity-80 ml-2">(lire plus chaque jour)</span>
                        </Button>
                        <Button variant="secondary" onClick={handleExtendDuration}>
                            Prolonger l'objectif <span className="text-xs opacity-80 ml-2">(garder le même rythme)</span>
                        </Button>
                    </div>
                </>
            );
        }

        if (type === 'ahead') {
            return (
                <>
                    <h3 className="text-xl font-bold mb-4">Avance sur l'objectif de lecture</h3>
                    <p className="mb-6">Masha'Allah, vous êtes en avance ! Voulez-vous ajuster votre plan ?</p>
                    <div className="flex flex-col gap-3">
                        <Button onClick={handleRecalculatePaceAhead}>
                            Réduire le rythme <span className="text-xs opacity-80 ml-2">(terminer à la date prévue)</span>
                        </Button>
                         <Button variant="secondary" onClick={handleClose}>
                            Garder l'avance <span className="text-xs opacity-80 ml-2">(terminer plus tôt)</span>
                        </Button>
                    </div>
                </>
            );
        }
        return null;
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            {renderContent()}
        </Modal>
    );
};

export default ReadjustmentModal;