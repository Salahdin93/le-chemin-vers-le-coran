import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { motion } from 'framer-motion';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'info'
}) => {
    const icon = {
        danger: <AlertTriangle className="text-danger" size={48} />,
        warning: <AlertTriangle className="text-warning" size={48} />,
        info: <HelpCircle className="text-accent-color" size={48} />
    }[variant];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-8 text-center space-y-8">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-bg-secondary rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 shadow-inner"
                >
                    {icon}
                </motion.div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-black tracking-tight text-text-main">{title}</h2>
                    <p className="text-text-secondary font-medium leading-relaxed max-w-sm mx-auto">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] opacity-50 hover:opacity-100"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'accent'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
