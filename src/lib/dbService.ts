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
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erreur lors de la récupération des profils:', error);
            return [];
        }

        return (data || []).map(row => ({
            ...row,
            // Conversion des champs JSONB si nécessaire
            goals: row.goals || {},
            memorizations: row.memorizations || { surahParts: [], hizbs: [], juzz: [] },
            hadithProgress: row.hadith_progress || {},
            hadithHistory: row.hadith_history || [],
            evaluationPlans: row.evaluation_plans || [],
            difficulties: row.difficulties || [],
            evaluationHistory: row.evaluation_history || [],
            badges: row.badges || [],
            progress: row.progress || null,
            plans: row.plans || null,
            // Mappage des noms snake_case vers camelCase si nécessaire
            accentColor: row.accent_color
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
            user_id: user.id,
            name: profile.name,
            gender: profile.gender,
            password: profile.password,
            theme: profile.theme,
            accent_color: profile.accentColor,
            goals: profile.goals,
            memorizations: profile.memorizations,
            hadith_progress: profile.hadithProgress,
            hadith_history: profile.hadithHistory,
            evaluation_plans: profile.evaluationPlans,
            difficulties: profile.difficulties,
            evaluation_history: profile.evaluationHistory,
            badges: profile.badges,
            progress: progress || profile.progress,
            plans: plans || profile.plans,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('profiles')
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
            .from('profiles')
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
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Erreur lors de la récupération des paramètres:', error);
            return null;
        }

        if (!data) return null;

        return {
            settings: {
                lang: data.lang,
                enableNotifications: data.enable_notifications,
                notificationTime: data.notification_time,
            },
            activeProfileId: data.active_profile_id
        };
    },

    /**
     * Sauvegarde les paramètres utilisateur.
     */
    async saveSettings(settings: Settings, activeProfileId: string | null): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const settingsData = {
            user_id: user.id,
            lang: settings.lang,
            enable_notifications: settings.enableNotifications,
            notification_time: settings.notificationTime,
            active_profile_id: activeProfileId,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_settings')
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
                // Pour le profil actif, on utilise l'état global actuel (progress, plans)
                await this.saveProfile(profile, state.progress, state.plans);
            } else {
                await this.saveProfile(profile);
            }
        }
        // On sauvegarde les paramètres
        await this.saveSettings(state.settings, state.activeProfileId);
    }
};
