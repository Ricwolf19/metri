export type DocCategory =
  | 'getting-started'
  | 'calculators'
  | 'nutrition'
  | 'training'
  | 'recovery'
  | 'supplements'
  | 'progress'
  | 'glossary';

/** Ordered categories for grouping the docs list (mirrors metri.info). */
export const DOC_CATEGORIES: DocCategory[] = [
  'getting-started',
  'calculators',
  'nutrition',
  'training',
  'recovery',
  'supplements',
  'progress',
  'glossary',
];

export type DocSection = {
  id: string;
  category: DocCategory;
  title: string;
  /** Lowercase search tags (without '#'). */
  tags: string[];
  /** Markdown body, rendered with react-native-markdown-display. */
  body: string;
};
