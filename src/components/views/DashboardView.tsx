import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { HIZB_DATA, JUZ_DATA, FULL_SURAH_LIST, HIZB_PAGE_RANGES, SURAH_DATA } from '@/constants/quranData';
import { checkReadingProgress } from '@/services/progressLogic';
import EndOfGoalModal from '@/components/ui/EndOfGoalModal';
import Modal from '@/components/ui/Modal';
import Timer from '@/components/ui/Timer';
import { ReadingStatus, Hadith, HadithMemorizationStatus, PlanDay, RevisionStatus, ExtraRevisionEntry, RevisionUnit } from '@/types';
import { notificationService } from '@/components/ui/NotificationContainer';
import InputModal from '@/components/ui/InputModal';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { HADITH_COLLECTION } from '@/constants/hadithData';
import { Eye, EyeOff, Sparkles, BookOpen, BookOpenCheck, Brain, Trophy, Flame, ChevronRight, Play, CheckCircle2, Star, Calendar, RotateCcw, Clock } from 'lucide-react';
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
    const [inputModalState, setInputModalState] = useState<{ isOpen: boolean; title: string; label: string; onSubmit: (value: string) => void; min?: number; max?: number; initialValue?: string; }>({ isOpen: false, title: '', label: '', onSubmit: () => { } });
    const [ratingSelector, setRatingSelector] = useState<{ isOpen: boolean; type: 'quran' | 'hadith'; index: number; surahRatings?: Record<string, 'tres_bien' | 'bien' | 'moyen' | 'a_revoir'>; pendingRating?: 'tres_bien' | 'bien' | 'moyen' | 'a_revoir'; extraRevisionItem?: ExtraRevisionEntry } | null>(null);
    const [extraRevisionModalOpen, setExtraRevisionModalOpen] = useState(false);
    const [extraRevisionType, setExtraRevisionType] = useState<'juzz' | 'hizb' | 'sourate'>('hizb');
    const [extraRevisionItemId, setExtraRevisionItemId] = useState<string>('');

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

    const hasHadithRevisionGoal = !!activeProfile?.goals?.hadithRevision;

    const getRevisionStartPage = (unit: RevisionUnit): number | null => {
        const text = unit.text.trim();
        const juzMatch = text.match(/Juz(z)?\s*(\d+)/i);
        if (juzMatch) {
            const num = parseInt(juzMatch[2], 10);
            const juz = JUZ_DATA.find(j => j.id === num);
            return juz?.page ?? null;
        }
        const hizbMatch = text.match(/Hizb\s*(\d+)/i);
        if (hizbMatch) {
            const num = parseInt(hizbMatch[1], 10);
            if (num >= 1 && num <= HIZB_PAGE_RANGES.length) {
                return HIZB_PAGE_RANGES[num - 1].startPage;
            }
        }
        const surah = FULL_SURAH_LIST.find(s =>
            text === s.name ||
            text.endsWith(s.name) ||
            text.includes(s.name),
        );
        if (surah) {
            const data = SURAH_DATA.find(d => d.id === surah.id);
            return data?.startPage ?? null;
        }
        return null;
    };

    const handleHadithPlanStatusChange = (index: number, status: RevisionStatus) => {
        if (status === 'revised') {
            if (hasHadithRevisionGoal) {
                setRatingSelector({ isOpen: true, type: 'hadith', index });
            } else {
                dispatch({ type: 'UPDATE_HADITH_REVISION_STATUS', payload: { dayIndex: index, status } });
                dispatch({ type: 'SET_TOAST', payload: t('mayAllahEase') });
            }
        } else {
            dispatch({ type: 'UPDATE_HADITH_REVISION_STATUS', payload: { dayIndex: index, status } });
            const msg = t('mayAllahEase');
            dispatch({ type: 'SET_TOAST', payload: msg });
        }
    };

    const openMushafAtReadingPage = () => {
        if (!readingPlan || !currentReading) return;
        const dayEntry = state.progress.readingHistory[`day_${currentReading.day}`];
        const realPages = dayEntry?.realPages ?? 0;
        const targetPages = currentReading.recalculatedPages;
        const clampedPages = Math.max(0, Math.min(realPages, targetPages));
        const page = clampedPages > 0 ? currentReading.startPage + clampedPages - 1 : currentReading.startPage;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('mushafLastPage', String(Math.min(page, 604)));
        }
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'mushaf-view' });
    };

    const openMushafAtRevisionPage = () => {
        if (!revisionPlan || !isRevisionActive) return;
        const currentRevision = revisionPlan[state.progress.currentRevisionIndex];
        const firstUnit = currentRevision?.units?.[0];
        if (!firstUnit) return;
        const inferredPage = getRevisionStartPage(firstUnit);
        const fallbackPage = currentReading?.startPage ?? 1;
        const targetPage = inferredPage ?? fallbackPage;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('mushafLastPage', String(Math.min(targetPage, 604)));
        }
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'mushaf-view' });
    };

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahf: boolean = false, time?: number) => {
        const execute = (realPages: number, statusOverride?: ReadingStatus) => {
            if (!activeProfile) return;
            const dayKey = `day_${day.day}`;
            const existing = state.progress.readingHistory[dayKey] || { status: 'not_read', realPages: 0, adjustment: 0 };
            const targetPages = day.recalculatedPages;
            const adjustment = realPages - targetPages;
            const resolvedStatus = statusOverride ?? (realPages >= targetPages ? (realPages > targetPages ? 'catchup' : 'done') : 'partial');
            const newHistory = {
                ...state.progress.readingHistory,
                [dayKey]: isKahf ? { ...existing, kahfStatus: status } : { ...existing, status: resolvedStatus, realPages, adjustment, timeSpent: time !== undefined ? (existing.timeSpent || 0) + time : existing.timeSpent }
            };
            const recPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, newHistory, state.progress.currentReadingDay) : null;
            dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory, recalculatedPlan: recPlan! } });
            const msg = (resolvedStatus === 'done' || resolvedStatus === 'catchup')
                ? (Math.random() > 0.5 ? t('jazakAllahuKhayr') : t('barakAllahuFik'))
                : t('mayAllahEase');
            dispatch({ type: 'SET_TOAST', payload: msg });
        };
        if (!isKahf && status === 'done') {
            setInputModalState({
                isOpen: true, title: t('upToWhichPage'),
                label: t('upToWhichPageLabel', { min: day.startPage, max: 604 }),
                min: day.startPage, max: 604, initialValue: String(day.endPage),
                onSubmit: (v) => {
                    const p = Math.max(day.startPage, Math.min(604, parseInt(v) || day.startPage));
                    execute(p - day.startPage + 1);
                }
            });
        } else if (!isKahf && status === 'not_read') {
            execute(0, 'not_read');
        } else {
            const existing = state.progress.readingHistory[`day_${day.day}`] || { status: 'not_read' as ReadingStatus, realPages: 0, adjustment: 0 };
            execute(existing.realPages || day.recalculatedPages, existing.status);
        }
    };

    const handleHadithStatusChange = (hadithId: number, status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_PROGRESS', payload: { hadithId, status, date: new Date().toISOString() } });
        const msg = (status === 'acquis' || status === 'lu')
            ? (Math.random() > 0.5 ? t('jazakAllahuKhayr') : t('barakAllahuFik'))
            : t('mayAllahEase');
        dispatch({ type: 'SET_TOAST', payload: msg });
    };

    const handleRevisionRating = (rating: 'tres_bien' | 'bien' | 'moyen' | 'a_revoir') => {
        if (!ratingSelector) return;
        const { type, index, surahRatings = {}, extraRevisionItem } = ratingSelector;

        if (extraRevisionItem) {
            dispatch({ type: 'ADD_EXTRA_REVISION', payload: { ...extraRevisionItem, quality: rating } });
            dispatch({ type: 'SET_TOAST', payload: t('jazakAllahuKhayr') });
            setRatingSelector(null);
            return;
        }

        if (type === 'quran') {
            const currentRevision = revisionPlan?.[index];
            if (!currentRevision) return;

            const allSurahs = currentRevision.units.flatMap(u => {
                const hizbMatch = u.text.match(/Hizb (\d+)/);
                if (hizbMatch) {
                    const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                    const hizb = HIZB_DATA[hizbIndex];
                    if (hizb && Array.isArray(hizb.surahs)) return hizb.surahs;
                }
                return (u.surahs || '').split(',').map(s => s.trim()).filter(Boolean);
            });
            const ratedSurahs = Object.keys(surahRatings);
            const remainingSurahs = allSurahs.filter(s => !ratedSurahs.includes(s));
            const currentSurah = remainingSurahs[0];

            if (!currentSurah) return;

            const newSurahRatings = { ...surahRatings, [currentSurah]: rating };
            const newRatedCount = Object.keys(newSurahRatings).length;

            if (newRatedCount === allSurahs.length) {
                // Determine overall quality (lowest rating)
                const ratings = Object.values(newSurahRatings);
                let overallQuality: any = 'tres_bien';
                if (ratings.includes('a_revoir')) overallQuality = 'a_revoir';
                else if (ratings.includes('moyen')) overallQuality = 'moyen';
                else if (ratings.includes('bien')) overallQuality = 'bien';

                dispatch({
                    type: 'UPDATE_REVISION_STATUS',
                    payload: { revisionIndex: index, status: 'revised', quality: overallQuality, surahRatings: newSurahRatings }
                });
                const msg = Math.random() > 0.5 ? t('jazakAllahuKhayr') : t('barakAllahuFik');
                dispatch({ type: 'SET_TOAST', payload: msg });
                setRatingSelector(null);
            } else {
                setRatingSelector({ ...ratingSelector, surahRatings: newSurahRatings });
            }
        } else {
            dispatch({
                type: 'UPDATE_HADITH_REVISION_STATUS',
                payload: { dayIndex: index, status: 'revised', quality: rating }
            });
            const msg = Math.random() > 0.5 ? t('jazakAllahuKhayr') : t('barakAllahuFik');
            dispatch({ type: 'SET_TOAST', payload: msg });
            setRatingSelector(null);
        }
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
        const msg = Math.random() > 0.5 ? t('jazakAllahuKhayr') : t('barakAllahuFik');
        dispatch({ type: 'SET_TOAST', payload: msg });
    };

    const currentRevision = isRevisionActive ? revisionPlan?.[state.progress.currentRevisionIndex] : null;

    const revisionItems = currentRevision
        ? currentRevision.units.flatMap(unit => {
            const hizbMatch = unit.text.match(/Hizb (\d+)/);
            if (hizbMatch) {
                const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                const hizb = HIZB_DATA[hizbIndex];
                if (hizb && Array.isArray(hizb.surahs)) {
                    return hizb.surahs;
                }
            }
            return unit.surahs.split(',').map(s => s.trim()).filter(Boolean);
        })
        : [];

    return (
        <div className="space-y-12 md:space-y-16 pb-32 pt-2 px-2 md:px-0">
            {/* Header Dashboard */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border-main pb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex-1">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                                <Sparkles size={28} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-text-secondary" />
                                <span className="text-sm font-bold text-text-main">
                                    {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                                </span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gradient mb-4">
                            {t('dashboard')}
                        </h1>
                        <p className="text-white/80 font-medium text-lg md:text-xl max-w-2xl leading-relaxed">
                            <>
                                {t('welcome')},{" "}
                                <span className="text-white font-black underline decoration-accent-color/40 underline-offset-4">
                                    {activeProfile.name}
                                </span>
                                . {t('supportMsg2')}
                            </>
                        </p>
                    </div>
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

                {hasHadithRevisionGoal && (
                    <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!bg-slate-900 border-white/5 shadow-2xl overflow-visible text-white p-8 group transition-all hover-glow">
                            <div className="flex justify-between items-start mb-8">
                                <ProgressRing
                                    percent={hadithPercent}
                                    color="text-warning"
                                    icon={<Sparkles size={24} />}
                                    label={t('hadithGoal')}
                                />
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
                )}

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
                        </Card>
                    </motion.div>
                )}
            </section>

            {/* Raccourcis Mushaf (mobile uniquement) */}
            {(isReadingActive || isRevisionActive) && (
                <div className="md:hidden mt-6 grid grid-cols-2 gap-3">
                    {isReadingActive && currentReading && (
                        <Button
                            variant="ghost"
                            className="h-12 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            onClick={openMushafAtReadingPage}
                        >
                            <BookOpen size={14} /> {t('openInMushaf') ?? 'Ouvrir dans le Mushaf'}
                        </Button>
                    )}
                    {isRevisionActive && (
                        <Button
                            variant="ghost"
                            className="h-12 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            onClick={openMushafAtRevisionPage}
                        >
                            <BookOpenCheck size={14} /> {t('openInMushaf') ?? 'Ouvrir dans le Mushaf'}
                        </Button>
                    )}
                </div>
            )}

            {/* Daily Missions */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-10 mt-6">
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
                                        <div className={`${missionBadgeBase} bg-success text-white shadow-success/20`}>
                                            {t('missionReading')}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {readingHistoryEntry?.timeSpent && readingHistoryEntry.timeSpent > 0 && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                                    <Clock size={14} />
                                                    {Math.floor(readingHistoryEntry.timeSpent / 60)} min
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Jour {currentReading.day}</span>
                                        </div>
                                    </div>

                                    <div className="p-10 md:p-14 bg-slate-900 rounded-[3.5rem] border border-white/5 text-center shadow-inner group/target hover:bg-slate-800 transition-colors duration-500">
                                        {(() => {
                                            const startHizb = getHizbDetailsFromPage(currentReading.startPage);
                                            const endHizb = getHizbDetailsFromPage(currentReading.endPage);
                                            const startInfo = HIZB_DATA[startHizb.hizbNum - 1];
                                            const endInfo = HIZB_DATA[endHizb.hizbNum - 1];

                                            if (startHizb.hizbNum === endHizb.hizbNum) {
                                                return (
                                                    <h4 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                                                        Hizb {startHizb.hizbNum} : {startInfo?.details || ''}
                                                    </h4>
                                                );
                                            }
                                            return (
                                                <h4 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                                                    Hizb {startHizb.hizbNum} : {startInfo?.details || ''} à Hizb {endHizb.hizbNum} : {endInfo?.details || ''}
                                                </h4>
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
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <Sparkles size={16} className="text-emerald-400" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sourate Al-Kahf (Vendredi)</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setRatingSelector({ isOpen: true, type: 'quran', index: -1 })} // Reuse rating selector modal structure for Kahf merits or use a separate one
                                                        className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 hover:text-emerald-400 underline underline-offset-4"
                                                    >
                                                        {t('view') || 'Voir'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { status: 'done', label: 'Lu', color: 'success' },
                                                        { status: 'partial', label: 'En partie', color: 'warning' },
                                                        { status: 'not_read', label: 'Non lu', color: 'danger' }
                                                    ].map(({ status, label, color }) => {
                                                        const currentKahfStatus = state.progress.readingHistory[`day_${currentReading.day}`]?.kahfStatus;
                                                        const isActive = currentKahfStatus === status;
                                                        return (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleStatusChange(currentReading, status as any, true)}
                                                                className={clsx(
                                                                    "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                                                    isActive
                                                                        ? `bg-${color} border-${color} text-white shadow-lg shadow-${color}/20`
                                                                        : "bg-white/5 border-white/10 hover:border-white/20 text-white/40"
                                                                )}
                                                            >
                                                                {label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <Timer onStop={(s) => handleStatusChange(currentReading, 'done', false, s)} />
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            onClick={openMushafAtReadingPage}
                                        >
                                            <BookOpen size={16} /> {t('openInMushaf') ?? 'Ouvrir dans le Mushaf'}
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { status: 'done', icon: <CheckCircle2 size={18} />, label: t('goalAchieved') || 'Lu', color: 'success' },
                                                { status: 'not_read', icon: <EyeOff size={18} />, label: t('notDone') || 'Pas fait', color: 'danger' }
                                            ].map((btn) => {
                                                const isActive = (btn.status === 'done' && (readingStatus === 'done' || readingStatus === 'partial' || readingStatus === 'catchup')) || (btn.status === 'not_read' && readingStatus === 'not_read');
                                                const currentEntry = state.progress.readingHistory[`day_${currentReading.day}`];
                                                const actualPages = currentEntry?.realPages ?? 0;
                                                const targetPages = currentReading.recalculatedPages;
                                                const diff = actualPages - targetPages;

                                                return (
                                                    <Button
                                                        key={btn.status}
                                                        variant={isActive ? (btn.color as any) : 'secondary'}
                                                        size="lg"
                                                        className={clsx(
                                                            "h-32 rounded-3xl px-2 md:px-4 text-[10px] md:text-xs font-black uppercase whitespace-normal leading-tight transition-all duration-300 border-2",
                                                            isActive
                                                                ? `shadow-premium scale-105 border-${btn.color} bg-${btn.color === 'accent-color' ? 'emerald-600' : btn.color} text-white opacity-100`
                                                                : "bg-white/5 border-white/10 opacity-70"
                                                        )}
                                                        onClick={() => handleStatusChange(currentReading, btn.status as any)}
                                                    >
                                                        <div className="flex flex-col items-center text-center">
                                                            <div className="flex flex-col items-center mb-1">
                                                                {btn.icon}
                                                                <span className="mt-1">{btn.label}</span>
                                                            </div>
                                                            {isActive && actualPages > 0 && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                    className="mt-2 flex flex-col items-center gap-1"
                                                                >
                                                                    <span className="text-[10px] font-black bg-black/30 px-3 py-1 rounded-full text-white shadow-lg">
                                                                        {actualPages} P.
                                                                    </span>
                                                                    {diff !== 0 && (
                                                                        <span className={clsx(
                                                                            "text-[8px] font-bold px-2 py-0.5 rounded-full ring-1 ring-white/20",
                                                                            diff > 0 ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
                                                                        )}>
                                                                            {diff > 0 ? `+${diff}` : diff}
                                                                        </span>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </Button>
                                                );
                                            })}
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
                                <div className="flex items-center gap-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/80">{hadithMissionTitle}</div>
                                    {hadithPlan?.[state.progress.currentHadithRevisionIndex]?.quality && (
                                        <div className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            hadithPlan[state.progress.currentHadithRevisionIndex].quality === 'tres_bien' ? 'bg-success/20 text-success border border-success/30' :
                                                hadithPlan[state.progress.currentHadithRevisionIndex].quality === 'bien' ? 'bg-accent-color/20 text-accent-color border border-accent-color/30' :
                                                    hadithPlan[state.progress.currentHadithRevisionIndex].quality === 'moyen' ? 'bg-warning/20 text-warning border border-warning/30' :
                                                        'bg-danger/20 text-danger border border-danger/30'
                                        )}>
                                            {hadithPlan[state.progress.currentHadithRevisionIndex].quality.replace('_', ' ')}
                                        </div>
                                    )}
                                </div>
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

                                    <div className={clsx("grid gap-2 pt-6 border-t border-white/5", hasHadithRevisionGoal ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2")}>
                                        {(hasHadithRevisionGoal
                                            ? (['en_memorisation', 'a_reprendre', 'acquis', 'non_lu'] as const)
                                            : (['lu', 'non_lu'] as const)
                                        ).map(hStat => {
                                            const currentHadithStatus = activeProfile?.hadithProgress?.[hadithDuJour.id];
                                            const isActive = currentHadithStatus === hStat || (hStat === 'lu' && currentHadithStatus === 'acquis');
                                            return (
                                                <Button
                                                    key={hStat}
                                                    variant={isActive ? (hStat === 'lu' || hStat === 'acquis' ? 'success' : hStat === 'a_reprendre' ? 'warning' : 'accent') : 'secondary'}
                                                    className={clsx(
                                                        "h-20 lg:h-16 rounded-2xl border-2 text-[8px] lg:text-[9px] px-1 font-black uppercase tracking-tight transition-all duration-300",
                                                        isActive
                                                            ? "shadow-premium scale-105 opacity-100 border-current"
                                                            : "bg-white/5 border-white/10 opacity-60 hover:opacity-100"
                                                    )}
                                                    onClick={() => {
                                                        if (hStat === 'lu') {
                                                            handleHadithPlanStatusChange(state.progress.currentHadithRevisionIndex, 'revised');
                                                            if (!hasHadithRevisionGoal) dispatch({ type: 'UPDATE_HADITH_PROGRESS', payload: { hadithId: hadithDuJour.id, status: 'lu', date: new Date().toISOString() } });
                                                        } else {
                                                            handleHadithStatusChange(hadithDuJour.id, hStat);
                                                        }
                                                    }}
                                                >
                                                    <div className="text-center leading-tight">
                                                        {hStat === 'lu' ? t('read') :
                                                            hStat === 'en_memorisation' ? t('statusEnMemorisation') :
                                                                hStat === 'a_reprendre' ? t('statusARependre') :
                                                                    hStat === 'acquis' ? t('statusAcquis') :
                                                                        t('statusNonLu')}
                                                    </div>
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
                                    <h3 className="text-4xl font-black italic tracking-tight">{t('allDone')}</h3>
                                    <p className="text-white/60 text-lg max-w-sm">{t('allHadithsCompleted')}</p>
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
                                    <div className="flex items-center gap-3">
                                        {currentRevision.timeSpent && currentRevision.timeSpent > 0 && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                                <Clock size={14} />
                                                {Math.floor(currentRevision.timeSpent / 60)} min
                                            </span>
                                        )}
                                        <div className="flex flex-col gap-1 items-end">
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                                {t('day')} {state.progress.currentRevisionIndex + 1}
                                            </div>
                                            {state.plans.revision?.[state.progress.currentRevisionIndex + 1] && (
                                                <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/40 text-right">
                                                    <span className="opacity-40">{t('nextRevision')} :</span> <span className="text-accent-color">{state.plans.revision?.[state.progress.currentRevisionIndex + 1]?.units.map(u => u.text).join(', ')}</span>
                                                    <div className="mt-1 lowercase opacity-30 italic font-medium">
                                                        {state.plans.revision?.[state.progress.currentRevisionIndex + 1]?.units.flatMap(u => {
                                                            const hizbMatch = u.text.match(/Hizb (\d+)/);
                                                            if (hizbMatch) {
                                                                const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                                                                return HIZB_DATA[hizbIndex]?.surahs || [];
                                                            }
                                                            return u.surahs.split(',').map(s => s.trim());
                                                        }).join(', ')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div
                                        className="flex items-start justify-between cursor-pointer group/rev"
                                        onClick={() => {
                                            if (currentRevision.surahRatings && Object.keys(currentRevision.surahRatings).length > 0) {
                                                setRatingSelector({ isOpen: true, type: 'quran', index: state.progress.currentRevisionIndex, surahRatings: currentRevision.surahRatings });
                                            }
                                        }}
                                    >
                                        <div className="flex flex-col gap-1 items-start">
                                            {currentRevision.units.map((unit, idx) => (
                                                <div key={idx} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-6 rounded-full bg-accent-color group-hover/rev:scale-y-125 transition-transform" />
                                                        <div className="text-sm font-black text-white/90 group-hover/rev:text-accent-color transition-colors">{unit.text}</div>
                                                    </div>
                                                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest ml-4">
                                                        {t('hizbConstituentSurahs').replace('{surahs}', unit.surahs)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        {currentRevision.quality && (
                                            <div className={clsx(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                currentRevision.quality === 'tres_bien' ? 'bg-success/20 text-success border border-success/30' :
                                                    currentRevision.quality === 'bien' ? 'bg-accent-color/20 text-accent-color border border-accent-color/30' :
                                                        currentRevision.quality === 'moyen' ? 'bg-warning/20 text-warning border border-warning/30' :
                                                            'bg-danger/20 text-danger border border-danger/30'
                                            )}>
                                                {currentRevision.quality.replace('_', ' ')}
                                            </div>
                                        )}
                                    </div>

                                    <Timer
                                        onStop={(s) => dispatch({
                                            type: 'UPDATE_REVISION_STATUS',
                                            payload: {
                                                revisionIndex: state.progress.currentRevisionIndex,
                                                status: currentRevision.status,
                                                timeSpent: s
                                            }
                                        })}
                                    />

                                    <Button
                                        variant="ghost"
                                        className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
                                        onClick={openMushafAtRevisionPage}
                                    >
                                        <BookOpenCheck size={16} /> {t('openInMushaf') ?? 'Ouvrir dans le Mushaf'}
                                    </Button>

                                    <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/5">
                                        <Button
                                            variant={currentRevision.status === 'revised' ? 'success' : 'secondary'}
                                            className={clsx(
                                                "h-14 min-w-0 flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-center px-2",
                                                currentRevision.status === 'revised' ? "shadow-lg shadow-success/20 ring-2 ring-success/50" : "bg-white/5 opacity-60 text-white/70"
                                            )}
                                            onClick={() => setRatingSelector({ isOpen: true, type: 'quran', index: state.progress.currentRevisionIndex })}
                                        >
                                            <CheckCircle2 size={14} className="shrink-0" /> <span className="truncate">{t('revised') || 'Révisé'}</span>
                                        </Button>
                                        <Button
                                            variant={currentRevision.status === 'to-review' ? 'warning' : 'secondary'}
                                            className={clsx(
                                                "h-14 min-w-0 flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-center px-2",
                                                currentRevision.status === 'to-review' ? "shadow-lg shadow-warning/20 ring-2 ring-warning/50" : "bg-white/5 opacity-60 text-white/70"
                                            )}
                                            onClick={() => dispatch({
                                                type: 'UPDATE_REVISION_STATUS',
                                                payload: { revisionIndex: state.progress.currentRevisionIndex, status: 'to-review' }
                                            })}
                                        >
                                            <RotateCcw size={14} className="shrink-0" /> <span className="truncate">{t('toReview') || 'À revoir'}</span>
                                        </Button>
                                        <Button
                                            variant={currentRevision.status === 'not_revised' ? 'danger' : 'secondary'}
                                            className={clsx(
                                                "h-14 min-w-0 flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-center px-2",
                                                currentRevision.status === 'not_revised' ? "shadow-lg shadow-danger/20 ring-2 ring-danger/50" : "bg-white/5 opacity-60 text-white/70"
                                            )}
                                            onClick={() => dispatch({
                                                type: 'UPDATE_REVISION_STATUS',
                                                payload: { revisionIndex: state.progress.currentRevisionIndex, status: 'not_revised' }
                                            })}
                                        >
                                            <EyeOff size={14} className="shrink-0" /> <span className="truncate">{t('notDone') || 'Pas fait'}</span>
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="col-span-3 h-12 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest border border-dashed border-white/20 hover:border-accent-color/50"
                                            onClick={() => {
                                                setExtraRevisionType('hizb');
                                                setExtraRevisionItemId('1');
                                                setExtraRevisionModalOpen(true);
                                            }}
                                        >
                                            <Star size={14} /> {t('addExtraRevision')}
                                        </Button>
                                    </div>
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
                            <div className={`${missionBadgeBase} inline-flex items-center gap-3 bg-danger text-white`}>
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
            <InputModal isOpen={inputModalState.isOpen} onClose={() => setInputModalState({ ...inputModalState, isOpen: false })} onSubmit={inputModalState.onSubmit} title={inputModalState.title} label={inputModalState.label} confirmText={t('validate')} cancelText={t('cancel')} min={inputModalState.min} max={inputModalState.max} initialValue={inputModalState.initialValue} />

            <Modal isOpen={extraRevisionModalOpen} onClose={() => setExtraRevisionModalOpen(false)}>
                <div className="p-6 space-y-6">
                    <h3 className="text-xl font-black text-text-main">{t('extraRevisionTitle')}</h3>
                    <div>
                        <label className="block text-sm font-bold mb-2">{t('extraRevisionSelectType')}</label>
                        <select
                            value={extraRevisionType}
                            onChange={(e) => {
                                const t = e.target.value as 'juzz' | 'hizb' | 'sourate';
                                setExtraRevisionType(t);
                                if (t === 'juzz') setExtraRevisionItemId(String(JUZ_DATA[0]?.id || 1));
                                else if (t === 'hizb') setExtraRevisionItemId('1');
                                else setExtraRevisionItemId(String(FULL_SURAH_LIST[0]?.id || 1));
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-border-main bg-bg-main"
                        >
                            <option value="juzz">{t('juzz')}</option>
                            <option value="hizb">{t('hizb')}</option>
                            <option value="sourate">{t('sourate')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">{t('extraRevisionSelectItem')}</label>
                        <select
                            value={extraRevisionItemId}
                            onChange={(e) => setExtraRevisionItemId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border-main bg-bg-main"
                        >
                            {extraRevisionType === 'juzz' && JUZ_DATA.map(j => (
                                <option key={j.id} value={String(j.id)}>Juzz {j.id} - {j.surah}</option>
                            ))}
                            {extraRevisionType === 'hizb' && HIZB_DATA.map((h, i) => (
                                <option key={i} value={String(i + 1)}>Hizb {i + 1} : {h.details}</option>
                            ))}
                            {extraRevisionType === 'sourate' && FULL_SURAH_LIST.map(s => (
                                <option key={s.id} value={String(s.id)}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => setExtraRevisionModalOpen(false)}>{t('cancel')}</Button>
                        <Button
                            variant="accent"
                            className="flex-1"
                            disabled={!extraRevisionItemId}
                            onClick={() => {
                                let entry: ExtraRevisionEntry | null = null;
                                if (extraRevisionType === 'juzz') {
                                    const j = JUZ_DATA.find(j => String(j.id) === extraRevisionItemId);
                                    if (j) {
                                        const h1 = HIZB_DATA[(j.id - 1) * 2];
                                        const h2 = HIZB_DATA[(j.id - 1) * 2 + 1];
                                        entry = { type: 'juzz', itemId: String(j.id), text: `Juzz ${j.id}`, surahs: `${h1?.details || ''} | ${h2?.details || ''}` };
                                    }
                                } else if (extraRevisionType === 'hizb') {
                                    const idx = parseInt(extraRevisionItemId, 10) - 1;
                                    const h = HIZB_DATA[idx];
                                    if (h) entry = { type: 'hizb', itemId: extraRevisionItemId, text: `Hizb ${h.name}`, surahs: h.details };
                                } else {
                                    const s = FULL_SURAH_LIST.find(s => String(s.id) === extraRevisionItemId);
                                    if (s) entry = { type: 'sourate', itemId: extraRevisionItemId, text: s.name, surahs: s.name };
                                }
                                if (entry) {
                                    setExtraRevisionModalOpen(false);
                                    setRatingSelector({ isOpen: true, type: 'quran', index: -2, extraRevisionItem: entry });
                                }
                            }}
                        >
                            {t('validate')}
                        </Button>
                    </div>
                </div>
            </Modal>
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

            {/* Modal du sélecteur de note */}
            <Modal
                isOpen={!!ratingSelector?.isOpen}
                onClose={() => setRatingSelector(null)}
                className="max-w-sm"
            >
                {ratingSelector?.index === -1 ? (
                    /* Kahf */
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="text-emerald-400" size={32} />
                        </div>
                        <h3 className="text-xl font-black text-text-main">{t('kahfMeritsTitle')}</h3>
                        <div className="p-6 rounded-2xl bg-bg-secondary border border-border-main italic text-sm text-text-main/80 leading-relaxed">
                            "{t('kahfHadith')}"
                            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-emerald-400/60">{t('kahfHadithSource')}</p>
                        </div>
                        <Button
                            variant="success"
                            className="w-full h-14 rounded-2xl"
                            onClick={() => setRatingSelector(null)}
                        >
                            {t('close')}
                        </Button>
                    </div>
                ) : ratingSelector?.extraRevisionItem ? (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-black text-text-main">{t('rateYourRevision')}</h3>
                            <p className="text-accent-color font-bold mt-2">{ratingSelector.extraRevisionItem.text}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'tres_bien', label: t('veryGood') || 'Très bien', icon: '✨' },
                                { id: 'bien', label: t('good') || 'Bien', icon: '👍' },
                                { id: 'moyen', label: t('average') || 'Moyen', icon: '😐' },
                                { id: 'a_revoir', label: t('toReview') || 'À réviser', icon: '🔄' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => ratingSelector && setRatingSelector({ ...ratingSelector, pendingRating: opt.id as any })}
                                    className={clsx(
                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                                        ratingSelector?.pendingRating === opt.id
                                            ? "bg-accent-color/10 border-accent-color shadow-lg shadow-accent-color/20"
                                            : "bg-bg-secondary border-border-main hover:border-accent-color/30 group"
                                    )}
                                >
                                    <span className="text-2xl">{opt.icon}</span>
                                    <span className="font-black text-xs uppercase tracking-widest">{opt.label}</span>
                                    {ratingSelector?.pendingRating === opt.id && <CheckCircle2 size={18} className="text-accent-color" />}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button variant="ghost" onClick={() => setRatingSelector(null)}>{t('cancel')}</Button>
                            <Button
                                variant="accent"
                                disabled={!ratingSelector?.pendingRating}
                                onClick={() => ratingSelector?.pendingRating && handleRevisionRating(ratingSelector.pendingRating)}
                            >
                                {t('validate')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-accent-color/20 flex items-center justify-center mx-auto mb-4">
                                <Star className="text-accent-color" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-text-main">
                                {ratingSelector?.type === 'quran' ? (
                                    <>
                                        {t('rateYourRevision') || 'Notez votre révision'}
                                        {(() => {
                                            const currentRev = revisionPlan?.[ratingSelector.index];
                                            if (!currentRev) return null;
                                            const allSurahs = currentRev.units.flatMap(u => {
                                                const hizbMatch = u.text.match(/Hizb (\d+)/);
                                                if (hizbMatch) {
                                                    const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                                                    const hizb = HIZB_DATA[hizbIndex];
                                                    if (hizb && Array.isArray(hizb.surahs)) return hizb.surahs;
                                                }
                                                return (u.surahs || '').split(',').map(s => s.trim()).filter(Boolean);
                                            });
                                            const ratedCount = Object.keys(ratingSelector.surahRatings || {}).length;
                                            const currentSurah = allSurahs[ratedCount];
                                            return currentSurah ? <span className="block text-accent-color mt-1">{currentSurah}</span> : null;
                                        })()}
                                    </>
                                ) : (
                                    t('rateYourRevision') || 'Notez votre révision'
                                )}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">{t('rateYourRevisionDesc') || 'Comment s’est passée cette session ?'}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'tres_bien', label: t('veryGood') || 'Très bien', icon: '✨' },
                                { id: 'bien', label: t('good') || 'Bien', icon: '👍' },
                                { id: 'moyen', label: t('average') || 'Moyen', icon: '😐' },
                                { id: 'a_revoir', label: t('toReview') || 'À réviser', icon: '🔄' },
                            ].map((opt) => {
                                const isSelected = ratingSelector?.pendingRating === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => ratingSelector && setRatingSelector({ ...ratingSelector, pendingRating: opt.id as any })}
                                        className={clsx(
                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                                            isSelected
                                                ? "bg-accent-color/10 border-accent-color shadow-lg shadow-accent-color/20"
                                                : "bg-bg-secondary border-border-main hover:border-accent-color/30 group"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={clsx("text-2xl transition-transform", isSelected ? "scale-125" : "group-hover:scale-110")}>{opt.icon}</span>
                                            <span className={clsx("font-black text-xs uppercase tracking-widest transition-colors", isSelected ? "text-text-main" : "text-text-secondary group-hover:text-text-main")}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        {isSelected && <CheckCircle2 size={18} className="text-accent-color" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <Button
                                variant="ghost"
                                className="h-14 rounded-2xl border-border-main text-text-secondary hover:text-text-main uppercase text-[10px] font-black tracking-widest"
                                onClick={() => setRatingSelector(null)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                variant="accent"
                                disabled={!ratingSelector?.pendingRating}
                                className="h-14 rounded-2xl shadow-xl shadow-accent-color/20 uppercase text-[10px] font-black tracking-widest"
                                onClick={() => {
                                    if (ratingSelector?.pendingRating) {
                                        handleRevisionRating(ratingSelector.pendingRating);
                                        setRatingSelector(prev => prev ? { ...prev, pendingRating: undefined } : null);
                                    }
                                }}
                            >
                                {t('validate')}
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default DashboardView;