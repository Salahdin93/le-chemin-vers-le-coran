import React, { useState } from 'react';
import { useStore, useActiveProfileSelector } from '@/context/AppContext';
import { THEMES, COLORS } from '@/constants/ui';
import { Theme, AccentColor } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { generateProgressPDF, exportUserData, importUserData } from '@/services/export';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
    User, Lock, Brain, Target, Palette,
    FileJson, ScrollText, ShieldAlert, BookOpen, RefreshCcw, Settings, Info, Globe, Calendar, FileText
} from 'lucide-react';
import { LOGO_URL_DARK } from '@/constants/ui';
import ConfirmModal from '../ui/ConfirmModal';
import { dbService } from '@/lib/dbService';
import { supabase } from '@/lib/supabase';

const SettingsView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const activeProfile = useActiveProfileSelector();

    const [name, setName] = useState(activeProfile?.name || '');
    const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isResetProgressOpen, setIsResetProgressOpen] = useState(false);
    const [isResetAppOpen, setIsResetAppOpen] = useState(false);
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

    const handleNameChange = (newName: string) => {
        setName(newName);
        dispatch({ type: 'UPDATE_PROFILE', payload: { name: newName } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPassword !== activeProfile?.password) {
            dispatch({ type: 'SET_TOAST', payload: t('wrongPassword') || 'Mot de passe actuel incorrect' });
            return;
        }
        if (newPassword.length < 4) {
            dispatch({ type: 'SET_TOAST', payload: t('passwordTooShort') || 'Le mot de passe doit faire au moins 4 caractères' });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            dispatch({ type: 'SET_TOAST', payload: t('passwordMismatch') || 'Les mots de passe ne correspondent pas' });
            return;
        }
        dispatch({ type: 'UPDATE_PROFILE', payload: { password: newPassword } });
        setIsPasswordFormVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    if (!activeProfile) return <div className="p-8 text-center animate-pulse text-text-main/20 font-black uppercase tracking-[0.5em]">{t('loading')}...</div>;

    const sections = [
        {
            id: 'identity',
            title: t('personalInfo'),
            icon: <User size={20} />,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            content: (
                <div className="space-y-6">
                    <Input
                        label={t('nameKunya')}
                        id="nameInput"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={e => handleNameChange(e.target.value)}
                        placeholder={t('yourNamePlaceholder')}
                        className="bg-bg-secondary text-text-main border-border-main font-black text-lg py-6"
                    />
                    <div className="flex items-center justify-between p-4 bg-bg-main/50 rounded-2xl border border-border-main/50">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('gender')}</span>
                            <span className="text-sm font-bold">
                                {t(activeProfile.gender)}
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <User size={14} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'security',
            title: t('security') || 'Sécurité Locale',
            icon: <Lock size={20} />,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            content: (
                <div className="space-y-4">
                    {isPasswordFormVisible ? (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <Input label={t('currentPassword')} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="bg-bg-secondary h-10" />
                            <Input label={t('newPassword')} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="bg-bg-secondary h-10" />
                            <Input label={t('confirmPassword')} type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className="bg-bg-secondary h-10" />
                            <div className="grid grid-cols-2 gap-2">
                                <Button type="submit" size="sm" className="w-full rounded-xl">{t('updatePassword') || 'Valider'}</Button>
                                <Button variant="ghost" size="sm" className="w-full rounded-xl" onClick={() => setIsPasswordFormVisible(false)}>{t('cancel')}</Button>
                            </div>
                        </form>
                    ) : (
                        <Button variant="secondary" size="md" className="w-full rounded-xl hover:bg-amber-500/5 group" onClick={() => setIsPasswordFormVisible(true)}>
                            <Lock size={16} className="mr-2 opacity-40 group-hover:opacity-100 transition-opacity" />
                            {t('changePassword')}
                        </Button>
                    )}
                </div>
            )
        },
        {
            id: 'goals',
            title: t('goalManagement'),
            icon: <Target size={20} />,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            content: (
                <div className="grid grid-cols-1 gap-3">
                    <Button variant="secondary" size="md" className="justify-start gap-4 rounded-xl hover:bg-rose-500/5 group" onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'reading', mode: 'new' } })}>
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                            <BookOpen size={16} />
                        </div>
                        <span className="font-bold">{t('changeReadingGoal')}</span>
                    </Button>
                    <Button variant="secondary" size="md" className="justify-start gap-4 rounded-xl hover:bg-rose-500/5 group" onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'revision', mode: 'new' } })}>
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                            <Brain size={16} />
                        </div>
                        <span className="font-bold">{t('changeRevisionGoal')}</span>
                    </Button>
                </div>
            )
        },
        {
            id: 'language',
            title: t('language') || 'Langue de l\'application',
            icon: <Globe size={20} />,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            content: (
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'fr', name: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
                        { id: 'ar', name: 'العربية', flag: 'https://flagcdn.com/w40/sa.png' },
                        { id: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' }
                    ].map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { lang: lang.id as any } })}
                            className={clsx(
                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                                state.settings.lang === lang.id
                                    ? "border-accent-color bg-accent-color/5 text-accent-color"
                                    : "border-border-main/50 bg-bg-main/30 hover:border-accent-color/30"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <img src={lang.flag} alt={lang.name} className="w-8 h-6 object-cover rounded shadow-sm group-hover:scale-110 transition-transform" />
                                <span className="font-bold">{lang.name}</span>
                            </div>
                            {state.settings.lang === lang.id && (
                                <div className="w-2 h-2 rounded-full bg-accent-color shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>
            )
        },
        {
            id: 'appearance',
            title: t('appearance'),
            icon: <Palette size={20} />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            content: (
                <div className="space-y-6">
                    <div>
                        <label className='text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3'>{t('theme')}</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => dispatch({ type: 'UPDATE_PROFILE', payload: { theme: theme.id as Theme, id: activeProfile.id } })}
                                    className={clsx(
                                        "p-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
                                        activeProfile.theme === theme.id
                                            ? "border-accent-color bg-accent-color/10 text-accent-color shadow-lg shadow-accent-color/10"
                                            : "border-border-main/50 bg-bg-main/30 hover:border-accent-color/30"
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
                                        "w-8 h-8 rounded-full border-4 transition-all hover:scale-125 hover:rotate-12",
                                        activeProfile.accentColor === color
                                            ? 'border-white ring-2 ring-accent-color shadow-lg'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    )}
                                    onClick={() => dispatch({ type: 'UPDATE_PROFILE', payload: { accentColor: color as AccentColor, id: activeProfile.id } })}
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
            bg: 'bg-indigo-500/10',
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                        <Button variant="secondary" size="md" className="w-full justify-start gap-3 rounded-2xl bg-bg-main/50 border-border-main/50 group hover:border-indigo-500/50 transition-all" onClick={() => {
                            const success = exportUserData();
                            if (!success) dispatch({ type: 'SET_TOAST', payload: t('noDataToExport') || 'Aucune donnée à sauvegarder.' });
                            else dispatch({ type: 'SET_TOAST', payload: t('exportSuccess') || 'Exportation réussie !' });
                        }}>
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform">
                                <FileJson size={18} />
                            </div>
                            <span className="font-bold">{t('exportJSON') || 'Sauvegarder (.JSON)'}</span>
                        </Button>
                        <Button as="label" variant="secondary" size="md" className="w-full justify-start gap-3 cursor-pointer rounded-2xl bg-bg-main/50 border-border-main/50 group hover:border-indigo-500/50 transition-all">
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform">
                                <RefreshCcw size={18} />
                            </div>
                            <span className="font-bold">{t('restoreData')}</span>
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={(e) => importUserData(
                                    e,
                                    () => {
                                        dispatch({ type: 'SET_TOAST', payload: "✅ Sauvegarde restaurée avec succès. Vous pouvez continuer votre utilisation." });
                                    },
                                    (msg) => dispatch({ type: 'SET_TOAST', payload: `❌ ${msg}` })
                                )}
                            />
                        </Button>
                    </div>

                    <div className="relative overflow-hidden p-6 rounded-[2rem] bg-slate-900 border border-white/10 shadow-2xl group/pdf">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{t('pdfReport') || 'Rapport PDF'}</h4>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">{t('customFilter') || 'Filtre temporel premium'}</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                    <Calendar size={14} className="text-white/20" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">{t('startDateLabel')}</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full bg-white/5 text-white/90 rounded-2xl border border-white/10 px-4 h-12 text-[10px] font-bold focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all appearance-none"
                                        />
                                        <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">{t('endDateLabel')}</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full bg-white/5 text-white/90 rounded-2xl border border-white/10 px-4 h-12 text-[10px] font-bold focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all appearance-none"
                                        />
                                        <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="accent"
                                size="lg"
                                className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-500/20 font-black text-[10px] uppercase tracking-[0.2em] bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 group/btn"
                                onClick={() => generateProgressPDF(state, t, startDate, endDate)}
                            >
                                <ScrollText size={16} className="mr-3 group-hover/btn:rotate-12 transition-transform" />
                                {t('exportPDF')}
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-12 pb-32 px-4 md:px-0">
            <header className="pb-8 border-b border-border-main flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-gradient mb-2">{t('settings')}</h1>
                    <p className="text-text-secondary font-medium text-sm md:text-base">{t('settingsSubtitle') || 'Personnalisez votre expérience et gérez votre sanctuaire numérique.'}</p>
                </div>
                <div className="flex items-center gap-3 p-1 bg-bg-secondary/50 rounded-2xl border border-border-main/50 self-start md:self-auto">
                    <div className="px-4 py-2 flex items-center gap-2">
                        <Settings size={16} className="text-accent-color" />
                        <span className="text-[10px] font-black uppercase tracking-widest">v7.0 Stable</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sections.map((section, i) => (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <div className="premium-card p-8 h-full flex flex-col group hover-glow border-none bg-bg-secondary/40 backdrop-blur-xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={clsx("p-3 rounded-2xl shadow-inner transition-transform group-hover:scale-110", section.bg, section.color)}>
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

                {/* Terms of Use - Full Width span */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sections.length * 0.05 }}
                    className="md:col-span-2 lg:col-span-3"
                >
                    <div className="premium-card p-8 md:p-12 group hover-glow border-none bg-bg-secondary/40 backdrop-blur-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 rounded-2xl shadow-inner transition-transform group-hover:scale-110 bg-amber-600/10 text-amber-600">
                                <ScrollText size={24} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">{t('termsOfUse') || 'Conditions d\'Utilisation'}</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            <div className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] bg-bg-main/30 border border-border-main/50 relative overflow-hidden group/logo">
                                <div className="absolute inset-0 bg-accent-color/5 opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[3rem] flex items-center justify-center glass-card border-none shadow-2xl bg-white/5 relative z-10">
                                    <img src={LOGO_URL_DARK} alt="Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
                                </div>
                            </div>

                            <div className="space-y-6 font-medium leading-relaxed text-text-main/80">
                                <p className="text-xl font-black text-accent-color italic">Baarak-Allahu fikum !</p>
                                <p className="text-lg">Cette application a été imaginée et développée par <span className="text-text-main font-black">Abu Junayd</span>. Elle demeure sa propriété exclusive.</p>
                                <p>Son objectif premier est de servir et de faciliter la pratique religieuse de la communauté musulmane. Toute utilisation doit se faire dans le respect de cet esprit.</p>

                                <div className="p-6 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl italic shadow-xl shadow-amber-500/5">
                                    <span className="text-amber-600 font-bold">Important :</span> Toute reproduction, modification sans autorisation est strictement interdite.
                                    Abu Junayd se réserve tous les droits, y compris en cas de mise à disposition payante ou commerciale, afin de garantir la pérennité et l’intégrité de cet outil.
                                </div>

                                <p>Quiconque s’aventurerait à le faire en portera l’entière responsabilité devant Allah le Jour des comptes.</p>
                                <p className="font-bold border-l-2 border-accent-color pl-4">Les musulmans respectent leurs engagement et certes Allah n’aime pas les traites.</p>

                                <div className="pt-8 mt-4 border-t border-border-main/30 text-center lg:text-left">
                                    <p className="text-accent-color font-bold opacity-70 mb-2">Qu’Allah accepte ce travail et qu’il soit bénéfique à tous.</p>
                                    <div className="text-2xl font-black uppercase tracking-[0.2em] text-text-main">Abu Junayd</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Danger Zone */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-12"
            >
                <div className="p-8 md:p-12 rounded-[2.5rem] border border-danger/20 bg-danger/[0.02] relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <ShieldAlert size={120} className="text-danger" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-danger text-white rounded-2xl shadow-2xl shadow-danger/20">
                                <ShieldAlert size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-danger">{t('dangerZone') || 'Zone Sensible'}</h2>
                                <p className="text-xs font-bold text-danger/60 uppercase tracking-widest">{t('dangerZoneSubtitle') || 'Actions irréversibles sur vos données sacrées'}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                className="border-danger/20 text-danger hover:bg-danger/10 rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest transition-all"
                                onClick={() => setIsResetProgressOpen(true)}
                            >
                                {t('resetProgress')}
                            </Button>
                            <Button
                                variant="danger"
                                className="shadow-xl shadow-danger/20 bg-danger text-white rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                onClick={() => setIsResetAppOpen(true)}
                            >
                                {t('resetEverything') || 'Réinitialisation Totale'}
                            </Button>
                            <Button
                                variant="danger"
                                className="shadow-xl shadow-danger/20 bg-danger/80 text-white rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border-2 border-danger"
                                onClick={() => setIsDeleteAccountOpen(true)}
                            >
                                {t('deleteAccount') || 'Supprimer le compte'}
                            </Button>
                        </div>
                    </div>
                </div>

                <ConfirmModal
                    isOpen={isResetProgressOpen}
                    onClose={() => setIsResetProgressOpen(false)}
                    onConfirm={() => { dispatch({ type: 'RESET_PROGRESS' }); setIsResetProgressOpen(false); }}
                    title={t('confirmResetProgressTitle') || 'Réinitialiser le progrès'}
                    message={t('confirmResetProgress') || 'Progression et objectifs (lecture, révision) seront effacés. Aucun plan ne restera configuré.'}
                    variant="danger"
                    confirmText={t('resetProgressConfirm') || 'Réinitialiser'}
                />

                <ConfirmModal
                    isOpen={isResetAppOpen}
                    onClose={() => setIsResetAppOpen(false)}
                    onConfirm={async () => {
                        setIsResetAppOpen(false);
                        dispatch({ type: 'RESET_APP' });
                        try {
                            await dbService.deleteAllProfilesForCurrentUser();
                        } catch (e) {
                            console.error('deleteAllProfilesForCurrentUser', e);
                        }
                    }}
                    title={t('resetEverything') || 'Réinitialisation Totale'}
                    message={t('confirmResetTotal') || t('confirmReset') || 'Voulez-vous vraiment tout réinitialiser ? Tous vos profils et données seront supprimés. Vous resterez connecté et pourrez créer un nouveau profil.'}
                    variant="danger"
                    confirmText={t('confirmResetBtn') || 'TOUT SUPPRIMER'}
                />

                <ConfirmModal
                    isOpen={isDeleteAccountOpen}
                    onClose={() => setIsDeleteAccountOpen(false)}
                    onConfirm={async () => {
                        await dbService.deleteAllProfilesForCurrentUser();
                        await supabase.auth.signOut();
                        dispatch({ type: 'SET_APP_SCREEN', payload: 'auth' });
                        setIsDeleteAccountOpen(false);
                    }}
                    title={t('deleteAccount') || 'Supprimer le compte'}
                    message={t('confirmDeleteAccount') || 'Cette action supprimera définitivement votre compte (Google/email), tous vos profils et données. Vous devrez recréer un compte pour utiliser l\'application.'}
                    variant="danger"
                    confirmText={t('confirmDeleteAccountBtn') || 'Supprimer le compte'}
                />
            </motion.section>

            <footer className="text-center pt-24 pb-12">
                <div className="flex flex-col items-center gap-6 opacity-80">
                    <div className="w-16 h-16 bg-bg-secondary rounded-[1.5rem] flex items-center justify-center border border-border-main shadow-premium">
                        <img src={LOGO_URL_DARK} alt="Spirit Logo" className="w-10" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.5em] text-text-main">{t('footerAppVersion')}</p>
                        <p className="text-[10px] font-bold text-accent-color/60 uppercase tracking-widest">{t('footerTagline')}</p>
                    </div>
                    <div className="flex items-center gap-8 mt-6">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-2 hover:text-accent-color transition-colors group">
                            <Info size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <div className="w-1 h-1 rounded-full bg-border-main" />
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-2 hover:text-accent-color transition-colors group">
                            <Settings size={16} className="group-hover:rotate-45 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SettingsView;
