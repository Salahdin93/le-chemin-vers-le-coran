import React, { useState } from 'react';
import { useStore } from '../../context/AppContext';
import { RevisionStatus } from '../../types';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
    Edit, Calendar, CheckCircle2, Clock,
    AlertCircle, Sparkles,
    Trophy, History, ArrowRight, Activity, ChevronRight, RotateCcw, EyeOff
} from 'lucide-react';

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: (i: number) => ({
        opacity: 1, scale: 1, y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1] as any
        }
    })
};

const HadithRevisionPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [ratingSelector, setRatingSelector] = useState<{ isOpen: boolean; index: number } | null>(null);

    const revisionPlan = state.plans.hadithRevision;
    const revisionGoal = activeProfile?.goals.hadithRevision;
    const currentProgress = state.progress.currentHadithRevisionIndex;
    const isPlanFinished = revisionGoal && currentProgress >= (revisionPlan?.length || 0);

    const handleStatusUpdate = (status: RevisionStatus, dayIndex: number) => {
        if (status === 'revised') {
            setRatingSelector({ isOpen: true, index: dayIndex });
        } else {
            completeUpdate(dayIndex, status);
        }
    };

    const completeUpdate = (dayIndex: number, status: RevisionStatus, quality?: any) => {
        dispatch({ type: 'UPDATE_HADITH_REVISION_STATUS', payload: { dayIndex, status, quality } });

        const isCompleting = dayIndex === (revisionPlan?.length || 0) - 1;
        if (isCompleting && revisionGoal && revisionPlan) {
            const completedGoal = {
                count: revisionGoal.selectedHadiths.length,
                duration: revisionPlan.length,
                completedAt: new Date().toLocaleDateString(state.settings.lang),
                dailyPlan: [...revisionPlan.slice(0, dayIndex), { ...revisionPlan[dayIndex], status, quality: quality as any }]
            };
            dispatch({ type: 'COMPLETE_HADITH_REVISION_GOAL', payload: { goal: completedGoal } });
            dispatch({ type: 'SET_TOAST', payload: t('congratulations') });
        }
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleRatingSelect = (rating: 'tres_bien' | 'bien' | 'moyen' | 'a_revoir') => {
        if (!ratingSelector) return;
        completeUpdate(ratingSelector.index, 'revised', rating);
        setRatingSelector(null);
    };

    const pastRevisions = revisionPlan?.filter((_, index) => index < currentProgress) || [];

    const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
        'revised': { color: 'text-success bg-success/10 border-success/20', icon: CheckCircle2, label: t('revised') },
        'to-review': { color: 'text-warning bg-warning/10 border-warning/20', icon: Clock, label: t('toReview') },
        'not_revised': { color: 'text-danger bg-danger/10 border-danger/20', icon: AlertCircle, label: t('notAchieved') },
        'pending': { color: 'text-text-main/20 bg-bg-secondary/50 border-border-main/20', icon: Calendar, label: t('pending') },
        'done': { color: 'text-success bg-success/10 border-success/20', icon: CheckCircle2, label: t('revised') }
    };

    return (
        <div className="space-y-12 pb-32 px-4 md:px-0">
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pb-12 border-b-2 border-border-main/50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <Activity size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-gradient">L'Art de la Rétention</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">{t('hadithRevisionPlan')}</h1>
                    <p className="text-text-secondary font-medium text-lg leading-relaxed max-w-2xl">Maintenez la pureté de votre mémorisation par des cycles de révision structurés et constants.</p>
                </div>

                {revisionPlan && revisionPlan.length > 0 && (
                    <Button
                        variant="secondary"
                        onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-settings-view' })}
                        className="rounded-2xl h-16 px-8 uppercase text-[10px] font-black tracking-widest bg-bg-secondary/50 border-border-main/20 shadow-premium group transition-all"
                    >
                        <Edit size={16} className="mr-3 text-accent-color group-hover:scale-110 transition-transform" />
                        {t('editPlan')}
                    </Button>
                )}
            </header>

            {!revisionPlan || revisionPlan.length === 0 ? (
                <div className="py-32 text-center premium-card border-none bg-bg-secondary/30 rounded-[3rem] flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-color/5 to-transparent pointer-events-none" />
                    <div className="w-24 h-24 bg-bg-main rounded-[2.5rem] flex items-center justify-center text-text-main/5 shadow-inner relative z-10">
                        <Calendar size={48} />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <p className="text-xl font-black tracking-tight opacity-40">{t('noHadithRevisionPlan')}</p>
                        <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest max-w-[300px] mx-auto">{t('createHadithRevisionPlanPrompt')}</p>
                    </div>
                    <Button
                        variant="accent"
                        onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-settings-view' })}
                        className="relative z-10 px-12 h-14 rounded-2xl uppercase font-black text-[10px] tracking-widest shadow-xl shadow-accent-color/20"
                    >
                        {t('setupRevisionPlan')}
                    </Button>
                </div>
            ) : isPlanFinished ? (
                <div className="py-32 text-center premium-card border-2 border-accent-color/20 bg-accent-color/[0.02] rounded-[3rem] flex flex-col items-center gap-10 shadow-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-sparkle-pattern opacity-10 pointer-events-none" />
                    <div className="w-32 h-32 bg-accent-color text-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-accent-color/40 relative z-10 animate-vertical-bounce">
                        <Trophy size={60} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gradient italic">{t('congratulations')}</h2>
                        <p className="text-lg font-medium opacity-60">{t('hadithRevisionGoalCompleted')}</p>
                    </div>
                    <Button
                        onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-settings-view' })}
                        className="relative z-10 px-16 h-20 rounded-[2rem] uppercase font-black text-xs tracking-widest shadow-2xl shadow-accent-color/30 flex items-center justify-center"
                    >
                        {t('newRevisionGoal')} <ArrowRight size={20} className="ml-3" />
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10">
                    {revisionPlan.map((day, index) => {
                        const isCurrent = index === currentProgress;
                        const isPast = index < currentProgress;
                        const config = statusConfig[day.status];

                        return (
                            <motion.div key={index} custom={index} initial="hidden" animate="visible" variants={cardVariants}>
                                <div className={clsx(
                                    'premium-card p-1 rounded-[2.5rem] border-2 transition-all duration-700 relative group h-full',
                                    isCurrent ? 'border-accent-color shadow-2xl shadow-accent-color/10 scale-102' : 'border-border-main/10 opacity-60 hover:opacity-100'
                                )}>
                                    {isCurrent && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-accent-color text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-accent-color/40 z-20">
                                            Aujourd'hui
                                        </div>
                                    )}

                                    <div className="bg-bg-secondary/40 h-full rounded-[2.3rem] p-8 flex flex-col">
                                        <div className="flex justify-between items-start mb-10 pb-6 border-b border-border-main/10">
                                            <div>
                                                <h4 className="text-4xl font-black text-white/10 group-hover:text-white transition-colors">#{day.day}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">{t('day')}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={clsx("px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-inner", config.color)}>
                                                    <config.icon size={12} />
                                                    {config.label}
                                                </div>
                                                {day.quality && (
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                                                        day.quality === 'tres_bien' ? 'bg-success/20 text-success border border-success/30' :
                                                            day.quality === 'bien' ? 'bg-accent-color/20 text-accent-color border border-accent-color/30' :
                                                                day.quality === 'moyen' ? 'bg-warning/20 text-warning border border-warning/30' :
                                                                    'bg-danger/20 text-danger border border-danger/30'
                                                    )}>
                                                        {day.quality.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6 mb-10">
                                            <div className="flex items-center gap-3">
                                                <Sparkles size={16} className="text-accent-color/40" />
                                                <span className="text-xs font-black uppercase tracking-widest opacity-60">{t('reviseHadiths')}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {day.hadithIds?.map((id: number) => (
                                                    <div key={id} className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-sm text-accent-color shadow-lg">
                                                        {id}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {isCurrent && (
                                            <div className="grid grid-cols-1 gap-3 mt-auto relative z-10 animate-in fade-in slide-in-from-bottom-2">
                                                <Button size="sm" variant={day.status === 'revised' ? 'success' : 'accent'} onClick={() => handleStatusUpdate('revised', index)} className={clsx("h-14 rounded-2xl font-black uppercase tracking-widest transition-all duration-300", day.status === 'revised' ? 'shadow-lg shadow-success/40' : 'shadow-xl shadow-accent-color/20')}>
                                                    <CheckCircle2 size={16} className="mr-2" /> {t('revised')}
                                                </Button>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Button variant={day.status === 'to-review' ? 'warning' : 'secondary'} onClick={() => handleStatusUpdate('to-review', index)} className={clsx("h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", day.status === 'to-review' ? 'shadow-lg shadow-warning/40 border-warning' : 'bg-white/5 border-white/10 opacity-60')}>
                                                        <RotateCcw size={14} className="mr-1" /> {t('toReview')}
                                                    </Button>
                                                    <Button variant={day.status === 'not_revised' ? 'danger' : 'secondary'} onClick={() => handleStatusUpdate('not_revised', index)} className={clsx("h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", day.status === 'not_revised' ? 'shadow-lg shadow-danger/40 border-danger' : 'bg-white/5 border-white/10 opacity-60')}>
                                                        <EyeOff size={14} className="mr-1" /> {t('notAchieved')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {isPast && day.date && (
                                            <div className="mt-auto flex items-center justify-center py-4 opacity-20 italic text-[10px] font-medium">
                                                Session terminée le {new Date(day.date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Modal du sélecteur de note */}
            {ratingSelector?.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="w-full max-w-sm rounded-[2.5rem] premium-card p-8 bg-slate-900 border border-white/10"
                    >
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-black text-white">{t('rateYourRevision') || 'Notez votre révision'}</h3>
                            <p className="text-sm text-white/50 mt-1">{t('rateYourRevisionDesc') || 'Comment s’est passée cette session ?'}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'tres_bien', label: 'Très bien', icon: '✨' },
                                { id: 'bien', label: 'Bien', icon: '👍' },
                                { id: 'moyen', label: 'Moyen', icon: '😐' },
                                { id: 'a_revoir', label: 'À réviser', icon: '🔄' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleRatingSelect(opt.id as any)}
                                    className={clsx(
                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                                        "bg-white/5 border-white/10 hover:border-accent-color hover:bg-white/10 group"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl group-hover:scale-125 transition-transform">{opt.icon}</span>
                                        <span className="font-black text-sm uppercase tracking-widest text-white/80 group-hover:text-white">{opt.label}</span>
                                    </div>
                                    <ChevronRight className="text-white/20 group-hover:text-white" size={20} />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {pastRevisions.length > 0 && !isPlanFinished && (
                <section className="mt-20 space-y-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 flex items-center gap-4">
                        <span className="p-2 bg-border-main/20 rounded-lg"><History size={20} /></span>
                        {t('history')}
                        <span className="flex-1 h-px bg-border-main/50" />
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {pastRevisions.slice().reverse().map((day, i) => {
                            const config = statusConfig[day.status];
                            return (
                                <motion.div key={day.day} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                    className="p-6 bg-bg-secondary/40 rounded-3xl border border-border-main/10 flex flex-col justify-between gap-6 hover:bg-bg-secondary transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xl font-black opacity-10 italic">Day {day.day}</span>
                                            {day.quality && (
                                                <span className={clsx(
                                                    "w-fit px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                                                    day.quality === 'tres_bien' ? 'bg-success/20 text-success border border-success/30' :
                                                        day.quality === 'bien' ? 'bg-accent-color/20 text-accent-color border border-accent-color/30' :
                                                            day.quality === 'moyen' ? 'bg-warning/20 text-warning border border-warning/30' :
                                                                'bg-danger/20 text-danger border border-danger/30'
                                                )}>
                                                    {day.quality.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <div className={clsx("p-2 rounded-lg border", config.color.split(' ')[0])}>
                                            <config.icon size={14} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mb-2">Hadiths</p>
                                        <p className="text-xs font-bold truncate">{day.hadithIds?.join(', ')}</p>
                                    </div>
                                    <span className="text-[8px] font-bold opacity-10">{day.date && new Date(day.date).toLocaleDateString()}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default HadithRevisionPlanView;
