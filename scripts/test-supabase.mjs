/**
 * Test Supabase : connexion, création de profil, sync.
 * Usage : node scripts/test-supabase.mjs
 * Nécessite un fichier .env avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const path = join(root, '.env');
  if (!existsSync(path)) {
    console.error('Fichier .env introuvable.');
    process.exit(1);
  }
  const content = readFileSync(path, 'utf8');
  content.split('\n').forEach((line) => {
    const i = line.indexOf('=');
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (k && v) process.env[k] = v;
    }
  });
}

loadEnv();
const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const testEmail = `test-${Date.now()}@supabase-test.local`;
const testPassword = 'TestPassword123!';

async function run() {
  console.log('1. Test connexion (getSession)...');
  const { data: session0, error: err0 } = await supabase.auth.getSession();
  if (err0) {
    console.error('   Échec:', err0.message);
    return;
  }
  console.log('   OK (session:', session0?.session ? 'existante' : 'vide', ')');

  console.log('2. Inscription test (signUp)...');
  const { data: signUpData, error: errSignUp } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: { emailRedirectTo: undefined }
  });
  if (errSignUp) {
    console.error('   Échec:', errSignUp.message);
    return;
  }
  const user = signUpData?.user;
  if (!user) {
    console.error('   Utilisateur non retourné');
    return;
  }
  console.log('   OK (user id:', user.id.slice(0, 8) + '...)');

  console.log('3. Création d’un profil (insert profiles)...');
  const profileId = crypto.randomUUID();
  const { error: errProfile } = await supabase.from('profiles').insert({
    id: profileId,
    user_id: user.id,
    name: 'Profil Test',
    gender: 'male',
    theme: 'light',
    accent_color: '#2E7D32',
    goals: {},
    memorizations: { surahParts: [], hizbs: [], juzz: [] },
    evaluation_history: [],
    evaluation_plans: [],
    badges: [],
    hadith_progress: {},
    hadith_history: [],
    difficulties: [],
    progression: null,
    plans: null
  });
  if (errProfile) {
    console.error('   Échec:', errProfile.message, errProfile.code);
    return;
  }
  console.log('   OK (profile id:', profileId.slice(0, 8) + '...)');

  console.log('4. Lecture des profils (select profiles)...');
  const { data: profiles, error: errList } = await supabase
    .from('profiles')
    .select('id, name, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (errList) {
    console.error('   Échec:', errList.message);
    return;
  }
  console.log('   OK (nombre:', profiles?.length ?? 0, ')');

  console.log('5. user_settings (upsert)...');
  const { error: errSettings } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      lang: 'fr',
      enable_notifications: true,
      notification_time: '09:00',
      active_profile_id: profileId,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );
  if (errSettings) {
    console.error('   Échec:', errSettings.message);
    return;
  }
  console.log('   OK');

  console.log('6. Lecture user_settings...');
  const { data: settings, error: errGetSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (errGetSettings) {
    console.error('   Échec:', errGetSettings.message);
    return;
  }
  console.log('   OK (active_profile_id:', settings?.active_profile_id?.slice(0, 8) + '...)');

  console.log('\nTous les tests Supabase sont passés.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
