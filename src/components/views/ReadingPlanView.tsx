import React, { useState } from 'react';
import { useStore } from '@/context/AppContext';
import { ReadingStatus, PlanDay } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import Modal from '@/components/ui/Modal';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { TOTAL_PAGES, HIZB_DATA } from '@/constants/quranData';
import InputModal from '@/components/ui/InputModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Circle, ArrowRight, Star, BookOpen, Calendar, Folder, Trophy } from 'lucide-react';

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

const HadithAlKahf: React.FC = () => {
    const { t } = useStore();
    return (
        <div className="text-sm text-left space-y-6 p-2">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-accent-color/10 flex items-center justify-center text-accent-color">
                    <Star size={24} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-black text-gradient tracking-tight">{t('surahAlKahf')}</h3>
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
                        {t('kahfHadith')}
                    </p>
                    <p className="text-[10px] opacity-40 mt-6 font-black uppercase tracking-[0.2em] text-right">{t('kahfHadithSource')}</p>
                </div>
            </div>
        </div>
    );
};

const getDateForDay = (day: number, startDateStr: string | null): Date | null => {
    if (!startDateStr) return null;
    const [y, m, d] = startDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + (day - 1));
    return date;
};

const GlobalProgressCard: React.FC = () => {
    const { state, t, activeProfile } = useStore();
    const readingGoal = activeProfile?.goals.reading;
    if (!readingGoal || !state.progress.startDate) return null;

    const historyPages = Object.values(state.progress.readingHistory).reduce((sum, day) => sum + (day.realPages || 0), 0);
    const totalPagesRead = (state.progress.existingPagesRead ?? 0) + historyPages;
    const totalPagesToRead = readingGoal.khatmas * TOTAL_PAGES;
    const percentage = totalPagesToRead > 0 ? Math.round((totalPagesRead / totalPagesToRead) * 100) : 0;
    const pagesRemaining = Math.max(0, totalPagesToRead - totalPagesRead);
    const readingPlan = state.plans.reading;
    const planEndDate = readingPlan && readingPlan.length > 0
        ? getDateForDay(readingPlan[readingPlan.length - 1].day, state.progress.startDate)
        : null;
    const estimatedEndDate = percentage < 100 && planEndDate
        ? planEndDate
        : percentage < 100
            ? (() => {
                const daysElapsed = Math.max(1, (state.progress.existingDaysRead ?? 0) + Math.max(0, state.progress.currentReadingDay - 1));
                const avgPagesPerDay = totalPagesRead / daysElapsed;
                const estimatedDaysRemaining = avgPagesPerDay > 0 ? Math.ceil(pagesRemaining / avgPagesPerDay) : readingGoal.duration - state.progress.currentReadingDay;
                return new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
            })()
            : null;

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
                    <span className="text-2xl font-black tracking-tight">~{readingGoal.pagesPerDay}</span>
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
            {estimatedEndDate && percentage < 100 && (
                <div className="flex items-center gap-2 px-8 pb-8 pt-2 border-t border-white/5 mt-2">
                    <Calendar size={18} className="text-accent-color opacity-80" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">{t('estimatedEndDate') || 'Fin estimée'}</span>
                    <span className="text-lg font-black text-accent-color">
                        {estimatedEndDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            )}
        </div>
    );
}

