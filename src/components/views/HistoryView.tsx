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
        'done': "Terminé", 'partial': "Partiel", 'catchup': "Rattrapage", 'not_read': "Non lu"
    };

    const revisionStatusClasses: Record<RevisionStatus, string> = {
        'revised': 'bg-green-500', 'to-review': 'bg-yellow-500', 'not_revised': 'bg-red-500', 'pending': "bg-gray-400"
    };
    
    const hadithStatusText: Record<HadithMemorizationStatus, string> = {
        'acquis': t('statusAcquis', 'Acquis'),
        'en_memorisation': t('statusEnMemorisation', 'En mémorisation'),
        'a_reprendre': t('statusARependre', 'À reprendre'),
        'lu': t('statusLu', 'Lu'),
        'non_lu': t('statusNonLu', 'Non lu')
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
        <div className='space-y-6'>
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-bg-main rounded-lg border border-border-main">
                <Input
                    type="text"
                    placeholder={t('searchHistoryPlaceholder', 'Rechercher un objectif...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow"
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant={sortCriteria === 'date_desc' ? 'primary' : 'secondary'} onClick={() => setSortCriteria('date_desc')}>{t('sortMostRecent', 'Plus récents')}</Button>
                    <Button size="sm" variant={sortCriteria === 'date_asc' ? 'primary' : 'secondary'} onClick={() => setSortCriteria('date_asc')}>{t('sortOldest', 'Plus anciens')}</Button>
                </div>
            </div>

            <Tabs defaultValue="quran" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quran">{t('quran', 'Coran')}</TabsTrigger>
                    <TabsTrigger value="hadith">{t('hadith', 'Hadith')}</TabsTrigger>
                </TabsList>

                <TabsContent value="quran" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader icon="📂">{t('readingHistoryTitle')}</CardHeader>
                        {history.reading.length === 0 ? <EmptyState icon="📚" title={t('noReadingHistoryTitle')} message={t('noReadingHistoryMessage')} />
                        : filteredAndSortedReadingHistory.length === 0 ? <div className="p-4 text-center text-text-secondary">{t('noResultsFound')}</div>
                        : <ul className="space-y-2 p-4">{filteredAndSortedReadingHistory.map((goal, index) => (
                            <li key={index} onClick={() => setSelectedGoal({type: 'reading', data: goal})} className="p-3 bg-bg-main rounded-lg border-l-4 border-primary cursor-pointer hover:bg-border-main transition-colors">
                                {t('readingGoalHistory', {index: index + 1, khatmas: goal.khatmas, duration: goal.duration})}
                                <span className="block text-xs opacity-70">{t('completedOn', {date: goal.completedAt})}</span>
                            </li>))}
                        </ul>}
                    </Card>
                    <Card>
                        <CardHeader icon="📂">{t('revisionHistoryTitle')}</CardHeader>
                        {history.revision.length === 0 ? <EmptyState icon="🧠" title={t('noRevisionHistoryTitle')} message={t('noRevisionHistoryMessage')} />
                        : filteredAndSortedRevisionHistory.length === 0 ? <div className="p-4 text-center text-text-secondary">{t('noResultsFound')}</div>
                        : <ul className="space-y-2 p-4">{filteredAndSortedRevisionHistory.map((goal, index) => (
                            <li key={index} onClick={() => setSelectedGoal({type: 'revision', data: goal})} className="p-3 bg-bg-main rounded-lg border-l-4 border-primary cursor-pointer hover:bg-border-main transition-colors">
                                {t('revisionGoalHistory', {index: index + 1, count: goal.count, duration: goal.duration})}
                                <span className="block text-xs opacity-70">{t('completedOn', {date: goal.completedAt})}</span>
                            </li>))}
                        </ul>}
                    </Card>
                </TabsContent>

                <TabsContent value="hadith" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader icon="✍️">{t('hadithHistory', "Historique - Hadiths")}</CardHeader>
                        {hadithHistory.length === 0 ? <EmptyState icon="📜" title={t('noHadithHistoryTitle')} message={t('noHadithHistoryMessage')} />
                        : filteredAndSortedHadithHistory.length === 0 ? <div className="p-4 text-center text-text-secondary">{t('noResultsFound')}</div>
                        : <ul className="space-y-2 p-4">{filteredAndSortedHadithHistory.map((entry, index) => (
                            <li key={index} className="p-3 bg-bg-main rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{t('hadithNumber', {number: entry.hadithId})}: <span className="font-normal">{t('statusChangedTo', 'Statut changé en')} "{hadithStatusText[entry.action]}"</span></p>
                                    <span className="text-xs opacity-70">{new Date(entry.date).toLocaleString(state.settings.lang)}</span>
                                </div>
                            </li>))}
                        </ul>}
                    </Card>
                </TabsContent>
            </Tabs>

            <Modal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)}>
                {selectedGoal?.type === 'reading' && (
                    <>
                        <h3 className="text-xl font-bold mb-4">{t('readingGoalHistory', {index: '', khatmas: selectedGoal.data.khatmas, duration: selectedGoal.data.duration})}</h3>
                        <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-2">
                            {Object.entries(selectedGoal.data.dailyHistory).map(([dayKey, entry]) => (
                                <div key={dayKey} className="text-sm p-2 bg-bg-main rounded flex justify-between items-center">
                                    <span>{t('day')} {dayKey.split('_')[1]}</span>
                                    <span>{readingStatusText[entry.status]} ({entry.realPages} pages)</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                 {selectedGoal?.type === 'revision' && (
                    <>
                        <h3 className="text-xl font-bold mb-4">{t('revisionGoalHistory', {index: '', count: selectedGoal.data.count, duration: selectedGoal.data.duration})}</h3>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                             {selectedGoal.data.dailyPlan.map(day => (
                                 <div key={day.day} className="text-sm p-2 bg-bg-main rounded">
                                     <div className="flex justify-between items-center">
                                         <strong>{t('day')} {day.day}: {day.units.map(u => u.text).join(' + ')}</strong>
                                         <span className={clsx("w-3 h-3 rounded-full", revisionStatusClasses[day.status])}></span>
                                     </div>
                                     {day.status === 'to-review' && day.difficulties.length > 0 && <p className="text-xs mt-1 p-1 bg-yellow-100 rounded">Difficultés: {day.difficulties.join(', ')}</p>}
                                 </div>
                             ))}
                        </div>
                    </>
                )}
                <Button onClick={() => setSelectedGoal(null)} className="mt-6 w-full">{t('close')}</Button>
            </Modal>
        </div>
    );
};

export default HistoryView;