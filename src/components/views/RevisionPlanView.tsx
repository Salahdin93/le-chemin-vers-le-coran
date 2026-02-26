import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { RevisionPlanDay, RevisionStatus } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertCircle, CheckCircle2, Circle, Clock, LayoutGrid, History } from 'lucide-react';
import ReadjustmentModal from '@/components/ui/ReadjustmentModal';
import { HIZB_DATA } from '@/constants/quranData';

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

const RevisionPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [filter, setFilter] = useState<RevisionStatus | 'all'>('all');
    const [reviewModalDay, setReviewModalDay] = useState<RevisionPlanDay | null>(null);

    const revisionPlan = state.plans.revision;

    const currentSurahNames = useMemo(() => {
        if (!activeProfile || !revisionPlan) return [];
        const currentDay = revisionPlan[state.progress.currentRevisionIndex];
        if (!currentDay) return [];
        const currentHizbNums = currentDay.units
            .map(u => {
                const m = u.text.match(/Hizb (\d+)/);
                return m ? parseInt(m[1], 10) : null;
            })
            .filter(Boolean) as number[];

        return (activeProfile.difficulties || [])
            .filter(d => d.hizbNum && currentHizbNums.includes(d.hizbNum as number))
            .map(d => d.surahName);
    }, [activeProfile?.difficulties, revisionPlan, state.progress.currentRevisionIndex]);

    const pastRevisionsCount = state.progress.currentRevisionIndex;
    const totalDays = revisionPlan?.length || 0;
    const progressPercent = totalDays > 0 ? Math.round((pastRevisionsCount / totalDays) * 100) : 0;

    const handleStatusUpdate = (day: RevisionPlanDay, status: RevisionStatus, difficulties?: string[]) => {
        const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
        const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1], 10) : undefined;
        dispatch({
            type: 'UPDATE_REVISION_STATUS',
            payload: { revisionIndex: state.plans.revision!.indexOf(day), status, hizbNum, difficulties }
        });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    if (!revisionPlan) {
        return (
            <Card className="text-center py-20 flex flex-col items-center gap-8 premium-card border-none bg-bg-secondary/40">
                <div className="w-24 h-24 bg-accent-color/10 rounded-[2.5rem] flex items-center justify-center text-accent-color shadow-2xl shadow-accent-color/10 animate-bounce-subtle">
                    <Brain size={48} />
                </div>
                <div className="max-w-md">
                    <h3 className="text-3xl font-black mb-3 text-gradient">{t('noGoalsYet')}</h3>
                    <p className="text-text-secondary font-medium leading-relaxed">
                        {t('revisionEmptySubtitle') ||
                            "Vous n'avez pas encore défini d'objectif de révision pour fortifier votre mémoire."}
                    </p>
                </div>
                <Button
                    variant="accent"
                    size="lg"
                    className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-accent-color/20"
                    onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'revision', mode: 'new' } })}
                >
                    {t('newMemorizationGoal')}
                </Button>
            </Card>
        );
    }

    const filteredPlan = revisionPlan.filter(day => filter === 'all' || day.status === filter);

    return (
        <div className="space-y-12 pb-32 px-4 md:px-0">
            {/* Header Stats */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 border-b border-border-main pb-12">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <Brain size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gradient">
                                {t('revisionTitle')}
                            </h1>
                            <p className="text-text-secondary font-medium mt-1 text-sm md:text-base">
                                {t('revisionSubtitle') ||
                                    'Entretenez vos acquis et fortifiez votre mémoire grâce à une révision structurée.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:flex gap-4 w-full xl:w-auto">
                    <div className="p-8 premium-card border-none bg-slate-900 border-white/5 text-white flex-1 xl:min-w-[200px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <LayoutGrid size={80} />
                        </div>
                        <span className="text-4xl font-black block text-accent-color mb-2">{progressPercent}%</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                            {t('totalProgress')}
                        </span>
                    </div>
                    <div className="p-8 premium-card border-none bg-bg-secondary/40 flex-1 xl:min-w-[200px] shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <CheckCircle2 size={80} />
                        </div>
                        <span className="text-4xl font-black block text-text-main mb-2">
                            {pastRevisionsCount} <span className="text-lg opacity-20">/ {totalDays}</span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                            {t('daysCompleted')}
                        </span>
                    </div>
                </div>
            </header>

            {/* Hadith — Importance de la révision */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border border-white/5 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                    <div className="p-8 md:p-12 relative z-10 space-y-8">
                        {/* Label */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Brain size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/60">Hadith</span>
                                <h3 className="text-lg font-black tracking-tight text-white leading-tight">🔁 L’importance de la révision</h3>
                            </div>
                        </div>

                        {/* Arabic text */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Brain size={80} />
                            </div>
                            <p className="font-amiri text-2xl md:text-3xl rtl text-right leading-[2.2] md:leading-[2.8] text-white/90 relative z-10">
                                عَنْ أَبِي مُوسَى الأَشْعَرِيِّ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ: «تَعَاهَدُوا القُرْآنَ، فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الإِبِلِ فِي عُقُلِهَا»
                            </p>
                        </div>

                        {/* Translation */}
                        <div className="border-l-4 border-blue-500/60 pl-6 space-y-2">
                            <p className="text-sm font-semibold text-blue-400/80 mb-1">
                                D'après Abu Moussa Al Ach'ari (qu'Allah l'agrée), le Prophète (ﷺ) a dit :
                            </p>
                            <p className="text-base md:text-lg italic font-medium text-white/80 leading-relaxed">
                                « Réviser régulièrement le Coran car, par Celui qui détient mon âme dans Sa main, il s'échappe plus vite que les chameaux de leurs enclos ».
                            </p>
                        </div>

                        {/* Source */}
                        <div className="flex justify-end">
                            <span className="px-5 py-2 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                                Boukhari n°5033 · Mouslim n°791
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Filters */}
            <div className="flex items-center gap-6 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-2 bg-bg-secondary/50 p-1.5 rounded-2xl border border-border-main/50">
                    {(['all', 'revised', 'to-review', 'not_revised', 'pending'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={clsx(
                                'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                                filter === f
                                    ? 'bg-accent-color text-white shadow-lg shadow-accent-color/20'
                                    : 'text-text-main/40 hover:text-text-main hover:bg-bg-main'
                            )}
                        >
                            {t(f === 'all' ? 'showAll' : f)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredPlan.map((day, i) => {
                        const dayIndex = revisionPlan.indexOf(day);
                        const isCurrent = dayIndex === state.progress.currentRevisionIndex;
                        const statusColor =
                            day.status === 'revised'
                                ? 'text-success'
                                : day.status === 'to-review'
                                    ? 'text-warning'
                                    : day.status === 'not_revised'
                                        ? 'text-danger'
                                        : 'text-text-main/20';

                        return (
                            <motion.div
                                key={dayIndex}
                                layout
                                custom={i}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.95 }}
                                variants={cardVariants}
                            >
                                <div
                                    className={clsx(
                                        'premium-card h-full p-8 flex flex-col gap-8 border-2 transition-all relative overflow-hidden group',
                                        isCurrent
                                            ? 'border-accent-color ring-8 ring-accent-color/5 shadow-premium'
                                            : 'border-border-main/50 bg-bg-secondary/40',
                                        day.status === 'revised' &&
                                        !isCurrent &&
                                        'opacity-60 grayscale-[0.5] border-success/10'
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color mb-2 block">
                                                {t('day')} {dayIndex + 1}
                                                {day.date && (
                                                    <span className="ml-2 font-black text-text-main group-hover:text-accent-color transition-colors">
                                                        — {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </span>
                                                )}
                                            </span>
                                            <h4 className="text-2xl font-black tracking-tight">
                                                {day.units.map(u => u.text).join(' + ')}
                                            </h4>
                                        </div>
                                        <div
                                            className={clsx(
                                                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500',
                                                day.status === 'revised'
                                                    ? 'bg-success text-white shadow-lg shadow-success/20'
                                                    : day.status === 'to-review'
                                                        ? 'bg-warning text-white shadow-lg shadow-warning/20'
                                                        : 'bg-bg-main border border-border-main/50',
                                                statusColor
                                            )}
                                        >
                                            {day.status === 'revised' ? (
                                                <CheckCircle2 size={24} />
                                            ) : day.status === 'to-review' ? (
                                                <Clock size={24} />
                                            ) : isCurrent ? (
                                                <Circle size={24} className="animate-pulse" />
                                            ) : (
                                                <Clock size={20} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        {day.units.map((unit, j) => (
                                            <div
                                                key={j}
                                                className="flex items-center gap-4 p-4 rounded-2xl bg-bg-main/50 border border-border-main/30 group-hover:bg-bg-main transition-colors"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color font-black text-xs">
                                                    {j + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black tracking-tight">
                                                        {unit.text}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
                                                        {unit.surahs}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {isCurrent && currentSurahNames.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="mt-4 p-4 bg-danger/5 border border-danger/20 rounded-2xl flex gap-4 items-start"
                                            >
                                                <AlertCircle size={20} className="text-danger shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-danger uppercase tracking-[0.2em]">
                                                        {t('difficultyWarning')}
                                                    </p>
                                                    <p className="text-xs font-bold leading-relaxed">
                                                        {currentSurahNames.join(', ')}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {(isCurrent || dayIndex < state.progress.currentRevisionIndex) && (
                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                            <Button
                                                size="sm"
                                                variant={day.status === 'revised' ? 'success' : 'secondary'}
                                                className={clsx(
                                                    "h-14 font-black rounded-xl transition-all duration-300",
                                                    day.status === 'revised' ? "shadow-lg shadow-success/30 scale-105" : "bg-white/5 opacity-60"
                                                )}
                                                onClick={() => handleStatusUpdate(day, 'revised')}
                                            >
                                                {t('revised')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={day.status === 'not_revised' ? 'danger' : 'secondary'}
                                                className={clsx(
                                                    "h-14 font-black rounded-xl transition-all duration-300",
                                                    day.status === 'not_revised' ? "shadow-lg shadow-danger/30 scale-105" : "bg-white/5 opacity-60"
                                                )}
                                                onClick={() => handleStatusUpdate(day, 'not_revised')}
                                            >
                                                {t('not_revised')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={day.status === 'to-review' ? 'warning' : 'secondary'}
                                                className={clsx(
                                                    "h-14 font-black rounded-xl transition-all duration-300",
                                                    day.status === 'to-review' ? "shadow-lg shadow-warning/30 scale-105" : "bg-white/5 opacity-60"
                                                )}
                                                onClick={() => setReviewModalDay(day)}
                                            >
                                                {t('toReview')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
            {reviewModalDay && (
                <ReadjustmentModal
                    isOpen={!!reviewModalDay}
                    onClose={() => setReviewModalDay(null)}
                    onConfirm={(selectedItems: string[]) => {
                        handleStatusUpdate(reviewModalDay, 'to-review', selectedItems);
                        setReviewModalDay(null);
                    }}
                    title={t('toReview')}
                    items={reviewModalDay.units.flatMap(unit => {
                        const hizbMatch = unit.text.match(/Hizb (\d+)/);
                        if (hizbMatch) {
                            const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                            const hizb = HIZB_DATA[hizbIndex];
                            if (hizb && Array.isArray(hizb.surahs)) {
                                return hizb.surahs;
                            }
                        }
                        return unit.surahs.split(',').map(s => s.trim()).filter(Boolean);
                    })}
                />
            )}
            <section className="mt-20 space-y-10">
                <div className="flex items-center gap-4 border-b border-border-main pb-8">
                    <div className="p-3 bg-warning/10 rounded-2xl text-warning">
                        <History size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gradient">Historique des unités à reprendre</h2>
                        <p className="text-text-secondary font-medium">Retrouvez ici les unités marquées comme étant à revoir lors de vos sessions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.progress.history.toReview && state.progress.history.toReview.length > 0 ? (
                        state.progress.history.toReview.map((item, idx) => (
                            <div key={idx} className="premium-card p-6 bg-warning/5 border-warning/10 border-2 rounded-[2rem] flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-warning opacity-60">
                                        Jour {item.day} — {new Date(item.date).toLocaleDateString()}
                                    </span>
                                    <div className="p-2 bg-warning/20 rounded-lg text-warning">
                                        <AlertCircle size={16} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {item.units.map((u, i) => (
                                        <div key={i} className="text-sm font-bold">{u.text}</div>
                                    ))}
                                </div>
                                {item.difficulties && item.difficulties.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {item.difficulties.map((d, i) => (
                                            <span key={i} className="px-3 py-1 bg-warning/10 text-[9px] font-black uppercase tracking-widest text-warning rounded-full border border-warning/20">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-text-secondary opacity-50 font-medium">
                            Aucune unité à reprendre pour le moment.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default RevisionPlanView;
