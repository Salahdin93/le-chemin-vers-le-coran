import React, { useState, useMemo } from 'react';
import Card, { CardHeader } from '../ui/Card';
import { useStore } from '@/context/AppContext';
import { CompletedReadingGoal, CompletedRevisionGoal, ReadingStatus, RevisionStatus, HadithMemorizationStatus } from '@/types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import EmptyState from '../ui/EmptyState';
import Input from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type SelectedGoal = { type: 'reading', data: CompletedReadingGoal } | { type: 'revision', data: CompletedRevisionGoal };

const HistoryView: React.FC = () => {
    const { state, t, activeProfile } = useStore();
    const [selectedGoal, setSelectedGoal] = useState<SelectedGoal | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortCriteria, setSortCriteria] = useState<'date_desc' | 'date_asc'>('date_desc');
    const history = state.progress.history;
    const hadithHistory = activeProfile?.hadithHistory || [];

    const readingStatusText: Record<ReadingStatus, string> = {
        'done': t('doneStatus'), 'partial': t('partialStatus'), 'catchup': t('catchupStatus'), 'not_read': t('notReadStatus')
    };

    const revisionStatusClasses: Record<RevisionStatus, string> = {
        'revised': 'bg-green-500', 'to-review': 'bg-yellow-500', 'not_revised': 'bg-red-500', 'pending': "bg-gray-400"
    };

    const hadithStatusText: Record<HadithMemorizationStatus, string> = {
        'acquis': t('statusAcquis'),
        'en_memorisation': t('statusEnMemorisation'),
        'a_reprendre': t('statusARependre'),
        'lu': t('statusLu'),
        'non_lu': t('statusNonLu')
    };

    const filteredAndSortedReadingHistory = useMemo(() => {
        return [...history.reading]
            .filter(goal => JSON.stringify(goal).toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const dateA = new Date(a.completedAt.split('/').reverse().join('-')).getTime();
                const dateB = new Date(b.completedAt.split('/').reverse().join('-')).getTime();
                return sortCriteria === 'date_desc' ? dateB - dateA : dateA - dateB;
            });
    }, [history.reading, searchQuery, sortCriteria]);

    const filteredAndSortedRevisionHistory = useMemo(() => {
        return [...history.revision]
            .filter(goal => JSON.stringify(goal).toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const dateA = new Date(a.completedAt.split('/').reverse().join('-')).getTime();
                const dateB = new Date(b.completedAt.split('/').reverse().join('-')).getTime();
                return sortCriteria === 'date_desc' ? dateB - dateA : dateA - dateB;
            });
    }, [history.revision, searchQuery, sortCriteria]);

    const filteredAndSortedHadithHistory = useMemo(() => {
        return [...hadithHistory]
            .filter(entry => `hadith ${entry.hadithId} ${entry.action} ${entry.date}`.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                return sortCriteria === 'date_desc' ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime();
            });
    }, [hadithHistory, searchQuery, sortCriteria]);

    return (
        <div className="space-y-8 md:space-y-12 pb-32 px-2 md:px-0">
            <header className="pb-8 border-b border-border-main flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-black text-gradient mb-2">{t('historyTitle') || 'Archives'}</h1>
                    <p className="text-text-secondary font-medium text-sm md:text-base">{t('historySubtitle') || 'Contemplez le chemin parcouru et les efforts consacrés à votre quête spirituelle.'}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/20" />
                        <Input
                            type="text"
                            placeholder={t('searchHistoryPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-11 rounded-full bg-bg-secondary/50 border-border-main/50 focus:ring-accent-color/20 text-xs font-bold"
                        />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-bg-secondary/50 rounded-full border border-border-main/50">
                        <button
                            onClick={() => setSortCriteria('date_desc')}
                            className={clsx(
                                "h-9 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                sortCriteria === 'date_desc' ? "bg-accent-color text-white shadow-lg shadow-accent-color/20" : "text-text-main/40 hover:text-text-main"
                            )}
                        >
                            {t('recent') || 'Récents'}
                        </button>
                        <button
                            onClick={() => setSortCriteria('date_asc')}
                            className={clsx(
                                "h-9 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                sortCriteria === 'date_asc' ? "bg-accent-color text-white shadow-lg shadow-accent-color/20" : "text-text-main/40 hover:text-text-main"
                            )}
                        >
                            {t('older') || 'Anciens'}
                        </button>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="quran" className="w-full">
                <TabsList className="flex items-center gap-1 p-1 bg-bg-secondary/50 backdrop-blur-md rounded-2xl border border-border-main/50 mb-8 w-fit mx-auto lg:mx-0">
                    <TabsTrigger value="quran" className="px-8 h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('quran')}</TabsTrigger>
                    <TabsTrigger value="hadith" className="px-8 h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('hadith')}</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="quran" className="space-y-12 outline-none">
                        {/* Reading History */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-2 bg-accent-color/10 rounded-lg text-accent-color">📚</span>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-40">{t('readingHistoryTitle')}</h3>
                            </div>
                            {history.reading.length === 0 ? (
                                <div className="p-12 text-center glass-card border-none bg-bg-main/30 rounded-3xl">
                                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noReadingHistoryTitle')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredAndSortedReadingHistory.map((goal, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setSelectedGoal({ type: 'reading', data: goal })}
                                            className="premium-card p-6 flex flex-col justify-between cursor-pointer hover-glow group transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color">
                                                    <span className="text-xs font-black">R</span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity">#{history.reading.length - index}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black tracking-tight mb-1">{goal.khatmas} Khatmas</h4>
                                                <p className="text-text-secondary text-xs font-medium">{t('duration')}: {goal.duration} {t('days')}</p>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-border-main/50 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-accent-color uppercase tracking-widest">{t('completedOn', { date: goal.completedAt })}</span>
                                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-accent-color" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Revision History */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-2 bg-blue-500/10 rounded-lg text-blue-600">🧠</span>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-40">{t('revisionHistoryTitle')}</h3>
                            </div>
                            {history.revision.length === 0 ? (
                                <div className="p-12 text-center glass-card border-none bg-bg-main/30 rounded-3xl">
                                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noRevisionHistoryTitle')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredAndSortedRevisionHistory.map((goal, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setSelectedGoal({ type: 'revision', data: goal })}
                                            className="premium-card p-6 flex flex-col justify-between cursor-pointer hover-glow group transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                    <span className="text-xs font-black">V</span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity">#{history.revision.length - index}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black tracking-tight mb-1">{goal.count} Juzz/Hizbs</h4>
                                                <p className="text-text-secondary text-xs font-medium">{t('duration')}: {goal.duration} {t('days')}</p>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-border-main/50 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t('completedOn', { date: goal.completedAt })}</span>
                                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-600" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </TabsContent>

                    <TabsContent value="hadith" className="space-y-6 outline-none">
                        <div className="max-w-3xl mx-auto space-y-3">
                            {hadithHistory.length === 0 ? (
                                <div className="p-12 text-center glass-card border-none bg-bg-main/30 rounded-3xl">
                                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noHadithHistoryTitle')}</p>
                                </div>
                            ) : (
                                filteredAndSortedHadithHistory.map((entry, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="premium-card p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                                                <span className="text-xs font-black">{entry.hadithId}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-main line-clamp-1">{t('hadithNumber', { number: entry.hadithId })}: {t('statusChangedTo', { status: hadithStatusText[entry.action] })}</p>
                                                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{new Date(entry.date).toLocaleString(state.settings.lang)}</span>
                                            </div>
                                        </div>
                                        <StatusIndicator status={entry.action} />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </AnimatePresence>
            </Tabs>

            {/* Premium Details Modal */}
            <Modal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)}>
                {selectedGoal && (
                    <div className="space-y-8">
                        <header className="border-b border-border-main pb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-accent-color/10 text-accent-color text-[8px] font-black uppercase tracking-[0.2em] rounded-full">Archive</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">{selectedGoal.data.completedAt}</span>
                            </div>
                            <h3 className="text-2xl font-black text-gradient">
                                {selectedGoal.type === 'reading'
                                    ? t('readingGoalHistory', { index: '', khatmas: selectedGoal.data.khatmas, duration: selectedGoal.data.duration })
                                    : t('revisionGoalHistory', { index: '', count: selectedGoal.data.count, duration: selectedGoal.data.duration })
                                }
                            </h3>
                        </header>

                        <div className="max-h-[50vh] overflow-y-auto pr-2 no-scrollbar space-y-3">
                            {selectedGoal.type === 'reading' ? (
                                Object.entries(selectedGoal.data.dailyHistory).map(([dayKey, entry]) => (
                                    <div key={dayKey} className="p-4 rounded-2xl bg-bg-secondary border border-border-main/50 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('day')}</span>
                                            <p className="text-sm font-black text-accent-color">{dayKey.split('_')[1]}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{readingStatusText[entry.status]}</p>
                                            <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{entry.realPages} pages</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                selectedGoal.data.dailyPlan.map(day => (
                                    <div key={day.day} className="p-4 rounded-2xl bg-bg-secondary border border-border-main/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('day')}</span>
                                                <p className="text-sm font-black text-blue-600">{day.day}</p>
                                            </div>
                                            <div className={clsx("w-2 h-2 rounded-full", revisionStatusClasses[day.status])}></div>
                                        </div>
                                        <p className="text-sm font-bold opacity-80">{day.units.map(u => u.text).join(' + ')}</p>
                                        {day.status === 'to-review' && day.difficulties.length > 0 && (
                                            <div className="p-3 bg-warning/5 border border-warning/10 rounded-xl text-[10px] font-medium text-warning italic">
                                                {t('difficultiesLabel')}: {day.difficulties.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <Button variant="accent" onClick={() => setSelectedGoal(null)} className="w-full h-12">Fermer</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HistoryView;