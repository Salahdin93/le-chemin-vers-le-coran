import React, { useState } from 'react';
import { useStore, useActiveProfileSelector } from '@/context/AppContext';
import { THEMES, COLORS } from '@/constants/ui';
import { Theme, AccentColor } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { generateProgressPDF, exportUserData, importUserData } from '@/services/export';
import { LOGO_URL } from '@/constants/ui';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
    User, Lock, Brain, Target, Palette,
    FileJson, ScrollText, ShieldAlert, BookOpen, RefreshCcw, Settings, Info
} from 'lucide-react';

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
                        className="bg-bg-secondary !text-text-main border-border-main font-black text-lg py-6"
                    />
                    <div className="flex items-center justify-between p-4 bg-bg-main/50 rounded-2xl border border-border-main/50">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('gender')}</span>
                            <span className="text-sm font-bold">{t(activeProfile.gender)}</span>
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
            id: 'appearance',
            title: t('appearance'),
            icon: <Palette size={20} />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
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
            bg: 'bg-indigo-500/10',
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        <Button variant="secondary" size="md" className="w-full justify-start gap-3 rounded-xl" onClick={exportUserData}>
                            <FileJson size={16} className="text-indigo-500" />
                            <span className="font-bold">{t('exportJSON') || 'Sauvegarder (.JSON)'}</span>
                        </Button>
                        <Button as="label" variant="secondary" size="md" className="w-full justify-start gap-3 cursor-pointer rounded-xl">
                            <RefreshCcw size={16} className="text-indigo-500" />
                            <span className="font-bold">{t('restoreData')}</span>
                            <input type="file" accept=".json" className="hidden" onChange={(e) => importUserData(e, () => window.location.reload())} />
                        </Button>
                    </div>

                    <div className="space-y-4 p-4 bg-bg-main/50 rounded-2xl border border-border-main/50">
                        <div className="flex items-center gap-2 mb-2">
                            <ScrollText size={14} className="text-indigo-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('pdfDateFilter') || 'Rapport PDF'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 ml-2">{t('startDateLabel')}</span>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-full bg-bg-secondary/50 rounded-lg border border-border-main/50 px-3 text-[10px] font-bold" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 ml-2">{t('endDateLabel')}</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-full bg-bg-secondary/50 rounded-lg border border-border-main/50 px-3 text-[10px] font-bold" />
                            </div>
                        </div>
                        <Button variant="accent" size="sm" className="w-full rounded-xl shadow-lg shadow-accent-color/10" onClick={() => generateProgressPDF(state, t, startDate, endDate)}>
                            {t('exportPDF')}
                        </Button>
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
                                onClick={() => { if (window.confirm(t('confirmResetProgress'))) dispatch({ type: 'RESET_PROGRESS' }); }}
                            >
                                {t('resetProgress')}
                            </Button>
                            <Button
                                variant="danger"
                                className="shadow-xl shadow-danger/20 bg-danger text-white rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                onClick={() => { if (window.confirm(t('confirmReset'))) dispatch({ type: 'RESET_APP' }) }}
                            >
                                {t('resetEverything') || 'Réinitialisation Totale'}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.section>

            <footer className="text-center pt-12 pb-8">
                <div className="flex flex-col items-center gap-4 opacity-30">
                    <div className="w-12 h-12 bg-bg-secondary rounded-2xl flex items-center justify-center border border-border-main/50">
                        <img src={LOGO_URL} alt="Spirit Logo" className="w-6 grayscale" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Spirit Engine v7.0.4 Premium</p>
                        <p className="text-[8px] font-medium opacity-50">Crafted with gratitude for your spiritual journey</p>
                    </div>
                    <div className="flex items-center gap-6 mt-4">
                        <Info size={14} className="hover:text-accent-color cursor-help transition-colors" />
                        <Settings size={14} className="hover:text-accent-color cursor-help transition-colors" />
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SettingsView;
