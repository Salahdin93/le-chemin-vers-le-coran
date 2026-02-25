import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../context/AppContext';
import Input from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Loader2, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { LOGO_URL_DARK } from '@/constants/ui';

const AuthScreen: React.FC = () => {
    const { dispatch, t } = useStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess('✅ Vérifiez votre email pour confirmer votre inscription');
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
        <div
            className="fixed inset-0 flex items-center justify-center p-6 overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #052e16 0%, #064e3b 35%, #065f46 60%, #047857 100%)' }}
        >
            {/* Background pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='0.8'%3E%3Cpolygon points='40,5 55,20 75,20 60,35 67,55 40,45 13,55 20,35 5,20 25,20'/%3E%3Ccircle cx='40' cy='40' r='18'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '80px 80px',
                }}
            />
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-md w-full"
            >
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '1.75rem',
                        padding: '2.5rem',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                >
                    {/* Top shine */}
                    <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 0 40px rgba(52,211,153,0.2)',
                            }}
                        >
                            <img src={LOGO_URL_DARK} alt="Logo" className="w-12 h-12 object-contain" />
                        </motion.div>

                        {/* Identity Context */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            < Sparkles size={12} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">
                                Mon Compte Universel
                            </span>
                        </div>

                        <h2
                            className="text-3xl font-black font-cairo mb-2"
                            style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #d1fae5 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {isSignUp ? 'Créer un compte' : 'Mon Compte'}
                        </h2>
                        <p className="text-sm font-medium" style={{ color: 'rgba(167,243,208,0.6)' }}>
                            {isSignUp
                                ? 'Vos données sauvegardées en sécurité'
                                : 'Connectez-vous pour accéder à vos données sauvegardées'}
                        </p>
                    </div>

                    {/* ===== Bénéfices Compte ===== */}
                    {!isSignUp && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="grid grid-cols-3 gap-2 mb-6"
                        >
                            {[
                                { icon: '💾', label: 'Sauvegarde auto' },
                                { icon: '📱', label: 'Multi-appareils' },
                                { icon: '🔒', label: 'Sécurisé' },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(167,243,208,0.6)' }}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        <Input
                            label={t('email') || 'Adresse Email'}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nom@exemple.com"
                            icon={<Mail size={18} />}
                            required
                        />
                        <Input
                            label={t('password') || 'Mot de passe'}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={<Lock size={18} />}
                            required
                        />

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 rounded-xl text-xs font-bold text-center"
                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                                >
                                    {error}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 rounded-xl text-xs font-bold text-center"
                                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}
                                >
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-3 pt-2">
                            {/* Main CTA */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.02 }}
                                className="w-full py-4 rounded-2xl font-black text-base text-white relative overflow-hidden group disabled:opacity-50"
                                style={{
                                    background: loading
                                        ? 'rgba(52,211,153,0.4)'
                                        : 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                                    boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
                                }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                                            {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            </motion.button>

                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
                                className="w-full py-2 text-xs font-black uppercase tracking-widest transition-colors"
                                style={{ color: 'rgba(110,231,183,0.5)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(110,231,183,1)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(110,231,183,0.5)')}
                            >
                                {isSignUp ? 'Déjà un compte ? Se connecter' : 'Créer un nouveau compte'}
                            </button>

                            {/* Back */}
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' })}
                                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-xl"
                                style={{ color: 'rgba(167,243,208,0.35)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(167,243,208,0.7)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,243,208,0.35)')}
                            >
                                <ArrowLeft size={14} /> {t('backNav') || 'Retour'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthScreen;
