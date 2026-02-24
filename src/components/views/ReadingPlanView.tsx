import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { ReadingStatus, PlanDay } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import Modal from '@/components/ui/Modal';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { TOTAL_PAGES } from '@/constants/quranData';
import InputModal from '@/components/ui/InputModal';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: "easeOut"
        }
    })
};

const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        return `${minutes} min ${seconds} s`;
    }
    return `${seconds} s`;
};

const HadithAlKahf: React.FC = () => (
    <div className="text-sm text-left max-h-[60vh] overflow-y-auto">
        <p className="font-semibold text-lg mb-2">Rappel sur les mérites de la lecture de Sourate Al-Kahf</p>
        <div className="p-3 bg-bg-main rounded-lg border border-border-main">
            <p className="font-amiri text-base rtl text-right">عن أبي سعيد الخدري رضي الله عنه قال النبي صلى الله عليه و سلم : من قرأ سورةَ الكهفِ في يومِ الجمعةِ أضاء له من النورِ ما بين الجمُعتَينِ</p>
            <p className="text-xs italic mt-2">D'après Abou Said Al Khoudri (qu'Allah l'agrée), le Prophète (ﷺ) a dit: « Celui qui lit la sourate Al Kahf le jour du vendredi, il est éclairé par une lumière entre les deux vendredis (_) ».</p>
            <p className="text-xs opacity-70 mt-1">(Rapporté par Al Bayhaqi et authentifié par Cheikh Albani dans Sahih Al Jami n°6470)</p>
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

    const daysElapsed = state.progress.currentReadingDay - 1;
    const averagePace = daysElapsed > 0 ? Math.round(totalPagesRead / daysElapsed) : 0;

    let estimatedFinishDateStr = "N/A";
    if (averagePace > 0 && totalPagesRead < totalPagesToRead) {
        const remainingPages = totalPagesToRead - totalPagesRead;
        const remainingDays = Math.ceil(remainingPages / averagePace);
        const finishDate = new Date();
        finishDate.setDate(new Date().getDate() + remainingDays);
        estimatedFinishDateStr = finishDate.toLocaleDateString(state.settings.lang, { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (totalPagesRead >= totalPagesToRead) {
        estimatedFinishDateStr = "Terminé !";
    }

    return (
        <Card>
            <CardHeader icon="📊">Progression Globale</CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-bg-main rounded-lg">
                    <span className="text-3xl font-bold block">{percentage}%</span>
                    <span className="text-sm opacity-70">{t('overallProgress')}</span>
                </div>
                <div className="p-3 bg-bg-main rounded-lg">
                    <span className="text-3xl font-bold block">{totalPagesRead} / {totalPagesToRead}</span>
                    <span className="text-sm opacity-70">{t('pagesRead')}</span>
                </div>
                <div className="p-3 bg-bg-main rounded-lg">
                    <span className="text-3xl font-bold block">~{averagePace}</span>
                    <span className="text-sm opacity-70">{t('pagesPerDay')}</span>
                </div>
                <div className="p-3 bg-bg-main rounded-lg">
                    <span className="text-xl font-bold block">{estimatedFinishDateStr}</span>
                    <span className="text-sm opacity-70">{t('estimatedFinishDate')}</span>
                </div>
            </div>
        </Card>
    );
}

const ReadingPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [kahfModalOpen, setKahfModalOpen] = useState(false);
    const [editingDay, setEditingDay] = useState<PlanDay | null>(null);
    const [inputModalState, setInputModalState] = useState<{
        isOpen: boolean;
        title: string;
        label: string;
        onSubmit: (value: string) => void;
    }>({
        isOpen: false,
        title: '',
        label: '',
        onSubmit: () => {},
    });

    const readingGoal = activeProfile?.goals.reading;
    const readingPlan = state.plans.reading;
    const originalReadingPlan = state.plans.originalReading;

    const isPlanFinished = readingGoal && state.progress.currentReadingDay > readingGoal.duration;

    if (!readingGoal || !readingPlan) {
        return (
            <Card className="text-center py-8">
                <p className="mb-4 text-lg">{t('noGoalsYet')}</p>
                <Button onClick={() => dispatch({type:'START_WIZARD', payload: {type: 'reading', mode: 'new'}})}>{t('newReadingGoal')}</Button>
            </Card>
        );
    }

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahfUpdate: boolean = false) => {
        const executeUpdate = (adjustment: number) => {
            const dayKey = `day_${day.day}`;
            const existingHistory = state.progress.readingHistory[dayKey] || { status: 'not_read', realPages: 0, adjustment: 0 };
            
            let newHistoryForDay;

            if (isKahfUpdate) {
                newHistoryForDay = {
                    ...existingHistory,
                    kahfStatus: status,
                };
            } else {
                const realPages = status === 'not_read' ? 0 : day.recalculatedPages + adjustment;
                newHistoryForDay = {
                    ...existingHistory,
                    status: status,
                    realPages: realPages,
                    adjustment: adjustment,
                };
            }

            const updatedHistory = { ...state.progress.readingHistory, [dayKey]: newHistoryForDay };
            const recalculatedPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, updatedHistory, state.progress.currentReadingDay) : null;
            
            dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory: updatedHistory, recalculatedPlan: recalculatedPlan! } });
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
            setEditingDay(null);
        };

        if (!isKahfUpdate && (status === 'partial' || status === 'catchup')) {
            setInputModalState({
                isOpen: true,
                title: status === 'partial' ? t('partialReadingTitle') : t('catchUpReadingTitle'),
                label: status === 'partial' ? t('partialLabel') : t('catchUpLabel'),
                onSubmit: (value: string) => {
                    const numValue = parseInt(value) || 0;
                    if (numValue < 0) return;
                    const adjustment = status === 'partial' ? -numValue : numValue;
                    executeUpdate(adjustment);
                }
            });
        } else {
            executeUpdate(0);
        }
    };

    const handleKahfStatus = (day: PlanDay, status: 'done' | 'partial' | 'not_read') => {
        if(status === 'partial' || status === 'not_read') {
            setKahfModalOpen(true);
        }
        handleStatusChange(day, status, true);
    };

    if (isPlanFinished) {
        return (
            <Card className="text-center py-12">
                <h3 className="text-3xl font-amiri mb-4">{t('congratulations')}</h3>
                <p className="mb-6">Vous avez terminé votre objectif de lecture. Qu'Allah accepte.</p>
                <Button onClick={() => dispatch({type:'START_WIZARD', payload: {type: 'reading', mode: 'new'}})}>{t('newReadingGoal')}</Button>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                <Card>
                    <CardHeader icon="🌟">La récompense de la lecture du Coran</CardHeader>
                    <div className="rtl text-right font-amiri text-xl">
                        <p>عَنْ عَبْدَ اللَّهِ بْنَ مَسْعُودٍ، يَقُولُ: قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: " مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالحَسَنَةُ بِعَشْرِ أَمْثَالِهَا، لَا أَقُولُ الم حَرْفٌ، وَلَكِنْ أَلِفٌ حَرْفٌ وَلَامٌ حَرْفٌ وَمِيمٌ حَرْفٌ "</p>
                        <p className="ltr text-left text-base italic mt-2 opacity-80">D'après Abdallah ibn Mas'ud (qu'Allah l'agrée), le Prophète (ﷺ) a dit: « Celui qui lit une seule lettre du Coran obtient une bonne action et la bonne action est décuplée. Je ne dis pas que 'Alif Lam Mim' est une lettre mais Alif est une lettre, Lam est une lettre et Mim est une lettre ».</p>
                        <p className="text-xs opacity-70 mt-1 ltr text-left">(Rapporté par Tirmidhi n°2910, authentifié par Cheikh Albani)</p>
                    </div>
                </Card>
            </motion.div>
            
            <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                <Card>
                    <CardHeader>{t('readingPlan')}</CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {readingPlan.map((day) => {
                            const dayKey = `day_${day.day}`;
                            const history = state.progress.readingHistory[dayKey];
                            const isCurrent = day.day === state.progress.currentReadingDay;
                            const isPast = day.day < state.progress.currentReadingDay;

                            const statusBorderColorClass = {
                                'done': 'border-green-500',
                                'catchup': 'border-green-500',
                                'partial': 'border-yellow-500',
                                'not_read': 'border-red-500',
                            };
                            
                            const hizbStart = getHizbDetailsFromPage(day.startPage);
                            const hizbEnd = getHizbDetailsFromPage(day.endPage);
                            const hizbText = hizbStart.hizbNum === hizbEnd.hizbNum ? `Hizb ${hizbStart.hizbNum}` : `Hizb ${hizbStart.hizbNum} → Hizb ${hizbEnd.hizbNum}`;
                            const surahText = hizbStart && hizbEnd 
                                ? (hizbStart.surahName === hizbEnd.surahName 
                                    ? `Sourate ${hizbStart.surahName}` 
                                    : `De Sourate ${hizbStart.surahName} à ${hizbEnd.surahName}`)
                                : '';
                            const date = new Date(state.progress.startDate!);
                            date.setDate(date.getDate() + day.day - 1);
                            const dateString = date.toLocaleDateString(state.settings.lang, { weekday: 'long', day: 'numeric', month: 'long' });

                            const isEditing = editingDay?.day === day.day;
                            
                            let kahfDisplayText = '';
                            if (history?.kahfStatus && activeProfile?.goals.reading?.kahfOption) {
                                if (history.kahfStatus === 'done') {
                                    kahfDisplayText = ' + Sourate Al-Kahf : Lu';
                                } else if (history.kahfStatus === 'partial') {
                                    kahfDisplayText = ' + Sourate Al-Kahf : Partiel';
                                } else if (history.kahfStatus === 'not_read') {
                                    kahfDisplayText = ' + Sourate Al-Kahf : Non lu';
                                }
                            }

                            return (
                                <div 
                                    key={day.day} 
                                    onClick={() => !isEditing && setEditingDay(day)} 
                                    className={clsx(
                                        'p-5 border-2 rounded-2xl flex flex-col cursor-pointer transition-all duration-200 ease-in-out',
                                        'bg-bg-secondary text-text-main shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1',
                                        isCurrent 
                                            ? 'border-primary' 
                                            : (isPast && history) 
                                                ? statusBorderColorClass[history.status as ReadingStatus] 
                                                : 'border-border-main'
                                    )}
                                >
                                    <div className="pb-3 mb-3 border-b border-border-main">
                                        <h4 className="font-bold text-primary text-xl">Jour {day.day}</h4>
                                        <p className="text-xs opacity-70">{dateString}</p>
                                    </div>
                                    <div className="flex-grow space-y-1 mb-4">
                                        <p className="text-sm font-semibold">
                                            {hizbText} | Lire de la page {day.startPage} à {day.endPage} ({day.recalculatedPages} pages)
                                        </p>
                                        <p className="text-xs opacity-80">{surahText}</p>
                                        <p className="text-sm font-bold pt-2">
                                            {history ? `${history.realPages || 0} pages lues${kahfDisplayText}` : "⏳ En attente..."}
                                        </p>
                                        {history?.timeSpent && history.timeSpent > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-text-main/80 pt-1">
                                                <Clock size={14} />
                                                <span>{`Temps de session : ${formatTime(history.timeSpent)}`}</span>
                                            </div>
                                        )}
                                    </div>
                                    {(isCurrent || isEditing) && (
                                        <div className="mt-auto space-y-3">
                                            <h5 className="text-sm font-bold text-left">{t('status')}:</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button size="sm" variant="success" onClick={(e) => {e.stopPropagation(); handleStatusChange(day, 'done')}}>{t('goalAchieved')}</Button>
                                                <Button size="sm" variant="warning" onClick={(e) => {e.stopPropagation(); handleStatusChange(day, 'partial')}}>{t('partial')}</Button>
                                                <Button size="sm" variant="primary" className="!bg-green-700" onClick={(e) => {e.stopPropagation(); handleStatusChange(day, 'catchup')}}>{t('catchUp')}</Button>
                                                <Button size="sm" variant="danger" onClick={(e) => {e.stopPropagation(); handleStatusChange(day, 'not_read')}}>{t('notRead')}</Button>
                                            </div>
                                            
                                            {/* CORRECTION: Ajout de la vérification de l'option dans les objectifs */}
                                            {day.isKahfDay && activeProfile?.goals.reading?.kahfOption && (
                                                <div className="mt-4 pt-4 border-t border-dashed border-border-main/50">
                                                    <h5 className="text-sm font-bold text-center mb-3">Rappel : Lecture de Sourate Al-Kahf</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                        <Button size="sm" variant="success" onClick={(e) => {e.stopPropagation(); handleKahfStatus(day, 'done')}}>✅ Lu</Button>
                                                        <Button size="sm" variant="warning" onClick={(e) => {e.stopPropagation(); handleKahfStatus(day, 'partial')}}>📉 Partiel</Button>
                                                        <Button size="sm" variant="danger" onClick={(e) => {e.stopPropagation(); handleKahfStatus(day, 'not_read')}}>❌ Non Lu</Button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {isEditing && <Button size="sm" variant="ghost" className="mt-2" onClick={(e) => {e.stopPropagation(); setEditingDay(null)}}>Fermer</Button>}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </Card>
            </motion.div>

            <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                <GlobalProgressCard />
            </motion.div>

            <Modal isOpen={kahfModalOpen} onClose={() => setKahfModalOpen(false)}>
                <HadithAlKahf />
                <Button onClick={() => setKahfModalOpen(false)} className="mt-6 w-full">Compris</Button>
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