import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { RevisionPlanDay, RevisionStatus } from '@/types';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertCircle, CheckCircle2, Circle, Clock, LayoutGrid, History, ChevronRight, Folder, Trophy, Star, RotateCcw } from 'lucide-react';
import ReadjustmentModal from '@/components/ui/ReadjustmentModal';
import Modal from '@/components/ui/Modal';
import { HIZB_DATA } from '@/constants/quranData';

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.7,
            ease: [0.23, 1, 0.32, 1] as any
        }
    })
};

const RevisionPlanView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [filter, setFilter] = useState<RevisionStatus | 'all'>('all');
    const [reviewModalDay, setReviewModalDay] = useState<RevisionPlanDay | null>(null);
    const [summaryModalDay, setSummaryModalDay] = useState<RevisionPlanDay | null>(null);
    const [ratingSelector, setRatingSelector] = useState<{
        isOpen: boolean;
        index: number;
        surahRatings?: Record<string, 'tres_bien' | 'bien' | 'moyen' | 'a_revoir'>;
        pendingRating?: 'tres_bien' | 'bien' | 'moyen' | 'a_revoir';
    } | null>(null);

    const revisionPlan = state.plans.revision;

    const currentSurahNames = useMemo(() => {
        if (!activeProfile || !revisionPlan) return [];
        const currentDay = revisionPlan[state.progress.currentRevisionIndex];
        if (!currentDay) return [];
        const currentHizbNums = currentDay.units
            .map(u => {
                const m = u.text.match(/Hizb (\d+)/);
                return m ? parseInt(m[1], 10) : null;
            })
            .filter(Boolean) as number[];

        return (activeProfile.difficulties || [])
            .filter(d => d.hizbNum && currentHizbNums.includes(d.hizbNum as number))
            .map(d => d.surahName);
    }, [activeProfile?.difficulties, revisionPlan, state.progress.currentRevisionIndex]);

    const pastRevisionsCount = state.progress.currentRevisionIndex;
    const totalDays = revisionPlan?.length || 0;
    const progressPercent = totalDays > 0 ? Math.round((pastRevisionsCount / totalDays) * 100) : 0;

    const handleStatusUpdate = (day: RevisionPlanDay, status: RevisionStatus, difficulties?: string[]) => {
        if (!revisionPlan) return;
        const index = revisionPlan.indexOf(day);
        if (status === 'revised') {
            setRatingSelector({ isOpen: true, index });
        } else {
            const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
            const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1], 10) : undefined;
            dispatch({
                type: 'UPDATE_REVISION_STATUS',
                payload: { revisionIndex: index, status, hizbNum, difficulties }
            });
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
        }
    };

    const handleRatingSelect = (rating: 'tres_bien' | 'bien' | 'moyen' | 'a_revoir') => {
        if (!ratingSelector || !revisionPlan) return;
        const index = ratingSelector.index;
        const day = revisionPlan[index];
        const surahRatings = ratingSelector.surahRatings || {};

        const allSurahs = day.units.flatMap(u => {
            const hizbMatch = u.text.match(/Hizb (\d+)/);
            if (hizbMatch) {
                const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                const hizb = HIZB_DATA[hizbIndex];
                if (hizb && Array.isArray(hizb.surahs)) return hizb.surahs;
            }
            return (u.surahs || '').split(',').map(s => s.trim()).filter(Boolean);
        });

        if (allSurahs.length === 0) {
            const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
            const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1], 10) : undefined;
            dispatch({
                type: 'UPDATE_REVISION_STATUS',
                payload: { revisionIndex: index, status: 'revised', hizbNum, quality: rating }
            });
            setRatingSelector(null);
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
            return;
        }

        const ratedSurahs = Object.keys(surahRatings);
        const remainingSurahs = allSurahs.filter(s => !ratedSurahs.includes(s));
        const currentSurah = remainingSurahs[0];

        if (!currentSurah) return;

        const newSurahRatings = { ...surahRatings, [currentSurah]: rating };
        const newRatedCount = Object.keys(newSurahRatings).length;

        if (newRatedCount === allSurahs.length) {
            const ratings = Object.values(newSurahRatings);
            let overallQuality: any = 'tres_bien';
            if (ratings.includes('a_revoir')) overallQuality = 'a_revoir';
            else if (ratings.includes('moyen')) overallQuality = 'moyen';
            else if (ratings.includes('bien')) overallQuality = 'bien';

            const hizbNumMatch = day.units[0]?.text.match(/Hizb (\d+)/);
            const hizbNum = hizbNumMatch ? parseInt(hizbNumMatch[1], 10) : undefined;

            dispatch({
                type: 'UPDATE_REVISION_STATUS',
                payload: {
                    revisionIndex: index,
                    status: 'revised',
                    hizbNum,
                    quality: overallQuality,
                    surahRatings: newSurahRatings
                }
            });
            setRatingSelector(null);
            dispatch({ type: 'SET_TOAST', payload: t('saved') });
        } else {
            setRatingSelector({ ...ratingSelector, surahRatings: newSurahRatings });
        }
    };

    if (!revisionPlan) {
        return (
            <Card className="text-center py-20 flex flex-col items-center gap-8 premium-card border-none bg-bg-secondary/40">
                <div className="w-24 h-24 bg-accent-color/10 rounded-[2.5rem] flex items-center justify-center text-accent-color shadow-2xl shadow-accent-color/10 animate-bounce-subtle">
                    <Brain size={48} />
                </div>
                <div className="max-w-md">
                    <h3 className="text-3xl font-black mb-3 text-gradient">{t('noGoalsYet')}</h3>
                    <p className="text-text-secondary font-medium leading-relaxed">
                        {t('revisionEmptySubtitle') ||
                            "Vous n'avez pas encore défini d'objectif de révision pour fortifier votre mémoire."}
                    </p>
                </div>
                <Button
                    variant="accent"
                    size="lg"
                    className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-accent-color/20"
                    onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'revision', mode: 'new' } })}
                >
                    {t('newMemorizationGoal')}
                </Button>
            </Card>
        );
    }

    const filteredPlan = revisionPlan.filter(day => filter === 'all' || day.status === filter);

    return (
        <div className="space-y-12 pb-32 px-4 md:px-0">
            {/* Header Stats */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 border-b border-border-main pb-12">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <Brain size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gradient">
                                {t('revisionTitle')}
                            </h1>
                            <p className="text-text-secondary font-medium mt-1 text-sm md:text-base">
                                {t('revisionSubtitle') ||
                                    'Entretenez vos acquis et fortifiez votre mémoire grâce à une révision structurée.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:flex gap-4 w-full xl:w-auto">
                    <div className="p-8 premium-card border-none bg-slate-900 border-white/5 text-white flex-1 xl:min-w-[200px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <LayoutGrid size={80} />
                        </div>
                        <span className="text-4xl font-black block text-accent-color mb-2">{progressPercent}%</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                            {t('totalProgress')}
                        </span>
                    </div>
                    <div className="p-8 premium-card border-none bg-bg-secondary/40 flex-1 xl:min-w-[200px] shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <CheckCircle2 size={80} />
                        </div>
                        <span className="text-4xl font-black block text-text-main mb-2">
                            {pastRevisionsCount} <span className="text-lg opacity-20">/ {totalDays}</span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                            {t('daysCompleted')}
                        </span>
                    </div>
                </div>
            </header>

            {/* Hadith Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.23, 1, 0.32, 1] as any }}>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border border-white/5 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                    <div className="p-8 md:p-12 relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Brain size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/60">Hadith</span>
                                <h3 className="text-lg font-black tracking-tight text-white leading-tight">🔁 L’importance de la révision</h3>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Brain size={80} />
                            </div>
                            <p className="font-amiri text-2xl md:text-3xl rtl text-right leading-[2.2] md:leading-[2.8] text-white/90 relative z-10">
                                عَنْ أَبِي مُوسَى الأَشْعَرِيِّ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ: «تَعَاهَدُوا القُرْآنَ، فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الإِبِلِ فِي عُقُلِهَا»
                            </p>
                        </div>

                        <div className="border-l-4 border-blue-500/60 pl-6 space-y-2">
                            <p className="text-sm font-semibold text-blue-400/80 mb-1">
                                D'après Abu Moussa Al Ach'ari (qu'Allah l'agrée), le Prophète (ﷺ) a dit :
                            </p>
                            <p className="text-base md:text-lg italic font-medium text-white/80 leading-relaxed">
                                « Réviser régulièrement le Coran car, par Celui qui détient mon âme dans Sa main, il s'échappe plus vite que les chameaux de leurs enclos ».
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <span className="px-5 py-2 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                                Boukhari n°5033 · Mouslim n°791
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Filters */}
            <div className="flex items-center gap-6 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-2 bg-bg-secondary/50 p-1.5 rounded-2xl border border-border-main/50">
                    {(['all', 'revised', 'to-review', 'not_revised', 'pending'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={clsx(
                                'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                                filter === f
                                    ? 'bg-accent-color text-white shadow-lg shadow-accent-color/20'
                                    : 'text-text-main/40 hover:text-text-main hover:bg-bg-main'
                            )}
                        >
                            {t(f === 'all' ? 'showAll' : f)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredPlan.map((day, i) => {
                        const dayIndex = revisionPlan.indexOf(day);
                        const isCurrent = dayIndex === state.progress.currentRevisionIndex;
                        const statusColor =
                            day.status === 'revised'
                                ? 'text-success'
                                : day.status === 'to-review'
                                    ? 'text-warning'
                                    : day.status === 'not_revised'
                                        ? 'text-danger'
                                        : 'text-text-main/20';

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
                                <div
                                    className={clsx(
                                        'premium-card h-full p-8 flex flex-col gap-8 border-2 transition-all relative overflow-hidden group',
                                        isCurrent
                                            ? 'border-accent-color ring-8 ring-accent-color/5 shadow-premium'
                                            : 'border-border-main/50 bg-bg-secondary/40',
                                        day.status === 'revised' &&
                                        !isCurrent &&
                                        'opacity-60 grayscale-[0.5] border-success/10'
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color mb-2 block">
                                                {t('day')} {dayIndex + 1}
                                                {day.date && (
                                                    <span className="ml-2 font-black text-text-main group-hover:text-accent-color transition-colors">
                                                        — {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </span>
                                                )}
                                            </span>
                                            <h4 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                                {day.units.map(u => u.text).join(' + ')}
                                                {day.quality && (
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                        day.quality === 'tres_bien' ? 'bg-success/20 text-success border border-success/30' :
                                                            day.quality === 'bien' ? 'bg-accent-color/20 text-accent-color border border-accent-color/30' :
                                                                day.quality === 'moyen' ? 'bg-warning/20 text-warning border border-warning/30' :
                                                                    'bg-danger/20 text-danger border border-danger/30'
                                                    )}>
                                                        {day.quality.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </h4>
                                        </div>
                                        <div
                                            className={clsx(
                                                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500',
                                                day.status === 'revised'
                                                    ? 'bg-success text-white shadow-lg shadow-success/20'
                                                    : day.status === 'to-review'
                                                        ? 'bg-warning text-white shadow-lg shadow-warning/20'
                                                        : 'bg-bg-main border border-border-main/50',
                                                statusColor
                                            )}
                                        >
                                            {day.status === 'revised' ? (
                                                <CheckCircle2 size={24} />
                                            ) : day.status === 'to-review' ? (
                                                <Clock size={24} />
                                            ) : isCurrent ? (
                                                <Circle size={24} className="animate-pulse" />
                                            ) : (
                                                <Clock size={20} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        {day.units.map((unit, j) => (
                                            <div
                                                key={j}
                                                onClick={() => setSummaryModalDay(day)}
                                                className="flex items-center gap-4 p-4 rounded-2xl bg-bg-main/50 border border-border-main/30 group-hover:bg-bg-main transition-colors cursor-pointer hover:border-accent-color/50"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color font-black text-xs group-hover:bg-accent-color group-hover:text-white transition-all">
                                                    {j + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black tracking-tight group-hover:text-accent-color transition-colors">
                                                        {unit.text}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
                                                        {(() => {
                                                            const hizbMatch = unit.text.match(/Hizb (\d+)/);
                                                            if (hizbMatch) {
                                                                const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                                                                const hizb = HIZB_DATA[hizbIndex];
                                                                if (hizb && Array.isArray(hizb.surahs)) {
                                                                    return t('hizbConstituentSurahs').replace('{surahs}', hizb.surahs.join(', '));
                                                                }
                                                            }
                                                            return unit.surahs;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {isCurrent && currentSurahNames.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="mt-4 p-4 bg-danger/5 border border-danger/20 rounded-2xl flex gap-4 items-start"
                                            >
                                                <AlertCircle size={20} className="text-danger shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-danger uppercase tracking-[0.2em]">
                                                        {t('difficultyWarning')}
                                                    </p>
                                                    <p className="text-xs font-bold leading-relaxed">
                                                        {currentSurahNames.join(', ')}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {(isCurrent || dayIndex < state.progress.currentRevisionIndex) && (
                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                            <Button
                                                size="sm"
                                                variant={day.status === 'revised' ? 'success' : 'secondary'}
                                                className={clsx(
                                                    "h-14 font-black rounded-xl transition-all duration-300",
                                                    day.status === 'revised' ? "shadow-lg shadow-success/30 scale-105" : "bg-white/5 opacity-60"
                                                )}
                                                onClick={() => handleStatusUpdate(day, 'revised')}
                                            >
                                                {t('revised')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={day.status === 'not_revised' ? 'danger' : 'secondary'}
                                                className={clsx(
                                                    "h-14 font-black rounded-xl transition-all duration-300",
                                                    day.status === 'not_revised' ? "shadow-lg shadow-danger/30 scale-105" : "bg-white/5 opacity-60"
                                                )}
                                                onClick={() => handleStatusUpdate(day, 'not_revised')}
                                            >
                                                {t('not_revised')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={day.status === 'to-review' ? 'warning' : 'secondary'}
                                                className={clsx(
                                                    "h-14 font-black rounded-xl transition-all duration-300",
                                                    day.status === 'to-review' ? "shadow-lg shadow-warning/30 scale-105" : "bg-white/5 opacity-60"
                                                )}
                                                onClick={() => setReviewModalDay(day)}
                                            >
                                                <RotateCcw size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* ReadjustmentModal */}
            {reviewModalDay && (
                <ReadjustmentModal
                    isOpen={!!reviewModalDay}
                    onClose={() => setReviewModalDay(null)}
                    onConfirm={(selectedItems: string[]) => {
                        handleStatusUpdate(reviewModalDay!, 'to-review', selectedItems);
                        setReviewModalDay(null);
                    }}
                    title={t('toReview')}
                    items={reviewModalDay.units.flatMap(unit => {
                        const hizbMatch = unit.text.match(/Hizb (\d+)/);
                        if (hizbMatch) {
                            const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                            const hizb = HIZB_DATA[hizbIndex];
                            if (hizb && Array.isArray(hizb.surahs)) {
                                return hizb.surahs;
                            }
                        }
                        return unit.surahs.split(',').map(s => s.trim()).filter(Boolean);
                    })}
                />
            )}

            {/* Rating Selector Modal */}
            <AnimatePresence>
                {ratingSelector?.isOpen && (
                    <Modal
                        isOpen={!!ratingSelector?.isOpen}
                        onClose={() => setRatingSelector(null)}
                        className="max-w-sm"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-accent-color/20 flex items-center justify-center mx-auto mb-4">
                                <Star className="text-accent-color" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-text-main">
                                {t('rateYourRevision') || 'Notez votre révision'}
                                {(() => {
                                    const currentRev = revisionPlan?.[ratingSelector?.index ?? -1];
                                    if (!currentRev) return null;
                                    const allSurahs = currentRev.units.flatMap(u => {
                                        const hizbMatch = u.text.match(/Hizb (\d+)/);
                                        if (hizbMatch) {
                                            const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
                                            const hizb = HIZB_DATA[hizbIndex];
                                            if (hizb && Array.isArray(hizb.surahs)) return hizb.surahs;
                                        }
                                        return (u.surahs || '').split(',').map(s => s.trim()).filter(Boolean);
                                    });
                                    const ratedCount = Object.keys(ratingSelector?.surahRatings || {}).length;
                                    const currentSurah = allSurahs[ratedCount];
                                    return currentSurah ? <span className="block text-accent-color mt-1">{currentSurah}</span> : null;
                                })()}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">{t('rateYourRevisionDesc') || 'Comment s’est passée cette session ?'}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'tres_bien', label: t('veryGood') || 'Très bien', icon: '✨' },
                                { id: 'bien', label: t('good') || 'Bien', icon: '👍' },
                                { id: 'moyen', label: t('average') || 'Moyen', icon: '😐' },
                                { id: 'a_revoir', label: t('toReview') || 'À réviser', icon: '🔄' },
                            ].map((opt) => {
                                const isSelected = ratingSelector?.pendingRating === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => ratingSelector && setRatingSelector({ ...ratingSelector, pendingRating: opt.id as any })}
                                        className={clsx(
                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                                            isSelected
                                                ? "bg-accent-color/10 border-accent-color shadow-lg shadow-accent-color/20"
                                                : "bg-bg-secondary border-border-main hover:border-accent-color/30 group"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={clsx("text-2xl transition-transform", isSelected ? "scale-125" : "group-hover:scale-110")}>{opt.icon}</span>
                                            <span className={clsx("font-black text-xs uppercase tracking-widest transition-colors", isSelected ? "text-text-main" : "text-text-secondary group-hover:text-text-main")}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        {isSelected && <CheckCircle2 size={18} className="text-accent-color" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <Button
                                variant="ghost"
                                className="h-14 rounded-2xl border-border-main text-text-secondary hover:text-text-main uppercase text-[10px] font-black tracking-widest"
                                onClick={() => setRatingSelector(null)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                variant="accent"
                                disabled={!ratingSelector?.pendingRating}
                                className="h-14 rounded-2xl shadow-xl shadow-accent-color/20 uppercase text-[10px] font-black tracking-widest"
                                onClick={() => {
                                    if (ratingSelector?.pendingRating) {
                                        handleRatingSelect(ratingSelector.pendingRating);
                                        setRatingSelector(prev => prev ? { ...prev, pendingRating: undefined } : null);
                                    }
                                }}
                            >
                                {t('validate')}
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* To Review History Section */}
            <section className="mt-20 space-y-10">
                <div className="flex items-center gap-4 border-b border-border-main pb-8">
                    <div className="p-3 bg-warning/10 rounded-2xl text-warning">
                        <History size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gradient">Historique des unités à reprendre</h2>
                        <p className="text-text-secondary font-medium">Retrouvez ici les unités marquées comme étant à revoir lors de vos sessions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.progress.history.toReview && state.progress.history.toReview.length > 0 ? (
                        state.progress.history.toReview.map((item, idx) => (
                            <div key={idx} className="premium-card p-6 bg-warning/5 border-warning/10 border-2 rounded-[2rem] flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-warning opacity-60">
                                            Jour {item.day} — {item.date && new Date(item.date).toLocaleDateString()}
                                        </span>
                                        {item.quality && (
                                            <span className={clsx(
                                                "w-fit px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                                                item.quality === 'tres_bien' ? 'bg-success/20 text-success border border-success/30' :
                                                    item.quality === 'bien' ? 'bg-accent-color/20 text-accent-color border border-accent-color/30' :
                                                        item.quality === 'moyen' ? 'bg-warning/20 text-warning border border-warning/30' :
                                                            'bg-danger/20 text-danger border border-danger/30'
                                            )}>
                                                {item.quality.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-2 bg-warning/20 rounded-lg text-warning">
                                        <AlertCircle size={16} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {item.units?.map((u, i) => (
                                        <div key={i} className="text-sm font-bold">{u.text}</div>
                                    ))}
                                </div>
                                {item.difficulties && item.difficulties.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {item.difficulties.map((d, i) => (
                                            <span key={i} className="px-3 py-1 bg-warning/10 text-[9px] font-black uppercase tracking-widest text-warning rounded-full border border-warning/20">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-text-secondary opacity-50 font-medium">
                            Aucune unité à reprendre pour le moment.
                        </div>
                    )}
                </div>
            </section>

            {/* Completed Goals Section */}
            <section className="mt-20 space-y-10">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 border-b border-border-main pb-6">
                        <div className="w-14 h-14 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner group transition-all hover:scale-110">
                            <Folder size={28} fill="currentColor" opacity={0.2} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter">{t('completedGoals')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-indigo-300/60">{t('revisionHistoryTitle')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.progress.history.revision.length > 0 ? (
                            state.progress.history.revision.map((goal, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02, translateY: -5 }}
                                    className="premium-card group cursor-pointer border-border-main/50 hover:border-accent-color/50 transition-all bg-white/5 backdrop-blur-xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-color/5 rounded-full -mr-12 -mt-12 blur-3xl" />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                            <Trophy size={20} />
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black opacity-40 uppercase tracking-widest">
                                            #{state.progress.history.revision.length - idx}
                                        </div>
                                    </div>
                                    <h3 className="font-black text-xl mb-2 text-white/90 group-hover:text-accent-color transition-colors leading-tight">
                                        {t('revisionGoalHistory', {
                                            index: state.progress.history.revision.length - idx,
                                            count: goal.count,
                                            duration: goal.duration
                                        })}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                            {t('completedOn', { date: goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'N/A' })}
                                        </p>
                                    </div>
                                    <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] group-hover:bg-accent-color group-hover:text-white group-hover:border-accent-color transition-all duration-500 shadow-premium">
                                        {t('viewDetails') || 'Détails de l\'objectif'}
                                    </button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-white/5 backdrop-blur-sm">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10">
                                    <Folder size={40} className="text-white/10" />
                                </div>
                                <h3 className="text-white/60 font-black text-lg mb-2">{t('noRevisionHistory')}</h3>
                                <p className="text-white/20 text-xs font-medium max-w-xs">{t('noRevisionHistoryMessage') || 'Vos objectifs de révision complétés apparaîtront ici avec éclat.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Summary Modal */}
            <AnimatePresence>
                {summaryModalDay && (
                    <Modal isOpen={!!summaryModalDay} onClose={() => setSummaryModalDay(null)}>
                        <div className="p-8 space-y-10">
                            <header className="text-center space-y-4">
                                <div className="w-20 h-20 rounded-[2.5rem] bg-accent-color/10 flex items-center justify-center text-accent-color mx-auto shadow-inner group">
                                    <Brain size={36} className="group-hover:rotate-12 transition-transform" />
                                </div>
                                <h3 className="text-3xl font-black text-gradient">
                                    {t('summaryOfAnnotations') || 'Résumé des annotations'}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                                    {summaryModalDay.units.map(u => u.text).join(' + ')}
                                </p>
                            </header>

                            <div className="space-y-6">
                                {summaryModalDay.status === 'not_revised' ? (
                                    <div className="p-8 rounded-[2.5rem] bg-danger/5 border border-danger/20 text-center space-y-4">
                                        <AlertCircle size={40} className="text-danger mx-auto opacity-40" />
                                        <p className="text-danger font-black uppercase tracking-widest text-sm">{t('notDone')}</p>
                                        <p className="text-text-secondary text-xs italic">Cette session n'a pas encore été effectuée.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 block mb-2">{t('status')}</span>
                                                <span className={clsx(
                                                    "text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block",
                                                    summaryModalDay.status === 'revised' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                                                )}>
                                                    {t(summaryModalDay.status)}
                                                </span>
                                            </div>
                                            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 block mb-2">{t('quality') || 'Qualité globale'}</span>
                                                {summaryModalDay.quality ? (
                                                    <span className={clsx(
                                                        "text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block",
                                                        summaryModalDay.quality === 'tres_bien' ? 'bg-success/20 text-success' :
                                                            summaryModalDay.quality === 'bien' ? 'bg-accent-color/20 text-accent-color' :
                                                                summaryModalDay.quality === 'moyen' ? 'bg-warning/20 text-warning' :
                                                                    'bg-danger/20 text-danger'
                                                    )}>
                                                        {t(summaryModalDay.quality)}
                                                    </span>
                                                ) : (
                                                    <span className="text-text-secondary italic text-xs">N/A</span>
                                                )}
                                            </div>
                                        </div>

                                        {summaryModalDay.surahRatings && Object.keys(summaryModalDay.surahRatings).length > 0 && (
                                            <div className="space-y-6 pt-4">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-3">
                                                    <div className="w-8 h-px bg-border-main/50" />
                                                    {t('surahRatings') || 'Détails par sourate'}
                                                    <div className="h-px bg-border-main/50 flex-1" />
                                                </h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {Object.entries(summaryModalDay.surahRatings).map(([surah, rating]) => (
                                                        <div key={surah} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all">
                                                            <span className="font-black text-sm text-text-main/80 group-hover:text-text-main transition-colors">{surah}</span>
                                                            <div className={clsx(
                                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                                                rating === 'tres_bien' ? 'text-success bg-success/10' :
                                                                    rating === 'bien' ? 'text-accent-color bg-accent-color/10' :
                                                                        rating === 'moyen' ? 'text-warning bg-warning/10' :
                                                                            'text-danger bg-danger/10'
                                                            )}>
                                                                <span>{rating === 'tres_bien' ? '✨' : rating === 'bien' ? '👍' : rating === 'moyen' ? '😐' : '🔄'}</span>
                                                                {t(rating)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryModalDay.difficulties && summaryModalDay.difficulties.length > 0 && (
                                            <div className="space-y-6 pt-4">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-3">
                                                    <div className="w-8 h-px bg-border-main/50" />
                                                    {t('difficultiesToReview') || 'Points à revoir'}
                                                    <div className="h-px bg-border-main/50 flex-1" />
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {summaryModalDay.difficulties.map(d => (
                                                        <div key={d} className="px-5 py-2.5 bg-warning/10 border border-warning/20 text-warning text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm">
                                                            {d}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <Button
                                variant="accent"
                                size="lg"
                                className="w-full h-16 rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-premium"
                                onClick={() => setSummaryModalDay(null)}
                            >
                                {t('close')}
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RevisionPlanView;
