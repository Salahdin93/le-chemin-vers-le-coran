-- Ajout de la colonne avatar pour persister la config avatar (genre, teinte de peau)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar JSONB DEFAULT NULL;
