export type DocCategory =
  | 'getting-started'
  /** Using the app itself: modules, tips, UI conventions, FAQ. */
  | 'app'
  | 'calculators'
  | 'nutrition'
  | 'training'
  | 'cardio'
  | 'recovery'
  | 'supplements'
  | 'progress'
  | 'glossary';

export type DocSection = {
  id: string;
  category: DocCategory;
  title: string;
  /** Lowercase search tags (without '#'). */
  tags: string[];
  /** Markdown body, rendered with react-native-markdown-display. */
  body: string;
};
