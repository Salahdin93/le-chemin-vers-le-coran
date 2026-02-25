import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { RevisionPlanDay, RevisionStatus } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertCircle, Zap } from 'lucide-react';

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

const RevisionPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [filter, setFilter] = useState<RevisionStatus | 'all'>('all');

    const revisionPlan = state.plans.revision;

    const currentSurahNames = useMemo(() => {
        if (!activeProfile || !revisionPlan) return [];
        const currentDay = revisionPlan[state.progress.currentRevisionIndex];
        if (!currentDay) return [];
        const currentHizbNums = currentDay.units.map(u => {
            const m = u.text.match(/Hizb (\d+)/);
            return m ? parseInt(m[1]) : null;
        }).filter(Boolean);

        return (activeProfile.difficulties || []).filter(d => d.hizbNum && currentHizbNums.includes(d.hizbNum as number)).map(d => d.surahName);
    }, [activeProfile?.difficulties, revisionPlan, state.progress.currentRevisionIndex]);

    const pastRevisionsCount = state.progress.currentRevisionIndex;
    const totalDays = revisionPlan?.length || 0;
    const progressPercent = totalDays > 0 ? Math.round((pastRevisionsCount / totalDays) * 100) : 0;

    const handleStatusUpdate = (day: RevisionPlanDay, status: RevisionStatus) => {
        const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
        const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1]) : undefined;
        dispatch({ type: 'UPDATE_REVISION_STATUS', payload: { revisionIndex: state.plans.revision!.indexOf(day), status, hizbNum } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    if (!revisionPlan) {
        return (
            <Card className="text-center py-12 flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-accent-color/10 rounded-full flex items-center justify-center text-accent-color">
                    <Brain size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-black mb-2">{t('noGoalsYet')}</h3>
                    <p className="text-text-secondary">{t('revisionEmptySubtitle') || 'Vous n\'avez pas encore défini d\'objectif de révision.'}</p>
                </div>
                <Button variant="accent" onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'revision', mode: 'new' } })}>
                    {t('newMemorizationGoal')}
                </Button>
            </Card>
        );
    }

    const filteredPlan = revisionPlan.filter(day => filter === 'all' || day.status === filter);

    return (
        <div className="space-y-10 pb-24">
            {/* Header Stats */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-border-main pb-10">
                <div className="max-w-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 accent-gradient rounded-2xl text-white shadow-lg shadow-accent-color/20">
                            <Brain size={28} />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight text-gradient">{t('revisionTitle')}</h2>
                    </div>
                    <p className="text-text-secondary font-medium leading-relaxed">
                        {t('revisionSubtitle') || 'Entretenez vos acquis et fortifiez votre mémoire grâce à une révision structurée et régulière.'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="p-6 premium-card border-none bg-slate-900 text-white min-w-[160px] text-center">
                        <span className="text-4xl font-black block text-accent-color mb-1">{progressPercent}%</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t('totalProgress')}</span>
                    </div>
                    <div className="p-6 premium-card border-none bg-accent-color/5 min-w-[160px] text-center border-accent-color/10 ring-1 ring-accent-color/5">
                        <span className="text-4xl font-black block text-text-main mb-1">{pastRevisionsCount} <span className="text-lg opacity-30">/ {totalDays}</span></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('daysCompleted')}</span>
                    </div>
                </div>
            </header>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {(['all', 'revised', 'to-review', 'not_revised', 'pending'] as const).map(f => (
                    <Button
                        key={f}
                        size="sm"
                        variant={filter === f ? 'accent' : 'secondary'}
                        onClick={() => setFilter(f)}
                        className="rounded-full shadow-none"
                    >
                        {t(f === 'all' ? 'showAll' : f)}
                    </Button>
                ))}
            </div>

            {/* Grid of Days */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredPlan.map((day, i) => {
                        const dayIndex = revisionPlan.indexOf(day);
                        const isCurrent = dayIndex === state.progress.currentRevisionIndex;
                        const bgColor = day.status === 'revised' ? 'bg-success/5' : day.status === 'to-review' ? 'bg-warning/5' : 'bg-transparent';
                        const dotColor = day.status === 'revised' ? 'bg-success' : day.status === 'to-review' ? 'bg-warning' : day.status === 'not_revised' ? 'bg-danger' : 'bg-text-secondary/20';

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
                                <div className={clsx(
                                    "premium-card h-full p-6 flex flex-col gap-6 border-2 transition-all group",
                                    isCurrent ? "border-accent-color ring-8 ring-accent-color/5" : "border-border-main/40",
                                    bgColor
                                )}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color mb-1">
                                                {t('day')} {dayIndex + 1}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className={clsx("w-2 h-2 rounded-full", dotColor)} />
                                                <h4 className="text-xl font-black">{day.units.map(u => u.text).join(' + ')}</h4>
                                            </div>
                                        </div>
                                        {isCurrent && <Zap size={20} className="text-accent-color animate-pulse" fill="currentColor" />}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        {day.units.map((unit, j) => (
                                            <div key={j} className="flex items-center gap-3 p-3 glass-card border-none bg-bg-main/50 rounded-xl group-hover:bg-bg-main transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-accent-color/10 flex items-center justify-center text-accent-color">
                                                    <span className="text-[10px] font-bold">{j + 1}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{unit.text}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{unit.surahs}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {isCurrent && currentSurahNames.length > 0 && (
                                            <div className="mt-4 p-4 bg-danger/5 border border-danger/20 rounded-2xl flex gap-3 items-start animate-bounce-subtle">
                                                <AlertCircle size={18} className="text-danger shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-danger uppercase tracking-[0.2em]">{t('difficultyWarning')}</p>
                                                    <p className="text-xs font-bold leading-tight">{currentSurahNames.join(', ')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {(isCurrent || dayIndex < state.progress.currentRevisionIndex) && (
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <Button
                                                size="sm"
                                                variant={day.status === 'revised' ? 'success' : 'secondary'}
                                                className="h-11 font-black"
                                                onClick={() => handleStatusUpdate(day, 'revised')}
                                            >
                                                {t('revised')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={day.status === 'to-review' ? 'warning' : 'secondary'}
                                                className="h-11 font-black"
                                                onClick={() => handleStatusUpdate(day, 'to-review')}
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
        </div>
    );
};

export default RevisionPlanView;