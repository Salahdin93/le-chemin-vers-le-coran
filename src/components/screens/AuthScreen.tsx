import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../context/AppContext';
import Input from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { LOGO_URL_DARK } from '@/constants/ui';

type AuthView = 'landing' | 'signup' | 'signin' | 'forgot';

const AuthScreen: React.FC = () => {
    const { dispatch, t } = useStore();
    const [view, setView] = useState<AuthView>('landing');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const resetForm = () => {
        setError(null);
        setSuccess(null);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetForm();

        try {
            if (view === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess('✅ Vérifiez votre email pour confirmer votre inscription');
                dispatch({ type: 'SET_APP_SCREEN', payload: 'splash' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                dispatch({ type: 'SET_APP_SCREEN', payload: 'splash' });
            }
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('invalid') && view === 'signin') {
                setError(t('noAccountRedirect') || 'Aucun compte trouvé pour cet email. Créez-en un.');
                setView('signup');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        resetForm();
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: { prompt: 'select_account' }
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError(t('enterEmail') || 'Entrez votre adresse email');
            return;
        }
        setLoading(true);
        resetForm();
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: window.location.origin
            });
            if (error) throw error;
            setSuccess('✅ Vérifiez votre email pour réinitialiser votre mot de passe');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const goToSignUp = () => { setView('signup'); resetForm(); };
    const goToSignIn = () => { setView('signin'); resetForm(); };
    const goToForgot = () => { setView('forgot'); resetForm(); };
    const goBack = () => { setView('landing'); resetForm(); };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden min-w-0"
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
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-md w-full min-w-0 overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {view === 'landing' ? (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full"
                            style={{
                                background: 'rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '1.75rem',
                                padding: '2.5rem',
                                boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            }}
                        >
                            {/* Logo */}
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                    <img src={LOGO_URL_DARK} alt="Logo" className="w-16 h-16 object-contain" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2">
                                {t('appName') || 'Le Chemin vers le Coran'}
                            </h1>
                            <p className="font-amiri text-center text-2xl leading-relaxed mb-8" style={{ direction: 'rtl', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                            </p>
                            <p className="text-xs text-center font-black uppercase tracking-[0.25em] mb-8" style={{ color: 'rgba(167,243,208,0.6)' }}>
                                {t('startYourJourney') || 'Commencez votre voyage avec le Saint Coran'}
                            </p>
                            <div className="space-y-4">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={goToSignUp}
                                    className="w-full py-5 rounded-2xl font-black text-base uppercase tracking-tight text-white flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', boxShadow: '0 8px 32px rgba(16,185,129,0.5)' }}
                                >
                                    <span className="text-xl">+</span>
                                    {t('createAccount') || 'Créer un compte'}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={goToSignIn}
                                    className="w-full py-5 rounded-2xl font-black text-base uppercase tracking-tight flex items-center justify-center gap-2"
                                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#d1fae5' }}
                                >
                                    <KeyRound size={18} />
                                    {t('signIn') || 'Se connecter'}
                                </motion.button>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                    <div className="relative flex justify-center text-[10px] uppercase">
                                        <span className="bg-[#052e16]/80 px-4 text-emerald-100/30 font-black tracking-[0.3em]">{t('orContinueWith') || 'Ou continuer avec'}</span>
                                    </div>
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    whileTap={{ scale: 0.97 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </motion.button>
                            </div>
                            <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(167,243,208,0.4)' }}>
                                Abu Junayd • Editeur — بإذن الله
                            </p>
                            <p className="text-center text-[8px] mt-1" style={{ color: 'rgba(167,243,208,0.3)' }}>Version 7.0 Premium</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="relative max-h-[90vh] overflow-y-auto my-4 no-scrollbar min-w-0"
                            style={{
                                background: 'rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '1.75rem',
                                padding: '2.5rem',
                                boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            }}
                        >
                            <button type="button" onClick={goBack} className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 mb-4">
                                ← {t('back') || 'Retour'}
                            </button>
                            {view === 'forgot' ? (
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <h3 className="text-xl font-black text-white mb-4">{t('forgotPassword') || 'Mot de passe oublié ?'}</h3>
                                    <Input label={t('email') || 'Email'} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@exemple.com" icon={<Mail size={18} />} required />
                                    <AnimatePresence>
                                        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>{error}</motion.div>}
                                        {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>{success}</motion.div>}
                                    </AnimatePresence>
                                    <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="w-full py-4 rounded-2xl font-black text-base text-white" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}>
                                        {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : (t('sendResetLink') || 'Envoyer le lien')}
                                    </motion.button>
                                </form>
                            ) : (
                                <form onSubmit={handleAuth} className="space-y-4">
                                    <h3 className="text-xl font-black text-white mb-4">{view === 'signup' ? (t('createAccount') || 'Créer un compte') : (t('signIn') || 'Se connecter')}</h3>
                                    <Input label={t('email') || 'Email'} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@exemple.com" icon={<Mail size={18} />} required />
                                    <Input label={t('password') || 'Mot de passe'} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock size={18} />} required />
                                    {view === 'signin' && (
                                        <button type="button" onClick={goToForgot} className="text-xs font-bold" style={{ color: 'rgba(110,231,183,0.8)' }}>
                                            {t('forgotPassword') || 'Mot de passe oublié ?'}
                                        </button>
                                    )}
                                    <AnimatePresence>
                                        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>{error}</motion.div>}
                                        {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>{success}</motion.div>}
                                    </AnimatePresence>
                                    <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}>
                                        {loading ? <Loader2 size={20} className="animate-spin" /> : (view === 'signup' ? <><UserPlus size={18} />{t('createAccount') || 'Créer mon compte'}</> : <><LogIn size={18} />{t('signIn') || 'Se connecter'}</>)}
                                    </motion.button>
                                    <button type="button" onClick={view === 'signup' ? goToSignIn : goToSignUp} className="w-full py-2 text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(110,231,183,0.5)' }}>
                                        {view === 'signup' ? (t('alreadyAccount') || 'Déjà un compte ? Se connecter') : (t('createNewAccount') || 'Créer un nouveau compte')}
                                    </button>
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                        <div className="relative flex justify-center text-[10px] uppercase">
                                            <span className="bg-[#052e16]/80 px-4 text-emerald-100/30 font-black tracking-[0.3em]">{t('orContinueWith') || 'Ou continuer avec'}</span>
                                        </div>
                                    </div>
                                    <motion.button type="button" onClick={handleGoogleAuth} whileTap={{ scale: 0.97 }} className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                        Google
                                    </motion.button>
                                </form>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AuthScreen;
