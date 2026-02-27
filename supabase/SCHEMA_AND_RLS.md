# Schéma Supabase et RLS – Vérification

## Tables attendues (utilisées par l’app)

### 1. `public.profiles`
- **Colonnes** : `id` (UUID PK), `user_id` (UUID FK → auth.users), `name`, `gender`, `password`, `theme`, `accent_color`, `goals` (JSONB), `memorizations` (JSONB), `evaluation_history` (JSONB), `evaluation_plans` (JSONB), `badges` (JSONB), `hadith_progress` (JSONB), `hadith_history` (JSONB), `difficulties` (JSONB), `progression` (JSONB), `plans` (JSONB), `created_at`, `updated_at`.
- **RLS** : activé.
- **Politiques** :
  - SELECT / INSERT / UPDATE / DELETE : `auth.uid() = user_id`.

### 2. `public.user_settings`
- **Colonnes** : `id` (UUID PK), `user_id` (UUID UNIQUE FK → auth.users), `lang`, `enable_notifications`, `notification_time`, `active_profile_id` (FK → profiles), `updated_at`.
- **RLS** : activé.
- **Politiques** : ALL avec `auth.uid() = user_id` (USING et WITH CHECK).

## Migrations

1. `20240225000000_initial_schema.sql` : crée `profils` et `paramètres utilisateur` (anciens noms).
2. `20240225000001_fix_schema.sql` : crée `profiles` et `user_settings` (noms utilisés par l’app), RLS et index.

L’app utilise **uniquement** `profiles` et `user_settings`. Les anciennes tables `profils` et `paramètres utilisateur` peuvent rester en base si déjà présentes (elles ne sont pas utilisées).

## Vérifier en projet lié

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db diff
npx supabase migration list
```

Pour appliquer les migrations sur le projet distant :

```bash
npx supabase db push
```

(Requiert un projet lié et les droits nécessaires.)
