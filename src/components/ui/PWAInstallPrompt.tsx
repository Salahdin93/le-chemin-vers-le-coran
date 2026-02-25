import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { Download, X } from 'lucide-react';
import { useStore } from '@/context/AppContext';

const PWAInstallPrompt: React.FC = () => {
    const { t } = useStore();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show the prompt after a small delay
            setTimeout(() => setIsVisible(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-[100]"
            >
                <div className="glass-card p-6 border-accent-color/20 bg-accent-color/5 backdrop-blur-2xl shadow-premium relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent-color/10 rounded-full blur-2xl group-hover:bg-accent-color/20 transition-all duration-700" />

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={18} className="text-text-main opacity-40" />
                    </button>

                    <div className="flex items-start gap-4 pr-6">
                        <div className="w-12 h-12 rounded-2xl bg-accent-color text-white flex items-center justify-center shadow-lg shadow-accent-color/20 shrink-0">
                            <Download size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-lg tracking-tight">{t('installAppTitle') || 'Installer l\'application'}</h4>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {t('installAppDesc') || 'Installez Le Chemin vers le Coran sur votre écran d\'accueil pour un accès rapide et hors-ligne.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            variant="accent"
                            className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-accent-color/20"
                            onClick={handleInstall}
                        >
                            {t('install') || 'Installer'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
