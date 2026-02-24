import { AppState, Badge, BadgeId, EvaluationItem, EvaluationStatus } from "@/types";
import { HADITH_COLLECTION } from "@/constants/hadithData";

const allBadges: Omit<Badge, 'unlockedOn'>[] = [
    { id: 'khatma_1', name: 'Première Khatma', description: 'Terminer votre première lecture complète du Coran.', icon: ' ختمة_1' },
    { id: 'khatma_5', name: 'Lecteur Assidu', description: 'Terminer cinq lectures complètes du Coran.', icon: ' ختمة_5' },
    { id: 'consecutive_7_days', name: 'Série de 7 Jours', description: 'Lire le Coran pendant 7 jours consécutifs.', icon: ' 🔥_7' },
    { id: 'consecutive_30_days', name: 'Habitude Ancrée', description: 'Lire le Coran pendant 30 jours consécutifs.', icon: ' 🔥_30' },
    { id: 'first_revision', name: 'Première Révision', description: 'Compléter votre première session de révision.', icon: ' 🧠_1' },
    { id: 'first_memorization', name: 'Premier Pas du Hifdh', description: 'Enregistrer votre premier élément mémorisé.', icon: ' 💖_1' },
    { id: 'juzz_amma_memorized', name: 'Maître de Juzz Amma', description: 'Mémoriser l\'intégralité de Juzz Amma.', icon: '  Juz_Amma' },
    { id: 'one_thousand_pages', name: 'Grand Lecteur', description: 'Avoir lu un total de 1000 pages.', icon: ' 📖_1k' },
    { id: 'thirty_revisions', name: 'Révision Solide', description: 'Avoir complété 30 sessions de révision.', icon: ' 🧠_30' },
    { id: 'perfect_evaluation', name: 'Connaissance Parfaite', description: 'Obtenir un score "Excellent" sur tous les items d\'une session d\'évaluation.', icon: ' 🎯' },
    // Nouveaux badges pour les hadiths
    { id: 'hadith_first_step', name: 'Premier Pas du Savoir', description: 'Commencer à mémoriser votre premier hadith.', icon: ' 📜_1' },
    { id: 'hadith_apprentice', name: 'Apprenti Savant', description: 'Avoir mémorisé 10 hadiths.', icon: ' 🎓_10' },
    { id: 'hadith_guardian', name: 'Gardien de la Sunna', description: 'Avoir mémorisé 40 hadiths.', icon: ' 🛡️_40' },
    { id: 'hadith_muhaddith', name: 'Muhaddith en Herbe', description: 'Avoir mémorisé les 100 hadiths.', icon: ' ✨_100' },
];

export const getInitialBadges = (): Badge[] => {
    return allBadges.map(b => ({ ...b, unlockedOn: null }));
};

const hasBadge = (state: AppState, badgeId: BadgeId): boolean => {
    const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
    return !!activeProfile?.badges.find(b => b.id === badgeId && b.unlockedOn);
};

export const checkHadithMilestones = (state: AppState): BadgeId | null => {
    const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
    if (!activeProfile?.hadithProgress) return null;

    const progress = activeProfile.hadithProgress;
    const inProgressCount = Object.values(progress).filter(s => s === 'en_memorisation').length;
    const masteredCount = Object.values(progress).filter(s => s === 'acquis').length;
    const totalHadiths = HADITH_COLLECTION.length;
    
    if (masteredCount >= totalHadiths && !hasBadge(state, 'hadith_muhaddith')) return 'hadith_muhaddith';
    if (masteredCount >= 40 && !hasBadge(state, 'hadith_guardian')) return 'hadith_guardian';
    if (masteredCount >= 10 && !hasBadge(state, 'hadith_apprentice')) return 'hadith_apprentice';
    if (inProgressCount >= 1 && !hasBadge(state, 'hadith_first_step')) return 'hadith_first_step';

    return null;
}

export const checkConsecutiveDays = (state: AppState): BadgeId | null => {
    if (state.progress.consecutiveDays >= 30 && !hasBadge(state, 'consecutive_30_days')) return 'consecutive_30_days';
    if (state.progress.consecutiveDays >= 7 && !hasBadge(state, 'consecutive_7_days')) return 'consecutive_7_days';
    return null;
};

export const checkPageMilestone = (state: AppState): BadgeId | null => {
    const totalPagesRead = Object.values(state.progress.readingHistory).reduce((sum, entry) => sum + entry.realPages, 0);
    if (totalPagesRead >= 1000 && !hasBadge(state, 'one_thousand_pages')) return 'one_thousand_pages';
    return null;
};

export const checkRevisionMilestone = (state: AppState): BadgeId | null => {
    const totalRevisions = state.plans.revision?.filter(day => day.status === 'revised').length || 0;
    if (totalRevisions >= 30 && !hasBadge(state, 'thirty_revisions')) return 'thirty_revisions';
    if (totalRevisions >= 1 && !hasBadge(state, 'first_revision')) return 'first_revision';
    return null;
};

export const checkPerfectEvaluation = (evaluationResults: (EvaluationItem & { result: EvaluationStatus })[], state: AppState): BadgeId | null => {
    if (evaluationResults.length > 0 && evaluationResults.every(item => item.result === 'excellent') && !hasBadge(state, 'perfect_evaluation')) {
        return 'perfect_evaluation';
    }
    return null;
};

export const checkFirstMemorization = (state: AppState): BadgeId | null => {
    const { memorizations } = state.profiles.find(p => p.id === state.activeProfileId) || {};
    if (memorizations && (memorizations.juzz.length > 0 || memorizations.hizbs.length > 0 || memorizations.surahParts.length > 0) && !hasBadge(state, 'first_memorization')) {
        return 'first_memorization';
    }
    return null;
};

export const checkKhatmaMilestones = (state: AppState): BadgeId | null => {
    const completedKhatmas = state.progress.history.reading.reduce((sum, goal) => sum + goal.khatmas, 0);
    if (completedKhatmas >= 5 && !hasBadge(state, 'khatma_5')) return 'khatma_5';
    if (completedKhatmas >= 1 && !hasBadge(state, 'khatma_1')) return 'khatma_1';
    return null;
};