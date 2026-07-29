/**
 * Fails (exit 1) on i18n keys defined in `en.ts` that no source file references.
 *
 * A key counts as used when its quoted string appears anywhere (t() call or
 * data like `titleKey:`), or when it sits under a template-literal prefix
 * (`` t(`activity.${level}`) `` marks all `activity.*` used) — prefixes are
 * discovered from the source, not hard-coded. EN↔ES parity is tsc's job
 * (`es` is `Record<TranslationKey, string>`), not this script's.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { en } from '../src/i18n/en';

// Runs from the repo root (`bun run i18n:check`).
const SRC = join(process.cwd(), 'src');
// Only the dictionaries are excluded — the rest of src/i18n/ (LOCALES in
// index.tsx, LocaleToggle) consumes keys like any other source.
const DICTIONARIES = new Set([join(SRC, 'i18n', 'en.ts'), join(SRC, 'i18n', 'es.ts')]);

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name: string) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !DICTIONARIES.has(path) ? [path] : [];
  });

const corpus = sourceFiles(SRC)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

// `t(`activity.${...}`)` etc. — every `prefix.${` inside a template literal.
const dynamicPrefixes = [...corpus.matchAll(/`([a-zA-Z][a-zA-Z0-9.]*\.)\$\{/g)].map((m) => m[1]);

const keys = Object.keys(en);
const dead = keys.filter(
  (key) =>
    !corpus.includes(`'${key}'`) &&
    !corpus.includes(`"${key}"`) &&
    !dynamicPrefixes.some((prefix) => key.startsWith(prefix)),
);

if (dead.length > 0) {
  console.error(`Dead i18n keys (${dead.length}) — defined in en.ts but never referenced:`);
  for (const key of dead) console.error(`  ${key}`);
  console.error('\nRemove them from BOTH src/i18n/en.ts and src/i18n/es.ts.');
  process.exit(1);
}

console.log(
  `i18n: all ${keys.length} keys are referenced (${dynamicPrefixes.length} dynamic prefixes).`,
);
