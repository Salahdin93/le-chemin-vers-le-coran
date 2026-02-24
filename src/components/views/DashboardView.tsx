import React, { useEffect, useState, useMemo } from 'react';
import Card, { CardContent } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { checkReadingProgress } from '@/services/progressLogic';
import EndOfGoalModal from '@/components/ui/EndOfGoalModal';
import Modal from '@/components/ui/Modal';
import Timer from '@/components/ui/Timer';
import { ReadingStatus, PlanDay, Hadith, HadithMemorizationStatus } from '@/types';
import { notificationService } from '@/components/ui/NotificationContainer';
import InputModal from '@/components/ui/InputModal';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { HADITH_COLLECTION } from '@/constants/hadithData';
import { Eye, EyeOff, Sparkles, BookOpen, Brain, Trophy } from 'lucide-react';
import ReadjustmentModal from '@/components/ui/ReadjustmentModal';

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: i * 0.1,
            duration: 0.6,
            ease: "easeOut"
        }
    })
};

const ProgressRing: React.FC<{ percent: number, color: string, icon: React.ReactNode, label: string }> = ({ percent, color, icon, label }) => (
    <div className="flex flex-col items-center">
        <div className="relative w-28 h-28 transform transition-transform hover:scale-105 duration-300">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" className="text-border-main/20" fill="transparent" />
                <circle
                    cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8"
                    className={color} fill="transparent" strokeDasharray="339.292"
                    strokeDashoffset={339.292 - (percent / 100) * 339.292}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl mb-0.5">{icon}</div>
                <span className="text-2xl font-black tracking-tighter">{percent}%</span>
            </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-3 opacity-60">{label}</span>
    </div>
);

const HadithAlKahf: React.FC<{ t: any }> = ({ t }) => (
    <div className="text-sm text-left max-h-[60vh] overflow-y-auto">
        <p className="font-semibold text-lg mb-2">{t('kahfMeritsTitle')}</p>
        <div className="p-4 glass-effect rounded-2xl border border-border-main">
            <p className="font-amiri text-xl rtl text-right leading-loose mb-4 italic text-text-main/80">
                من قرأ سورةَ الكهفِ في يومِ الجمعةِ أضاء له من النورِ ما بين الجمُعتَينِ
            </p>
            <p className="text-sm italic opacity-80">"{t('kahfHadith')}"</p>
            <p className="text-xs opacity-50 mt-2">{t('kahfHadithSource')}</p>
        </div>
    </div>
);

