/**
 * Utilitaire de hachage pour le mot de passe de verrouillage de profil.
 * On ne stocke jamais le mot de passe en clair (ni en base ni en localStorage).
 */

const HASH_PREFIX = 'h1:';
const SALT_PREFIX = 'quran-companion-profile:';

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Indique si la valeur stockée est un hash (format attendu).
 */
export function isStoredHash(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith(HASH_PREFIX) && value.length > HASH_PREFIX.length;
}

/**
 * Hash le mot de passe avec le profil id comme sel (PBKDF2).
 * Retourne une chaîne du type "h1:<hex>" à stocker.
 */
export async function hashProfilePassword(profileId: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = encoder.encode(SALT_PREFIX + profileId);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return HASH_PREFIX + toHex(derived);
}

/**
 * Vérifie le mot de passe saisi contre la valeur stockée (hash ou legacy clair).
 * Pour la transition, si la valeur stockée n'est pas un hash, comparaison en clair (déprécié).
 */
export async function verifyProfilePassword(
  profileId: string,
  inputPassword: string,
  storedValue: string | null | undefined
): Promise<boolean> {
  if (!storedValue) return false;
  if (isStoredHash(storedValue)) {
    const inputHash = await hashProfilePassword(profileId, inputPassword);
    return inputHash === storedValue;
  }
  return inputPassword === storedValue;
}
