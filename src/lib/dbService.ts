import { supabase } from './supabase';
import { Profile, Settings, AppState } from '../types/types';

/**
 * Service pour gérer la persistance des données avec Supabase.
 * Utilise les tables : profiles, user_settings
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
            id: row.id,
            name: row.name,
            gender: row.gender || 'male',
            password: row.password,
            theme: row.theme || 'light',
            accentColor: row.accent_color || '#2E7D32',
            avatar: row.avatar || undefined,
            goals: row.goals || {},
            memorizations: row.memorizations || { surahParts: [], hizbs: [], juzz: [] },
            hadithProgress: row.hadith_progress || {},
            hadithHistory: row.hadith_history || [],
            evaluationPlans: row.evaluation_plans || [],
            difficulties: row.difficulties || [],
            evaluationHistory: row.evaluation_history || [],
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
            user_id: user.id,
            name: profile.name,
            gender: profile.gender || 'male',
            password: profile.password || null,
            theme: profile.theme || 'light',
            accent_color: profile.accentColor || '#2E7D32',
            avatar: profile.avatar || null,
            goals: profile.goals || {},
            memorizations: profile.memorizations || { surahParts: [], hizbs: [], juzz: [] },
            hadith_progress: profile.hadithProgress || {},
            hadith_history: profile.hadithHistory || [],
            evaluation_plans: profile.evaluationPlans || [],
            difficulties: profile.difficulties || [],
            evaluation_history: profile.evaluationHistory || [],
            badges: profile.badges || [],
            progression: progress !== undefined ? progress : (profile.progress || null),
            plans: plans !== undefined ? plans : (profile.plans || null),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

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
                lang: data.lang as 'fr' | 'en' | 'ar',
                enableNotifications: data.enable_notifications,
                notificationTime: data.notification_time,
            },
            activeProfileId: data.active_profile_id || null
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
            enable_notifications: settings.enableNotifications ?? true,
            notification_time: settings.notificationTime || '09:00',
            active_profile_id: activeProfileId || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_settings')
            .upsert(settingsData, { onConflict: 'user_id' });

        if (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            return false;
        }
        return true;
    },

    /**
     * Synchronise tout l'état de l'application
     */
    async syncFullState(state: AppState): Promise<void> {
        try {
            const profilePromises = state.profiles.map(profile => {
                if (profile.id === state.activeProfileId) {
                    // Pour le profil actif, on utilise l'état global (progression, plans)
                    return this.saveProfile(profile, state.progress, state.plans);
                } else {
                    return this.saveProfile(profile);
                }
            });
            await Promise.all(profilePromises);
            await this.saveSettings(state.settings, state.activeProfileId);
        } catch (error) {
            console.error('Erreur lors de la synchronisation complète:', error);
        }
    }
};
