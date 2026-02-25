import { supabase } from './supabase';
import { Profile, Settings, AppState } from '../types/types';

/**
 * Service pour gérer la persistance des données avec Supabase.
 * En mode "Local-First" : on lit/écrit localement, et on synchronise avec Supabase.
 */
export const dbService = {
    /**
     * Récupère les profils de l'utilisateur connecté.
     */
    async getProfiles(): Promise<Profile[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('profils')
            .select('*')
            .eq('ID de l\'utilisateur', user.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erreur lors de la récupération des profils:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            gender: row.gender,
            password: row.password,
            theme: row.theme,
            accentColor: row.couleur_accent,
            goals: row.goals || {},
            memorizations: row.memorisations || { surahParts: [], hizbs: [], juzz: [] },
            hadithProgress: row.hadith_progression || {},
            hadithHistory: row.hadith_historique || [],
            evaluationPlans: row.plans_evaluation || [],
            difficulties: row.difficulties || [],
            evaluationHistory: row.historique_evaluation || [],
            badges: row.badges || [],
            progress: row.progression || null,
            plans: row.plans || null
        }));
    },

    /**
     * Sauvegarde ou met à jour un profil.
     */
    async saveProfile(profile: Profile, progress?: any, plans?: any): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const profileData = {
            id: profile.id,
            "ID de l'utilisateur": user.id,
            name: profile.name,
            gender: profile.gender,
            password: profile.password,
            theme: profile.theme,
            couleur_accent: profile.accentColor,
            goals: profile.goals,
            memorisations: profile.memorizations,
            hadith_progression: profile.hadithProgress,
            hadith_historique: profile.hadithHistory,
            plans_evaluation: profile.evaluationPlans,
            difficulties: profile.difficulties,
            historique_evaluation: profile.evaluationHistory,
            badges: profile.badges,
            progression: progress || profile.progress,
            plans: plans || profile.plans,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('profils')
            .upsert(profileData);

        if (error) {
            console.error('Erreur lors de la sauvegarde du profil:', error);
            return false;
        }
        return true;
    },

    /**
     * Supprime un profil.
     */
    async deleteProfile(profileId: string): Promise<boolean> {
        const { error } = await supabase
            .from('profils')
            .delete()
            .eq('id', profileId);

        if (error) {
            console.error('Erreur lors de la suppression du profil:', error);
            return false;
        }
        return true;
    },

    /**
     * Récupère les paramètres de l'utilisateur.
     */
    async getSettings(): Promise<{ settings: Partial<Settings>, activeProfileId: string | null } | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('paramètres utilisateur')
            .select('*')
            .eq('ID de l\'utilisateur', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Erreur lors de la récupération des paramètres:', error);
            return null;
        }

        if (!data) return null;

        return {
            settings: {
                lang: data.langue,
                enableNotifications: data.activer_notifications,
                notificationTime: data.heure_de_notification,
            },
            activeProfileId: data.id_profil_actuel
        };
    },

    /**
     * Sauvegarde les paramètres utilisateur.
     */
    async saveSettings(settings: Settings, activeProfileId: string | null): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const settingsData = {
            "ID de l'utilisateur": user.id,
            langue: settings.lang,
            activer_notifications: settings.enableNotifications,
            heure_de_notification: settings.notificationTime,
            id_profil_actuel: activeProfileId,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('paramètres utilisateur')
            .upsert(settingsData);

        if (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            return false;
        }
        return true;
    },

    /**
     * Synchronise tout l'état de l'application (pour un utilisateur qui switch d'appareil).
     */
    async syncFullState(state: AppState): Promise<void> {
        // On sauvegarde chaque profil
        for (const profile of state.profiles) {
            if (profile.id === state.activeProfileId) {
                // Pour le profil actif, on utilise l'état global actuel (progression, plans)
                await this.saveProfile(profile, state.progress, state.plans);
            } else {
                await this.saveProfile(profile);
            }
        }
        // On sauvegarde les paramètres
        await this.saveSettings(state.settings, state.activeProfileId);
    }
};
