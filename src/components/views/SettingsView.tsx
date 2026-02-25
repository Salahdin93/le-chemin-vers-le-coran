import React, { useState, useEffect } from 'react';
import { useStore, useActiveProfileSelector } from '@/context/AppContext';
import { THEMES, COLORS } from '@/constants/ui';
import { Theme, AccentColor } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { generateProgressPDF, exportUserData, importUserData } from '@/services/export';
import { LOGO_URL } from '@/constants/ui';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
    Cloud, User, Lock, Brain, Target, Palette,
    FileJson, ScrollText, ShieldAlert, BookOpen, RefreshCcw
} from 'lucide-react';

const SettingsView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const activeProfile = useActiveProfileSelector();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    }, []);

    const [name, setName] = useState(activeProfile?.name || '');
    const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleNameChange = (newName: string) => {
        setName(newName);
        dispatch({ type: 'UPDATE_PROFILE', payload: { name: newName } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPassword !== activeProfile?.password) { alert(t('wrongPassword')); return; }
        if (newPassword.length < 4 || newPassword !== confirmNewPassword) { alert(t('passwordMismatch')); return; }
        dispatch({ type: 'UPDATE_PROFILE', payload: { password: newPassword } });
        setIsPasswordFormVisible(false);
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    if (!activeProfile) return <div className="p-8 text-center animate-pulse text-text-main/20 font-black uppercase tracking-[0.5em]">{t('loading')}...</div>;

    const sections = [
        {
            id: 'cloud',
            title: t('cloudSync') || 'Cloud Architecture',
            icon: <Cloud size={20} />,
            color: 'text-blue-500',
            content: (
                <div className="space-y-4">
                    {user ? (
                        <div className="p-4 bg-accent-color/5 rounded-2xl border border-accent-color/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-color mb-1">{t('activeSession') || 'Session Active'}</p>
                            <p className="text-sm font-bold text-text-main mb-4">{user.email}</p>
                            <Button variant="secondary" size="sm" className="w-full" onClick={async () => { await supabase.auth.signOut(); setUser(null); }}>
                                {t('cloudLogout') || 'Déconnexion Cloud'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-text-main/40 font-medium">{t('cloudDesc') || 'Sauvegardez vos khatmas et progressez sur tous vos appareils.'}</p>
                            <Button variant="accent" size="md" className="w-full" onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'auth' })}>
                                {t('cloudConnect') || 'Activer la Synchronisation'}
                            </Button>
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 'identity',
            title: t('personalInfo'),
            icon: <User size={20} />,
            color: 'text-purple-500',
            content: (
                <div className="space-y-6">
                    <Input
                        label={t('nameKunya')}
                        id="nameInput"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={e => handleNameChange(e.target.value)}
                        placeholder="Votre nom"
                    />
                    <div className="flex items-center justify-between p-4 glass-card border-none bg-bg-main rounded-2xl">
                        <span className="text-xs font-black uppercase tracking-widest opacity-40">{t('gender')}</span>
                        <span className="text-sm font-bold">{t(activeProfile.gender)}</span>
                    </div>
                </div>
            )
        },
        {
            id: 'security',
            title: t('security') || 'Sécurité Locale',
            icon: <Lock size={20} />,
            color: 'text-amber-500',
            content: (
                <div className="space-y-4">
                    {isPasswordFormVisible ? (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <Input label={t('currentPassword')} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                            <Input label={t('newPassword')} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            <Input label={t('confirmPassword')} type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required />
                            <Button type="submit" size="sm" className="w-full">{t('updatePassword') || 'Mettre à jour'}</Button>
                            <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsPasswordFormVisible(false)}>{t('cancel')}</Button>
                        </form>
                    ) : (
                        <Button variant="secondary" size="md" className="w-full" onClick={() => setIsPasswordFormVisible(true)}>{t('changePassword')}</Button>
                    )}
                </div>
            )
        },
        {
            id: 'goals',
            title: t('goalManagement'),
            icon: <Target size={20} />,
            color: 'text-rose-500',
            content: (
                <div className="grid grid-cols-1 gap-3">
                    <Button variant="secondary" size="md" className="justify-start gap-3" onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'reading', mode: 'new' } })}>
                        <BookOpen size={16} /> {t('changeReadingGoal')}
                    </Button>
                    <Button variant="secondary" size="md" className="justify-start gap-3" onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'revision', mode: 'new' } })}>
                        <Brain size={16} /> {t('changeRevisionGoal')}
                    </Button>
                </div>
            )
        },
        {
            id: 'appearance',
            title: t('appearance'),
            icon: <Palette size={20} />,
            color: 'text-emerald-500',
            content: (
                <div className="space-y-6">
                    <div>
                        <label className='text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3'>{t('theme')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {THEMES.slice(0, 4).map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => dispatch({ type: 'UPDATE_PROFILE', payload: { theme: theme.id as Theme } })}
                                    className={clsx(
                                        "p-3 rounded-xl border-2 transition-all text-xs font-bold flex items-center justify-center gap-2",
                                        activeProfile.theme === theme.id ? "border-accent-color bg-accent-color/5" : "border-border-main hover:border-accent-color/30"
                                    )}
                                >
                                    {theme.icon} {t(theme.id)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className='text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3'>{t('accentColor')}</label>
                        <div className='flex flex-wrap gap-2'>
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    style={{ backgroundColor: color }}
                                    className={clsx(
                                        "w-8 h-8 rounded-full border-4 transition-transform hover:scale-110",
                                        activeProfile.accentColor === color ? 'border-white ring-2 ring-accent-color' : 'border-transparent'
                                    )}
                                    onClick={() => dispatch({ type: 'UPDATE_PROFILE', payload: { accentColor: color as AccentColor } })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'data',
            title: t('dataExport'),
            icon: <FileJson size={20} />,
            color: 'text-indigo-500',
            content: (
                <div className="space-y-3">
                    <Button variant="secondary" size="md" className="w-full justify-start gap-3" onClick={exportUserData}>
                        <FileJson size={16} /> {t('exportJSON') || 'Sauvegarder (.JSON)'}
                    </Button>
                    <Button as="label" variant="secondary" size="md" className="w-full justify-start gap-3 cursor-pointer">
                        <RefreshCcw size={16} /> {t('restoreData')}
                        <input type="file" accept=".json" className="hidden" onChange={(e) => importUserData(e, () => window.location.reload())} />
                    </Button>
                    <div className="space-y-2 p-3 bg-bg-main/30 rounded-2xl border border-border-main/50">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t('pdfDateFilter') || 'Filtre Dates PDF'}</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 text-xs py-2 px-3" />
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 text-xs py-2 px-3" />
                        </div>
                        <Button variant="accent" size="sm" className="w-full mt-2" onClick={() => generateProgressPDF(state, t, startDate, endDate)}>
                            <ScrollText size={16} className="mr-2" /> {t('exportPDF')}
                        </Button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-12 pb-32">
            <header className="pb-8 border-b border-border-main">
                <h1 className="text-4xl font-black text-gradient mb-2">{t('settings')}</h1>
                <p className="text-text-secondary font-medium">{t('settingsSubtitle') || 'Personnalisez votre expérience et gérez votre sanctuaire numérique.'}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sections.map((section, i) => (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <div className="premium-card p-8 h-full flex flex-col group hover-glow">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={clsx("p-3 rounded-2xl bg-bg-main shadow-sm transition-transform group-hover:scale-110", section.color)}>
                                    {section.icon}
                                </div>
                                <h3 className="text-lg font-black tracking-tight">{section.title}</h3>
                            </div>
                            <div className="flex-1">
                                {section.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Danger Zone */}
            <section className="pt-12">
                <div className="p-8 rounded-[2.5rem] border-2 border-danger/10 bg-danger/[0.02] space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-danger text-white rounded-2xl shadow-lg shadow-danger/20">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-danger">{t('dangerZone') || 'Zone Sensible'}</h2>
                            <p className="text-xs font-bold text-danger/60 uppercase tracking-widest">{t('dangerZoneSubtitle') || 'Actions irréversibles'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button variant="secondary" className="border-danger/30 text-danger hover:bg-danger/5" onClick={() => { if (window.confirm(t('confirmResetProgress'))) dispatch({ type: 'RESET_PROGRESS' }); }}>
                            {t('resetProgress')}
                        </Button>
                        <Button variant="danger" className="shadow-danger/20" onClick={() => { if (window.confirm(t('confirmReset'))) dispatch({ type: 'RESET_APP' }) }}>
                            {t('resetEverything') || 'Réinitialisation Totale'}
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="text-center pt-8 opacity-20">
                <div className="flex justify-center mb-4">
                    <img src={LOGO_URL} alt="Spirit Logo" className="w-16 grayscale opacity-50" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Spirit Engine v7.0 Premium</p>
            </footer>
        </div>
    );
};

export default SettingsView;