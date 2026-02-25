import React, { useEffect, useState } from 'react';
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
import { Eye, EyeOff, Sparkles, BookOpen, Brain, Trophy, Flame, ChevronRight, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import ReadjustmentModal from '@/components/ui/ReadjustmentModal';

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }
    })
};

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

    const hadithProgress = activeProfile?.hadithProgress || {};

    useEffect(() => {
        const inProgress = HADITH_COLLECTION.find(h => hadithProgress[h.id] === 'en_memorisation');
        setHadithDuJour(inProgress || HADITH_COLLECTION.find(h => (hadithProgress[h.id] || 'non_lu') === 'non_lu'));
    }, [hadithProgress]);

    useEffect(() => {
        if (checkReadingProgress(state) === 'behind') {
            notificationService.show({ title: t('progressStatusBehindTitle'), message: t('progressStatusBehindMessage'), type: 'warning' });
        }
    }, [state.progress.currentReadingDay, state]);

    if (!activeProfile) return <DashboardSkeleton />;

    const { reading: readingGoal, revision: revisionGoal } = activeProfile.goals;
    const { reading: readingPlan, revision: revisionPlan, originalReading: originalReadingPlan } = state.plans;

    const isReadingActive = !!(readingGoal && readingPlan && state.progress.currentReadingDay <= readingGoal.duration);
    const isRevisionActive = !!(revisionGoal && revisionPlan && state.progress.currentRevisionIndex < revisionPlan.length);

    const overallPercent = readingGoal ? Math.floor(((state.progress.currentReadingDay - 1) / readingGoal.duration) * 100) : 0;
    const revisionPercent = revisionPlan ? Math.floor((state.progress.currentRevisionIndex / revisionPlan.length) * 100) : 0;
    const totalPagesRead = Object.values(state.progress.readingHistory).reduce((acc, h) => acc + (h.realPages || 0), 0);
    const masteredHadiths = Object.values(hadithProgress).filter(s => s === 'acquis').length;
    const hadithPercent = Math.floor((masteredHadiths / HADITH_COLLECTION.length) * 100);

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahf: boolean = false, time?: number) => {
        const execute = (adj: number) => {
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

    const currentReading = isReadingActive ? readingPlan?.find(d => d.day === state.progress.currentReadingDay) : null;
    const currentRevision = isRevisionActive ? revisionPlan?.[state.progress.currentRevisionIndex] : null;

    return (
        <div className="space-y-12 pb-32 pt-4">
            {/* Header Dashboard */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-border-main pb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
                    <h1 className="text-5xl font-black tracking-tight text-gradient mb-3">{t('dashboard')}</h1>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-accent-color/10 border border-accent-color/20 rounded-full text-[10px] font-black uppercase tracking-widest text-accent-color">
                            Spirituel • Premium
                        </div>
                        <p className="text-text-main/50 font-medium">{activeProfile.name}, {t('supportMsg2')}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
                    <div className="p-4 glass-card border-none bg-orange-500/5 min-w-[140px] text-center group cursor-default">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Flame size={18} className="text-orange-500 group-hover:animate-bounce" />
                            <span className="text-2xl font-black">{state.progress.consecutiveDays}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60">{t('streak')}</span>
                    </div>
                </motion.div>
            </header>

            {/* Global Rings Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {isReadingActive && (
                    <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!bg-accent-color/5 border-accent-color/10 shadow-none ring-1 ring-accent-color/5 overflow-visible">
                            <CardContent className="pt-8 flex flex-col items-center">
                                <ProgressRing percent={overallPercent} color="text-accent-color" icon={<BookOpen size={24} />} label={t('readingGoal')} />
                                <div className="w-full flex justify-around mt-8 border-t border-accent-color/10 pt-6">
                                    <div className="text-center">
                                        <span className="block text-xl font-black">{totalPagesRead}</span>
                                        <span className="text-[10px] font-bold opacity-40 uppercase">{t('pagesReadShort') || 'Pages'}</span>
                                    </div>
                                    <div className="w-[1px] bg-accent-color/10" />
                                    <div className="text-center">
                                        <span className="block text-xl font-black">{readingGoal!.duration - state.progress.currentReadingDay + 1}</span>
                                        <span className="text-[10px] font-bold opacity-40 uppercase">{t('daysLeft') || 'Jours'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="!bg-yellow-500/5 border-yellow-500/10 shadow-none ring-1 ring-yellow-500/5 overflow-visible">
                        <CardContent className="pt-8 flex flex-col items-center">
                            <ProgressRing percent={hadithPercent} color="text-yellow-500" icon={<Sparkles size={24} />} label={t('hadithGoal')} />
                            <div className="w-full flex justify-around mt-8 border-t border-yellow-500/10 pt-6">
                                <div className="text-center">
                                    <span className="block text-xl font-black">{masteredHadiths}</span>
                                    <span className="text-[10px] font-bold opacity-40 uppercase">{t('mastered') || 'Acquis'}</span>
                                </div>
                                <div className="w-[1px] bg-yellow-500/10" />
                                <div className="text-center">
                                    <span className="block text-xl font-black">{HADITH_COLLECTION.length - masteredHadiths}</span>
                                    <span className="text-[10px] font-bold opacity-40 uppercase">{t('remaining') || 'Reste'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {isRevisionActive && (
                    <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!bg-blue-500/5 border-blue-500/10 shadow-none ring-1 ring-blue-500/5 overflow-visible">
                            <CardContent className="pt-8 flex flex-col items-center">
                                <ProgressRing percent={revisionPercent} color="text-blue-500" icon={<Brain size={24} />} label={t('revisionGoal')} />
                                <div className="w-full flex justify-around mt-8 border-t border-blue-500/10 pt-6">
                                    <div className="text-center">
                                        <span className="block text-xl font-black">{state.progress.currentRevisionIndex}</span>
                                        <span className="text-[10px] font-bold opacity-40 uppercase">{t('completed') || 'Fait'}</span>
                                    </div>
                                    <div className="w-[1px] bg-blue-500/10" />
                                    <div className="text-center">
                                        <span className="block text-xl font-black">{revisionPlan!.length - state.progress.currentRevisionIndex}</span>
                                        <span className="text-[10px] font-bold opacity-40 uppercase">{t('daysLeft') || 'Jours'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </section>

            {/* Daily Missions */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Mission Reading */}
                <AnimatePresence>
                    {isReadingActive && currentReading && (
                        <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants} className="relative group">
                            <div className="absolute -inset-1 accent-gradient opacity-20 group-hover:opacity-30 blur-xl transition-opacity duration-500 pointer-events-none" />
                            <Card className="h-full relative border-none shadow-2xl overflow-visible">
                                <div className="absolute -top-4 left-8 px-6 py-1.5 bg-accent-color text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg z-20 ring-4 ring-bg-main">
                                    {t('missionReading')} • {t('day')} {currentReading.day}
                                </div>
                                <CardContent className="pt-12 p-8 space-y-8">
                                    <div className="p-8 bg-accent-color/5 rounded-[2.5rem] border border-accent-color/10 text-center relative overflow-hidden group/target">
                                        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover/target:opacity-100 pointer-events-none" />
                                        <h4 className="text-3xl font-black mb-2 drop-shadow-sm">{getHizbDetailsFromPage(currentReading.startPage).surahName}</h4>
                                        <div className="flex items-center justify-center gap-4 text-accent-color font-black opacity-60">
                                            <span className="text-xs uppercase tracking-widest">{t('fromPage')} {currentReading.startPage}</span>
                                            <ChevronRight size={16} className="opacity-30" />
                                            <span className="text-xs uppercase tracking-widest">{t('toPage')} {currentReading.endPage}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Timer onStop={(s) => handleStatusChange(currentReading, 'done', false, s)} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button variant="success" size="lg" className="h-16 rounded-[2rem]" onClick={() => handleStatusChange(currentReading, 'done')}>
                                                <CheckCircle2 size={20} className="mr-2" /> {t('goalAchieved')}
                                            </Button>
                                            <Button variant="secondary" size="lg" className="h-16 rounded-[2rem]" onClick={() => handleStatusChange(currentReading, 'partial')}>
                                                <AlertCircle size={20} className="mr-2" /> {t('partial')}
                                            </Button>
                                        </div>
                                        <Button variant="accent" size="lg" className="w-full h-16 rounded-[2rem]" onClick={handleAdvance}>
                                            {t('nextDay')} <ChevronRight size={20} className="ml-2" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mission Hadith */}
                <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants} className="relative group">
                    <div className="absolute -inset-1 bg-yellow-500 opacity-10 group-hover:opacity-20 blur-xl transition-opacity duration-500 pointer-events-none" />
                    <Card className="h-full relative border-none shadow-2xl">
                        <div className="absolute -top-4 left-8 px-6 py-1.5 bg-yellow-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg z-20 ring-4 ring-bg-main">
                            {t('missionHadith')}
                        </div>
                        <CardContent className="pt-12 p-8 flex flex-col h-full space-y-10">
                            {hadithDuJour ? (
                                <>
                                    <div className="flex-grow flex flex-col justify-center items-center py-6 group/h text-center cursor-pointer" onClick={() => setHadithModalContent(hadithDuJour)}>
                                        <p className="font-amiri text-4xl leading-loose rtl text-right text-text-main/90 group-hover/h:text-yellow-500 transition-colors duration-500 drop-shadow-sm px-4">
                                            {hadithDuJour.arabic}
                                        </p>
                                        <div className="mt-10">
                                            <Button variant="ghost" className="rounded-full border-none px-6 bg-yellow-500/5 group-hover/h:bg-yellow-500/10 transition-all" onClick={(e) => { e.stopPropagation(); setShowHadithTranslation(!showHadithTranslation); }}>
                                                {showHadithTranslation ? <EyeOff size={16} className="mr-2 text-yellow-500" /> : <Eye size={16} className="mr-2 text-yellow-500" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-main/40 group-hover/h:text-text-main/70">
                                                    {t(showHadithTranslation ? 'hideTranslation' : 'showTranslation')}
                                                </span>
                                            </Button>
                                        </div>
                                        <AnimatePresence>
                                            {showHadithTranslation && (
                                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 p-6 glass-card border-dashed bg-yellow-500/[0.02] rounded-[2rem] text-sm text-text-main/70 max-w-sm italic">
                                                    "{state.settings.lang === 'ar' ? null : (hadithDuJour.translations as any)[state.settings.lang] || hadithDuJour.translations.en}"
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Button variant="secondary" size="md" className="rounded-2xl h-12" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'lu')}>{t('read') || 'Lu'}</Button>
                                        <Button variant="secondary" size="md" className="rounded-2xl h-12" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'a_reprendre')}>{t('review') || 'À revoir'}</Button>
                                        <Button variant="success" size="md" className="rounded-2xl h-12 font-black" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'acquis')}>{t('mastered') || 'Acquis'}</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-24 h-24 accent-gradient rounded-[2rem] flex items-center justify-center text-white shadow-premium animate-bounce-subtle">
                                        <Trophy size={48} />
                                    </div>
                                    <h3 className="text-3xl font-black">{t('allDone')}</h3>
                                    <p className="text-text-secondary">{t('allHadithsCompleted')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </section>

            {/* Quick Evaluation CTA */}
            <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
                <div className="relative overflow-hidden p-10 md:p-14 rounded-[3rem] bg-slate-950 text-white shadow-premium group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-color/20 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-accent-color/10 blur-[100px] pointer-events-none rotate-12" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="text-center lg:text-left">
                            <h2 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center lg:justify-start gap-4">
                                {t('evalPromptTitle') || 'Testez-vous !'} <Sparkles className="text-warning animate-pulse" />
                            </h2>
                            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl">
                                {t('evalPromptSubtitle') || 'Prenez 5 minutes pour évaluer votre mémorisation avec notre outil intelligent.'}
                            </p>
                        </div>
                        <Button
                            variant="accent"
                            size="lg"
                            className="w-full lg:w-auto px-12 py-6 text-xl rounded-2xl shadow-premium group/btn"
                            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-view' })}
                        >
                            <Play size={24} className="mr-3 fill-current group-hover/btn:scale-110 transition-transform" /> {t('startEvaluationShort') || 'Démarrer'}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Modals Portals */}
            <EndOfGoalModal isOpen={isEndOfGoalModalOpen} onClose={() => setIsEndOfGoalModalOpen(false)} />
            <InputModal isOpen={inputModalState.isOpen} onClose={() => setInputModalState({ ...inputModalState, isOpen: false })} onSubmit={inputModalState.onSubmit} title={inputModalState.title} label={inputModalState.label} confirmText={t('validate')} cancelText={t('cancel')} />
            {isReadjustmentModalOpen && currentRevision && (
                <ReadjustmentModal isOpen={isReadjustmentModalOpen} onClose={() => setIsReadjustmentModalOpen(false)} onConfirm={() => setIsReadjustmentModalOpen(false)} title={t('toReview')} items={currentRevision.units.map(u => u.surahs).join(', ').split(', ')} />
            )}
            {hadithModalContent && (
                <Modal isOpen={!!hadithModalContent} onClose={() => setHadithModalContent(null)}>
                    <div className="p-8 text-center space-y-10">
                        <div className="space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">{t('hadith')} {hadithModalContent.id}</div>
                            <h3 className="text-2xl font-black text-gradient">{t('source') || '40 Hadiths'}</h3>
                        </div>
                        <p className="font-amiri text-4xl leading-[3] rtl text-right text-text-main drop-shadow-sm">{hadithModalContent.arabic}</p>
                        <div className="p-8 glass-card border-none bg-accent-color/5 rounded-[2.5rem] italic text-base leading-relaxed text-text-main/70">
                            "{state.settings.lang === 'ar' ? null : (hadithModalContent.translations as any)[state.settings.lang] || hadithModalContent.translations.en}"
                        </div>
                        <Button variant="accent" size="lg" className="w-full rounded-2xl" onClick={() => setHadithModalContent(null)}>{t('close')}</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DashboardView;