const DashboardView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [isEndOfGoalModalOpen, setIsEndOfGoalModalOpen] = useState(false);
    const [kahfModalOpen, setKahfModalOpen] = useState(false);
    const [showHadithTranslation, setShowHadithTranslation] = useState(false);
    const [hadithDuJour, setHadithDuJour] = useState<Hadith | undefined>(undefined);
    const [isNextHadithModalOpen, setIsNextHadithModalOpen] = useState(false);
    const [isReadjustmentModalOpen, setIsReadjustmentModalOpen] = useState(false);
    const [hadithModalContent, setHadithModalContent] = useState<Hadith | null>(null);

    const [inputModalState, setInputModalState] = useState<{ isOpen: boolean; title: string; label: string; onSubmit: (value: string) => void; }>({ isOpen: false, title: '', label: '', onSubmit: () => { } });

    const hadithProgress = activeProfile?.hadithProgress || {};

    useEffect(() => {
        const inProgressHadith = HADITH_COLLECTION.find(h => hadithProgress[h.id] === 'en_memorisation');
        setHadithDuJour(inProgressHadith || HADITH_COLLECTION.find(h => (hadithProgress[h.id] || 'non_lu') === 'non_lu'));
    }, [hadithProgress]);

    const findNextHadith = (currentId: number): Hadith | undefined => {
        const currentIndex = HADITH_COLLECTION.findIndex(h => h.id === currentId);
        return HADITH_COLLECTION.slice(currentIndex + 1).find(h => (hadithProgress[h.id] || 'non_lu') !== 'acquis');
    };

    const nextHadithToMemorize = hadithDuJour ? findNextHadith(hadithDuJour.id) : undefined;

    useEffect(() => {
        if (checkReadingProgress(state) === 'behind') {
            notificationService.show({ title: t('progressStatusBehindTitle'), message: t('progressStatusBehindMessage'), type: 'warning' });
        }
    }, [state.progress.currentReadingDay, activeProfile, t, state]);

    if (!activeProfile) return <DashboardSkeleton />;

    const readingGoal = activeProfile.goals.reading;
    const revisionGoal = activeProfile.goals.revision;
    const readingPlan = state.plans.reading;
    const revisionPlan = state.plans.revision;
    const originalReadingPlan = state.plans.originalReading;

    const isReadingGoalActive = !!(readingGoal && readingPlan && state.progress.currentReadingDay <= readingGoal.duration);
    const isRevisionGoalActive = !!(revisionGoal && revisionPlan && state.progress.currentRevisionIndex < revisionPlan.length);

    const overallProgressPercent = readingGoal ? Math.floor(((state.progress.currentReadingDay - 1) / readingGoal.duration) * 100) : 0;
    const revisionProgressPercent = revisionPlan ? Math.floor((state.progress.currentRevisionIndex / revisionPlan.length) * 100) : 0;
    const totalPagesRead = Object.values(state.progress.readingHistory).reduce((acc, h) => acc + (h.realPages || 0), 0);
    const masteredHadiths = Object.values(hadithProgress).filter(s => s === 'acquis').length;
    const hadithProgressPercent = Math.floor((masteredHadiths / HADITH_COLLECTION.length) * 100);

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahfUpdate: boolean = false, timeSpent?: number) => {
        const executeUpdate = (adjustment: number) => {
            const dayKey = `day_${day.day}`;
            const existingHistory = state.progress.readingHistory[dayKey] || { status: 'not_read', realPages: 0, adjustment: 0, kahfStatus: day.isKahfDay ? 'not_read' : undefined };
            const realPages = status === 'not_read' ? 0 : day.recalculatedPages + adjustment;
            const newHistoryForDay = isKahfUpdate ? { ...existingHistory, kahfStatus: status } : { ...existingHistory, status, realPages, adjustment, timeSpent: timeSpent !== undefined ? (existingHistory.timeSpent || 0) + timeSpent : existingHistory.timeSpent };
            const newHistory = { ...state.progress.readingHistory, [dayKey]: newHistoryForDay };
            const recalculatedPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, newHistory, state.progress.currentReadingDay) : null;
            dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory, recalculatedPlan: recalculatedPlan! } });
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
            if (isKahfUpdate && (status === 'partial' || status === 'not_read')) setKahfModalOpen(true);
        };

        if (!isKahfUpdate && (status === 'partial' || status === 'catchup')) {
            setInputModalState({ isOpen: true, title: status === 'partial' ? t('partialReadingTitle') : t('catchUpReadingTitle'), label: status === 'partial' ? t('partialLabel') : t('catchUpLabel'), onSubmit: (v) => { const n = parseInt(v) || 0; if (n >= 0) executeUpdate(status === 'partial' ? -n : n); } });
        } else executeUpdate(0);
    };

    const handleAdvanceDay = () => {
        const currentDay = state.progress.currentReadingDay;
        const dayKey = `day_${currentDay}`;
        let newHistory = { ...state.progress.readingHistory };
        if (!newHistory[dayKey] && readingPlan) {
            const planDay = readingPlan.find(d => d.day === currentDay);
            if (planDay) newHistory[dayKey] = { status: 'done', adjustment: 0, realPages: planDay.recalculatedPages, kahf: planDay.isKahfDay, kahfStatus: planDay.isKahfDay ? 'done' : undefined };
        }
        const yesterdayStatus = newHistory[dayKey]?.status;
        const newConsecutiveDays = (yesterdayStatus === 'done' || yesterdayStatus === 'catchup') ? state.progress.consecutiveDays + 1 : 0;
        const recalculatedPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, newHistory, currentDay + 1) : null;
        dispatch({ type: 'ADVANCE_DAY', payload: { newHistory, newConsecutiveDays, recalculatedPlan: recalculatedPlan! } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleHadithStatusChange = (hadithId: number, status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId, status } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleReadjustmentConfirm = () => {
        if (!currentRevisionDayData) return;
        const index = revisionPlan?.findIndex(d => d.day === currentRevisionDayData.day) ?? -1;
        if (index === -1) return;
        const hizbNumMatch = currentRevisionDayData.units[0]?.text.match(/Hizb (\d+)/);
        dispatch({ type: 'UPDATE_REVISION_STATUS', payload: { revisionIndex: index, status: 'to-review', hizbNum: hizbNumMatch ? parseInt(hizbNumMatch[1]) : undefined } });
        setIsReadjustmentModalOpen(false);
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const currentReadingDayData = isReadingGoalActive ? readingPlan?.find(d => d.day === state.progress.currentReadingDay) : null;
    const currentRevisionDayData = isRevisionGoalActive ? revisionPlan?.[state.progress.currentRevisionIndex] : null;

    const readingInfo = useMemo(() => {
        if (!currentReadingDayData) return null;
        const hizbStart = getHizbDetailsFromPage(currentReadingDayData.startPage);
        const hizbEnd = getHizbDetailsFromPage(currentReadingDayData.endPage);
        if (!hizbStart || !hizbEnd) return null;
        const description = hizbStart.surahName === hizbEnd.surahName ? `${t('surahLabel')}: ${hizbStart.surahName}` : t('surahsFromTo', { start: hizbStart.surahName, end: hizbEnd.surahName });
        const details = t('readingDetailsShort', { hizbStart: hizbStart.hizbNum, hizbEnd: hizbEnd.hizbNum });
        return { description, details, pages: `${currentReadingDayData.startPage} → ${currentReadingDayData.endPage}` };
    }, [currentReadingDayData, t]);

    const getHadithTranslation = (hadith: Hadith) => {
        const lang = state.settings.lang;
        if (lang === 'ar') return null;
        return (hadith.translations as any)[lang] || hadith.translations.en;
    };

    return (
        <div className="space-y-10 pb-28 md:pb-8">
            {/* --- Header Section --- */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="animate-fadeSlideUp">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
                        {t('dashboard')}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-12 h-1 bg-accent-color rounded-full" />
                        <p className="text-text-secondary font-medium">{activeProfile.name}, {t('supportMsg2')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-5 py-3 glass-effect rounded-2xl border-border-main flex items-center gap-3">
                        <span className="text-2xl">🔥</span>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest opacity-40">{t('consecutiveDays')}</span>
                            <span className="text-lg font-black">{state.progress.consecutiveDays}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Stats Overview --- */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {isReadingGoalActive && readingGoal && (
                    <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!bg-accent-color/5 border-accent-color/10 ring-1 ring-accent-color/5">
                            <CardContent className="pt-6 flex flex-col items-center">
                                <ProgressRing percent={overallProgressPercent} color="text-accent-color" icon={<BookOpen size={20} />} label={t('readingProgress')} />
                                <div className="w-full grid grid-cols-2 gap-3 mt-6">
                                    <div className="p-3 bg-bg-main/50 rounded-xl text-center">
                                        <span className="block text-[10px] font-bold opacity-40 uppercase">{t('pagesRead')}</span>
                                        <span className="text-lg font-black">{totalPagesRead}</span>
                                    </div>
                                    <div className="p-3 bg-bg-main/50 rounded-xl text-center">
                                        <span className="block text-[10px] font-bold opacity-40 uppercase">{t('daysLeft')}</span>
                                        <span className="text-lg font-black">{readingGoal.duration - state.progress.currentReadingDay + 1}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="!bg-yellow-500/5 border-yellow-500/10 ring-1 ring-yellow-500/5">
                        <CardContent className="pt-6 flex flex-col items-center">
                            <ProgressRing percent={hadithProgressPercent} color="text-yellow-500" icon={<Sparkles size={20} />} label={t('hadithProgress')} />
                            <div className="w-full grid grid-cols-2 gap-3 mt-6">
                                <div className="p-3 bg-bg-main/50 rounded-xl text-center">
                                    <span className="block text-[10px] font-bold opacity-40 uppercase">{t('hadithsMastered')}</span>
                                    <span className="text-lg font-black">{masteredHadiths}</span>
                                </div>
                                <div className="p-3 bg-bg-main/50 rounded-xl text-center">
                                    <span className="block text-[10px] font-bold opacity-40 uppercase">{t('hadithsLeft')}</span>
                                    <span className="text-lg font-black">{HADITH_COLLECTION.length - masteredHadiths}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {isRevisionGoalActive && revisionPlan && (
                    <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!bg-blue-500/5 border-blue-500/10 ring-1 ring-blue-500/5">
                            <CardContent className="pt-6 flex flex-col items-center">
                                <ProgressRing percent={revisionProgressPercent} color="text-blue-500" icon={<Brain size={20} />} label={t('revisionProgress')} />
                                <div className="w-full grid grid-cols-2 gap-3 mt-6">
                                    <div className="p-3 bg-bg-main/50 rounded-xl text-center">
                                        <span className="block text-[10px] font-bold opacity-40 uppercase">{t('daysDone')}</span>
                                        <span className="text-lg font-black">{state.progress.currentRevisionIndex}</span>
                                    </div>
                                    <div className="p-3 bg-bg-main/50 rounded-xl text-center">
                                        <span className="block text-[10px] font-bold opacity-40 uppercase">{t('daysLeft')}</span>
                                        <span className="text-lg font-black">{revisionPlan.length - state.progress.currentRevisionIndex}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </section>

            {/* --- Daily Tasks Section --- */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Reading Task */}
                {isReadingGoalActive && currentReadingDayData && readingInfo ? (
                    <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants} className="h-full">
                        <Card className="h-full overflow-visible">
                            <div className="absolute -top-4 left-6 px-4 py-1 bg-accent-color text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                                {t('myReading')} • {t('day')} {currentReadingDayData.day}
                            </div>
                            <CardContent className="pt-8 space-y-6">
                                <div className="p-6 bg-gradient-to-br from-bg-secondary to-bg-main rounded-3xl border border-border-main text-center shadow-inner">
                                    <h4 className="text-2xl font-black mb-1">{readingInfo.description}</h4>
                                    <div className="flex items-center justify-center gap-2 opacity-60">
                                        <span className="text-xs font-bold uppercase tracking-wider">{readingInfo.details}</span>
                                        <span>•</span>
                                        <span className="text-xs font-bold">{readingInfo.pages}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Timer onStop={(s) => handleStatusChange(currentReadingDayData, 'done', false, s)} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button size="lg" variant="success" className="btn-premium" onClick={() => handleStatusChange(currentReadingDayData, 'done')}>{t('goalAchieved')}</Button>
                                        <Button size="lg" variant="warning" className="btn-premium" onClick={() => handleStatusChange(currentReadingDayData, 'partial')}>{t('partial')}</Button>
                                    </div>
                                    <Button className="w-full btn-premium py-4 font-bold text-lg accent-gradient border-none shadow-xl shadow-accent-color/20" onClick={handleAdvanceDay}>
                                        {t('nextDay')} →
                                    </Button>
                                </div>
                                {currentReadingDayData.isKahfDay && (
                                    <div className="pt-6 border-t border-dashed border-border-main">
                                        <Button variant="ghost" className="w-full gap-2 text-yellow-500 font-bold" onClick={() => setKahfModalOpen(true)}>
                                            ✨ {t('readKahf')}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : null}

                {/* Hadith Task */}
                <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants} className="h-full">
                    <Card className="h-full">
                        <div className="absolute -top-4 left-6 px-4 py-1 bg-yellow-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                            {t('hadithOfTheDay')}
                        </div>
                        <CardContent className="pt-8 h-full flex flex-col space-y-6">
                            {hadithDuJour ? (
                                <>
                                    <div className="flex-1 flex flex-col justify-center items-center py-6 cursor-pointer group/hadith" onClick={() => setHadithModalContent(hadithDuJour)}>
                                        <p className="font-amiri hadith-arabic text-3xl md:text-4xl text-right tracking-wide rtl text-text-main/90 group-hover/hadith:text-accent-color transition-colors">
                                            {hadithDuJour.arabic}
                                        </p>
                                        <div className="mt-8">
                                            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setShowHadithTranslation(!showHadithTranslation); }} className="text-xs uppercase tracking-widest font-bold opacity-60 hover:opacity-100 italic gap-2 transition-all">
                                                {showHadithTranslation ? <EyeOff size={14} /> : <Eye size={14} />}
                                                {showHadithTranslation ? t('hideTranslation') : t('showTranslation')}
                                            </Button>
                                        </div>
                                        <AnimatePresence>
                                            {showHadithTranslation && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 p-5 glass-effect rounded-2xl border-border-main italic text-sm text-center">
                                                    "{getHadithTranslation(hadithDuJour)}"
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Button size="sm" variant="ghost" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'lu')}>{t('statusLu')}</Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'a_reprendre')}>{t('statusARependre')}</Button>
                                        <Button size="sm" variant="success" className="btn-premium" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'acquis')}>{t('statusAcquis')}</Button>
                                    </div>
                                    {nextHadithToMemorize && (
                                        <Button variant="link" className="text-xs opacity-50" onClick={() => setIsNextHadithModalOpen(true)}>
                                            {t('nextHadithToMemorize')} →
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                    <Trophy size={64} className="text-yellow-500 animate-bounce" />
                                    <p className="text-xl font-black">{t('allHadithsMastered')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Revision Task */}
                {isRevisionGoalActive && currentRevisionDayData && (
                    <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants} className="h-full">
                        <Card className="h-full overflow-visible">
                            <div className="absolute -top-4 left-6 px-4 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                                {t('myRevision')}
                            </div>
                            <CardContent className="pt-8 space-y-6">
                                <div className="p-6 bg-gradient-to-br from-bg-secondary to-bg-main rounded-3xl border border-border-main text-center shadow-inner">
                                    <h4 className="text-2xl font-black mb-1">{currentRevisionDayData.units.map(u => u.text).join(' + ')}</h4>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                                        {currentRevisionDayData.units.map(u => u.surahs).join('; ')}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <Timer onStop={(s) => dispatch({ type: 'UPDATE_REVISION_STATUS', payload: { revisionIndex: state.progress.currentRevisionIndex, status: 'revised', timeSpent: s } })} />
                                    <div className="grid grid-cols-3 gap-3">
                                        <Button size="sm" variant="success" className="btn-premium" onClick={() => dispatch({ type: 'UPDATE_REVISION_STATUS', payload: { revisionIndex: state.progress.currentRevisionIndex, status: 'revised' } })}>{t('revised')}</Button>
                                        <Button size="sm" variant="warning" className="btn-premium" onClick={() => setIsReadjustmentModalOpen(true)}>{t('toReview')}</Button>
                                        <Button size="sm" variant="danger" className="btn-premium" onClick={() => dispatch({ type: 'UPDATE_REVISION_STATUS', payload: { revisionIndex: state.progress.currentRevisionIndex, status: 'not_revised' } })}>{t('notAchieved')}</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </section>

            {/* --- Call to Action --- */}
            <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants}>
                <div className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-slate-900 border border-white/5 shadow-2xl group">
                    <div className="absolute inset-0 accent-gradient opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-color/20 rounded-full blur-[100px]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                                {t('testKnowledgePromptTitle')}
                            </h2>
                            <p className="text-slate-400 text-lg">
                                {t('testKnowledgePromptBody')}
                            </p>
                        </div>
                        <Button onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-view' })} size="lg" className="btn-premium py-5 px-10 text-xl font-bold rounded-2xl accent-gradient border-none shadow-2xl shadow-accent-color/30">
                            🚀 {t('startEvaluation')}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Modals */}
            <EndOfGoalModal isOpen={isEndOfGoalModalOpen} onClose={() => setIsEndOfGoalModalOpen(false)} />
            <InputModal isOpen={inputModalState.isOpen} onClose={() => setInputModalState({ ...inputModalState, isOpen: false })} onSubmit={inputModalState.onSubmit} title={inputModalState.title} label={inputModalState.label} confirmText={t('validate')} cancelText={t('cancel')} />

            <Modal isOpen={kahfModalOpen} onClose={() => setKahfModalOpen(false)}>
                <HadithAlKahf t={t} />
                <Button onClick={() => setKahfModalOpen(false)} className="mt-6 w-full btn-premium">{t('understood')}</Button>
            </Modal>

            {currentRevisionDayData && (
                <ReadjustmentModal
                    isOpen={isReadjustmentModalOpen}
                    onClose={() => setIsReadjustmentModalOpen(false)}
                    onConfirm={handleReadjustmentConfirm}
                    title={t('toReview')}
                    items={currentRevisionDayData.units.flatMap(u => u.surahs.split(/; |, /)).filter(Boolean)}
                />
            )}

            {hadithModalContent && (
                <Modal isOpen={!!hadithModalContent} onClose={() => setHadithModalContent(null)}>
                    <CardContent className="space-y-6 pt-6">
                        <div className="text-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{t('hadithNumber', { number: hadithModalContent.id })}</span>
                            <h3 className="text-2xl font-black mt-1 text-gradient">{t('hadithOfTheDay')}</h3>
                        </div>
                        <p className="font-amiri text-3xl leading-loose rtl text-right text-text-main/90">{hadithModalContent.arabic}</p>
                        <div className="p-6 glass-effect rounded-2xl border-border-main text-center italic text-sm">
                            "{getHadithTranslation(hadithModalContent)}"
                        </div>
                        <Button onClick={() => setHadithModalContent(null)} className="w-full btn-premium">{t('close')}</Button>
                    </CardContent>
                </Modal>
            )}

            {nextHadithToMemorize && (
                <Modal isOpen={isNextHadithModalOpen} onClose={() => setIsNextHadithModalOpen(false)}>
                    <CardContent className="space-y-6 pt-6 text-center">
                        <h3 className="text-2xl font-black text-gradient">{t('nextHadithToMemorize')}</h3>
                        <p className="font-amiri text-2xl leading-relaxed rtl text-right">{nextHadithToMemorize.arabic}</p>
                        <Button onClick={() => setIsNextHadithModalOpen(false)} className="w-full btn-premium">{t('close')}</Button>
                    </CardContent>
                </Modal>
            )}
        </div>
    );
};

export default DashboardView;