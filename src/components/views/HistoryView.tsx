import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/AppContext';
import { CompletedReadingGoal, CompletedRevisionGoal, ReadingStatus, HadithMemorizationStatus } from '@/types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import Input from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, BookOpen, Brain, BookMarked, Calendar, ChevronRight, LayoutGrid, Clock, Star, Activity, AlertCircle } from 'lucide-react';

type SelectedGoal = { type: 'reading', data: CompletedReadingGoal } | { type: 'revision', data: CompletedRevisionGoal };

const StatusIndicator: React.FC<{ status: HadithMemorizationStatus }> = ({ status }) => {
    const colors = {
        'acquis': 'bg-success text-white ring-success/20',
        'en_memorisation': 'bg-accent-color text-white ring-accent-color/20',
        'a_reprendre': 'bg-warning text-white ring-warning/20',
        'lu': 'bg-blue-500/10 text-blue-500 ring-blue-500/10',
        'non_lu': 'bg-text-secondary/10 text-text-secondary ring-text-secondary/10'
    };

    return (
        <div className={clsx("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ring-4", colors[status])}>
            {status.replace('_', ' ')}
        </div>
    );
};

const QualityBadge: React.FC<{ quality: string }> = ({ quality }) => {
    if (!quality) return null;
    const colors: Record<string, string> = {
        'tres_bien': 'bg-success/20 text-success border border-success/30',
        'bien': 'bg-accent-color/20 text-accent-color border border-accent-color/30',
        'moyen': 'bg-warning/20 text-warning border border-warning/30',
        'a_revoir': 'bg-danger/20 text-danger border border-danger/30',
    };
    return (
        <div className={clsx("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", colors[quality] || 'bg-white/5')}>
            {quality.replace('_', ' ')}
        </div>
    );
};

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
        <div className="space-y-12 pb-32 px-4 md:px-0">
            <header className="pb-8 border-b border-border-main flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <History size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-gradient">{t('historyTitle') || 'Archives Sacrées'}</h1>
                            <p className="text-text-secondary font-medium text-sm md:text-base">{t('historySubtitle') || 'Contemplez le chemin parcouru et les efforts consacrés à votre quête spirituelle.'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/20" />
                        <Input
                            type="text"
                            placeholder={t('searchHistoryPlaceholder') || 'Rechercher dans les archives...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-11 rounded-2xl bg-bg-secondary/50 border-border-main/50 focus:ring-accent-color/20 text-xs font-bold w-full"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 bg-bg-secondary/50 rounded-2xl border border-border-main/50">
                        <button
                            onClick={() => setSortCriteria('date_desc')}
                            className={clsx(
                                "h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                sortCriteria === 'date_desc' ? "bg-white text-slate-900 shadow-xl" : "text-text-main/40 hover:text-text-main"
                            )}
                        >
                            {t('recent') || 'Récents'}
                        </button>
                        <button
                            onClick={() => setSortCriteria('date_asc')}
                            className={clsx(
                                "h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                sortCriteria === 'date_asc' ? "bg-white text-slate-900 shadow-xl" : "text-text-main/40 hover:text-text-main"
                            )}
                        >
                            {t('older') || 'Anciens'}
                        </button>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="quran" className="w-full">
                <TabsList className="inline-flex items-center gap-2 p-1.5 bg-bg-secondary/50 backdrop-blur-xl rounded-2xl border border-border-main/50 mb-12">
                    <TabsTrigger value="quran" className="px-10 h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg shadow-accent-color/20 text-xs font-black uppercase tracking-widest transition-all">
                        <BookOpen size={14} className="mr-2 inline" /> {t('quran')}
                    </TabsTrigger>
                    <TabsTrigger value="hadith" className="px-10 h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg shadow-accent-color/20 text-xs font-black uppercase tracking-widest transition-all">
                        <BookMarked size={14} className="mr-2 inline" /> {t('hadith')}
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="quran" className="space-y-16 outline-none">
                        {/* Reading History */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-accent-color rounded-full" />
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">{t('readingHistoryTitle')}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Historique des Lectures</p>
                                    </div>
                                </div>
                                <span className="px-4 py-2 bg-bg-secondary rounded-xl border border-border-main/50 text-[10px] font-bold opacity-50">
                                    {filteredAndSortedReadingHistory.length} khatmas
                                </span>
                            </div>

                            {history.reading.length === 0 ? (
                                <div className="p-20 text-center premium-card border-none bg-bg-secondary/40">
                                    <div className="w-20 h-20 bg-bg-main rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <BookOpen size={40} className="text-text-main/10" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noReadingHistoryTitle')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAndSortedReadingHistory.map((goal, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => setSelectedGoal({ type: 'reading', data: goal })}
                                            className="premium-card p-8 flex flex-col justify-between cursor-pointer hover-glow group transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                                                <Star size={120} />
                                            </div>

                                            <div className="flex justify-between items-start mb-10 relative z-10">
                                                <div className="w-12 h-12 rounded-2xl bg-accent-color/10 flex items-center justify-center text-accent-color shadow-inner">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">Archive ID</span>
                                                    <span className="text-xs font-black font-mono">#{String(history.reading.length - index).padStart(3, '0')}</span>
                                                </div>
                                            </div>

                                            <div className="relative z-10">
                                                <h4 className="text-2xl font-black tracking-tight mb-2">{goal.khatmas} Khatmas</h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-bg-main rounded-full border border-border-main/50">
                                                        <Clock size={10} className="opacity-40" />
                                                        <span className="text-[10px] font-bold">{goal.duration} {t('days')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 pt-6 border-t border-border-main/30 flex justify-between items-center relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12} className="text-accent-color" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-color">{goal.completedAt}</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-accent-color/5 flex items-center justify-center -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                    <ChevronRight size={14} className="text-accent-color" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Revision History */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">{t('revisionHistoryTitle')}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Historique des Révisions</p>
                                    </div>
                                </div>
                                <span className="px-4 py-2 bg-bg-secondary rounded-xl border border-border-main/50 text-[10px] font-bold opacity-50">
                                    {filteredAndSortedRevisionHistory.length} plans
                                </span>
                            </div>

                            {history.revision.length === 0 ? (
                                <div className="p-20 text-center premium-card border-none bg-bg-secondary/40">
                                    <div className="w-20 h-20 bg-bg-main rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Brain size={40} className="text-text-main/10" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noRevisionHistoryTitle')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAndSortedRevisionHistory.map((goal, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => setSelectedGoal({ type: 'revision', data: goal })}
                                            className="premium-card p-8 flex flex-col justify-between cursor-pointer hover-glow group transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                                                <Activity size={120} />
                                            </div>

                                            <div className="flex justify-between items-start mb-10 relative z-10">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                                                    <Brain size={20} />
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">Archive ID</span>
                                                    <span className="text-xs font-black font-mono">#{String(history.revision.length - index).padStart(3, '0')}</span>
                                                </div>
                                            </div>

                                            <div className="relative z-10">
                                                <h4 className="text-2xl font-black tracking-tight mb-2">{goal.count} Juzz/Hizbs</h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-bg-main rounded-full border border-border-main/50">
                                                        <Clock size={10} className="opacity-40" />
                                                        <span className="text-[10px] font-bold">{goal.duration} {t('days')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 pt-6 border-t border-border-main/30 flex justify-between items-center relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12} className="text-blue-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{goal.completedAt}</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-blue-500/5 flex items-center justify-center -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                    <ChevronRight size={14} className="text-blue-500" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </TabsContent>

                    <TabsContent value="hadith" className="space-y-6 outline-none">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {hadithHistory.length === 0 ? (
                                <div className="p-32 text-center premium-card border-none bg-bg-secondary/40">
                                    <div className="w-24 h-24 bg-bg-main rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                        <BookMarked size={48} className="text-text-main/10" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noHadithHistoryTitle') || 'Aucun historique de Hadith'}</p>
                                </div>
                            ) : (
                                filteredAndSortedHadithHistory.map((entry, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-bg-secondary transition-colors group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner group-hover:scale-110 transition-transform">
                                                <span className="text-lg font-black">{entry.hadithId}</span>
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-text-main mb-1">
                                                    {t('hadithNumber', { number: entry.hadithId })}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Calendar size={10} />
                                                        {new Date(entry.date).toLocaleString(state.settings.lang)}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-border-main" />
                                                    <span className="text-[10px] font-black text-accent-color uppercase tracking-widest">{t('statusChangedTo', { status: '' })}</span>
                                                </div>
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
                    <div className="space-y-10 p-2">
                        <header className="border-b border-border-main pb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={clsx(
                                    "p-3 rounded-2xl text-white shadow-lg",
                                    selectedGoal.type === 'reading' ? "bg-accent-color shadow-accent-color/20" : "bg-blue-500 shadow-blue-500/20"
                                )}>
                                    {selectedGoal.type === 'reading' ? <BookOpen size={24} /> : <Brain size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-bg-secondary text-text-main/40 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border border-border-main/50">Mission Accomplie</span>
                                        <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-30">{selectedGoal.data.completedAt}</span>
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tight">
                                        {selectedGoal.type === 'reading'
                                            ? `${selectedGoal.data.khatmas} Khatmas`
                                            : `${selectedGoal.data.count} Juzz/Hizbs`
                                        }
                                    </h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-bg-secondary/50 rounded-2xl border border-border-main/50">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30 block mb-1">Durée</span>
                                    <span className="text-sm font-black">{selectedGoal.data.duration} jours</span>
                                </div>
                                <div className="p-4 bg-bg-secondary/50 rounded-2xl border border-border-main/50">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30 block mb-1">Type</span>
                                    <span className="text-sm font-black uppercase">{selectedGoal.type}</span>
                                </div>
                                <div className="p-4 bg-bg-secondary/50 rounded-2xl border border-border-main/50 text-right">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30 block mb-1">Statut</span>
                                    <span className="text-[10px] font-black uppercase text-success">Validé</span>
                                </div>
                            </div>
                        </header>

                        <div className="max-h-[45vh] overflow-y-auto pr-4 no-scrollbar space-y-4">
                            {selectedGoal.type === 'reading' ? (
                                Object.entries(selectedGoal.data.dailyHistory).map(([dayKey, entry]) => (
                                    <div key={dayKey} className="p-5 rounded-[1.5rem] bg-bg-secondary/40 border border-border-main/30 flex justify-between items-center group hover:bg-bg-secondary transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-bg-main border border-border-main/50 flex flex-col items-center justify-center">
                                                <span className="text-[8px] font-black uppercase opacity-30">Jour</span>
                                                <span className="text-base font-black text-accent-color leading-none">{dayKey.split('_')[1]}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold tracking-tight">{readingStatusText[entry.status]}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <LayoutGrid size={10} className="text-accent-color opacity-30" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{entry.realPages} pages lues</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "w-2.5 h-2.5 rounded-full",
                                            entry.status === 'done' ? "bg-success shadow-[0_0_8px_rgba(var(--success-rgb),0.5)]" : "bg-warning"
                                        )} />
                                    </div>
                                ))
                            ) : (
                                selectedGoal.data.dailyPlan.map((day, idx) => (
                                    <div key={idx} className="p-5 rounded-[1.5rem] bg-bg-secondary/40 border border-border-main/30 space-y-4 group hover:bg-bg-secondary transition-colors">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-bg-main border border-border-main/50 flex flex-col items-center justify-center">
                                                    <span className="text-[8px] font-black uppercase opacity-30">Jour</span>
                                                    <span className="text-base font-black text-blue-500 leading-none">{day.day}</span>
                                                </div>
                                                <h4 className="text-sm font-bold tracking-tight opacity-90">{day.units.map(u => u.text).join(' + ')}</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <QualityBadge quality={day.quality || ''} />
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                    day.status === 'revised' ? "bg-success/10 text-success" :
                                                        day.status === 'to-review' ? "bg-warning/10 text-warning" : "bg-bg-main text-text-main/20"
                                                )}>
                                                    {day.status}
                                                </div>
                                            </div>
                                        </div>
                                        {day.status === 'to-review' && day.difficulties.length > 0 && (
                                            <div className="p-4 bg-danger/5 border border-danger/10 rounded-2xl flex gap-3 items-start">
                                                <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-danger">{t('difficultiesLabel')}</span>
                                                    <p className="text-xs font-bold leading-relaxed">{day.difficulties.join(', ')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <Button variant="secondary" onClick={() => setSelectedGoal(null)} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest border-border-main/50 hover:bg-bg-secondary">
                            Fermer les archives
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HistoryView;
