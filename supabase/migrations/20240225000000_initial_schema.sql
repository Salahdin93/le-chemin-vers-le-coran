-- Table Profils
CREATE TABLE IF NOT EXISTS public.profils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ID de l'utilisateur" UUID DEFAULT auth.uid(), -- Lié à l'authentification Supabase
    name TEXT NOT NULL,
    gender TEXT,
    password TEXT,
    theme TEXT DEFAULT 'light',
    couleur_accent TEXT DEFAULT '#2E7D32',
    goals JSONB DEFAULT '{}'::jsonb,
    memorisations JSONB DEFAULT '{"surahParts": [], "hizbs": [], "juzz": []}'::jsonb,
    historique_evaluation JSONB DEFAULT '[]'::jsonb,
    badges JSONB DEFAULT '[]'::jsonb,
    hadith_progression JSONB DEFAULT '{}'::jsonb,
    hadith_historique JSONB DEFAULT '[]'::jsonb,
    plans_evaluation JSONB DEFAULT '[]'::jsonb,
    difficulties JSONB DEFAULT '[]'::jsonb,
    progression JSONB DEFAULT '{}'::jsonb,
    plans JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Paramètres Utilisateur
CREATE TABLE IF NOT EXISTS public."paramètres utilisateur" (
    "ID de l'utilisateur" UUID PRIMARY KEY DEFAULT auth.uid(),
    langue TEXT DEFAULT 'fr',
    activer_notifications BOOLEAN DEFAULT true,
    heure_de_notification TEXT DEFAULT '09:00',
    id_profil_actuel UUID REFERENCES public.profils(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de Row Level Security (RLS)
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."paramètres utilisateur" ENABLE ROW LEVEL SECURITY;

-- Politiques pour Profils
CREATE POLICY "Les utilisateurs ne peuvent voir que leurs propres profils" 
ON public.profils FOR SELECT 
USING (auth.uid() = "ID de l'utilisateur");

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres profils" 
ON public.profils FOR INSERT 
WITH CHECK (auth.uid() = "ID de l'utilisateur");

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres profils" 
ON public.profils FOR UPDATE 
USING (auth.uid() = "ID de l'utilisateur");

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres profils" 
ON public.profils FOR DELETE 
USING (auth.uid() = "ID de l'utilisateur");

-- Politiques pour Paramètres Utilisateur
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres paramètres" 
ON public."paramètres utilisateur" FOR ALL 
USING (auth.uid() = "ID de l'utilisateur");

-- Fonction pour gérer la mise à jour des timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER set_profils_updated_at
    BEFORE UPDATE ON public.profils
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_paramètres_utilisateur_updated_at
    BEFORE UPDATE ON public."paramètres utilisateur"
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
