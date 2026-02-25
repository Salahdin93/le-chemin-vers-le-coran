import React from 'react';
import { useStore } from '@/context/AppContext';
import { Badge } from '@/types';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';

const BadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => {
    const isUnlocked = !!badge.unlockedOn;
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={clsx(
                "p-8 rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden group",
                isUnlocked
                    ? "border-accent-color/20 bg-accent-color/5 shadow-premium"
                    : "border-border-main/50 bg-bg-secondary/50 opacity-40 grayscale"
            )}
        >
            {isUnlocked && (
                <div className="absolute top-0 right-0 p-3">
                    <div className="w-2 h-2 rounded-full bg-accent-color animate-pulse shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"></div>
                </div>
            )}

            <div className={clsx(
                "w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mb-6 transition-all duration-500 shadow-inner",
                isUnlocked ? "bg-white/10 scale-110 rotate-3 group-hover:rotate-6" : "bg-bg-main"
            )}>
                {badge.icon}
            </div>

            <h3 className="text-lg font-black tracking-tight mb-2 text-center">{badge.name}</h3>
            <p className="text-xs font-medium text-text-secondary text-center leading-relaxed px-4 line-clamp-2">{badge.description}</p>

            {isUnlocked && (
                <div className="mt-6 pt-4 border-t border-accent-color/10 w-full text-center">
                    <p className="text-[10px] font-black text-accent-color uppercase tracking-widest">
                        Débloqué le {badge.unlockedOn ? new Date(badge.unlockedOn).toLocaleDateString() : ''}
                    </p>
                </div>
            )}

            {!isUnlocked && (
                <div className="mt-6">
                    <Lock size={16} className="text-text-main/20" />
                </div>
            )}
        </motion.div>
    );
};

const AchievementsView: React.FC = () => {
    const { activeProfile, t } = useStore();
    const badges = activeProfile?.badges || [];
    const unlockedCount = badges.filter(b => b.unlockedOn).length;

    return (
        <div className="space-y-8 md:space-y-12 pb-32 px-2 md:px-0">
            <header className="pb-8 border-b border-border-main flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gradient mb-2">{t('achievementsTitle') || 'Trophées & Réussites'}</h1>
                    <p className="text-text-secondary font-medium text-sm md:text-base">{t('achievementsSubtitle') || 'Célébrez vos jalons et portez vos succès avec humilité et gratitude.'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-accent-color/5 border border-accent-color/10 flex flex-col items-center min-w-[160px]">
                    <span className="text-3xl font-black text-accent-color">{unlockedCount} / {badges.length}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('unlocked') || 'Débloqués'}</span>
                </div>
            </header>

            {badges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
                </div>
            ) : (
                <div className="p-20 text-center glass-card border-none bg-bg-main/30 rounded-3xl">
                    <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy size={40} className="text-text-main/10" />
                    </div>
                    <p className="text-sm font-bold opacity-30 max-w-sm mx-auto">
                        Les badges apparaîtront ici au fur et à mesure de votre progression sacrée.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AchievementsView;