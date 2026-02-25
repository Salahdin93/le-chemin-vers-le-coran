import React, { useState } from 'react';
import { useStore } from '@/context/AppContext';
import { ReadingStatus, PlanDay } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import Modal from '@/components/ui/Modal';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { TOTAL_PAGES } from '@/constants/quranData';
import InputModal from '@/components/ui/InputModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Circle, ArrowRight, Star, BookOpen, Calendar, ChevronRight } from 'lucide-react';

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.7,
            ease: [0.23, 1, 0.32, 1] as any
        }
    })
};

const HadithAlKahf: React.FC = () => (
    <div className="text-sm text-left space-y-6 p-2">
        <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-accent-color/10 flex items-center justify-center text-accent-color">
                <Star size={24} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-black text-gradient tracking-tight">Sourate Al-Kahf</h3>
        </div>
        <div className="p-8 rounded-[2rem] bg-bg-secondary/50 border border-border-main/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <BookOpen size={120} />
            </div>
            <p className="font-amiri text-3xl rtl text-right leading-[2.5] text-text-main/90 mb-8 relative z-10">
                عن أبي سعيد الخدري رضي الله عنه قال النبي صلى الله عليه و سلم : من قرأ سورةَ الكهفِ في يومِ الجمعةِ أضاء له من النورِ ما بين الجمُعتَينِ
            </p>
            <div className="relative z-10">
                <p className="text-sm md:text-base italic font-medium opacity-80 border-l-4 border-accent-color pl-6 py-2">
                    "Celui qui lit la sourate Al Kahf le jour du vendredi, il est éclairé par une lumière entre les deux vendredis."
                </p>
                <p className="text-[10px] opacity-40 mt-6 font-black uppercase tracking-[0.2em] text-right">(Rapporté par Al Bayhaqi)</p>
            </div>
        </div>
    </div>
);

const GlobalProgressCard: React.FC = () => {
    const { state, t, activeProfile } = useStore();
    const readingGoal = activeProfile?.goals.reading;
    if (!readingGoal || !state.progress.startDate) return null;

    const totalPagesRead = Object.values(state.progress.readingHistory).reduce((sum, day) => sum + (day.realPages || 0), 0);
    const totalPagesToRead = readingGoal.khatmas * TOTAL_PAGES;
    const percentage = totalPagesToRead > 0 ? Math.round((totalPagesRead / totalPagesToRead) * 100) : 0;

    return (
        <div className="premium-card !bg-slate-900 border-none text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-accent-color/10 rounded-full blur-[100px] group-hover:bg-accent-color/20 transition-all duration-1000" />
            <div className="absolute top-0 left-0 px-6 py-2 bg-accent-color text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-br-2xl shadow-lg z-10">
                {t('overallProgress')}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 pt-12">
                <div className="relative flex flex-col items-center justify-center col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0">
                    <div className="relative">
                        <svg className="w-24 h-24 -rotate-90 scale-110" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" className="text-white/5" fill="transparent" />
                            <circle
                                cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8"
                                className="text-accent-color" fill="transparent"
                                strokeDasharray="282.7" strokeDashoffset={282.7 - (Math.min(100, percentage) / 100) * 282.7}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.23, 1, 0.32, 1)', filter: 'drop-shadow(0 0 10px rgba(var(--accent-rgb), 0.5))' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black">{percentage}%</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-2">{t('pagesRead')}</span>
                    <span className="text-2xl font-black tracking-tight">{totalPagesRead} <span className="text-sm opacity-20">/ {totalPagesToRead}</span></span>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-2">{t('pagesPerDay')}</span>
                    <span className="text-2xl font-black tracking-tight">~{Math.round(totalPagesRead / Math.max(1, state.progress.currentReadingDay - 1))}</span>
                </div>
                <div className="flex flex-col justify-center border-l border-white/5 pl-6 md:pl-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-2">{t('status')}</span>
                    <span className={clsx(
                        "text-base font-black flex items-center gap-2",
                        percentage >= 100 ? "text-success" : "text-accent-color"
                    )}>
                        <Star size={16} fill="currentColor" /> {percentage >= 100 ? 'Accompli !' : 'En Voyage...'}
                    </span>
                </div>
            </div>
        </div>
    );
}

const ReadingPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [kahfModalOpen, setKahfModalOpen] = useState(false);
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [inputModalState, setInputModalState] = useState<{
        isOpen: boolean;
        title: string;
        label: string;
        onSubmit: (value: string) => void;
    }>({ isOpen: false, title: '', label: '', onSubmit: () => { } });

    const readingGoal = activeProfile?.goals.reading;
    const readingPlan = state.plans.reading;
    if (!readingGoal || !readingPlan) return null;

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahfUpdate: boolean = false) => {
        const executeUpdate = (adjustment: number) => {
            const dayKey = `day_${day.day}`;
            const existing = state.progress.readingHistory[dayKey] || { status: 'not_read', realPages: 0, adjustment: 0 };
            const updatedHistory = {
                ...state.progress.readingHistory,
                [dayKey]: isKahfUpdate ? { ...existing, kahfStatus: status } : { ...existing, status, realPages: status === 'not_read' ? 0 : day.recalculatedPages + adjustment, adjustment }
            };
            const recPlan = state.plans.originalReading ? recalculateFuturePlan(state.plans.originalReading, updatedHistory, state.progress.currentReadingDay) : null;
            dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory: updatedHistory, recalculatedPlan: recPlan! } });
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
            setEditingDay(null);
        };

        if (!isKahfUpdate && (status === 'partial' || status === 'catchup')) {
            setInputModalState({
                isOpen: true, title: status === 'partial' ? t('partialReadingTitle') : t('catchUpReadingTitle'),
                label: status === 'partial' ? t('partialLabel') : t('catchUpLabel'),
                onSubmit: (v) => { const n = parseInt(v) || 0; if (n >= 0) executeUpdate(status === 'partial' ? -n : n); }
            });
        } else executeUpdate(0);
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
        const rPlan = state.plans.originalReading ? recalculateFuturePlan(state.plans.originalReading, h, d + 1) : null;
        dispatch({ type: 'ADVANCE_DAY', payload: { newHistory: h, newConsecutiveDays: cDays, recalculatedPlan: rPlan! } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    return (
        <div className="space-y-12 pb-32 px-4 md:px-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 border-b border-border-main pb-12">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                                <BookOpen size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gradient">{t('readingPlan')}</h1>
                                <p className="text-text-secondary font-medium mt-1 text-sm md:text-base">{t('readingPlanSubtitle') || 'Suivez votre progression quotidienne vers la Khatma'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full xl:w-[600px]">
                        <GlobalProgressCard />
                    </div>
                </header>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {readingPlan.map((day, i) => {
                    const status = state.progress.readingHistory[`day_${day.day}`]?.status || 'not_read';
                    const isCurrent = day.day === state.progress.currentReadingDay;
                    const isEditing = editingDay === day.day;
                    const hizbDetails = getHizbDetailsFromPage(day.startPage);
                    const endHizbDetails = getHizbDetailsFromPage(day.endPage);

                    return (
                        <motion.div key={day.day} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
                            <div
                                className={clsx(
                                    "premium-card h-full p-8 flex flex-col gap-6 border-2 transition-all relative overflow-hidden group",
                                    isCurrent ? "border-accent-color ring-8 ring-accent-color/5 shadow-premium" : "border-border-main/50 bg-bg-secondary/40",
                                    status === 'done' && !isCurrent && "opacity-60 grayscale-[0.5] border-success/10"
                                )}
                                onClick={() => !isCurrent && setEditingDay(isEditing ? null : day.day)}
                            >
                                {day.isKahfDay && (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setKahfModalOpen(true); }}
                                        className="absolute top-0 right-0 p-3 bg-accent-color text-white rounded-bl-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                    >
                                        <Star size={14} fill="currentColor" />
                                    </div>
                                )}

                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar size={12} className="text-accent-color opacity-50" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color">{t('day')} {day.day}</span>
                                        </div>
                                        <h4 className="text-xl font-black tracking-tight">{hizbDetails.surahName}</h4>
                                    </div>
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                        status === 'done' ? "bg-success shadow-lg shadow-success/20 text-white" : "bg-bg-main border border-border-main/50 text-text-main/20"
                                    )}>
                                        {status === 'done' ? <CheckCircle2 size={24} /> : isCurrent ? <Circle size={24} className="animate-pulse text-accent-color" /> : <Clock size={20} />}
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="p-4 rounded-2xl bg-bg-main/50 border border-border-main/30 flex items-center justify-between group-hover:bg-bg-main transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">{t('start')}</span>
                                            <span className="text-sm font-bold">p. {day.startPage}</span>
                                        </div>
                                        <ArrowRight size={14} className="opacity-20 mx-2" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">{t('end')}</span>
                                            <span className="text-sm font-bold">p. {day.endPage}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-2 px-3 bg-accent-color/5 rounded-xl border border-accent-color/10 self-start">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-color">
                                            Hizb {hizbDetails.hizbNum} <ChevronRight size={8} className="inline mx-1" /> {endHizbDetails.hizbNum}
                                        </span>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {(isCurrent || isEditing) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, y: 10 }}
                                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: 10 }}
                                            className="space-y-3 pt-6 border-t border-dashed border-border-main/50 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    size="sm"
                                                    className="rounded-xl h-10 font-black"
                                                    variant={status === 'done' ? 'success' : 'secondary'}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(day, 'done'); }}
                                                >
                                                    {t('goalAchieved')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="rounded-xl h-10 font-black"
                                                    variant="warning"
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(day, 'partial'); }}
                                                >
                                                    {t('partial')}
                                                </Button>
                                            </div>
                                            {isCurrent && (
                                                <Button
                                                    size="md"
                                                    variant="accent"
                                                    className="w-full rounded-xl h-11 font-black shadow-lg shadow-accent-color/20"
                                                    onClick={(e) => { e.stopPropagation(); handleAdvance(); }}
                                                >
                                                    Suivant →
                                                </Button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <Modal isOpen={kahfModalOpen} onClose={() => setKahfModalOpen(false)}>
                <HadithAlKahf />
                <Button variant="accent" onClick={() => setKahfModalOpen(false)} className="mt-10 w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent-color/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Je l'ai lue ! (Barakallah u feek)</Button>
            </Modal>

            <InputModal
                isOpen={inputModalState.isOpen}
                onClose={() => setInputModalState({ ...inputModalState, isOpen: false })}
                onSubmit={inputModalState.onSubmit}
                title={inputModalState.title}
                label={inputModalState.label}
                confirmText={t('validate')}
                cancelText={t('cancel')}
            />
        </div>
    );
};
export default ReadingPlanView;
