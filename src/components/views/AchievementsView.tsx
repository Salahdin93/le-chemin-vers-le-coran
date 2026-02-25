import React from 'react';
import { useStore } from '@/context/AppContext';
import { Badge } from '@/types';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trophy, Award, Sparkles, Calendar } from 'lucide-react';

const BadgeCard: React.FC<{ badge: Badge; index: number }> = ({ badge, index }) => {
    const isUnlocked = !!badge.unlockedOn;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.23, 1, 0.32, 1]
            }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={clsx(
                "p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden group h-full",
                isUnlocked
                    ? "border-accent-color/20 bg-accent-color/5 shadow-premium"
                    : "border-border-main/50 bg-bg-secondary/30 grayscale opacity-60"
            )}
        >
            {/* Background Glow */}
            {isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent-color/10 via-transparent to-accent-color/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            )}

            {/* Status Indicator */}
            <div className="absolute top-6 right-6">
                {isUnlocked ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-color text-white rounded-full shadow-lg shadow-accent-color/20">
                        <Sparkles size={8} />
                        <span className="text-[7px] font-black uppercase tracking-widest">Master</span>
                    </div>
                ) : (
                    <div className="p-2 bg-bg-main/50 rounded-xl border border-border-main/50">
                        <Lock size={12} className="text-text-main/20" />
                    </div>
                )}
            </div>

            {/* Badge Icon Container */}
            <div className="relative mb-8">
                {isUnlocked && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 -inset-y-2 opacity-20 blur-2xl"
                    >
                        <div className="w-full h-full bg-accent-color rounded-full" />
                    </motion.div>
                )}

                <div className={clsx(
                    "w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl relative z-10 transition-all duration-700 shadow-2xl",
                    isUnlocked
                        ? "bg-white/10 scale-110 rotate-3 group-hover:rotate-6 group-hover:scale-125"
                        : "bg-bg-main border border-border-main/50"
                )}>
                    {badge.icon}
                </div>
            </div>

            <div className="text-center relative z-10 space-y-2">
                <h3 className="text-xl font-black tracking-tight">{badge.name}</h3>
                <p className="text-xs font-bold text-text-secondary leading-relaxed px-2 opacity-60 group-hover:opacity-100 transition-opacity line-clamp-2">
                    {badge.description}
                </p>
            </div>

            {isUnlocked ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 pt-6 border-t border-accent-color/10 w-full text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-color/10 rounded-full">
                        <Calendar size={10} className="text-accent-color" />
                        <span className="text-[9px] font-black text-accent-color uppercase tracking-[0.15em]">
                            {new Date(badge.unlockedOn!).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </motion.div>
            ) : (
                <div className="mt-8 h-px w-12 bg-border-main/50" />
            )}
        </motion.div>
    );
};

const AchievementsView: React.FC = () => {
    const { activeProfile, t } = useStore();
    const badges = activeProfile?.badges || [];
    const unlockedCount = badges.filter(b => b.unlockedOn).length;
    const progressPercent = badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0;

    return (
        <div className="space-y-12 pb-32 px-4 md:px-0">
            <header className="pb-12 border-b border-border-main flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color shadow-inner">
                            <Trophy size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-gradient">{t('achievementsTitle') || 'Panthéon des Succès'}</h1>
                            <p className="text-text-secondary font-medium mt-1 text-sm md:text-base">
                                {t('achievementsSubtitle') || 'Célébrez vos jalons et portez vos succès avec humilité et gratitude envers l\'Unique.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 w-full xl:w-auto">
                    <div className="p-8 premium-card border-none bg-slate-900 border-white/5 text-white flex-1 xl:min-w-[240px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-color/20 to-transparent opacity-50" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Progression Totale</span>
                                <Award size={16} className="text-accent-color" />
                            </div>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-5xl font-black text-accent-color">{unlockedCount}</span>
                                <span className="text-lg font-black opacity-30 mb-1.5">/ {badges.length}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-accent-color shadow-[0_0_15px_rgba(var(--accent-rgb),0.6)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <AnimatePresence mode="popLayout">
                {badges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {badges.map((badge, i) => (
                            <BadgeCard key={badge.id} badge={badge} index={i} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-32 text-center premium-card border-none bg-bg-secondary/40 flex flex-col items-center"
                    >
                        <div className="w-24 h-24 bg-bg-main rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-border-main/50">
                            <Trophy size={48} className="text-text-main/5" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 opacity-40">En attente de vos premiers exploits</h3>
                        <p className="text-sm font-bold opacity-20 max-w-sm mx-auto leading-relaxed">
                            Les badges de réussite apparaîtront ici au fur et à mesure de votre progression sacrée dans l'étude du Coran et de la Sunnah.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AchievementsView;