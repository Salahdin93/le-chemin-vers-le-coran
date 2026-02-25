import React, { useMemo } from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { motion } from 'framer-motion';
import {
    Activity, Trophy, Sparkles,
    Clock, Eye,
    TrendingUp, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { clsx } from 'clsx';

const COLORS = {
    acquis: '#10b981', // emerald-500
    en_memorisation: '#f59e0b', // amber-500
    a_reprendre: '#ef4444', // red-500
    lu: '#3b82f6', // blue-500
    non_lu: '#1e293b', // slate-800
};

const HadithStatsView: React.FC = () => {
    const { t } = useStore();
    const activeProfile = useActiveProfileSelector();

    const stats = useMemo(() => {
        if (!activeProfile) return null;
        const progress = activeProfile.hadithProgress || {};
        const total = HADITH_COLLECTION.length;

        const counts = {
            acquis: Object.values(progress).filter(s => s === 'acquis').length,
            en_memorisation: Object.values(progress).filter(s => s === 'en_memorisation').length,
            a_reprendre: Object.values(progress).filter(s => s === 'a_reprendre').length,
            lu: Object.values(progress).filter(s => s === 'lu').length,
        };
        const non_lu = total - (counts.acquis + counts.en_memorisation + counts.a_reprendre + counts.lu);

        return { ...counts, non_lu, total };
    }, [activeProfile]);

    if (!stats) return null;

    const pieData = [
        { name: t('statusAcquis'), value: stats.acquis, color: COLORS.acquis },
        { name: t('statusEnMemorisation'), value: stats.en_memorisation, color: COLORS.en_memorisation },
        { name: t('statusARependre'), value: stats.a_reprendre, color: COLORS.a_reprendre },
        { name: t('statusLu'), value: stats.lu, color: COLORS.lu },
        { name: t('statusNonLu'), value: stats.non_lu, color: COLORS.non_lu },
    ].filter(item => item.value > 0);


    const percentage = Math.round((stats.acquis / stats.total) * 100);

    return (
        <div className="space-y-12 pb-32">
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pb-12 border-b-2 border-border-main/50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <TrendingUp size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-gradient">Analytique de la Science</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight">{t('hadithStats')}</h1>
                    <p className="text-text-secondary font-medium text-lg leading-relaxed max-w-2xl">Visualisez votre progression et célébrez chaque étape de votre voyage vers la maîtrise de la Sounnah.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                <StatCard icon={<Trophy className="text-accent-color" />} label="Maîtrisés" value={stats.acquis} color="bg-accent-color/10" percentage={`${percentage}%`} />
                <StatCard icon={<Clock className="text-warning" />} label="En cours" value={stats.en_memorisation} color="bg-warning/10" />
                <StatCard icon={<Eye className="text-blue-500" />} label="Lus" value={stats.lu} color="bg-blue-500/10" />
                <StatCard icon={<Activity className="text-text-main/20" />} label="Total Hadiths" value={stats.total} color="bg-bg-secondary" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-7 premium-card p-1 items-stretch rounded-[3rem] border-2 border-border-main/10 shadow-3xl overflow-hidden group">
                    <div className="bg-bg-secondary/40 h-full p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 shadow-inner">
                                    <PieChartIcon size={20} className="text-accent-color" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">Répartition Globale</h3>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-accent-color/5 border border-accent-color/10 rounded-full">
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent-color">Temps Réel</span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-12 flex-1">
                            <div className="w-full lg:w-1/2 h-80 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%" cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} className="filter drop-shadow-lg" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '1rem' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-4xl font-black text-white">{percentage}%</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Maîtrisé</span>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 space-y-4">
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-slate-900 transition-all group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-bold text-text-main/60 group-hover/item:text-text-main transition-colors">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-5 flex flex-col gap-10">
                    <div className="premium-card p-1 rounded-[3rem] border-2 border-border-main/10 shadow-3xl overflow-hidden flex-1 bg-gradient-to-br from-accent-color/10 to-transparent">
                        <div className="p-10 flex flex-col h-full bg-slate-900/50 backdrop-blur-xl">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <BarChart3 size={20} className="text-accent-color" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">Focus Mémorisation</h3>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-5xl font-black text-white mb-2">{stats.acquis}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Hadiths mémorisés sur {stats.total}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-accent-color">{percentage}%</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Objectif final</p>
                                    </div>
                                </div>
                                <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 p-1 shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full bg-accent-color rounded-full shadow-lg shadow-accent-color/40 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                                    </motion.div>
                                </div>
                            </div>

                            <div className="mt-12 p-6 rounded-[2rem] bg-accent-color/5 border border-accent-color/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Sparkles size={18} className="text-accent-color" />
                                    <p className="text-sm font-bold">Le saviez-vous ?</p>
                                </div>
                                <p className="text-xs leading-relaxed font-medium opacity-60">
                                    La régularité est la clé de la science. Mémoriser un hadith par semaine vous permettra d’achever ce recueil prestigieux en moins de deux ans.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: any, label: string, value: number, color: string, percentage?: string }> = ({ icon, label, value, color, percentage }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={clsx("premium-card p-8 border-2 border-border-main/10 shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500", color)}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
        <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 shadow-inner transition-transform duration-500 group-hover:scale-110">
                {icon}
            </div>
            {percentage && (
                <span className="text-[10px] font-black italic text-accent-color">{percentage}</span>
            )}
        </div>
        <div>
            <p className="text-4xl font-black text-white mb-1 group-hover:text-accent-color transition-colors">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">{label}</p>
        </div>
    </motion.div>
);

export default HadithStatsView;