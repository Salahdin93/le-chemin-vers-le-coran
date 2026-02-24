import React, { useEffect, useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { getHizbDetailsFromPage, recalculateFuturePlan } from '@/services/planLogic';
import { checkReadingProgress } from '@/services/progressLogic';
import EndOfGoalModal from '@/components/ui/EndOfGoalModal';
import Modal from '@/components/ui/Modal';
import Timer from '@/components/ui/Timer';
import { ReadingStatus, PlanDay, RevisionPlanDay, RevisionStatus, Hadith, HadithMemorizationStatus } from '@/types';
import anime from 'animejs';
import { notificationService } from '@/components/ui/NotificationContainer';
import InputModal from '@/components/ui/InputModal';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { HADITH_COLLECTION } from '@/constants/hadithData';
import { Eye, EyeOff } from 'lucide-react';
import ReadjustmentModal from '@/components/ui/ReadjustmentModal';

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

const DashboardView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [isEndOfGoalModalOpen, setIsEndOfGoalModalOpen] = useState(false);
    const [kahfModalOpen, setKahfModalOpen] = useState(false);
    const [showHadithTranslation, setShowHadithTranslation] = useState(false);
    const [hadithDuJour, setHadithDuJour] = useState<Hadith | undefined>(undefined);
    const [isNextHadithModalOpen, setIsNextHadithModalOpen] = useState(false);
    const [isReadjustmentModalOpen, setIsReadjustmentModalOpen] = useState(false);
    const [hadithModalContent, setHadithModalContent] = useState<Hadith | null>(null);
    
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

    const hadithProgress = activeProfile?.hadithProgress || {};

    useEffect(() => {
        const inProgressHadith = HADITH_COLLECTION.find(h => hadithProgress[h.id] === 'en_memorisation');
        if (inProgressHadith) {
            setHadithDuJour(inProgressHadith);
        } else {
            const notStartedHadith = HADITH_COLLECTION.find(h => (hadithProgress[h.id] || 'non_lu') === 'non_lu');
            setHadithDuJour(notStartedHadith);
        }
    }, [hadithProgress]);

    const findNextHadith = (currentId: number): Hadith | undefined => {
        const currentIndex = HADITH_COLLECTION.findIndex(h => h.id === currentId);
        return HADITH_COLLECTION.slice(currentIndex + 1).find(h => (hadithProgress[h.id] || 'non_lu') !== 'acquis');
    };
    
    const nextHadithToMemorize = hadithDuJour ? findNextHadith(hadithDuJour.id) : undefined;

    useEffect(() => {
        const progressStatus = checkReadingProgress(state, activeProfile);
        if (progressStatus === 'behind') {
            notificationService.show({
                title: t('progressStatusBehindTitle'),
                message: t('progressStatusBehindMessage'),
                type: 'warning',
                duration: 10000
            });
        }
    }, [state.progress.currentReadingDay, activeProfile, t, state]);

    useEffect(() => {
        const { progress } = state;
        if (!activeProfile?.goals.reading || !progress.startDate) return;
        
        const totalPagesRead = Object.values(progress.readingHistory).reduce((sum, day) => sum + (day.realPages || 0), 0);
        const totalPagesToRead = activeProfile.goals.reading.khatmas * activeProfile.goals.reading.pagesPerDay * activeProfile.goals.reading.duration;
        const isDurationOver = progress.currentReadingDay > activeProfile.goals.reading.duration;
        const isGoalUnfinished = totalPagesRead < totalPagesToRead;

        if (isDurationOver && isGoalUnfinished) setIsEndOfGoalModalOpen(true);
    }, [state.progress.currentReadingDay, activeProfile?.goals.reading, state.progress.readingHistory, state.progress.startDate]);

    useEffect(() => {
        if(activeProfile?.difficulties && state.plans.revision){
            const currentRevision = state.plans.revision[state.progress.currentRevisionIndex];
            if(currentRevision){
                const currentHizbNums = currentRevision.units.map(u => parseInt(u.text.replace(/\D/g, ''))).filter(Boolean);
                const difficultReminders = activeProfile.difficulties.filter(d => d.hizbNum && currentHizbNums.includes(d.hizbNum));
                if(difficultReminders.length > 0){
                    notificationService.show({
                        title: t('revisionReminder'),
                        message: t('difficultSurahReminder', { surah: difficultReminders.map(d=>d.surahName).join(', '), day: '' }),
                        type: 'warning'
                    });
                }
            }
        }
    }, [state.progress.currentRevisionIndex, t, activeProfile, state.plans.revision]);

    if (!activeProfile) {
        return <DashboardSkeleton />;
    }

    const readingGoal = activeProfile.goals.reading;
    const revisionGoal = activeProfile.goals.revision;
    const readingPlan = state.plans.reading;
    const revisionPlan = state.plans.revision;
    const originalReadingPlan = state.plans.originalReading;

    const isReadingGoalActive = readingGoal && readingPlan && state.progress.currentReadingDay <= readingGoal.duration;
    const isRevisionGoalActive = revisionGoal && revisionPlan && state.progress.currentRevisionIndex < revisionPlan.length;

    const overallProgressPercent = readingGoal ? Math.floor(((state.progress.currentReadingDay - 1) / readingGoal.duration) * 100) : 0;
    const revisionProgressPercent = revisionPlan ? Math.floor((state.progress.currentRevisionIndex / revisionPlan.length) * 100) : 0;
    const totalPagesRead = Object.values(state.progress.readingHistory).reduce((acc, h) => acc + (h.realPages || 0), 0);

    const masteredHadiths = Object.values(hadithProgress).filter(s => s === 'acquis').length;
    const hadithProgressPercent = Math.floor((masteredHadiths / HADITH_COLLECTION.length) * 100);

    useEffect(() => {
        anime({ targets: '#progress-fg-reading-circle', strokeDashoffset: [anime.setDashoffset, 314 - (overallProgressPercent / 100) * 314], easing: 'easeInOutSine', duration: 1500 });
        anime({ targets: '#progress-fg-revision-circle', strokeDashoffset: [anime.setDashoffset, 314 - (revisionProgressPercent / 100) * 314], easing: 'easeInOutSine', duration: 1500 });
        anime({ targets: '#progress-fg-hadith-circle', strokeDashoffset: [anime.setDashoffset, 314 - (hadithProgressPercent / 100) * 314], easing: 'easeInOutSine', duration: 1500 });
    }, [overallProgressPercent, revisionProgressPercent, hadithProgressPercent]);

    const handleStatusChange = (day: PlanDay, status: ReadingStatus, isKahfUpdate: boolean = false, timeSpent?: number) => {
        const executeUpdate = (adjustment: number) => {
            const dayKey = `day_${day.day}`;
            const existingHistory = state.progress.readingHistory[dayKey] || { status: 'not_read', realPages: 0, adjustment: 0, kahfStatus: day.isKahfDay ? 'not_read' : undefined };
            let newHistoryForDay;
            if (isKahfUpdate) {
                newHistoryForDay = { ...existingHistory, kahfStatus: status };
            } else {
                const realPages = status === 'not_read' ? 0 : day.recalculatedPages + adjustment;
                newHistoryForDay = { 
                    ...existingHistory, 
                    status: status, 
                    realPages: realPages, 
                    adjustment: adjustment,
                    timeSpent: timeSpent !== undefined ? (existingHistory.timeSpent || 0) + timeSpent : existingHistory.timeSpent
                };
            }
            const newHistory = { ...state.progress.readingHistory, [dayKey]: newHistoryForDay };
            const recalculatedPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, newHistory, state.progress.currentReadingDay) : null;
            dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory, recalculatedPlan: recalculatedPlan! } });
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
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
    
    const handleReadingStop = (seconds: number) => {
        if (currentReadingDayData) {
            handleStatusChange(currentReadingDayData, 'done', false, seconds);
        }
    };

    const handleKahfStatus = (day: PlanDay, status: 'done' | 'partial' | 'not_read') => {
        if(status === 'partial' || status === 'not_read') setKahfModalOpen(true);
        handleStatusChange(day, status, true);
    };

    const handleAdvanceDay = () => {
        const currentDay = state.progress.currentReadingDay;
        const dayKey = `day_${currentDay}`;
        let newHistory = { ...state.progress.readingHistory };
        if (!newHistory[dayKey] && readingPlan) {
            const planDay = readingPlan.find(d => d.day === currentDay);
            if (planDay) newHistory[dayKey] = { status: 'done', adjustment: 0, realPages: planDay.recalculatedPages, kahf: planDay.isKahfDay, kahfStatus: planDay.isKahfDay ? 'done' : undefined };
        }
        const yesterdayStatus = newHistory[dayKey]?.status;
        const newConsecutiveDays = (yesterdayStatus === 'done' || yesterdayStatus === 'catchup') ? state.progress.consecutiveDays + 1 : 0;
        if (currentDay === readingGoal?.duration) {
            const completedGoal = { khatmas: readingGoal!.khatmas, duration: readingGoal!.duration, completedAt: new Date().toLocaleDateString(state.settings.lang), dailyHistory: newHistory };
            dispatch({ type: 'COMPLETE_GOAL', payload: { type: 'reading', goal: completedGoal } });
        }
        const recalculatedPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, newHistory, currentDay + 1) : null;
        dispatch({type: 'ADVANCE_DAY', payload: {newHistory, newConsecutiveDays, recalculatedPlan: recalculatedPlan! }});
        dispatch({type: 'SET_TOAST', payload: t('saved')});
    };

    const handleRevisionStatus = (status: RevisionStatus, day: RevisionPlanDay, timeSpent?: number) => {
        const index = revisionPlan?.findIndex(d => d.day === day.day) ?? -1;
        if (index === -1) return;
        
        const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
        const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1]) : null;
        dispatch({ type: 'UPDATE_REVISION_STATUS', payload: { revisionIndex: index, status, difficulties: [], hizbNum, timeSpent } });
        dispatch({type: 'SET_TOAST', payload: t('saved')});
    };
    
    const handleReadjustmentConfirm = (selectedSurahs: string[]) => {
        if (!currentRevisionDayData) return;
        const index = revisionPlan?.findIndex(d => d.day === currentRevisionDayData.day) ?? -1;
        if (index === -1) return;
        const hizbNumMatch = currentRevisionDayData.units[0]?.text.match(/Hizb (\d+)/);
        const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1]) : null;

        dispatch({
            type: 'UPDATE_REVISION_STATUS',
            payload: {
                revisionIndex: index,
                status: 'to-review',
                difficulties: selectedSurahs,
                hizbNum
            }
        });
        setIsReadjustmentModalOpen(false);
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleRevisionStop = (seconds: number) => {
        if (currentRevisionDayData) {
            handleRevisionStatus('revised', currentRevisionDayData, seconds);
        }
    };
    
    const handleHadithStatusChange = (hadithId: number, status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId, status }});
        dispatch({ type: 'SET_TOAST', payload: t('saved')});
    };

    const handleStartEvaluation = () => {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-view' });
    };

    const currentReadingDayData = isReadingGoalActive ? readingPlan?.find(d => d.day === state.progress.currentReadingDay) : null;
    const currentRevisionDayData = isRevisionGoalActive ? revisionPlan?.[state.progress.currentRevisionIndex] : null;
    const nextRevisionDayData = isRevisionGoalActive ? revisionPlan?.[state.progress.currentRevisionIndex + 1] : null;

    const readingDate = new Date(state.progress.startDate!);
    if (currentReadingDayData) {
        readingDate.setDate(readingDate.getDate() + currentReadingDayData.day - 1);
    }
    const readingDateString = currentReadingDayData ? readingDate.toLocaleDateString(state.settings.lang, { weekday: 'long', day: 'numeric' }) : '';
    
    const readingInfo = useMemo(() => {
        if (!currentReadingDayData) return null;

        const hizbStart = getHizbDetailsFromPage(currentReadingDayData.startPage);
        const hizbEnd = getHizbDetailsFromPage(currentReadingDayData.endPage);
        
        if (!hizbStart || !hizbEnd) return null;

        const description = hizbStart.surahName === hizbEnd.surahName
            ? `Sourate: ${hizbStart.surahName}`
            : t('surahsFromTo', { start: hizbStart.surahName, end: hizbEnd.surahName });

        const details = t('readingDetails', {
            hizbStart: hizbStart.hizbNum,
            hizbEnd: hizbEnd.hizbNum,
            startPage: currentReadingDayData.startPage,
            endPage: currentReadingDayData.endPage,
            totalPages: currentReadingDayData.recalculatedPages
        });

        return { description, details };
    }, [currentReadingDayData, t]);

    return (
        <div className="space-y-6">
            {/* --- Progress Cards Section (No changes here) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {isReadingGoalActive && (
                    <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!p-4 text-center">
                            <CardHeader>
                                <CardTitle>{t('readingProgress')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-32 h-32 mx-auto">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" strokeWidth="12" className="stroke-border-main" fill="transparent"/>
                                        <circle id="progress-fg-reading-circle" cx="60" cy="60" r="50" strokeWidth="12" className="stroke-primary" fill="transparent" strokeDasharray="314" strokeDashoffset="314" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">{overallProgressPercent}%</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    <div className="p-2 bg-bg-main rounded-lg"><span className="font-bold block text-lg">🔥 {state.progress.consecutiveDays}</span><span className="text-xs opacity-70">{t('consecutiveDays')}</span></div>
                                    <div className="p-2 bg-bg-main rounded-lg"><span className="font-bold block text-lg">📖 {totalPagesRead}</span><span className="text-xs opacity-70">{t('pagesRead')}</span></div>
                                    <div className="p-2 bg-bg-main rounded-lg"><span className="font-bold block text-lg">⏳ {readingGoal.duration - state.progress.currentReadingDay + 1}</span><span className="text-xs opacity-70">{t('daysLeft')}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="!p-4 text-center">
                        <CardHeader>
                            <CardTitle>{t('hadithProgress')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" strokeWidth="12" className="stroke-border-main" fill="transparent"/>
                                    <circle id="progress-fg-hadith-circle" cx="60" cy="60" r="50" strokeWidth="12" className="stroke-yellow-500" fill="transparent" strokeDasharray="314" strokeDashoffset="314" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold">{hadithProgressPercent}%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="p-2 bg-bg-main rounded-lg"><span className="font-bold block text-lg">{masteredHadiths}</span><span className="text-xs opacity-70">{t('hadithsMastered')}</span></div>
                                <div className="p-2 bg-bg-main rounded-lg"><span className="font-bold block text-lg">{HADITH_COLLECTION.length - masteredHadiths}</span><span className="text-xs opacity-70">{t('hadithsLeft')}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {isRevisionGoalActive && revisionPlan && (
                    <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!p-4 text-center">
                            <CardHeader>
                                <CardTitle>{t('revisionProgress')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-32 h-32 mx-auto">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" strokeWidth="12" className="stroke-border-main" fill="transparent"/>
                                        <circle id="progress-fg-revision-circle" cx="60" cy="60" r="50" strokeWidth="12" className="stroke-success" fill="transparent" strokeDasharray="314" strokeDashoffset="314" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">{revisionProgressPercent}%</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="p-2 bg-bg-main rounded-lg"><span className="font-bold block text-lg">{state.progress.currentRevisionIndex}</span><span className="text-xs opacity-70">{t('revisionDaysDone')}</span></div>
                                    <div className="p-2 bg-bg-main rounded-lg"><span className="font-bold block text-lg">{revisionPlan.length - state.progress.currentRevisionIndex}</span><span className="text-xs opacity-70">{t('daysLeft')}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
            
            {/* --- Action Cards Section (Changes applied here) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {isReadingGoalActive && currentReadingDayData && readingInfo ? (
                    <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!p-6">
                            <CardHeader>
                                <CardTitle>{t('myReading')} - {t('day')} {state.progress.currentReadingDay} <span className="text-sm font-normal text-text-main/70 ml-1">{readingDateString}</span></CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 mb-4 bg-bg-main rounded-lg border-l-4 border-primary text-center">
                                    <p className="font-semibold text-base">{readingInfo.description}</p>
                                    <p className="text-sm opacity-80 mt-1">{readingInfo.details}</p>
                                </div>
                                <div className="space-y-3">
                                    <h5 className="text-sm font-bold">{t('sessionTracker')}:</h5>
                                    <Timer onStop={handleReadingStop} />
                                    <h5 className="text-sm font-bold pt-2 border-t border-dashed">{t('status')}:</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button size="sm" variant="success" onClick={() => handleStatusChange(currentReadingDayData, 'done', false)}>{t('goalAchieved')}</Button>
                                        <Button size="sm" variant="warning" onClick={() => handleStatusChange(currentReadingDayData, 'partial', false)}>{t('partial')}</Button>
                                        <Button size="sm" variant="primary" className="!bg-green-700" onClick={() => handleStatusChange(currentReadingDayData, 'catchup', false)}>{t('catchUp')}</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleStatusChange(currentReadingDayData, 'not_read', false)}>{t('notRead')}</Button>
                                    </div>
                                    {currentReadingDayData?.isKahfDay && (<div className="mt-3 pt-3 border-t border-dashed"><h5 className="text-sm font-bold text-center mb-2">{t('readKahf')}</h5><div className="grid grid-cols-1 gap-2"><Button size="sm" variant="success" onClick={() => handleKahfStatus(currentReadingDayData, 'done')}>{t('goalAchieved')}</Button><Button size="sm" variant="warning" onClick={() => handleKahfStatus(currentReadingDayData, 'partial')}>{t('partial')}</Button><Button size="sm" variant="danger" onClick={() => handleKahfStatus(currentReadingDayData, 'not_read')}>{t('notRead')}</Button></div></div>)}
                                    <div className="pt-3 border-t border-dashed"><Button className="w-full" onClick={handleAdvanceDay}>{t('nextDay')}</Button></div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className='text-center !p-6'><CardContent><p className='mb-4 text-lg'>{readingGoal ? t('congratulations') : t('noGoalsYet')}</p><Button onClick={() => dispatch({type: 'START_WIZARD', payload: {type: 'reading', mode: 'new'}})}>{t('newReadingGoal')}</Button></CardContent></Card>
                    </motion.div>
                )}
            
                <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="!p-6 flex flex-col">
                        <CardHeader>
                            <CardTitle>{t('hadithOfTheDay')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center space-y-4">
                            {hadithDuJour ? (
                                <>
                                    <div 
                                        className="w-full mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setHadithModalContent(hadithDuJour)}
                                    >
                                        <p className="font-semibold text-sm mb-2">{t('hadithNumber', { number: hadithDuJour.id })}</p>
                                        <p className="font-amiri text-xl leading-relaxed rtl text-right truncate">{hadithDuJour.arabic}</p>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {showHadithTranslation && state.settings.lang !== 'ar' && (
                                            <motion.div
                                                key="translation" initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }} className="w-full"
                                            >
                                                <div className="p-3 bg-bg-main rounded-lg border border-border-main text-sm italic">
                                                    <p>"{hadithDuJour.translations[state.settings.lang] || hadithDuJour.translations.en}"</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    <div className="w-full space-y-3">
                                        <h5 className="text-sm font-bold pt-2 border-t border-dashed">{t('status')}:</h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button variant="primary" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'lu')}>{t('statusLu')}</Button>
                                            <Button variant="warning" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'a_reprendre')}>{t('statusARependre')}</Button>
                                            <Button variant="success" onClick={() => handleHadithStatusChange(hadithDuJour.id, 'acquis')}>{t('statusAcquis')}</Button>
                                        </div>
                                        {state.settings.lang !== 'ar' && (
                                            <Button variant="ghost" onClick={() => setShowHadithTranslation(!showHadithTranslation)} className="gap-2 w-full">
                                                {showHadithTranslation ? <EyeOff size={16} /> : <Eye size={16} />}
                                                {showHadithTranslation ? t('hideTranslation') : t('showTranslation')}
                                            </Button>
                                        )}
                                    </div>

                                    {nextHadithToMemorize && (
                                        <div className="text-center pt-3 w-full border-t border-dashed">
                                            <p className="text-sm font-semibold mb-1">{t('nextHadithToMemorize')}:</p>
                                            <Button variant="link" className="text-sm" onClick={() => setIsNextHadithModalOpen(true)}>{t('view')}</Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-lg font-semibold">{t('allHadithsMastered')}</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {isRevisionGoalActive && currentRevisionDayData ? (
                    <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className="!p-6">
                            <CardHeader>
                                <CardTitle>{t('myRevision')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 mb-4 bg-bg-main rounded-lg border-l-4 border-primary text-center"><p className="font-semibold text-lg">{currentRevisionDayData.units.map(u => u.text).join(' + ')}</p><p className="text-sm opacity-80">{currentRevisionDayData.units.map(u => u.surahs).join('; ')}</p></div>
                                <div className="space-y-3">
                                    <h5 className="text-sm font-bold">{t('sessionTracker')}:</h5>
                                    <Timer onStop={handleRevisionStop} />
                                    <h5 className="text-sm font-bold pt-2 border-t border-dashed">{t('status')}:</h5>
                                    <div className="flex justify-center gap-2">
                                        <Button variant="success" onClick={() => handleRevisionStatus('revised', currentRevisionDayData)}>{t('revised')}</Button>
                                        <Button variant="warning" onClick={() => setIsReadjustmentModalOpen(true)}>{t('toReview')}</Button>
                                        <Button variant="danger" onClick={() => handleRevisionStatus('not_revised', currentRevisionDayData)}>{t('notAchieved')}</Button>
                                    </div>
                                </div>
                                {nextRevisionDayData && (<div className="text-center text-sm p-3 mt-4 bg-bg-main rounded-lg border-t border-dashed border-border-main"><p className="font-bold">{t('nextRevisionFor', { chunk: '' })}</p><p>{nextRevisionDayData.units.map(u => u.text).join(' + ')} - <span className="opacity-80">{nextRevisionDayData.units.map(u => u.surahs).join('; ')}</span></p><p className="text-xs opacity-70">{new Date(nextRevisionDayData.date).toLocaleDateString(state.settings.lang, {weekday: 'long', day: 'numeric'})}</p></div>)}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
                        <Card className='text-center !p-6'><CardContent><p className='mb-4 text-lg'>{revisionGoal ? t('congratulations') : t('noGoalsYet')}</p><Button onClick={() => dispatch({type: 'START_WIZARD', payload: {type: 'revision', mode: 'new'}})}>{t('newRevisionGoal')}</Button></CardContent></Card>
                    </motion.div>
                )}
            </div>

            {/* --- CTA & Modals Section (Changes applied here) --- */}
            <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants}>
                <Card className="w-full bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle>{t('testKnowledgePromptTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <p className="md:w-2/3">{t('testKnowledgePromptBody')}</p>
                        <Button onClick={handleStartEvaluation} size="lg" className="w-full md:w-auto">
                            🚀 {t('startEvaluation')}
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        
            <EndOfGoalModal isOpen={isEndOfGoalModalOpen} onClose={() => setIsEndOfGoalModalOpen(false)} />
            <Modal isOpen={kahfModalOpen} onClose={() => setKahfModalOpen(false)}>
                <HadithAlKahf />
                <Button onClick={() => setKahfModalOpen(false)} className="mt-6 w-full">{t('understood')}</Button>
            </Modal>

            {currentRevisionDayData && (
                <ReadjustmentModal
                    isOpen={isReadjustmentModalOpen}
                    onClose={() => setIsReadjustmentModalOpen(false)}
                    onConfirm={handleReadjustmentConfirm}
                    title={t('toReview')}
                    items={currentRevisionDayData.units.flatMap(u => u.surahs.split(/; |, /)).filter(Boolean)}
                />
            )}

            {hadithModalContent && (
                <Modal isOpen={!!hadithModalContent} onClose={() => setHadithModalContent(null)}>
                    <CardHeader>
                        <CardTitle>{t('hadithModalTitle', { number: hadithModalContent.id })}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <p className="font-amiri text-2xl leading-loose rtl text-right">{hadithModalContent.arabic}</p>
                        {state.settings.lang !== 'ar' && (
                             <div className="p-4 bg-bg-main rounded-lg border border-border-main text-base italic">
                                <p>"{hadithModalContent.translations[state.settings.lang] || hadithModalContent.translations.en}"</p>
                            </div>
                        )}
                        <Button onClick={() => setHadithModalContent(null)} className="w-full mt-4">{t('close')}</Button>
                    </CardContent>
                </Modal>
            )}

            {nextHadithToMemorize && (
                <Modal isOpen={isNextHadithModalOpen} onClose={() => setIsNextHadithModalOpen(false)}>
                     <CardHeader>
                        <CardTitle>{t('nextHadithToMemorize')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="font-amiri text-xl leading-relaxed rtl text-right">{nextHadithToMemorize.arabic}</p>
                        {state.settings.lang !== 'ar' && (
                             <div className="p-3 bg-bg-main rounded-lg border border-border-main text-sm italic">
                                <p>"{nextHadithToMemorize.translations[state.settings.lang] || nextHadithToMemorize.translations.en}"</p>
                            </div>
                        )}
                        <Button onClick={() => setIsNextHadithModalOpen(false)}>{t('close')}</Button>
                    </CardContent>
                </Modal>
            )}

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
export default DashboardView;