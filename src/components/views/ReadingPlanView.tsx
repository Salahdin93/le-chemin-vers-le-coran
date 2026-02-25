import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { ReadingStatus, PlanDay } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import Modal from '@/components/ui/Modal';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { TOTAL_PAGES } from '@/constants/quranData';
import InputModal from '@/components/ui/InputModal';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Circle, ArrowRight, Star } from 'lucide-react';

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.7,
            ease: [0.23, 1, 0.32, 1] as any
        }
    })
};

const HadithAlKahf: React.FC = () => (
    <div className="text-sm text-left space-y-4">
        <p className="font-black text-2xl text-gradient">Sourate Al-Kahf</p>
        <div className="p-6 glass-card border-none shadow-inner bg-accent-color/5">
            <p className="font-amiri text-2xl rtl text-right leading-loose text-text-main/90 mb-4">
                عن أبي سعيد الخدري رضي الله عنه قال النبي صلى الله عليه و سلم : من قرأ سورةَ الكهفِ في يومِ الجمعةِ أضاء له من النورِ ما بين الجمُعتَينِ
            </p>
            <p className="text-sm italic opacity-80 border-t border-border-main pt-4">
                "Celui qui lit la sourate Al Kahf le jour du vendredi, il est éclairé par une lumière entre les deux vendredis."
            </p>
            <p className="text-[10px] opacity-50 mt-2 font-bold uppercase tracking-widest">(Rapporté par Al Bayhaqi)</p>
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
        <Card className="overflow-visible !bg-slate-900 border-white/5 text-white">
            <div className="absolute -top-3 left-8 px-4 py-1 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl">
                {t('overallProgress')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-8">
                <div className="relative flex flex-col items-center justify-center">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" className="text-white/10" fill="transparent" />
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" className="text-accent-color" fill="transparent" strokeDasharray="282.7" strokeDashoffset={282.7 - (percentage / 100) * 282.7} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                    </svg>
                    <span className="absolute text-xl font-black">{percentage}%</span>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{t('pagesRead')}</span>
                    <span className="text-2xl font-black leading-none">{totalPagesRead} <span className="text-sm opacity-40">/ {totalPagesToRead}</span></span>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{t('pagesPerDay')}</span>
                    <span className="text-2xl font-black leading-none">~{Math.round(totalPagesRead / Math.max(1, state.progress.currentReadingDay - 1))}</span>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{t('status')}</span>
                    <span className="text-lg font-bold text-accent-color flex items-center gap-2">
                        <Star size={16} fill="currentColor" /> {percentage >= 100 ? 'Terminé !' : 'En chemin...'}
                    </span>
                </div>
            </div>
        </Card>
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

        if (readingGoal && d === readingGoal.duration) {
            // Optionnel: peut-être naviguer ou montrer un modal spécial
        }
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    return (
        <div className="space-y-12 pb-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-main pb-8">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-gradient">{t('readingPlan')}</h2>
                        <p className="text-text-secondary font-medium mt-1">{t('readingPlanSubtitle') || 'Suivez votre progression quotidienne vers la Khatma'}</p>
                    </div>
                    <GlobalProgressCard />
                </header>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {readingPlan.map((day, i) => {
                    const status = state.progress.readingHistory[`day_${day.day}`]?.status || 'not_read';
                    const isCurrent = day.day === state.progress.currentReadingDay;
                    const isEditing = editingDay === day.day;

                    return (
                        <motion.div key={day.day} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
                            <div
                                className={clsx(
                                    "premium-card h-full p-6 flex flex-col gap-5 border-2 transition-all group hover-glow",
                                    isCurrent ? "border-accent-color ring-4 ring-accent-color/5" : "border-border-main/50"
                                )}
                                onClick={() => !isCurrent && setEditingDay(isEditing ? null : day.day)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color mb-1">Jour {day.day}</span>
                                        <h4 className="text-xl font-black">{getHizbDetailsFromPage(day.startPage).surahName}</h4>
                                    </div>
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        status === 'done' ? "bg-success/10 text-success" : "bg-bg-main text-text-secondary"
                                    )}>
                                        {status === 'done' ? <CheckCircle2 size={24} /> : isCurrent ? <Circle size={24} className="animate-pulse" /> : <Clock size={24} className="opacity-40" />}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-bold flex items-center gap-2">
                                        <span className="opacity-40">p. {day.startPage}</span>
                                        <ArrowRight size={14} className="opacity-20" />
                                        <span className="opacity-40">p. {day.endPage}</span>
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-widest bg-bg-main self-start px-2 py-0.5 rounded-md opacity-60">
                                        Hizb {getHizbDetailsFromPage(day.startPage).hizbNum} → {getHizbDetailsFromPage(day.endPage).hizbNum}
                                    </p>
                                </div>

                                {(isCurrent || isEditing) && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-dashed border-border-main">
                                        <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); handleStatusChange(day, 'done'); }}>{t('goalAchieved')}</Button>
                                        <Button size="sm" variant="warning" onClick={(e) => { e.stopPropagation(); handleStatusChange(day, 'partial'); }}>{t('partial')}</Button>
                                        <Button size="sm" variant="accent" onClick={(e) => { e.stopPropagation(); handleAdvance(); }}>Suivant →</Button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <Modal isOpen={kahfModalOpen} onClose={() => setKahfModalOpen(false)}>
                <HadithAlKahf />
                <Button variant="accent" onClick={() => setKahfModalOpen(false)} className="mt-8 w-full">Compris</Button>
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