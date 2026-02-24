import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { Badge } from '@/types';
import { clsx } from 'clsx';

const BadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => {
    const isUnlocked = !!badge.unlockedOn;
    return (
        <div className={clsx(
            "p-6 rounded-lg border-2 text-center transition-all duration-300",
            isUnlocked
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-border-main bg-bg-main opacity-50"
        )}>
            <div className="text-5xl mb-4">{badge.icon}</div>
            <h3 className="text-lg font-bold">{badge.name}</h3>
            <p className="text-sm text-text-secondary mt-1">{badge.description}</p>
            {isUnlocked && (
                <p className="text-xs text-yellow-600 font-semibold mt-4">
                    Débloqué le {badge.unlockedOn ? new Date(badge.unlockedOn).toLocaleDateString() : ''}
                </p>
            )}
        </div>
    );
};

const AchievementsView: React.FC = () => {
    const { activeProfile } = useStore();
    const badges = activeProfile?.badges || [];
    const unlockedCount = badges.filter(b => b.unlockedOn).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trophées et Réussites</CardTitle>
                <p className="text-text-secondary">{unlockedCount} / {badges.length} débloqués</p>
            </CardHeader>
            <CardContent>
                {badges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
                    </div>
                ) : (
                    <p className="text-center text-text-secondary py-8">
                        Les badges apparaîtront ici au fur et à mesure de votre progression.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default AchievementsView;