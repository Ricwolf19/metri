import type { ThemeScheme } from '@/theme/tokens';

/**
 * Theme-aware styles for react-native-markdown-display. The renderer uses inline
 * styles (not className), so we resolve concrete hex per scheme here.
 */
export const markdownStyles = (scheme: ThemeScheme) => {
  const dark = scheme === 'dark';
  const text = dark ? '#d7dce6' : '#1e232e';
  const heading = dark ? '#eef1f6' : '#11141b';
  const border = dark ? '#2c3447' : '#d1d6e0';
  const surface = dark ? '#141823' : '#f1f5f9';
  const accent = dark ? '#bef82b' : '#65a30d';

  return {
    body: { color: text, fontSize: 15, lineHeight: 23 },
    heading1: {
      color: heading,
      fontSize: 22,
      fontWeight: '700' as const,
      marginTop: 12,
      marginBottom: 6,
    },
    heading2: {
      color: heading,
      fontSize: 18,
      fontWeight: '700' as const,
      marginTop: 14,
      marginBottom: 6,
    },
    heading3: {
      color: heading,
      fontSize: 16,
      fontWeight: '700' as const,
      marginTop: 10,
      marginBottom: 4,
    },
    paragraph: { marginTop: 0, marginBottom: 12 },
    strong: { fontWeight: '700' as const, color: heading },
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
    code_inline: {
      backgroundColor: surface,
      color: heading,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    table: { borderColor: border, borderWidth: 1, borderRadius: 10, marginBottom: 12 },
    // Fixed column width so every row aligns; the table scrolls horizontally.
    th: {
      padding: 10,
      width: 150,
      backgroundColor: surface,
      color: heading,
      fontWeight: '700' as const,
    },
    td: { padding: 10, width: 150, color: text },
    tr: { borderColor: border },
    hr: { backgroundColor: border, height: 1, marginVertical: 12 },
    link: { color: accent },
  };
};