/** Date de début "virtuelle" pour l'affichage des jours 1..existingDaysRead (jour 1 = startDate - existingDaysRead, pour que jour 11 = startDate). */
const getVirtualStartDateStr = (startDateStr: string | null, existingDaysRead: number): string | null => {
    if (!startDateStr || existingDaysRead <= 0) return startDateStr;
    const [y, m, d] = startDateStr.split('-').map(Number);
    const d1 = new Date(y, m - 1, d);
    d1.setDate(d1.getDate() - existingDaysRead);
    const yy = d1.getFullYear();
    const mm = String(d1.getMonth() + 1).padStart(2, '0');
    const dd = String(d1.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
};

const ReadingPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [kahfModalOpen, setKahfModalOpen] = useState(false);
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [inputModalState, setInputModalState] = useState<{
        isOpen: boolean;
        title: string;
        label: string;
        onSubmit: (value: string) => void;
        min?: number;
        max?: number;
        initialValue?: string;
    }>({ isOpen: false, title: '', label: '', onSubmit: () => { } });

    const readingGoal = activeProfile?.goals.reading;
    const readingPlan = state.plans.reading;

    if (!readingGoal || !readingPlan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 p-8">
                <div className="w-32 h-32 accent-gradient rounded-[3rem] flex items-center justify-center text-white shadow-premium animate-bounce-subtle">
                    <BookOpen size={64} />
                </div>
                <div className="space-y-4 max-w-sm">
                    <h2 className="text-3xl font-black tracking-tight">{t('noReadingPlanTitle')}</h2>
                    <p className="text-text-secondary font-medium">{t('noReadingPlanMessage')}</p>
                </div>
                <Button
                    variant="accent"
                    size="lg"
                    className="px-12 h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent-color/20"
                    onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'reading', mode: 'new' } })}
                >
                    {t('createPlan')}
                </Button>
            </div>
        );
    }

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahfUpdate: boolean = false) => {
        const executeUpdate = (realPages: number, statusOverride?: ReadingStatus) => {
            const dayKey = `day_${day.day}`;
            const existing = state.progress.readingHistory[dayKey] || { status: 'not_read', realPages: 0, adjustment: 0 };
            const targetPages = day.recalculatedPages;
            const adjustment = realPages - targetPages;
            const resolvedStatus = statusOverride ?? (realPages >= targetPages ? (realPages > targetPages ? 'catchup' : 'done') : 'partial');
            const updatedHistory = {
                ...state.progress.readingHistory,
                [dayKey]: isKahfUpdate ? { ...existing, kahfStatus: status } : { ...existing, status: resolvedStatus, realPages, adjustment }
            };
            const recPlan = state.plans.originalReading ? recalculateFuturePlan(state.plans.originalReading, updatedHistory, state.progress.currentReadingDay) : null;
            dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory: updatedHistory, recalculatedPlan: recPlan! } });
            const msg = (resolvedStatus === 'done' || resolvedStatus === 'catchup')
                ? (Math.random() > 0.5 ? t('jazakAllahuKhayr') : t('barakAllahuFik'))
                : t('mayAllahEase');
            dispatch({ type: 'SET_TOAST', payload: msg });
            setEditingDay(null);
        };

        if (!isKahfUpdate && status === 'done') {
            setInputModalState({
                isOpen: true,
                title: t('upToWhichPage'),
                label: t('upToWhichPageLabel', { min: day.startPage, max: 604 }),
                min: day.startPage,
                max: 604,
                initialValue: String(day.endPage),
                onSubmit: (v) => {
                    const p = Math.max(day.startPage, Math.min(604, parseInt(v) || day.startPage));
                    const realPages = p - day.startPage + 1;
                    executeUpdate(realPages);
                }
            });
        } else if (!isKahfUpdate && status === 'not_read') {
            executeUpdate(0, 'not_read');
        } else if (isKahfUpdate) {
            const existing = state.progress.readingHistory[`day_${day.day}`] || { status: 'not_read' as ReadingStatus, realPages: 0, adjustment: 0 };
            executeUpdate(existing.realPages || 0, existing.status);
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
        const rPlan = state.plans.originalReading ? recalculateFuturePlan(state.plans.originalReading, h, d + 1) : null;
        dispatch({ type: 'ADVANCE_DAY', payload: { newHistory: h, newConsecutiveDays: cDays, recalculatedPlan: rPlan! } });
        const msg = Math.random() > 0.5 ? t('jazakAllahuKhayr') : t('barakAllahuFik');
        dispatch({ type: 'SET_TOAST', payload: msg });
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

            {/* Hadith — Récompense de la lecture */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border border-white/5 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
                    <div className="p-8 md:p-12 relative z-10 space-y-8">
                        {/* Label */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60">Hadith</span>
                                <h3 className="text-lg font-black tracking-tight text-white leading-tight">La récompense de la lecture du Coran</h3>
                            </div>
                        </div>

                        {/* Arabic text */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <BookOpen size={80} />
                            </div>
                            <p className="font-amiri text-2xl md:text-3xl rtl text-right leading-[2.2] md:leading-[2.8] text-white/90 relative z-10">
                                عَنْ عَبْدَ اللَّهِ بْنَ مَسْعُودٍ، يَقُولُ: قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: " مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالحَسَنَةُ بِعَشْرِ أَمْثَالِهَا، لَا أَقُولُ الم حَرْفٌ، وَلَكِنْ أَلِفٌ حَرْفٌ وَلَامٌ حَرْفٌ وَمِيمٌ حَرْفٌ "
                            </p>
                        </div>

                        {/* Translation */}
                        <div className="border-l-4 border-emerald-500/60 pl-6 space-y-2">
                            <p className="text-sm font-semibold text-emerald-400/80 mb-1">
                                D'après Abdallah ibn Mas'ud (qu'Allah l'agrée), le Prophète (ﷺ) a dit :
                            </p>
                            <p className="text-base md:text-lg italic font-medium text-white/80 leading-relaxed">
                                « Celui qui lit une seule lettre du Coran obtient une bonne action et la bonne action est décuplée. Je ne dis pas que 'Alif Lam Mim' est une lettre mais Alif est une lettre, Lam est une lettre et Mim est une lettre ».
                            </p>
                        </div>

                        {/* Source */}
                        <div className="flex justify-end">
                            <span className="px-5 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                                Tirmidhi n°2910 · Authentifié par Cheikh Albani
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Jours 1..existingDaysRead : affichés comme "Lu" (effectués avant l'inscription) */}
                {(() => {
                    const existingDays = state.progress.existingDaysRead ?? 0;
                    const virtualStart = getVirtualStartDateStr(state.progress.startDate, existingDays);
                    const pastDayCards: { displayDayNum: number; date: Date | null }[] = [];
                    for (let i = 1; i <= existingDays; i++) {
                        pastDayCards.push({
                            displayDayNum: i,
                            date: getDateForDay(i, virtualStart)
                        });
                    }
                    return pastDayCards.map((past, idx) => (
                        <motion.div key={`past_${past.displayDayNum}`} custom={idx} initial="hidden" animate="visible" variants={cardVariants}>
                            <div className="premium-card h-full p-8 flex flex-col gap-6 border-2 border-border-main/50 bg-bg-secondary/40 opacity-60 grayscale-[0.5] border-success/10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar size={12} className="text-accent-color opacity-50" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color">
                                                {t('day')} {past.displayDayNum}
                                                {past.date && (
                                                    <span className="ml-2 font-black text-text-main">
                                                        — {past.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-text-secondary mt-1">{t('readBeforeRegistration')}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-success shadow-lg shadow-success/20 text-white">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-full bg-success/20 border border-success/30 text-[9px] font-black uppercase tracking-widest text-success flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                        Lu
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ));
                })()}
                {readingPlan.map((day, i) => {
                    const status = state.progress.readingHistory[`day_${day.day}`]?.status || 'not_read';
                    const isCompleted = status === 'done' || status === 'partial' || status === 'catchup';
                    const isCurrent = day.day === state.progress.currentReadingDay;
                    const isEditing = editingDay === day.day;
                    const isHighlighted = isCurrent || isEditing;
                    const displayDayNum = (state.progress.existingDaysRead ?? 0) + day.day;
                    const dayDate = getDateForDay(day.day, state.progress.startDate);
                    const isFriday = dayDate?.getDay() === 5;
                    const showKahf = day.isKahfDay && isFriday;
                    const hizbDetails = getHizbDetailsFromPage(day.startPage);
                    const endHizbDetails = getHizbDetailsFromPage(day.endPage);
                    const hizbInfo = HIZB_DATA[hizbDetails.hizbNum - 1];
                    const endHizbInfo = HIZB_DATA[endHizbDetails.hizbNum - 1];
                    const hizbDetailsText = (hizbDetails.hizbNum !== endHizbDetails.hizbNum && hizbInfo && endHizbInfo)
                        ? `Hizb ${hizbDetails.hizbNum} : ${hizbInfo.details} à Hizb ${endHizbDetails.hizbNum} : ${endHizbInfo.details}`
                        : hizbInfo ? `Hizb ${hizbDetails.hizbNum} : ${hizbInfo.details}` : undefined;

                    return (
                        <motion.div key={day.day} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
                            <div
                                className={clsx(
                                    "premium-card h-full p-8 flex flex-col gap-6 border-2 transition-all relative overflow-hidden group",
                                    isHighlighted ? "border-accent-color ring-8 ring-accent-color/5 shadow-premium" : "border-border-main/50 bg-bg-secondary/40",
                                    isCompleted && !isHighlighted && "opacity-60 grayscale-[0.5] border-success/10"
                                )}
                                onClick={() => !isCurrent && setEditingDay(isEditing ? null : day.day)}
                            >
                                {showKahf && (
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
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color">
                                                {t('day')} {displayDayNum}
                                                {state.progress.startDate && (
                                                    <span className="ml-2 font-black text-text-main group-hover:text-accent-color transition-colors">
                                                        — {getDateForDay(day.day, state.progress.startDate)?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-black tracking-tight">{hizbDetails.surahName}</h4>
                                        {hizbDetailsText && (
                                            <p className="text-sm font-semibold text-text-secondary mt-1">
                                                {hizbDetailsText} — Pages : {day.startPage} à {day.endPage}
                                            </p>
                                        )}
                                    </div>
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                        status === 'done' || status === 'partial' || status === 'catchup' ? "bg-success shadow-lg shadow-success/20 text-white" : "bg-bg-main border border-border-main/50 text-text-main/20"
                                    )}>
                                        {status === 'done' || status === 'partial' || status === 'catchup' ? <CheckCircle2 size={24} /> : isCurrent ? <Circle size={24} className="animate-pulse text-accent-color" /> : <Clock size={20} />}
                                    </div>
                                </div>

                                {(status === 'done' || status === 'partial' || status === 'catchup') && (
                                    <div className="flex gap-2 -mt-2 mb-2">
                                        <div className="px-3 py-1 rounded-full bg-success/20 border border-success/30 text-[9px] font-black uppercase tracking-widest text-success flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                                            {t('pagesReadBadge').replace('{count}', String(state.progress.readingHistory[`day_${day.day}`]?.realPages || day.recalculatedPages))}
                                        </div>
                                        {state.progress.readingHistory[`day_${day.day}`]?.adjustment !== 0 && (
                                            <div className={clsx(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border",
                                                (state.progress.readingHistory[`day_${day.day}`]?.adjustment || 0) > 0
                                                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                                    : "bg-danger/20 border-danger/30 text-danger"
                                            )}>
                                                {(state.progress.readingHistory[`day_${day.day}`]?.adjustment || 0) > 0 ? '+' : ''}
                                                {state.progress.readingHistory[`day_${day.day}`]?.adjustment} {t((state.progress.readingHistory[`day_${day.day}`]?.adjustment || 0) > 0 ? 'extraPages' : 'missingPages')}
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                            {hizbDetails.hizbNum === endHizbDetails.hizbNum ? `Hizb ${hizbDetails.hizbNum}` : `Hizbs ${hizbDetails.hizbNum}-${endHizbDetails.hizbNum}`}
                                        </span>
                                    </div>

                                    {showKahf && (
                                        <div className="mt-4 p-4 bg-accent-color/5 border border-accent-color/20 rounded-2xl space-y-4">
                                            <div className="flex items-center gap-2 text-accent-color">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sourate Al-Kahf</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['done', 'partial', 'not_read'] as const).map(kStatus => (
                                                    <button
                                                        key={kStatus}
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(day, kStatus, true); }}
                                                        className={clsx(
                                                            "py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                                            state.progress.readingHistory[`day_${day.day}`]?.kahfStatus === kStatus
                                                                ? (kStatus === 'done' ? "bg-accent-color border-accent-color text-white" : kStatus === 'partial' ? "bg-warning border-warning text-white" : "bg-danger border-danger text-white")
                                                                : "bg-white/5 border-white/5 hover:border-accent-color/30 text-text-main/60"
                                                        )}
                                                    >
                                                        {kStatus === 'done' ? 'Lu' : kStatus === 'partial' ? 'Partiel' : 'Non lu'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                                                    className={clsx(
                                                        "rounded-xl h-12 font-black transition-all duration-300",
                                                        (status === 'done' || status === 'partial' || status === 'catchup') ? "shadow-lg shadow-success/30 scale-105" : ""
                                                    )}
                                                    variant={(status === 'done' || status === 'partial' || status === 'catchup') ? 'success' : 'secondary'}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(day, 'done'); }}
                                                >
                                                    {t('goalAchieved')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className={clsx(
                                                        "rounded-xl h-12 font-black transition-all duration-300",
                                                        status === 'not_read' ? "shadow-lg shadow-danger/30 scale-105" : ""
                                                    )}
                                                    variant={status === 'not_read' ? 'danger' : 'secondary'}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(day, 'not_read'); }}
                                                >
                                                    {t('notReadStatus') || 'Non lu'}
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

            {/* Objectifs Atteints Section */}
            <section className="mt-16 space-y-8">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 border-b border-border-main pb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                            <Folder size={24} fill="currentColor" opacity={0.2} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{t('completedGoals')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t('readingHistoryTitle')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {state.progress.history.reading.length > 0 ? (
                            state.progress.history.reading.map((goal, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02, translateY: -5 }}
                                    className="premium-card group cursor-pointer border-border-main/50 hover:border-accent-color/50 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 rounded-xl bg-accent-color/10 text-accent-color">
                                            <Trophy size={20} />
                                        </div>
                                        <div className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                                            #{state.progress.history.reading.length - idx}
                                        </div>
                                    </div>
                                    <h3 className="font-black text-lg mb-1">{t('readingGoalHistory', { index: state.progress.history.reading.length - idx, khatmas: goal.khatmas, duration: goal.duration })}</h3>
                                    <p className="text-xs opacity-50 mb-4">{t('completedOn', { date: new Date(goal.completedAt).toLocaleDateString() })}</p>
                                    <Button variant="ghost" size="sm" className="w-full rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-accent-color hover:text-white transition-colors">
                                        {t('viewDetails') || 'Voir les détails'}
                                    </Button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-bg-main/30 rounded-[2.5rem] border border-dashed border-border-main/50">
                                <Folder size={48} className="text-border-main mb-4 opacity-50" />
                                <p className="text-sm font-bold opacity-40">{t('noReadingHistory')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Modal isOpen={kahfModalOpen} onClose={() => setKahfModalOpen(false)}>
                <HadithAlKahf />
                <Button variant="accent" onClick={() => setKahfModalOpen(false)} className="mt-10 w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent-color/20 transition-all hover:scale-[1.02] active:scale-[0.98]">{t('kahfReadButton')}</Button>
            </Modal>

            <InputModal
                isOpen={inputModalState.isOpen}
                onClose={() => setInputModalState({ ...inputModalState, isOpen: false })}
                onSubmit={inputModalState.onSubmit}
                title={inputModalState.title}
                label={inputModalState.label}
                confirmText={t('validate')}
                cancelText={t('cancel')}
                min={inputModalState.min}
                max={inputModalState.max}
                initialValue={inputModalState.initialValue}
            />
        </div>
    );
};
export default ReadingPlanView;
