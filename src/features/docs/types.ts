export type DocCategory = 'glossary' | 'nutrition' | 'training' | 'supplements' | 'progress';

/** Ordered categories for grouping the docs list. */
export const DOC_CATEGORIES: DocCategory[] = [
  'nutrition',
  'training',
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
