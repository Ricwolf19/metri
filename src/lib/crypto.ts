import * as Crypto from 'expo-crypto';

/**
 * Local password hashing.
 *
 * The app is offline and single-device, so there is no network attack surface.
 * We salt each password with random bytes and key-stretch with iterated SHA-512
 * to slow offline brute-force against the on-device database. This is good
 * enough for the local-only v1; when a server lands, hashing moves server-side
 * to a memory-hard KDF (Argon2/bcrypt) and this becomes the offline cache only.
 */
const ITERATIONS = 150;

export const randomId = (): string => Crypto.randomUUID();

export const generateSalt = async (): Promise<string> => {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const hashPassword = async (password: string, salt: string): Promise<string> => {
  let hash = `${salt}:${password}`;
  for (let i = 0; i < ITERATIONS; i++) {
    hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, `${salt}${hash}`);
  }
  return hash;
};

export const verifyPassword = async (
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> => {
  const actual = await hashPassword(password, salt);
  // Length-then-content compare; timing is irrelevant on-device but keep it tidy.
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
};
