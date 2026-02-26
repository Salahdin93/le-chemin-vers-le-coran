import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { HIZB_DATA } from '@/constants/quranData';
import { checkReadingProgress } from '@/services/progressLogic';
import EndOfGoalModal from '@/components/ui/EndOfGoalModal';
import Modal from '@/components/ui/Modal';
import Timer from '@/components/ui/Timer';
import { ReadingStatus, Hadith, HadithMemorizationStatus, PlanDay } from '@/types';
import { notificationService } from '@/components/ui/NotificationContainer';
import InputModal from '@/components/ui/InputModal';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { HADITH_COLLECTION } from '@/constants/hadithData';
import { Eye, EyeOff, Sparkles, BookOpen, Brain, Trophy, Flame, ChevronRight, Play, CheckCircle2, AlertCircle, Star, Calendar } from 'lucide-react';
import ReadjustmentModal from '@/components/ui/ReadjustmentModal';

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }
    })
};

const missionBadgeBase =
    'px-6 py-2.5 text-xs font-black uppercase tracking-[0.25em] rounded-full shadow-lg';

const ProgressRing: React.FC<{ percent: number, color: string, icon: React.ReactNode, label: string }> = ({ percent, color, icon, label }) => (
    <div className="flex flex-col items-center group">
        <div className="relative w-32 h-32 transform transition-transform group-hover:scale-105 duration-500">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <defs>
                    <linearGradient id={`${label}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.5" />
                    </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="6" className="text-border-main/10" fill="transparent" />
                <circle
                    cx="60" cy="60" r="52" stroke={`url(#${label}-gradient)`} strokeWidth="8"
                    className={color} fill="transparent" strokeDasharray="326.7"
                    strokeDashoffset={326.7 - (percent / 100) * 326.7}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.23, 1, 0.32, 1)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl mb-1 text-text-main opacity-80 group-hover:scale-110 transition-transform">{icon}</div>
                <span className="text-3xl font-black tracking-tight">{percent}<span className="text-xs opacity-40 ml-0.5">%</span></span>
            </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 opacity-40 group-hover:opacity-80 transition-opacity">{label}</span>
    </div>
);

const DashboardView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [isEndOfGoalModalOpen, setIsEndOfGoalModalOpen] = useState(false);
    const [showHadithTranslation, setShowHadithTranslation] = useState(false);
    const [hadithDuJour, setHadithDuJour] = useState<Hadith | undefined>(undefined);
    const [isReadjustmentModalOpen, setIsReadjustmentModalOpen] = useState(false);
    const [hadithModalContent, setHadithModalContent] = useState<Hadith | null>(null);
    const [inputModalState, setInputModalState] = useState<{ isOpen: boolean; title: string; label: string; onSubmit: (value: string) => void; }>({ isOpen: false, title: '', label: '', onSubmit: () => { } });

    const [hadithMissionTitle, setHadithMissionTitle] = useState<string>('');

    const hadithProgress = activeProfile?.hadithProgress || {};
    const hadithPlan = state.plans.hadithRevision; // Currently used for both types

    useEffect(() => {
        // If we have a structured plan (Lecture or Revision)
        if (hadithPlan && hadithPlan.length > 0) {
            const currentDayIndex = state.progress.currentHadithRevisionIndex; // Shared index for now
            const todayPlan = hadithPlan[currentDayIndex];

            if (todayPlan) {
                const firstId = todayPlan.hadithIds[0];
                const hadith = HADITH_COLLECTION.find(h => h.id === firstId);
                setHadithDuJour(hadith);

                // Set title based on type (reading/revision)
                // We'll infer it from the data structure for now or activeProfile goals
                const isRevision = !!activeProfile?.goals?.hadithRevision;
                setHadithMissionTitle(isRevision ? t('myRevision') : t('myReading'));
            } else {
                setHadithDuJour(undefined);
            }
        } else {
            // Fallback: simple individual hadith display (legacy/non-plan)
            const inProgress = HADITH_COLLECTION.find(h => hadithProgress[h.id] === 'en_memorisation');
            setHadithDuJour(inProgress || HADITH_COLLECTION.find(h => (hadithProgress[h.id] || 'non_lu') === 'non_lu'));
            setHadithMissionTitle(t('hadithOfTheDay'));
        }
    }, [hadithProgress, hadithPlan, state.progress.currentHadithRevisionIndex, activeProfile?.goals]);

    useEffect(() => {
        if (checkReadingProgress(state) === 'behind') {
            notificationService.show({ title: t('progressStatusBehindTitle'), message: t('progressStatusBehindMessage'), type: 'warning' });
        }
    }, [state.progress.currentReadingDay, state]);

    if (!activeProfile) return <DashboardSkeleton />;

    const { reading: readingGoal, revision: revisionGoal } = activeProfile.goals;
    const { reading: readingPlan, revision: revisionPlan, originalReading: originalReadingPlan } = state.plans;

    const isReadingActive = !!(activeProfile && readingGoal && readingPlan && state.progress.currentReadingDay <= readingGoal.duration);
    const isRevisionActive = !!(activeProfile && revisionGoal && revisionPlan && state.progress.currentRevisionIndex < (revisionPlan?.length || 0));

    const overallPercent = (activeProfile && readingGoal) ? Math.floor(((state.progress.currentReadingDay - 1) / readingGoal.duration) * 100) : 0;
    const revisionPercent = revisionPlan ? Math.floor((state.progress.currentRevisionIndex / revisionPlan.length) * 100) : 0;
    const totalPagesRead = Object.values(state.progress.readingHistory).reduce((acc, h: any) => acc + (h.realPages || 0), 0);
    const masteredHadiths = Object.values(hadithProgress).filter(s => s === 'acquis').length;
    const hadithPercent = Math.floor((masteredHadiths / HADITH_COLLECTION.length) * 100);

    const currentReading = readingPlan ? readingPlan[state.progress.currentReadingDay - 1] : null;
    const readingHistoryEntry = currentReading ? state.progress.readingHistory[`day_${currentReading.day}`] : null;
    const readingStatus = readingHistoryEntry?.status || 'not_read';

    const handleRevisionStatusUpdate = (_revisionDay: any, status: any) => {
        dispatch({
            type: 'UPDATE_REVISION_STATUS',
            payload: { revisionIndex: state.progress.currentRevisionIndex, status }
        });
    };

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahf: boolean = false, time?: number) => {
        const execute = (adj: number) => {
            if (!activeProfile) return;
            const dayKey = `day_${day.day}`;
            const existing = state.progress.readingHistory[dayKey] || { status: 'not_read', realPages: 0, adjustment: 0 };
            const newHistory = { ...state.progress.readingHistory, [dayKey]: isKahf ? { ...existing, kahfStatus: status } : { ...existing, status, realPages: status === 'not_read' ? 0 : day.recalculatedPages + adj, adjustment: adj, timeSpent: time !== undefined ? (existing.timeSpent || 0) + time : existing.timeSpent } };
            const recPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, newHistory, state.progress.currentReadingDay) : null;
            dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory, recalculatedPlan: recPlan! } });
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
        };
        if (!isKahf && (status === 'partial' || status === 'catchup')) {
            setInputModalState({ isOpen: true, title: t(status === 'partial' ? 'partialReadingTitle' : 'catchUpReadingTitle'), label: t(status === 'partial' ? 'partialLabel' : 'catchUpLabel'), onSubmit: (v) => { const n = parseInt(v) || 0; if (n >= 0) execute(status === 'partial' ? -n : n); } });
        } else execute(0);
    };

    const handleHadithStatusChange = (hadithId: number, status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_PROGRESS', payload: { hadithId, status, date: new Date().toISOString() } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleAdvance = () => {
        const d = state.progress.currentReadingDay;
        const dayK = `day_${d}`;
        let h = { ...state.progress.readingHistory };
        if (!h[dayK] && readingPlan) {
            const pD = readingPlan.find(dp => dp.day === d);
            if (pD) h[dayK] = { status: 'done', adjustment: 0, realPages: pD.recalculatedPages, kahf: pD.isKahfDay, kahfStatus: pD.isKahfDay ? 'done' : undefined };
        }
        const s = h[dayK]?.status;
        const cDays = (s === 'done' || s === 'catchup') ? state.progress.consecutiveDays + 1 : 0;
        const rPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, h, d + 1) : null;
        dispatch({ type: 'ADVANCE_DAY', payload: { newHistory: h, newConsecutiveDays: cDays, recalculatedPlan: rPlan! } });
        if (readingGoal && d === readingGoal.duration) setIsEndOfGoalModalOpen(true);
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const currentRevision = isRevisionActive ? revisionPlan?.[state.progress.currentRevisionIndex] : null;

    const revisionItems = currentRevision
        ? currentRevision.units.flatMap(unit => {
            // Si le texte contient un numéro de Hizb, on récupère les sourates détaillées depuis HIZB_DATA
            const hizbMatch = unit.text.match(/Hizb (\d+)/);
            if (hizbMatch) {
                const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                const hizb = HIZB_DATA[hizbIndex];
                if (hizb && Array.isArray(hizb.surahs)) {
                    return hizb.surahs;
                }
            }
            // Sinon on découpe simplement sur les virgules
            return unit.surahs.split(',').map(s => s.trim()).filter(Boolean);
        })
        : [];

    return (
        <div className="space-y-12 md:space-y-16 pb-32 pt-2 px-2 md:px-0">
            {/* Header Dashboard */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border-main pb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center text-white shadow-lg shadow-accent-color/20 rotate-3">
                            <Sparkles size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Lumière du jour</span>
                            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mt-1">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-text-secondary" />
                                    <span className="text-sm font-bold text-text-main">
                                        {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                                    </span>
                                </div>
                                <span className="hidden md:block w-px h-4 bg-white/10" />
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-accent-color/20 rounded-2xl shadow-lg shadow-accent-color/20 animate-bounce-subtle">
                                        <Sparkles size={20} className="text-accent-color" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Date Hégirienne</span>
                                        <span className="text-2xl md:text-3xl font-black text-accent-color tracking-tighter drop-shadow-sm">
                                            {new Intl.DateTimeFormat('fr-u-ca-islamic-uma-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gradient mb-4">
                        {t('dashboard')}
                    </h1>
                    <p className="text-text-secondary font-medium text-lg md:text-xl max-w-2xl leading-relaxed">
                        Bienvenue, <span className="text-text-main font-black underline decoration-accent-color/30 underline-offset-4">{activeProfile.name}</span>. {t('supportMsg2') || 'Votre voyage spirituel continue ici.'}
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="flex flex-col items-center">
                    <div className="relative group p-6 rounded-[2.5rem] bg-slate-900 shadow-2xl border border-white/5 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-3 mb-2">
                                <Flame size={24} className="text-orange-500 animate-pulse" />
                                <span className="text-4xl md:text-5xl font-black text-white">{state.progress.consecutiveDays}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white/60 transition-colors">{t('streak')}</span>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Global Rings Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {isReadingActive && (
                    <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!bg-slate-900 border-white/5 shadow-2xl overflow-visible text-white p-8 group transition-all hover-glow">
                            <div className="flex justify-between items-start mb-8">
                                <ProgressRing percent={overallPercent} color="text-emerald-500" icon={<BookOpen size={24} />} label={t('readingGoal')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 py-6 border-t border-white/5">
                                <div>
                                    <span className="block text-2xl font-black text-emerald-500">{totalPagesRead}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('pagesReadShort') || 'Pages lues'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-black text-white">{readingGoal!.duration - state.progress.currentReadingDay + 1}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('daysLeft') || 'Jours restants'}</span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="!bg-slate-900 border-white/5 shadow-2xl overflow-visible text-white p-8 group transition-all hover-glow">
                        <div className="flex justify-between items-start mb-8">
                            <ProgressRing percent={hadithPercent} color="text-warning" icon={<Sparkles size={24} />} label={t('hadithGoal')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 py-6 border-t border-white/5">
                            <div>
                                <span className="block text-2xl font-black text-warning">{masteredHadiths}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('mastered') || 'Hadiths acquis'}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-black text-white">{HADITH_COLLECTION.length - masteredHadiths}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('remaining') || 'Reste à apprendre'}</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {isRevisionActive && (
                    <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!bg-slate-900 border-white/5 shadow-2xl overflow-visible text-white p-8 group transition-all hover-glow">
                            <div className="flex justify-between items-start mb-8">
                                <ProgressRing percent={revisionPercent} color="text-blue-500" icon={<Brain size={24} />} label={t('revisionGoal')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 py-6 border-t border-white/5">
                                <div>
                                    <span className="block text-2xl font-black text-blue-400">{state.progress.currentRevisionIndex}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('completed') || 'Étapes faites'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-black text-white">{revisionPlan!.length - state.progress.currentRevisionIndex}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{t('daysLeft') || 'Jours restants'}</span>
                                </div>
                            </div>
                            {currentRevision && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-white/5">
                                    {(['revised', 'to-review', 'not_revised'] as const).map(revStat => (
                                        <Button
                                            key={revStat}
                                            variant={currentRevision.status === revStat ? (revStat === 'revised' ? 'success' : revStat === 'to-review' ? 'warning' : 'danger') : 'secondary'}
                                            className={clsx(
                                                "h-14 rounded-2xl border-none text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                currentRevision.status === revStat
                                                    ? "shadow-premium scale-105 opacity-100"
                                                    : "bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100"
                                            )}
                                            onClick={() => handleRevisionStatusUpdate(currentRevision, revStat)}
                                        >
                                            {revStat === 'revised' ? t('revised') : revStat === 'to-review' ? t('toReview') : t('not_revised')}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="accent"
                                        className="h-14 rounded-2xl bg-blue-500 text-white border-none hover:scale-105 transition-transform text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => dispatch({ type: 'COMPLETE_REVISION_DAY' } as any)}
                                    >
                                        {t('nextDay') || 'Suivant'}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </section>

            {/* Daily Missions */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Mission Reading */}
                <AnimatePresence>
                    {isReadingActive && currentReading && (
                        <motion.div
                            custom={3} initial="hidden" animate="visible" variants={cardVariants}
                            className="relative group h-full"
                        >
                            <Card className="h-full relative border-none shadow-2xl overflow-hidden rounded-[3rem] group transition-all hover:scale-[1.01] duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />

                                <div className="p-8 md:p-12 space-y-10 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className={`${missionBadgeBase} bg-emerald-500 text-white shadow-emerald-500/20`}>
                                            {t('missionReading')}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-30">Jour {currentReading.day}</div>
                                    </div>

                                    <div className="p-10 md:p-14 bg-slate-900 rounded-[3.5rem] border border-white/5 text-center shadow-inner group/target hover:bg-slate-800 transition-colors duration-500">
                                        {(() => {
                                            const { surahName, hizbNum } = getHizbDetailsFromPage(currentReading.startPage);
                                            const hizbInfo = HIZB_DATA[hizbNum - 1];
                                            const details = hizbInfo?.details || '';

                                            return (
                                                <>
                                                    <h4 className="text-4xl md:text-5xl font-black mb-3 text-white tracking-tight drop-shadow-md">
                                                        {surahName}
                                                    </h4>
                                                    {details && (
                                                        <p className="text-xs md:text-sm font-semibold text-text-secondary mb-6">
                                                            {details}
                                                        </p>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <div className="flex items-center justify-center gap-6 mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">{t('fromPage') || 'DEPUIS'}</span>
                                                <span className="text-2xl font-black text-emerald-500">{currentReading.startPage}</span>
                                            </div>
                                            <div className="h-8 w-px bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">{t('toPage') || 'JUSQU\'À'}</span>
                                                <span className="text-2xl font-black text-emerald-500">{currentReading.endPage}</span>
                                            </div>
                                        </div>

                                        {currentReading.isKahfDay && (
                                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                                <div className="flex items-center justify-center gap-2 text-accent-color">
                                                    <Star size={16} fill="currentColor" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sourate Al-Kahf (Vendredi)</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(currentReading, 'done', true)}
                                                        className={clsx(
                                                            "py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                                            state.progress.readingHistory[`day_${currentReading.day}`]?.kahfStatus === 'done'
                                                                ? "bg-accent-color border-accent-color text-white"
                                                                : "bg-white/5 border-white/10 hover:border-accent-color/50"
                                                        )}
                                                    >
                                                        Lu
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(currentReading, 'partial', true)}
                                                        className={clsx(
                                                            "py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                                            state.progress.readingHistory[`day_${currentReading.day}`]?.kahfStatus === 'partial'
                                                                ? "bg-warning border-warning text-white"
                                                                : "bg-white/5 border-white/10 hover:border-warning/50"
                                                        )}
                                                    >
                                                        En partie
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(currentReading, 'not_read', true)}
                                                        className={clsx(
                                                            "py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                                            state.progress.readingHistory[`day_${currentReading.day}`]?.kahfStatus === 'not_read'
                                                                ? "bg-danger border-danger text-white"
                                                                : "bg-white/5 border-white/10 hover:border-danger/50"
                                                        )}
                                                    >
                                                        Non lu
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <Timer onStop={(s) => handleStatusChange(currentReading, 'done', false, s)} />
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <Button
                                                variant={readingStatus === 'done' ? 'success' : 'secondary'}
                                                size="lg"
                                                className={clsx(
                                                    "h-24 rounded-3xl px-10 md:px-12 text-base md:text-lg font-black uppercase whitespace-normal transition-all duration-300 border-2",
                                                    readingStatus === 'done' ? "shadow-premium scale-105 border-success bg-success text-white opacity-100" : "bg-white/5 border-white/10 opacity-70"
                                                )}
                                                onClick={() => handleStatusChange(currentReading, 'done')}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center">
                                                        <CheckCircle2 size={24} className="mr-3" /> {t('goalAchieved') || 'Accompli'}
                                                    </div>
                                                    <span className="text-[10px] mt-1 opacity-80">{currentReading.endPage - currentReading.startPage + 1} pages lues</span>
                                                </div>
                                            </Button>
                                            <Button
                                                variant={readingStatus === 'partial' ? 'warning' : 'secondary'}
                                                size="lg"
                                                className={clsx(
                                                    "h-24 rounded-3xl px-10 md:px-12 text-base md:text-lg font-black uppercase whitespace-normal transition-all duration-300 border-2",
                                                    readingStatus === 'partial' ? "shadow-premium scale-105 border-warning bg-warning text-white opacity-100" : "bg-white/5 border-white/10 opacity-70"
                                                )}
                                                onClick={() => handleStatusChange(currentReading, 'partial')}
                                            >
                                                <AlertCircle size={24} className="mr-3" /> {t('partial') || 'Partiel'}
                                            </Button>
                                            <Button
                                                variant={readingStatus === 'not_read' ? 'danger' : 'secondary'}
                                                size="lg"
                                                className={clsx(
                                                    "h-24 rounded-3xl px-10 md:px-12 text-base md:text-lg font-black uppercase whitespace-normal transition-all duration-300 border-2",
                                                    readingStatus === 'not_read' ? "shadow-premium scale-105 border-danger bg-danger text-white opacity-100" : "bg-white/5 border-white/10 opacity-70"
                                                )}
                                                onClick={() => handleStatusChange(currentReading, 'not_read')}
                                            >
                                                {t('notReadStatus') || 'Non lu'}
                                            </Button>
                                            <Button
                                                variant={readingStatus === 'catchup' ? 'accent' : 'secondary'}
                                                size="lg"
                                                className={clsx(
                                                    "h-24 rounded-3xl px-10 md:px-12 text-base md:text-lg font-black uppercase whitespace-normal transition-all duration-300",
                                                    readingStatus === 'catchup' ? "shadow-2xl shadow-accent-color/40 scale-105 border-transparent" : "bg-white/5 border-white/10 opacity-70"
                                                )}
                                                onClick={() => handleStatusChange(currentReading, 'catchup')}
                                            >
                                                {t('catchupStatus') || 'Supp.'}
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="lg" className="w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 hover:bg-bg-secondary" onClick={handleAdvance}>
                                            {t('nextDay') || 'Passer au jour suivant'} <ChevronRight size={18} className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mission Hadith */}
                <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants} className="relative group h-full">
                    <Card className="h-full relative border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
                        <div className="absolute inset-0 bg-gradient-to-tr from-warning/5 to-transparent pointer-events-none" />

                        <div className="p-6 md:p-10 flex flex-col h-full space-y-8 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className={`${missionBadgeBase} bg-warning text-slate-900 shadow-warning/20`}>
                                    {t('missionHadith')}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/80">{hadithMissionTitle}</div>
                            </div>

                            {hadithDuJour ? (
                                <>
                                    <div className="flex-grow flex flex-col justify-center items-center py-6 group/h text-center cursor-pointer" onClick={() => setHadithModalContent(hadithDuJour)}>
                                        <motion.p layoutId={`hadith-${hadithDuJour.id}`} className="font-amiri text-2xl md:text-4xl leading-[2.2] md:leading-[2.8] rtl text-right drop-shadow-xl text-white/95 group-hover/h:text-warning transition-colors duration-700">
                                            {hadithDuJour.arabic}
                                        </motion.p>

                                        <div className="mt-8 flex flex-col items-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowHadithTranslation(!showHadithTranslation); }}
                                                className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                                            >
                                                {showHadithTranslation ? <EyeOff size={18} className="text-warning" /> : <Eye size={18} className="text-warning" />}
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white/70">
                                                    {t(showHadithTranslation ? 'hideTranslation' : 'showTranslation') || 'Traduction'}
                                                </span>
                                            </button>

                                            <AnimatePresence>
                                                {showHadithTranslation && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                        className="mt-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 text-sm md:text-base text-white/70 max-w-lg italic leading-relaxed backdrop-blur-md"
                                                    >
                                                        {state.settings.lang === 'ar' ? null : (hadithDuJour.translations as any)[state.settings.lang] || hadithDuJour.translations.en}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-white/5">
                                        {(['lu', 'en_memorisation', 'a_reprendre', 'acquis'] as const).map(hStat => {
                                            const currentHadithStatus = activeProfile?.hadithProgress?.[hadithDuJour.id];
                                            const isActive = currentHadithStatus === hStat;
                                            return (
                                                <Button
                                                    key={hStat}
                                                    variant={isActive ? (hStat === 'lu' || hStat === 'acquis' ? 'success' : hStat === 'a_reprendre' ? 'warning' : 'accent') : 'secondary'}
                                                    className={clsx(
                                                        "h-14 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                        isActive
                                                            ? "shadow-premium scale-105 opacity-100 border-current"
                                                            : "bg-white/5 border-white/10 opacity-60 hover:opacity-100"
                                                    )}
                                                    onClick={() => handleHadithStatusChange(hadithDuJour.id, hStat)}
                                                >
                                                    {hStat === 'lu' ? t('read') :
                                                        hStat === 'en_memorisation' ? t('statusEnMemorisation') :
                                                            hStat === 'a_reprendre' ? t('statusARependre') :
                                                                t('statusAcquis')}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                                    <div className="w-32 h-32 accent-gradient rounded-[3rem] flex items-center justify-center text-white shadow-premium animate-bounce-subtle">
                                        <Trophy size={64} />
                                    </div>
                                    <h3 className="text-4xl font-black italic tracking-tight">{t('allDone') || 'Macha\'Allah !'}</h3>
                                    <p className="text-white/60 text-lg max-w-sm">{t('allHadithsCompleted') || 'Vous avez exploré toute la collection pour aujourd\'hui.'}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* Mission Revision */}
                {isRevisionActive && currentRevision && (
                    <motion.div
                        custom={5}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        className="relative group h-full xl:col-span-2"
                    >
                        <Card className="h-full relative border-none shadow-2xl overflow-hidden rounded-[3rem] group transition-all hover:scale-[1.01] duration-500 bg-slate-900 text-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />

                            <div className="p-8 md:p-12 space-y-10 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className={`${missionBadgeBase} bg-blue-500 text-white shadow-blue-500/20`}>
                                        {t('missionRevision')}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                        {t('day')} {state.progress.currentRevisionIndex + 1}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {currentRevision.units.map((unit, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-bg-main/60 border border-border-main/40 text-left">
                                            <div className="text-sm font-black">{unit.text}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                                {unit.surahs}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                    {(['revised', 'not_revised', 'to-review'] as const).map(revStat => {
                                        const isActive = currentRevision.status === revStat;
                                        return (
                                            <Button
                                                key={revStat}
                                                variant={isActive ? (revStat === 'revised' ? 'success' : revStat === 'to-review' ? 'warning' : 'danger') : 'secondary'}
                                                className={clsx(
                                                    "h-14 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                    isActive
                                                        ? "shadow-premium scale-105 opacity-100 border-current"
                                                        : "bg-white/5 border-white/10 opacity-60 hover:opacity-100 text-white/70"
                                                )}
                                                onClick={() => revStat === 'to-review' ? setIsReadjustmentModalOpen(true) : handleRevisionStatusUpdate(currentRevision, revStat)}
                                            >
                                                {revStat === 'revised' ? t('revised') : revStat === 'to-review' ? t('toReview') : t('not_revised')}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </section>

            {/* Quick Evaluation CTA */}
            <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
                <div className="relative overflow-hidden p-12 md:p-20 rounded-[4rem] bg-slate-950 text-white shadow-2xl group transition-all duration-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-red-600/10 opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[120%] bg-red-500/20 blur-[130px] pointer-events-none rotate-12" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-500/20 blur-[100px] pointer-events-none" />

                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={120} className="animate-pulse" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="text-center lg:text-left space-y-6">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-red-500/20 backdrop-blur-md">
                                <Play size={12} className="fill-current" /> Auto-évaluation
                            </div>
                            <h2 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter leading-tight">
                                {t('evalPromptTitle') || 'Défiez votre mémoire'}
                            </h2>
                            <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-2xl leading-relaxed">
                                {t('evalPromptSubtitle') || 'Utilisez nos outils d\'évaluation pour ancrer vos acquis durablement.'}
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="lg"
                            className="w-full lg:w-auto px-16 h-24 text-xl font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-danger/30 group/btn transition-all active:scale-95"
                            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-view' })}
                        >
                            <Sparkles size={28} className="mr-4 group-hover/btn:rotate-12 transition-transform" /> {t('startEvaluationShort') || 'S\'évaluer maintenant'}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Modals Portals */}
            <EndOfGoalModal isOpen={isEndOfGoalModalOpen} onClose={() => setIsEndOfGoalModalOpen(false)} />
            <InputModal isOpen={inputModalState.isOpen} onClose={() => setInputModalState({ ...inputModalState, isOpen: false })} onSubmit={inputModalState.onSubmit} title={inputModalState.title} label={inputModalState.label} confirmText={t('validate')} cancelText={t('cancel')} />
            {isReadjustmentModalOpen && currentRevision && (
                <ReadjustmentModal
                    isOpen={isReadjustmentModalOpen}
                    onClose={() => setIsReadjustmentModalOpen(false)}
                    onConfirm={(selectedItems) => {
                        dispatch({
                            type: 'UPDATE_REVISION_STATUS',
                            payload: {
                                revisionIndex: state.progress.currentRevisionIndex,
                                status: 'to-review',
                                difficulties: selectedItems,
                            },
                        });
                        setIsReadjustmentModalOpen(false);
                    }}
                    title={t('toReview')}
                    items={revisionItems}
                />
            )}

            <AnimatePresence>
                {hadithModalContent && (
                    <Modal isOpen={!!hadithModalContent} onClose={() => setHadithModalContent(null)}>
                        <div className="p-4 md:p-12 text-center space-y-12">
                            <div className="space-y-4">
                                <div className="w-16 h-1 w-20 bg-accent-color/20 mx-auto rounded-full mb-8" />
                                <div className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">{t('hadith')} {hadithModalContent.id}</div>
                                <h3 className="text-4xl font-black text-gradient">Sagesse Divine</h3>
                            </div>

                            <div className="p-8 md:p-12 rounded-[3.5rem] bg-slate-900 shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-30" />
                                <p className="relative z-10 font-amiri text-3xl md:text-5xl leading-[2.5] md:leading-[3] rtl text-right text-white drop-shadow-2xl">
                                    {hadithModalContent.arabic}
                                </p>
                            </div>

                            <div className="p-8 md:p-10 glass-card border-none bg-accent-color/5 rounded-[3rem] italic text-lg md:text-xl leading-relaxed text-text-main/80 font-medium">
                                {state.settings.lang === 'ar' ? null : (hadithModalContent.translations as any)[state.settings.lang] || hadithModalContent.translations.en}
                            </div>

                            <Button variant="accent" size="lg" className="w-full h-20 rounded-3xl text-sm font-black uppercase tracking-widest" onClick={() => setHadithModalContent(null)}>{t('close') || 'Quitter la lecture'}</Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardView;