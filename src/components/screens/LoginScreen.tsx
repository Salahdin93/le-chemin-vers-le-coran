import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Lock, ArrowLeft, RotateCcw } from 'lucide-react';
import ConfirmModal from '../ui/ConfirmModal';

const LoginScreen: React.FC = () => {
    const { dispatch, t, activeProfile } = useStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const handleLogin = () => {
        if (activeProfile?.password === password) {
            setError('');
            dispatch({ type: 'SET_APP_SCREEN', payload: 'main' });
        } else {
            setError(t('wrongPassword') || 'Mot de passe incorrect');
            setPassword('');
        }
    };

    const confirmReset = () => {
        dispatch({ type: 'RESET_APP' });
    };

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-6 overflow-hidden premium-bg"
        >

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative max-w-sm w-full glass-card p-10 border-none shadow-premium bg-white/5"
            >
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

                <header className="text-center mb-10">
                    <div className="text-4xl mb-4">🔒</div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        {t('enterPassword') || 'Saisissez votre mot de passe'}
                    </h2>
                    <p className="text-emerald-100/40 text-[10px] font-black uppercase tracking-widest mt-2">
                        {activeProfile?.name || 'Utilisateur'}
                    </p>
                </header>

                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        icon={<Lock size={18} />}
                        autoFocus
                    />

                    {error && (
                        <div className="p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Button variant="accent" size="lg" type="submit" className="w-full py-5 text-sm font-black uppercase tracking-widest">
                            {t('login') || 'Se connecter'}
                        </Button>

                        <div className="flex flex-col gap-2 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsResetConfirmOpen(true)}
                                className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                                style={{ color: 'rgba(251,191,36,0.4)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(251,191,36,0.8)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(251,191,36,0.4)')}
                            >
                                <RotateCcw size={12} />
                                {t('forgotPassword') || 'Réinitialiser'}
                            </button>

                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' })}
                                className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4"
                                style={{ color: 'rgba(167,243,208,0.4)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(167,243,208,0.8)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,243,208,0.4)')}
                            >
                                <ArrowLeft size={12} />
                                {t('back') || 'Retour'}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>

            <ConfirmModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={confirmReset}
                title={t('resetEverything') || 'Réinitialisation Totale'}
                message={t('confirmReset') || 'Voulez-vous vraiment TOUT réinitialiser ?'}
                variant="danger"
                cancelText={t('cancel')}
                confirmText={t('confirmResetBtn') || 'Confirmer'}
            />
        </div>
    );
};

export default LoginScreen;