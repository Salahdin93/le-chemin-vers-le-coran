import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/AppContext';
import Input from '../ui/Input';
import { HadithRevisionGoal, RevisionFrequency } from '../../types';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2, Clock, Calendar,
    RefreshCw, Check, ArrowRight,
    ChevronLeft, ListFilter, LayoutGrid
} from 'lucide-react';

const DayButton: React.FC<{ day: string; isSelected: boolean; onClick: () => void; }> = ({ day, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase transition-all duration-300 border-2",
            isSelected ? 'bg-accent-color border-accent-color text-white shadow-lg shadow-accent-color/20' : 'bg-bg-secondary/50 border-border-main/20 text-text-main/40 hover:text-text-main hover:bg-bg-main'
        )}
    >
        {day.substring(0, 3)}
    </button>
);

const HadithRevisionSettingsView: React.FC = () => {
    const { dispatch, t, activeProfile } = useStore();
    const initialGoal = activeProfile?.goals.hadithRevision;

    const [selectedHadiths, setSelectedHadiths] = useState<number[]>(initialGoal?.selectedHadiths || []);
    const [hadithsPerSession, setHadithsPerSession] = useState(initialGoal?.hadithsPerSession || 3);
    const [frequency, setFrequency] = useState<RevisionFrequency>(initialGoal?.frequency || { type: 'daily', value: 1 });

    if (!activeProfile) return null;
    const allHadithIds = HADITH_COLLECTION.map(h => h.id);

    const handleToggleHadith = (id: number) => {
        setSelectedHadiths(prev => prev.includes(id) ? prev.filter(hId => hId !== id) : [...prev, id]);
    };

    const handleGeneratePlan = () => {
        if (selectedHadiths.length === 0 || hadithsPerSession <= 0) {
            dispatch({ type: 'SET_TOAST', payload: t('errorInvalidHadithPlan') });
            return;
        }
        const goal: HadithRevisionGoal = { selectedHadiths, hadithsPerSession, frequency };
        dispatch({ type: 'SET_HADITH_REVISION_PLAN', payload: { goal } });
        dispatch({ type: 'SET_TOAST', payload: t('hadithRevisionPlanCreated') });
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-plan-view' });
    };

    const totalRevisionDays = useMemo(() => {
        if (hadithsPerSession <= 0) return 0;
        return Math.ceil(selectedHadiths.length / hadithsPerSession);
    }, [selectedHadiths, hadithsPerSession]);

    const daysOfWeek = JSON.parse(t('dayOfWeek'));

    return (
        <div className="space-y-12 pb-32">
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pb-12 border-b-2 border-border-main/50">
                <div className="space-y-4">
                    <button onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-plan-view' })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity mb-4 group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour au Plan
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <Settings2 size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-gradient">Architecture du Rappel</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">{t('hadithRevisionSettings')}</h1>
                    <p className="text-text-secondary font-medium text-lg leading-relaxed max-w-2xl">Configurez vos cycles de révision pour une mémorisation inébranlable.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                <div className="xl:col-span-8 space-y-20">
                    <section className="space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <SectionHeader icon={<ListFilter size={20} />} title={t('selectHadithsForRevision')} />
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedHadiths(allHadithIds)} className="px-5 py-2.5 rounded-xl bg-accent-color/10 text-accent-color text-[9px] font-black uppercase tracking-widest hover:bg-accent-color hover:text-white transition-all">{t('selectAll')}</button>
                                <button onClick={() => setSelectedHadiths([])} className="px-5 py-2.5 rounded-xl bg-bg-secondary text-text-main/20 text-[9px] font-black uppercase tracking-widest hover:bg-bg-main hover:text-text-main transition-all">{t('deselectAll')}</button>
                            </div>
                        </div>

                        <div className="premium-card p-1 rounded-[3rem] border-2 border-border-main/10 shadow-3xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-sparkle-pattern opacity-5 pointer-events-none" />
                            <div className="p-10 max-h-[600px] overflow-y-auto no-scrollbar relative z-10">
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-4">
                                    {HADITH_COLLECTION.map(hadith => (
                                        <button
                                            key={hadith.id}
                                            onClick={() => handleToggleHadith(hadith.id)}
                                            className={clsx(
                                                "aspect-square rounded-[1.5rem] border-2 flex items-center justify-center font-black text-sm transition-all duration-500",
                                                selectedHadiths.includes(hadith.id)
                                                    ? 'bg-accent-color border-accent-color text-white shadow-xl shadow-accent-color/20 scale-110'
                                                    : 'bg-slate-900 border-white/5 text-white/20 hover:border-accent-color/50 hover:text-white'
                                            )}
                                        >
                                            {hadith.id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-10">
                        <SectionHeader icon={<Calendar size={20} />} title={t('revisionFrequency')} />
                        <div className="p-1.5 bg-bg-secondary/40 backdrop-blur-3xl rounded-[2.5rem] border-2 border-border-main/10 shadow-inner flex flex-wrap gap-2 max-w-2xl">
                            {(['daily', 'weekly', 'custom'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFrequency({ type, value: type === 'weekly' ? [] : 1 })}
                                    className={clsx("flex-1 h-14 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                        frequency.type === type ? "bg-white text-slate-950 shadow-2xl" : "text-text-main/30 hover:text-text-main")}
                                >
                                    {t(`freq${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div key={frequency.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-10 rounded-[3rem] bg-accent-color/[0.02] border-2 border-accent-color/10 max-w-2xl">
                                {frequency.type === 'weekly' && (
                                    <div className="space-y-8">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent-color/60 text-center">{t('selectDaysOfWeek')}</p>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {daysOfWeek.map((day: string, index: number) => (
                                                <DayButton
                                                    key={index}
                                                    day={day}
                                                    isSelected={Array.isArray(frequency.value) && frequency.value.includes(index)}
                                                    onClick={() => {
                                                        const current = (Array.isArray(frequency.value) ? frequency.value : []).filter(d => typeof d === 'number');
                                                        const fresh = current.includes(index) ? current.filter(d => d !== index) : [...current, index].sort();
                                                        setFrequency({ type: 'weekly', value: fresh });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {frequency.type === 'custom' && (
                                    <div className="flex items-center gap-8">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-color/60 mb-6">{t('everyXDays')}</p>
                                            <Input type="number" min="1" value={typeof frequency.value === 'number' ? frequency.value : 2}
                                                onChange={(e) => setFrequency({ ...frequency, value: parseInt(e.target.value, 10) || 1 })}
                                                className="h-16 rounded-2xl bg-white/5 border-none shadow-inner px-8 text-xl font-black text-accent-color"
                                            />
                                        </div>
                                        <RefreshCw size={40} className="text-accent-color opacity-10 animate-spin-slow" />
                                    </div>
                                )}
                                {frequency.type === 'daily' && (
                                    <div className="flex items-center gap-6 py-4">
                                        <div className="p-4 bg-accent-color/20 rounded-2xl text-accent-color">
                                            <Check size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-accent-color">Engagement Quotidien</p>
                                            <p className="text-sm font-medium opacity-40">Un rendez-vous quotidien avec la Sounnah pour une excellence continue.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </section>
                </div>

                <div className="xl:col-span-4 space-y-12">
                    <section className="space-y-10 sticky top-32">
                        <SectionHeader icon={<Clock size={20} />} title={t('summary')} />
                        <div className="p-10 rounded-[3.5rem] bg-slate-900 shadow-4xl text-white space-y-12 relative overflow-hidden border-2 border-white/5">
                            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent-color/10 to-transparent pointer-events-none" />

                            <div className="relative z-10 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4">{t('hadithsPerSession')}</label>
                                <Input type="number" min="1" value={hadithsPerSession}
                                    onChange={(e) => setHadithsPerSession(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="h-16 rounded-2xl bg-white/5 border-none shadow-inner px-8 text-2xl font-black text-accent-color"
                                />
                            </div>

                            <div className="relative z-10 space-y-6 pt-10 border-t border-white/5">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg text-accent-color"><LayoutGrid size={16} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Sélectionné</span>
                                    </div>
                                    <span className="text-xl font-black text-white group-hover:scale-110 transition-transform">{selectedHadiths.length}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg text-accent-color"><Calendar size={16} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Durée du cycle</span>
                                    </div>
                                    <span className="text-xl font-black text-white group-hover:scale-110 transition-transform">{totalRevisionDays} jours</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGeneratePlan}
                                disabled={selectedHadiths.length === 0}
                                className="w-full h-20 rounded-[2rem] bg-accent-color text-slate-950 font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-accent-color/30 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-20 disabled:grayscale disabled:scale-100 relative z-10 overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {t('generatePlan')} <ArrowRight size={20} />
                                </span>
                            </button>

                            <p className="text-center text-[8px] font-black uppercase tracking-[0.2em] opacity-20 relative z-10">Optimisé pour une mémorisation long-terme</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

const SectionHeader: React.FC<{ icon: React.ReactNode, title: string }> = ({ icon, title }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 flex items-center gap-4">
        <span className="p-2 bg-border-main/20 rounded-lg">{icon}</span>
        {title}
        <span className="hidden sm:block flex-1 h-px bg-border-main/50" />
    </h3>
);

export default HadithRevisionSettingsView;