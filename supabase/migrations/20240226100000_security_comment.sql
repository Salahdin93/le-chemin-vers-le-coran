-- Documentation sécurité : le champ password des profils doit contenir uniquement
-- un hash (généré côté client via PBKDF2), jamais le mot de passe en clair.
-- L'app utilise profiles.password pour le verrouillage de profil (h1:...).
COMMENT ON COLUMN public.profiles.password IS 'Hash PBKDF2 du mot de passe de verrouillage (préfixe h1:). Ne jamais stocker en clair.';
