import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { clsx } from 'clsx';
import { useStore } from '@/context/AppContext';

interface ReadjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedItems: string[]) => void;
    title: string;
    items: string[];
}

const ReadjustmentModal: React.FC<ReadjustmentModalProps> = ({ isOpen, onClose, onConfirm, title, items }) => {
    const { t } = useStore();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const toggleItem = (item: string) => {
        setSelectedItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const handleConfirm = () => {
        onConfirm(selectedItems);
        setSelectedItems([]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-primary mb-2">{title}</h3>
                    <p className="text-text-main/70">{t('selectItemsToReview')}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-1">
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleItem(item)}
                            className={clsx(
                                "flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200",
                                selectedItems.includes(item)
                                    ? "bg-primary/10 border-primary shadow-sm"
                                    : "bg-bg-secondary border-border-main hover:border-primary/50"
                            )}
                        >
                            <span className="font-semibold">{item}</span>
                            <div className={clsx(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                selectedItems.includes(item) ? "bg-primary border-primary" : "border-text-main/30"
                            )}>
                                {selectedItems.includes(item) && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <Button onClick={onClose} variant="secondary" className="flex-1">{t('cancel')}</Button>
                    <Button
                        onClick={handleConfirm}
                        variant="primary"
                        className="flex-1"
                        disabled={selectedItems.length === 0}
                    >
                        {t('confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ReadjustmentModal;