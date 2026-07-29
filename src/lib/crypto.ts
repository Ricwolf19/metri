import * as Crypto from 'expo-crypto';

/**
 * Random id generation.
 *
 * The local password hashing that used to live here (salt + 150 iterations of
 * SHA-512) is gone: authentication moved to the server via Better Auth, which
 * uses a memory-hard KDF. The old primitives were dead code, but keeping them
 * meant the on-device hashes stayed one wiring change away from being a real
 * local-auth bypass — and 150 rounds of SHA-512 is trivially crackable off a
 * copied database file. Migration 0014 purges the stored values.
 *
 * Never reintroduce credential hashing on the device.
 */
export const randomId = (): string => Crypto.randomUUID();
