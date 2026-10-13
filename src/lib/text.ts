/** "Curl Araña" → "curl arana": lowercase, accents stripped (NFD, combining marks dropped) — the one matching key for every search in the app. */
export const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
