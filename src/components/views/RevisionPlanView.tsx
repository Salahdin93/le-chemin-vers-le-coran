import React, { useState, useMemo } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { RevisionPlanDay, RevisionStatus } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
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

    const pastRevisions = revisionPlan?.filter((_day, index) => index < state.progress.currentRevisionIndex) || [];

    const statusClasses: Record<RevisionStatus, string> = { 'revised': 'bg-green-500', 'to-review': 'bg-yellow-500', 'not_revised': 'bg-red-500', 'pending': "bg-gray-400" };
    const statusText: Record<RevisionStatus, string> = { 'revised': t('revised'), 'to-review': t('toReview'), 'not_revised': t('notAchieved'), 'pending': t('pending') };

    const handleStatusUpdate = (day: RevisionPlanDay, status: RevisionStatus) => {
        const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
        const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1]) : undefined;

        dispatch({ type: 'UPDATE_REVISION_STATUS', payload: { revisionIndex: state.plans.revision!.indexOf(day), status, hizbNum } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    if (!revisionPlan) {
        return (
            <Card className="text-center py-8">
                <p className="mb-4 text-lg">{t('noGoalsYet')}</p>
                <Button onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'revision', mode: 'new' } })}>{t('newMemorizationGoal')}</Button>
            </Card>
        );
    }

    const filteredPlan = revisionPlan.filter(day => filter === 'all' || day.status === filter);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader icon="🧠">{t('revisionTitle')}</CardHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-bg-main rounded-2xl text-center">
                        <span className="text-3xl font-bold block">{state.progress.currentRevisionIndex} / {revisionPlan.length}</span>
                        <span className="text-sm opacity-70">{t('daysCompleted')}</span>
                    </div>
                    <div className="p-4 bg-bg-main rounded-2xl text-center">
                        <span className="text-3xl font-bold block">{Math.round((state.progress.currentRevisionIndex / revisionPlan.length) * 100)}%</span>
                        <span className="text-sm opacity-70">{t('totalProgress')}</span>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    {(['all', 'revised', 'to-review', 'not_revised', 'pending'] as const).map(f => (
                        <Button key={f} size="sm" variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>
                            {t(f === 'all' ? 'showAll' : f)}
                        </Button>
                    ))}
                </div>

                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPlan.map((day) => {
                        const dayIndex = revisionPlan.indexOf(day);
                        const status = day.status;
                        const isCurrent = dayIndex === state.progress.currentRevisionIndex;
                        const isPast = dayIndex < state.progress.currentRevisionIndex;

                        return (
                            <motion.div
                                variants={itemVariants}
                                key={dayIndex}
                                className={clsx(
                                    "p-5 border-2 rounded-2xl transition-all duration-300",
                                    "bg-bg-secondary shadow-lg shadow-primary/5 hover:shadow-primary/15",
                                    isCurrent ? "border-primary scale-[1.02] shadow-primary/20" : "border-border-main",
                                    isPast && "opacity-80"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4 pb-3 border-b border-border-main">
                                    <div>
                                        <h4 className="font-bold text-xl text-primary">{t('day')} {dayIndex + 1}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={clsx("w-2 h-2 rounded-full", statusClasses[status])}></div>
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{statusText[status]}</span>
                                        </div>
                                    </div>
                                    {isCurrent && <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{t('todayLabel')}</span>}
                                </div>

                                <div className="space-y-3 mb-6">
                                    {day.units.map((unit, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                                <span className="font-bold text-sm">{unit.text}</span>
                                            </div>
                                            <span className="text-xs opacity-60 ml-3.5">{t('revisionUnit')}</span>
                                        </div>
                                    ))}
                                    {isCurrent && currentSurahNames.length > 0 && (
                                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">{t('difficultyWarning')}</p>
                                            <p className="text-xs font-medium">{currentSurahNames.join(', ')}</p>
                                        </div>
                                    )}
                                </div>

                                {(isCurrent || isPast) && (
                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <Button size="sm" variant={status === 'revised' ? 'success' : 'ghost'} className="h-9" onClick={() => handleStatusUpdate(day, 'revised')}>✅ {t('revised')}</Button>
                                        <Button size="sm" variant={status === 'to-review' ? 'warning' : 'ghost'} className="h-9" onClick={() => handleStatusUpdate(day, 'to-review')}>⚠️ {t('to-review')}</Button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </Card>

            {pastRevisions.length > 0 && (
                <Card>
                    <CardHeader icon="📈">{t('revisionSummary')}</CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-bg-main rounded-2xl border border-border-main">
                            <span className="text-xs opacity-60 uppercase font-bold tracking-widest block mb-1">{t('totalRevised')}</span>
                            <span className="text-2xl font-black">{pastRevisions.reduce((acc, day) => acc + day.units.length, 0)} {t('units')}</span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default RevisionPlanView;