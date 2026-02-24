import React, { useState } from 'react';
import Modal from './Modal';
import { useStore } from '@/context/AppContext';
import { SimpleCheckbox } from './Checkbox';
import Button from './Button';
import { shareViaWhatsApp } from '@/services/export';

const ShareModal: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const [shareReading, setShareReading] = useState(true);
    const [shareRevision, setShareRevision] = useState(true);

    const handleShare = () => {
        if (!shareReading && !shareRevision) {
            alert("Veuillez sélectionner au moins un élément à partager.");
            return;
        }
        shareViaWhatsApp(state, t, { shareReading, shareRevision });
        dispatch({ type: 'TOGGLE_SHARE_MODAL', payload: false });
    };

    return (
        <Modal isOpen={state.isShareModalOpen} onClose={() => dispatch({ type: 'TOGGLE_SHARE_MODAL', payload: false })}>
            <h3 className="text-xl font-bold mb-6">Que souhaitez-vous partager ?</h3>
            <div className="space-y-4 mb-6">
                <SimpleCheckbox 
                    id="share-reading"
                    label="Suivi de lecture"
                    checked={shareReading}
                    onChange={(e) => setShareReading(e.target.checked)}
                />
                <SimpleCheckbox 
                    id="share-revision"
                    label="Suivi de révision"
                    checked={shareRevision}
                    onChange={(e) => setShareRevision(e.target.checked)}
                />
            </div>
            <div className="flex gap-4">
                <Button variant="ghost" className="flex-1" onClick={() => dispatch({ type: 'TOGGLE_SHARE_MODAL', payload: false })}>Annuler</Button>
                <Button className="flex-1" onClick={handleShare}>Partager</Button>
            </div>
        </Modal>
    );
};

export default ShareModal;