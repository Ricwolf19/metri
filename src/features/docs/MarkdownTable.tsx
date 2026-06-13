import { Text, View } from 'react-native';
import type { ASTNode, RenderRules } from 'react-native-markdown-display';

/** Recursively pull the plain text out of a markdown AST node (handles **bold**, etc.). */
const nodeText = (node: ASTNode | undefined): string => {
  if (!node) return '';
  if (typeof node.content === 'string' && node.content.length) return node.content;
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
  return '';
};

const childrenOfType = (node: ASTNode | undefined, type: string): ASTNode[] =>
  (node?.children ?? []).filter((c) => c.type === type);

/**
 * A markdown table rendered as a stack of cards instead of a horizontally
 * scrolling grid — far more readable on a phone. Each row becomes a card: the
 * first column is the title, and any remaining columns show as labelled lines
 * (using the table headers as labels).
 */
const ReadableTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <View className="mb-3 gap-2">
    {rows.map((cells, r) => (
      <View key={r} className="rounded-xl border border-ink-700 bg-ink-850 p-3">
        {cells.map((value, c) => {
          if (!value) return null;
          // First column is the row's headline; the rest are labelled details.
          if (c === 0) {
            return (
              <Text key={c} className="text-[15px] font-semibold text-ink-50">
                {value}
              </Text>
            );
          }
          return (
            <View key={c} className={c === 1 && cells[0] ? 'mt-2' : 'mt-1.5'}>
              {headers[c] ? (
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  {headers[c]}
                </Text>
              ) : null}
              <Text className="text-sm leading-5 text-ink-200">{value}</Text>
            </View>
          );
        })}
      </View>
    ))}
  </View>
);

/**
 * Markdown render override: turn tables into a readable stacked-card layout
 * (no horizontal scrolling). Falls back to the default renderer if the table
 * structure can't be parsed.
 */
export const markdownRules: RenderRules = {
  table: (node, children) => {
    const thead = childrenOfType(node, 'thead')[0];
    const tbody = childrenOfType(node, 'tbody')[0];
    const headerRow = childrenOfType(thead, 'tr')[0];
    const headers = (headerRow?.children ?? []).map(nodeText);
    const rows = childrenOfType(tbody, 'tr').map((tr) => (tr.children ?? []).map(nodeText));

    if (rows.length === 0) return <View key={node.key}>{children}</View>;
    return <ReadableTable key={node.key} headers={headers} rows={rows} />;
  },
};
