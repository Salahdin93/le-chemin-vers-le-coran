import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { LOGO_URL_DARK } from '@/constants/ui';

const AuthScreen: React.FC = () => {
    const { dispatch, t } = useStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert(t('checkEmail') || 'Vérifiez votre email pour confirmer l\'inscription');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                dispatch({ type: 'SET_APP_SCREEN', payload: 'splash' });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-6 dynamic-bg geometric-overlay overflow-hidden">
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-color/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-md w-full"
            >
                <div className="glass-card border-none shadow-premium p-10 bg-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-color/[0.02] to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-20 h-20 mx-auto mb-6 glass-card border-none bg-accent-color/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-700"
                        >
                            <img src={LOGO_URL_DARK} alt="Logo" className="w-12 h-12 object-contain" />
                        </motion.div>

                        <h2 className="text-3xl font-black text-gradient font-cairo mb-2">
                            {isSignUp ? t('signUp') || 'Héritage Cloud' : t('signIn') || 'Séquence Cloud'}
                        </h2>
                        <p className="text-sm text-text-main/40 font-medium">
                            {t('authSubtitle') || 'Sécurisez votre progression spirituelle'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <Input
                            label={t('email') || 'Adresse Email'}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nom@exemple.com"
                            icon={<Mail size={20} />}
                            required
                        />
                        <Input
                            label={t('password') || 'Clé de Sécurité'}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={<Lock size={20} />}
                            required
                        />

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-danger/5 border border-danger/10 rounded-2xl text-danger text-xs font-bold text-center italic"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4 pt-2">
                            <Button
                                type="submit"
                                variant="accent"
                                size="lg"
                                className="w-full h-16 rounded-2xl"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <ShieldCheck size={20} />
                                        {isSignUp ? t('signUpAction') || 'S\'inscrire' : t('signInAction') || 'Connexion'}
                                    </span>
                                )}
                            </Button>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-xs font-black uppercase tracking-[0.2em] text-accent-color/60 hover:text-accent-color transition-colors py-2"
                                >
                                    {isSignUp ? t('alreadyHaveAccount') || 'Déjà un compte ?' : t('noAccount') || 'Créer un compte'}
                                </button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full flex items-center justify-center gap-2 border-none bg-transparent hover:bg-white/5 opacity-40 hover:opacity-100"
                                    onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' })}
                                >
                                    <ArrowLeft size={16} /> {t('backNav') || 'Quitter'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-dashed border-border-main/20 text-center">
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text-main/20">
                            <Sparkles size={12} /> Powered by Supabase Secure
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthScreen;
