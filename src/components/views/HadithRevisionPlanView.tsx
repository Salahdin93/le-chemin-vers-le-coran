import React from 'react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import { useStore } from '../../context/AppContext';
import { RevisionStatus } from '../../types';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import EmptyState from '../ui/EmptyState';
import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.5,
            ease: "easeOut" as any
        }
    })
};

const HadithRevisionPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();

    const revisionPlan = state.plans.hadithRevision;
    const revisionGoal = activeProfile?.goals.hadithRevision;
    const isPlanFinished = revisionGoal && state.progress.currentHadithRevisionIndex >= (revisionPlan?.length || 0);

    const handleStatusUpdate = (status: RevisionStatus, dayIndex: number) => {
        dispatch({
            type: 'UPDATE_HADITH_REVISION_STATUS',
            payload: { dayIndex, status }
        });

        const isCompleting = dayIndex === (revisionPlan?.length || 0) - 1;
        if (isCompleting && revisionGoal && revisionPlan) {
            const completedGoal = {
                count: revisionGoal.selectedHadiths.length,
                duration: revisionPlan.length,
                completedAt: new Date().toLocaleDateString(state.settings.lang),
                dailyPlan: [...revisionPlan.slice(0, dayIndex), { ...revisionPlan[dayIndex], status }]
            };
            dispatch({ type: 'COMPLETE_HADITH_REVISION_GOAL', payload: { goal: completedGoal } });
            dispatch({ type: 'SET_TOAST', payload: t('congratulations') });
        }
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const pastRevisions = revisionPlan?.filter((_, index) => index < state.progress.currentHadithRevisionIndex) || [];

    const statusClasses: Record<RevisionStatus, string> = { 'revised': 'bg-green-500', 'to-review': 'bg-yellow-500', 'not_revised': 'bg-red-500', 'pending': "bg-gray-400" };
    const statusText: Record<RevisionStatus, string> = { 'revised': t('revised'), 'to-review': t('toReview'), 'not_revised': t('notAchieved'), 'pending': t('pending') };

    return (
        <div className="space-y-8">
            <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                <Card>
                    <CardHeader icon="✍️" className="flex justify-between items-center">
                        {t('hadithRevisionPlan')}
                        {revisionPlan && revisionPlan.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-settings-view' })}>
                                <Edit size={16} className="mr-2" />
                                {t('editPlan')}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {!revisionPlan || revisionPlan.length === 0 ? (
                            <div className="p-4">
                                <EmptyState
                                    icon="🗺️"
                                    title={t('noHadithRevisionPlan')}
                                    message={t('createHadithRevisionPlanPrompt')}
                                    actionText={t('setupRevisionPlan')}
                                    onActionClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-settings-view' })}
                                />
                            </div>
                        ) : isPlanFinished ? (
                            <div className="text-center py-12">
                                <h3 className="text-3xl font-amiri mb-4">{t('congratulations')}</h3>
                                <p className="mb-6">{t('hadithRevisionGoalCompleted')}</p>
                                <Button onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-settings-view' })}>{t('newRevisionGoal')}</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {revisionPlan.map((day, index) => {
                                    const isCurrent = index === state.progress.currentHadithRevisionIndex;
                                    const statusBorderColorClass = {
                                        'revised': 'border-green-500',
                                        'to-review': 'border-yellow-500',
                                        'not_revised': 'border-red-500',
                                        'pending': 'border-border-main'
                                    };

                                    return (
                                        <motion.div key={index} custom={index} initial="hidden" animate="visible" variants={cardVariants}>
                                            <div className={clsx(
                                                'p-5 border-2 rounded-2xl flex flex-col justify-between transition-all duration-200 ease-in-out h-full',
                                                'bg-bg-secondary text-text-main shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1',
                                                isCurrent ? 'border-primary' : statusBorderColorClass[day.status],
                                            )}>
                                                <div>
                                                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-border-main">
                                                        <h4 className="font-bold text-primary text-xl">{t('day')} {day.day}</h4>
                                                        <div className='flex items-center gap-2'>
                                                            <span className={clsx("w-3 h-3 rounded-full", statusClasses[day.status])}></span>
                                                            <span className='text-xs font-bold'>{statusText[day.status]}</span>
                                                        </div>
                                                    </div>
                                                    <p className="font-semibold">{t('reviseHadiths')} N°:</p>
                                                    <p className="text-sm font-semibold text-text-main/80">{day.hadithIds.join(', ')}</p>
                                                </div>
                                                {isCurrent && (
                                                    <div className="flex flex-col gap-2 mt-4">
                                                        <Button size="sm" variant="success" onClick={() => handleStatusUpdate('revised', index)}>{t('revised')}</Button>
                                                        <Button size="sm" variant="warning" onClick={() => handleStatusUpdate('to-review', index)}>{t('toReview')}</Button>
                                                        <Button size="sm" variant="danger" onClick={() => handleStatusUpdate('not_revised', index)}>{t('notAchieved')}</Button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {pastRevisions.length > 0 && (
                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card>
                        <CardHeader icon="📚">{t('history')}</CardHeader>
                        <CardContent>
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                                {pastRevisions.slice().reverse().map((day) => (
                                    <li key={day.day} className="p-3 bg-bg-main rounded-lg flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{t('day')} {day.day}: {t('hadithIdsLabel')} {day.hadithIds.join(', ')}</p>
                                            <span className="text-xs opacity-60">{new Date(day.date).toLocaleDateString(state.settings.lang)}</span>
                                        </div>
                                        <div className='flex items-center gap-2 shrink-0 ml-4'>
                                            <span className={clsx("w-3 h-3 rounded-full", statusClasses[day.status])}></span>
                                            <span className='text-xs font-bold'>{statusText[day.status]}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default HadithRevisionPlanView;