import React, { useState, useMemo } from 'react';
import Card, { CardHeader } from '../ui/Card';
import { useStore } from '@/context/AppContext';
import { RevisionPlanDay, RevisionStatus } from '@/types';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import Modal from '../ui/Modal';
import { SimpleCheckbox } from '../ui/Checkbox';
import { SURAH_NAMES_HIZB_MAP } from '@/constants/quranData';
import EmptyState from '../ui/EmptyState';
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

const EncouragementA_Reprendre: React.FC = () => (
    <div className="text-sm text-left max-h-[50vh] overflow-y-auto">
        <p className="font-semibold text-lg mb-2">Les efforts résident dans la répétition.</p>
        <p className="mb-4">N'oubliez pas d'invoquer Allah pour qu'Il vous facilite.</p>
        <div className="p-3 bg-bg-main rounded-lg border border-border-main">
            <p className="font-amiri text-base rtl text-right">قال رسول الله ﷺ: « سَدِّدُوا وَقَارِبُوا، وَاعْلَمُوا أَنْ لَنْ يُدْخِلَ أَحَدَكُمْ عَمَلُهُ الْجَنَّةَ، وَأَنَّ أَحَبَّ الأَعْМАَالِ أَدْوَمُهَا إِلَى اللَّهِ، وَإِنْ قَلَّ ».‏</p>
            <p className="text-xs italic mt-2">Le Messager d’Allah (ﷺ) a dit: « Faites de bonnes œuvres avec sérieux, sincérité et modération ! Et sachez que vos actes ne vous feront pas entrer au Paradis, et que l’acte le plus aimé auprès d’Allah est le plus constant, cela même s’il est petit ».</p>
            <p className="text-xs opacity-100 mt-1">[Sahih al-Bukhari 6464]</p>
        </div>
    </div>
);

const EncouragementNon_Revise: React.FC = () => (
    <div className="text-sm text-left max-h-[50vh] overflow-y-auto">
        <p className="font-semibold text-lg mb-2">Les actes les plus aimés par Allah sont ceux faits avec assiduité.</p>
        <div className="p-3 bg-bg-main rounded-lg border border-border-main">
            <p className="font-amiri text-base rtl text-right">عن عائشة رضي الله عنها قالت : كان لرسول الله صلّى الله عليه وسلّم حصير وكان يحجره من اللّيل فيصلّي فيه فجعل النّاس يصلّون بصلاته ويبسطه بالنّهار فثابوا ذات ليلة فقال رسول الله صلّى الله عليه وسلّم : يا أيها الناس ! عليكم من الأعمال ما تطيقون فإنّ الله لا يملّ حتّى تملّوا وإن أحبّ الأعمال إلى الله ما دووم عليه وإن قلّ</p>
            <p className="text-xs italic mt-2">D'après 'Aicha (qu'Allah l'agrée) : [...] le Prophète (ﷺ) a dit : « Ô vous les gens ! Vous devez pratiquer comme acte ce dont vous êtes capables car certes Allah ne se lasse pas tant que vous ne vous lassez pas et certes les actes les plus aimés par Allah sont ceux qui sont fait avec assiduité même s'ils sont peu nombreux ».</p>
             <p className="text-xs opacity-100 mt-1">(Rapporté par Mouslim dans son Sahih n°782)</p>
        </div>
    </div>
);


const RevisionPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [modalOpenForDay, setModalOpenForDay] = useState<RevisionPlanDay | null>(null);
    const [difficultiesInModal, setDifficultiesInModal] = useState<string[]>([]);
    const [encouragementContent, setEncouragementContent] = useState<React.ReactNode | null>(null);
    
    const revisionPlan = state.plans.revision;
    const revisionGoal = activeProfile?.goals.revision;
    const isPlanFinished = revisionGoal && state.progress.currentRevisionIndex >= (revisionPlan?.length || 0);

    const handleStatusUpdate = (status: RevisionStatus, day: RevisionPlanDay, difficultiesList?: string[]) => {
        const index = revisionPlan?.findIndex(d => d.day === day.day) ?? -1;
        if (index === -1) return;
        
        if (status === 'to-review') {
            setEncouragementContent(<EncouragementA_Reprendre />);
        } else if (status === 'not_revised') {
            setEncouragementContent(<EncouragementNon_Revise />);
        }

        const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
        const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1]) : null;

        dispatch({
            type: 'UPDATE_REVISION_STATUS',
            payload: { revisionIndex: index, status, difficulties: difficultiesList, hizbNum }
        });

        const isCompleting = index === (revisionPlan?.length || 0) - 1;
        if(isCompleting && revisionGoal && revisionPlan) {
            const completedGoal = {
                count: revisionGoal.selection.length, duration: day.day,
                completedAt: new Date().toLocaleDateString(state.settings.lang),
                dailyPlan: [...revisionPlan.slice(0, index), {...day, status, difficulties: difficultiesList || day.difficulties}]
            };
            dispatch({ type: 'COMPLETE_GOAL', payload: { type: 'revision', goal: completedGoal } });
            dispatch({type: 'SET_TOAST', payload: t('congratulations')});
        } else if (state.progress.currentRevisionIndex === index) {
            const nextDay = revisionPlan && revisionPlan[index + 1];
            if (nextDay) {
                dispatch({type: 'SET_TOAST', payload: `${t('nextRevisionFor', {chunk: nextDay.units.map(u => u.text).join(' + ')})}`});
            }
        }
    };

    const openModal = (day: RevisionPlanDay) => {
        const surahSet = new Set<string>();
        day.units.forEach(unit => {
            const hizbNumMatch = unit.text.match(/Hizb (\d+)/);
            if(hizbNumMatch) {
                const hizbNum = parseInt(hizbNumMatch[1]);
                if(SURAH_NAMES_HIZB_MAP[hizbNum - 1]){
                    SURAH_NAMES_HIZB_MAP[hizbNum - 1].forEach(s => surahSet.add(s));
                }
            } else {
                 surahSet.add(unit.surahs.split(' (')[0]);
            }
        });
        setDifficultiesInModal(Array.from(surahSet));
        setModalOpenForDay(day);
    };

    const handleModalSubmit = () => {
        if (modalOpenForDay) {
            const selectedDifficulties = difficultiesInModal.filter(d => 
                (document.getElementById(`diff-${d.replace(/[']/g, "\\'")}`) as HTMLInputElement)?.checked
            );
            handleStatusUpdate('to-review', modalOpenForDay, selectedDifficulties);
            setModalOpenForDay(null);
        }
    };
    
    const persistentDifficultiesForToday = useMemo(() => {
        if(!activeProfile?.difficulties || !revisionPlan) return [];
        const currentDay = revisionPlan[state.progress.currentRevisionIndex];
        if(!currentDay) return [];
        const currentHizbNums = currentDay.units.map(u => {
            const match = u.text.match(/Hizb (\d+)/);
            return match ? parseInt(match[1]) : null;
        }).filter(n => n !== null);
        return activeProfile.difficulties.filter(d => d.hizbNum && currentHizbNums.includes(d.hizbNum)).map(d => d.surahName);
    }, [activeProfile?.difficulties, revisionPlan, state.progress.currentRevisionIndex]);

    const pastRevisions = revisionPlan?.filter((day, index) => index < state.progress.currentRevisionIndex) || [];
    
    const statusClasses: Record<RevisionStatus, string> = { 'revised': 'bg-green-500', 'to-review': 'bg-yellow-500', 'not_revised': 'bg-red-500', 'pending': "bg-gray-400" };
    const statusText: Record<RevisionStatus, string> = { 'revised': t('revised'), 'to-review': t('toReview'), 'not_revised': t('notAchieved'), 'pending': "En attente" };

    return (
        <div className="space-y-8">
            <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                <Card>
                    <CardHeader icon="🔁">L’importance de la révision</CardHeader>
                    <div className="rtl text-right font-amiri text-xl">
                        <p>عَنْ أَبِي مُوسَى الأَشْعَرِيِّ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ: «تَعَاهَدُوا القُرْآنَ، فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الإِبِلِ فِي عُقُلِهَا»</p>
                        <p className="ltr text-left text-base italic mt-2 opacity-80">D'après Abu Moussa Al Ach'ari (qu'Allah l'agrée), le Prophète (ﷺ) a dit: « Réviser régulièrement le Coran car, par Celui qui détient mon âme dans Sa main, il s'échappe plus vite que les chameaux de leurs enclos ».</p>
                        <p className="text-xs opacity-70 mt-1 ltr text-left">(Rapporté par Boukhari n°5033 et Mouslim n°791)</p>
                    </div>
                </Card>
            </motion.div>

            {persistentDifficultiesForToday.length > 0 && (
                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <Card className="!bg-warning/20 border-warning">
                        <CardHeader icon="🔔">{t('revisionReminder')}</CardHeader>
                        <p>La dernière fois, vous avez eu des difficultés avec : <strong>{persistentDifficultiesForToday.join(', ')}</strong>. Pensez à bien les réviser aujourd’hui.</p>
                    </Card>
                </motion.div>
            )}

            <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                <Card>
                    <CardHeader icon="🧠">{t('revisionPlan')}</CardHeader>
                    {!revisionPlan || revisionPlan.length === 0 ? (
                        <div className="p-4">
                            <EmptyState 
                                icon="🗺️"
                                title={t('noRevisionPlanTitle', "Aucun plan de révision actif")}
                                message={t('noRevisionPlanMessage', "Créez un plan personnalisé pour renforcer votre mémorisation et ne plus rien oublier.")}
                                actionText={t('newRevisionGoal', "Nouvel Objectif de Révision")}
                                onActionClick={() => dispatch({type:'START_WIZARD', payload: {type: 'revision', mode: 'new'}})}
                            />
                        </div>
                    ) : isPlanFinished ? (
                        <div className="text-center py-12">
                            <h3 className="text-3xl font-amiri mb-4">{t('congratulations')}</h3>
                            <p className="mb-6">Vous avez terminé votre objectif de révision. Qu'Allah accepte.</p>
                            <Button onClick={() => dispatch({type:'START_WIZARD', payload: {type: 'revision', mode: 'new'}})}>{t('newRevisionGoal')}</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {revisionPlan.map((day, index) => {
                                const isCurrent = index === state.progress.currentRevisionIndex;
                                const statusBorderColorClass = {
                                    'revised': 'border-green-500',
                                    'to-review': 'border-yellow-500',
                                    'not_revised': 'border-red-500',
                                    'pending': 'border-border-main'
                                };

                                return (
                                    <div key={index} className={clsx(
                                        'p-5 border-2 rounded-2xl flex flex-col justify-between transition-all duration-200 ease-in-out',
                                        'bg-bg-secondary text-text-main shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1',
                                        isCurrent ? 'border-primary' : statusBorderColorClass[day.status],
                                    )}>
                                        <div>
                                            <div className="flex justify-between items-center pb-2 mb-2 border-b border-border-main"><h4 className="font-bold text-primary text-xl">{t('day')} {day.day}</h4><div className='flex items-center gap-2'><span className={clsx("w-3 h-3 rounded-full", statusClasses[day.status])}></span><span className='text-xs font-bold'>{statusText[day.status]}</span></div></div>
                                            <p className="text-sm font-semibold">{day.units.map(u => u.text).join(' + ')}</p>
                                            <p className="text-xs opacity-60 mb-2">{day.units.map(u => u.surahs).join('; ')}</p>
                                            {day.difficulties.length > 0 && <p className="text-xs mt-2 p-1 bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 rounded">🔁 {day.difficulties.join(', ')}</p>}
                                            {day.timeSpent && day.timeSpent > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-text-main/80 pt-2 mt-2 border-t border-dashed">
                                                    <Clock size={14} />
                                                    <span>{`Temps de session : ${formatTime(day.timeSpent)}`}</span>
                                                </div>
                                            )}
                                        </div>
                                        {isCurrent && (
                                            <div className="flex flex-col gap-2 mt-4">
                                                <Button size="sm" variant="success" onClick={() => handleStatusUpdate('revised', day)}>{t('revised')}</Button>
                                                <Button size="sm" variant="warning" onClick={() => openModal(day)}>{t('toReview')}</Button>
                                                <Button size="sm" variant="danger" onClick={() => handleStatusUpdate('not_revised', day)}>{t('notAchieved')}</Button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </Card>
            </motion.div>
            
            <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
                <Card>
                    <CardHeader icon="📚">{t('history')}</CardHeader>
                    {pastRevisions.length > 0 ? (
                        <ul className="space-y-2">
                            {pastRevisions.slice().reverse().map((day) => (
                                <li key={day.day} className="p-3 bg-bg-main rounded-lg flex flex-col">
                                    <div className='flex justify-between items-start'>
                                        <div>
                                            <p className="font-semibold">{t('day')} {day.day}: {day.units.map(u => u.surahs).join(' + ')}</p>
                                            <span className="text-xs opacity-60">{new Date(day.date).toLocaleDateString(state.settings.lang)}</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <span className={clsx("w-3 h-3 rounded-full", statusClasses[day.status])}></span>
                                            <span className='text-xs font-bold'>{statusText[day.status]}</span>
                                        </div>
                                    </div>
                                    {day.status === 'to-review' && day.difficulties.length > 0 && (
                                         <div className="mt-2 text-xs p-2 bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 border-l-4 border-yellow-500 rounded">
                                            <strong>{t('toReview')}:</strong> {day.difficulties.join(', ')}
                                         </div>
                                    )}
                                    {day.timeSpent && day.timeSpent > 0 && (
                                        <div className="flex items-center gap-2 text-xs text-text-main/80 pt-2 mt-2 border-t border-dashed w-full">
                                            <Clock size={14} />
                                            <span>{`Temps de session : ${formatTime(day.timeSpent)}`}</span>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p>{t('noRevisionHistory')}</p>}
                </Card>
            </motion.div>

            <Modal isOpen={modalOpenForDay !== null} onClose={() => setModalOpenForDay(null)}>
                {modalOpenForDay && <>
                    <h3 className="text-xl font-bold mb-4">{t('revisionNotesTitle')}</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 p-2 border border-border-main rounded-lg">
                        {difficultiesInModal.map(surahName => (<SimpleCheckbox key={surahName} id={`diff-${surahName.replace(/[']/g, "\\'")}`} label={surahName} />))}
                    </div>
                    <div className="flex gap-4 mt-6"><Button variant="ghost" onClick={() => setModalOpenForDay(null)} className="flex-1">Annuler</Button><Button onClick={handleModalSubmit} className="flex-1">{t('saved')}</Button></div>
                </>}
            </Modal>
            
            <Modal isOpen={!!encouragementContent} onClose={() => setEncouragementContent(null)}>
                {encouragementContent}
                <Button onClick={() => setEncouragementContent(null)} className="mt-6 w-full">Compris</Button>
            </Modal>
        </div>
    );
};

export default RevisionPlanView;