import { THEME_VARS, type ThemeScheme } from '@/theme/tokens';

/**
 * Theme-aware styles for react-native-markdown-display. The renderer takes inline
 * styles (not className), so colours are resolved from the theme tokens here.
 * Every block the library ships a default for (fence, code_inline, link…) must be
 * overridden: its defaults are light-theme hex that leak through `mergeStyle`.
 */
export const markdownStyles = (scheme: ThemeScheme) => {
  const rgb = (token: string) => `rgb(${THEME_VARS[scheme][token]})`;
  const text = rgb('--ink-200');
  const heading = rgb('--ink-50');
  const border = rgb('--ink-600');
  const surface = rgb('--ink-850');
  const accent = rgb('--accent');
  const bold = { fontFamily: 'Geist_700Bold', fontWeight: '700' as const };
  const mono = { fontFamily: 'GeistMono_400Regular' };
  const codeBlock = {
    ...mono,
    color: rgb('--ink-100'),
    backgroundColor: surface,
    borderColor: border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  };

  return {
    body: { color: text, fontSize: 15, lineHeight: 23, fontFamily: 'Geist_400Regular' },
    heading1: { ...bold, color: heading, fontSize: 22, marginTop: 12, marginBottom: 6 },
    heading2: { ...bold, color: heading, fontSize: 18, marginTop: 14, marginBottom: 6 },
    heading3: { ...bold, color: heading, fontSize: 16, marginTop: 10, marginBottom: 4 },
    paragraph: { marginTop: 0, marginBottom: 12 },
    strong: { ...bold, color: heading },
    em: { fontStyle: 'italic' as const },
    bullet_list: { marginBottom: 8 },
    ordered_list: { marginBottom: 8 },
    list_item: { marginBottom: 4 },
    blockquote: {
      backgroundColor: surface,
      borderLeftColor: accent,
      borderLeftWidth: 3,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 12,
    },
    fence: codeBlock,
    code_block: codeBlock,
    code_inline: {
      ...mono,
      backgroundColor: surface,
      color: heading,
      borderWidth: 0,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      fontSize: 14,
    },
    table: { borderColor: border, borderWidth: 1, borderRadius: 10, marginBottom: 12 },
    // Fixed column width so every row aligns; the table scrolls horizontally.
    th: { ...bold, padding: 10, width: 150, backgroundColor: surface, color: heading },
    td: { padding: 10, width: 150, color: text },
    tr: { borderColor: border },
    hr: { backgroundColor: border, height: 1, marginVertical: 12 },
    link: { color: accent, textDecorationLine: 'underline' as const },
  };
};
