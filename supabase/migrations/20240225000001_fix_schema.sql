-- ============================================================
-- MIGRATION COMPLÈTE : Schéma propre pour l'app Coran
-- Tables avec noms sans accents/espaces + toutes les colonnes
-- ============================================================

-- Suppression des anciennes tables si elles existent
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- Table: profiles (anciennement "profils")
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT DEFAULT 'male',
    password TEXT,
    theme TEXT DEFAULT 'light',
    accent_color TEXT DEFAULT '#2E7D32',
    -- Objectifs (lecture, révision, hadiths)
    goals JSONB DEFAULT '{}'::jsonb,
    -- Mémorisations (surahParts, hizbs, juzz)
    memorizations JSONB DEFAULT '{"surahParts": [], "hizbs": [], "juzz": []}'::jsonb,
    -- Historique d'évaluation
    evaluation_history JSONB DEFAULT '[]'::jsonb,
    -- Plans d'évaluation
    evaluation_plans JSONB DEFAULT '[]'::jsonb,
    -- Badges débloqués
    badges JSONB DEFAULT '[]'::jsonb,
    -- Progrès Hadith
    hadith_progress JSONB DEFAULT '{}'::jsonb,
    -- Historique Hadith
    hadith_history JSONB DEFAULT '[]'::jsonb,
    -- Difficultés persistantes
    difficulties JSONB DEFAULT '[]'::jsonb,
    -- Progression (lecture, révision)
    progression JSONB DEFAULT NULL,
    -- Plans générés
    plans JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Table: user_settings (anciennement "paramètres utilisateur")
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    lang TEXT DEFAULT 'fr',
    enable_notifications BOOLEAN DEFAULT true,
    notification_time TEXT DEFAULT '09:00',
    active_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Activation de Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Politiques RLS pour profiles
-- ============================================================
DROP POLICY IF EXISTS "users_can_view_own_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_delete_own_profiles" ON public.profiles;

CREATE POLICY "users_can_view_own_profiles"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_profiles"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_profiles"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_profiles"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================
-- Politiques RLS pour user_settings
-- ============================================================
DROP POLICY IF EXISTS "users_can_manage_own_settings" ON public.user_settings;

CREATE POLICY "users_can_manage_own_settings"
ON public.user_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Fonction pour mettre à jour updated_at automatiquement
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Triggers pour updated_at
-- ============================================================
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Index pour performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
