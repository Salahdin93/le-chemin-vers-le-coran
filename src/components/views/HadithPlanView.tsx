import React, { useState, useMemo } from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { Hadith, HadithMemorizationStatus } from '../../types';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, EyeOff, CheckCircle2, Circle, Clock,
    Sparkles, Quote,
    Search, Activity, Folder, Trophy
} from 'lucide-react';

const HadithCard: React.FC<{ hadith: Hadith; status: HadithMemorizationStatus; index: number }> = ({ hadith, status, index }) => {
    const { state, dispatch, t } = useStore();
    const activeProfile = useActiveProfileSelector();
    const [showTranslation, setShowTranslation] = useState(false);

    const statusConfig: Record<HadithMemorizationStatus, { color: string, icon: any, label: string }> = {
        non_lu: { color: 'border-border-main/20 bg-bg-secondary/30', icon: Circle, label: t('statusNotStarted') },
        lu: { color: 'border-blue-500/30 bg-blue-500/5', icon: Eye, label: t('statusLu') },
        en_memorisation: { color: 'border-warning/30 bg-warning/5', icon: Clock, label: t('statusEnMemorisation') },
        a_reprendre: { color: 'border-danger/30 bg-danger/5', icon: Activity, label: t('statusARependre') },
        acquis: { color: 'border-success/30 bg-success/5', icon: CheckCircle2, label: t('statusAcquis') },
    };

    const config = statusConfig[status];

    const handleStatusChange = (newStatus: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId: hadith.id, status: newStatus } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className={clsx('premium-card !p-0 flex flex-col border-2 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group', config.color)}
        >
            <div className="p-6 border-b border-border-main/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-black shadow-lg border border-white/5">
                        #{hadith.id}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Hadith</span>
                </div>
                <div className={clsx("flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-[0.2em]", config.color.replace('border-', 'text-').split(' ')[0])}>
                    <config.icon size={10} />
                    {config.label}
                </div>
            </div>

            <div className="p-8 flex-1 flex flex-col space-y-6 relative">
                <div className="absolute top-4 right-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
                    <Quote size={80} />
                </div>

                <div className="relative">
                    <p className="font-amiri text-2xl leading-[2.5] text-right dir-rtl text-text-main group-hover:text-accent-color transition-colors selection:bg-accent-color/20">{hadith.arabic}</p>
                </div>

                <AnimatePresence>
                    {(showTranslation || state.settings.lang === 'ar') && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <div className="p-6 bg-slate-900/40 rounded-2xl text-sm leading-relaxed font-medium text-text-secondary border border-white/5 shadow-inner">
                                <span className="text-accent-color/40 mr-2 text-lg">“</span>
                                {hadith.translations[(state.settings.lang === 'ar' ? 'en' : state.settings.lang) as 'fr' | 'en'] || hadith.translations.en}
                                <span className="text-accent-color/40 ml-2 text-lg">”</span>
                            </div>
                            <p className="text-[9px] font-bold opacity-30 mt-4 uppercase tracking-widest text-center">Source: {hadith.source[state.settings.lang as keyof typeof hadith.source] || hadith.source.en}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-auto pt-6 space-y-6">
                    {state.settings.lang !== 'ar' && (
                        <button onClick={() => setShowTranslation(!showTranslation)} className="w-full h-10 rounded-xl bg-bg-secondary flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-accent-color hover:text-white transition-all">
                            {showTranslation ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showTranslation ? t('hideTranslation') : t('showTranslation')}
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {(activeProfile?.goals?.hadithRevision
                            ? [
                                { s: 'en_memorisation', v: 'ghost', l: t('statusEnMemorisation'), c: 'bg-warning/10 text-warning hover:bg-warning hover:text-white' },
                                { s: 'a_reprendre', v: 'ghost', l: t('statusARependre'), c: 'bg-danger/10 text-danger hover:bg-danger hover:text-white' },
                                { s: 'acquis', v: 'accent', l: t('statusAcquis') },
                                { s: 'non_lu', v: 'secondary', l: t('statusNonLu') }
                            ]
                            : [
                                { s: 'lu', v: 'secondary', l: t('statusLu') },
                                { s: 'non_lu', v: 'ghost', l: t('statusNonLu'), c: 'bg-bg-secondary text-text-main/40 hover:bg-bg-main hover:text-text-main' }
                            ]
                        ).map(opt => (
                            <button
                                key={opt.s}
                                onClick={() => handleStatusChange(opt.s as any)}
                                className={clsx(
                                    "h-10 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                    status === opt.s ? "bg-accent-color text-white shadow-lg scale-105" : (opt.c || "bg-bg-secondary text-text-main/40 hover:bg-bg-main hover:text-text-main")
                                )}
                            >
                                {opt.l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const HadithPlanView: React.FC = () => {
    const { state, t } = useStore();
    const activeProfile = useActiveProfileSelector();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<HadithMemorizationStatus | 'all'>('all');

    if (!activeProfile) return null;
    const progress = activeProfile.hadithProgress || {};

    const filteredHadiths = useMemo(() => {
        return HADITH_COLLECTION.filter(h => {
            const matchesSearch = h.arabic.includes(searchQuery) ||
                h.id.toString().includes(searchQuery) ||
                ((h.translations as any)[state.settings.lang === 'ar' ? 'en' : state.settings.lang]?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            const status = progress[h.id] || 'non_lu';
            const matchesFilter = filterStatus === 'all' || status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [searchQuery, filterStatus, progress, state.settings.lang]);

    return (
        <div className="space-y-12 pb-32">
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pb-12 border-b-2 border-border-main/50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <Sparkles size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Le Trésor de la Sounnah</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">Les 100 Hadiths</h1>
                    <p className="text-text-secondary font-medium text-lg leading-relaxed max-w-2xl">Une sélection précieuse de paroles prophétiques courtes et profondes pour embellir votre quotidien et fortifier votre foi.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative group flex-1 sm:w-80">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-main/40 group-hover:text-accent-color transition-colors" size={20} />
                        <input
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un hadith..."
                            className="w-full h-16 bg-bg-secondary/90 backdrop-blur-xl border-2 border-border-main/30 rounded-2xl pl-16 pr-8 text-sm font-bold text-text-main placeholder:text-text-main/50 focus:outline-none focus:border-accent-color transition-all shadow-xl"
                        />
                    </div>
                    <div className="flex gap-2 p-1.5 bg-bg-secondary/40 backdrop-blur-xl rounded-2xl border-2 border-border-main/10 shadow-inner overflow-x-auto no-scrollbar">
                        {['all', 'non_lu', 'en_memorisation', 'acquis'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilterStatus(f as any)}
                                className={clsx("px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                                    filterStatus === f ? "bg-accent-color text-white shadow-xl" : "text-text-main/30 hover:text-text-main")}
                            >
                                {f === 'all' ? 'Tous' : t(f === 'non_lu' ? 'statusNotStarted' : f === 'acquis' ? 'statusMastered' : 'statusInProgress')}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <AnimatePresence mode="popLayout">
                {filteredHadiths.length > 0 ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 md:gap-10">
                        {filteredHadiths.map((h, i) => (
                            <HadithCard key={h.id} hadith={h} status={progress[h.id] || 'non_lu'} index={i % 20} />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center">
                        <div className="w-24 h-24 bg-bg-secondary rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 opacity-20">
                            <Search size={48} />
                        </div>
                        <p className="text-xl font-black opacity-30 uppercase tracking-widest">Aucun hadith trouvé</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Objectifs Atteints Section */}
            <section className="mt-24 space-y-10">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 border-b border-border-main pb-6">
                        <div className="w-14 h-14 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner group transition-all hover:scale-110">
                            <Folder size={28} fill="currentColor" opacity={0.2} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter">{t('completedGoals')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-emerald-300/60">{t('hadithHistoryTitle')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.progress.history.hadithRevisionHistory && state.progress.history.hadithRevisionHistory.length > 0 ? (
                            state.progress.history.hadithRevisionHistory.map((goal, idx) => (
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
                                            #{state.progress.history.hadithRevisionHistory.length - idx}
                                        </div>
                                    </div>

                                    <h3 className="font-black text-xl mb-2 text-white/90 group-hover:text-accent-color transition-colors leading-tight">
                                        Objectif {state.progress.history.hadithRevisionHistory.length - idx} : {goal.count} hadiths en {goal.duration} jours
                                    </h3>

                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                            {t('completedOn', { date: new Date(goal.completedAt).toLocaleDateString() })}
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
                                <h3 className="text-white/60 font-black text-lg mb-2">{t('noHadithHistory') || 'Aucun historique de hadiths'}</h3>
                                <p className="text-white/20 text-xs font-medium max-w-xs">{t('noHadithHistoryMessage') || 'Vos objectifs de hadiths complétés apparaîtront ici.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HadithPlanView;