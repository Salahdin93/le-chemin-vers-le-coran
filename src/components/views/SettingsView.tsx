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
    FileJson, ScrollText, ShieldAlert, BookOpen, RefreshCcw, Settings, Info, Globe
} from 'lucide-react';
import { LOGO_URL_DARK } from '@/constants/ui';
import ConfirmModal from '../ui/ConfirmModal';

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

    const isDark = !['light', 'sepia', 'emerald', 'aube', 'oasis', 'sand', 'wood', 'sunrise', 'leafy', 'pearl'].includes(activeProfile?.theme ?? 'dark');

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
                        className="bg-bg-secondary text-text-main border-border-main font-black text-lg py-6"
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
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-full bg-bg-secondary text-text-main rounded-lg border border-border-main/50 px-3 text-[10px] font-bold focus:outline-none focus:border-accent-color transition-colors" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 ml-2">{t('endDateLabel')}</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-full bg-bg-secondary text-text-main rounded-lg border border-border-main/50 px-3 text-[10px] font-bold focus:outline-none focus:border-accent-color transition-colors" />
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
                                    <img src={isDark ? LOGO_URL_DARK : LOGO_URL} alt="Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
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
                        </div>
                    </div>
                </div>

                <ConfirmModal
                    isOpen={isResetProgressOpen}
                    onClose={() => setIsResetProgressOpen(false)}
                    onConfirm={() => dispatch({ type: 'RESET_PROGRESS' })}
                    title={t('confirmResetProgressTitle') || 'Réinitialiser le progrès'}
                    message={t('confirmResetProgress') || 'Cette action est irréversible. Toutes vos sessions de lecture et révision seront effacées.'}
                    variant="danger"
                    confirmText={t('resetProgressConfirm') || 'Réinitialiser'}
                />

                <ConfirmModal
                    isOpen={isResetAppOpen}
                    onClose={() => setIsResetAppOpen(false)}
                    onConfirm={() => dispatch({ type: 'RESET_APP' })}
                    title={t('resetEverything') || 'Réinitialisation Totale'}
                    message={t('confirmReset') || 'Voulez-vous vraiment TOUT réinitialiser ? Cette action supprimera tous vos profils et données localement.'}
                    variant="danger"
                    confirmText={t('confirmResetBtn') || 'TOUT SUPPRIMER'}
                />
            </motion.section>

            <footer className="text-center pt-24 pb-12">
                <div className="flex flex-col items-center gap-6 opacity-80">
                    <div className="w-16 h-16 bg-bg-secondary rounded-[1.5rem] flex items-center justify-center border border-border-main shadow-premium">
                        <img src={isDark ? LOGO_URL_DARK : LOGO_URL} alt="Spirit Logo" className="w-10" />
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
