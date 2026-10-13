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

/** Up to this many columns a phone-width grid still reads; wider tables stack. */
const GRID_MAX_COLUMNS = 4;

/**
 * A markdown table as a compact grid: one header line, one row per line, the
 * first column a little wider and bold. Cells wrap rather than scroll, so the
 * grid never overflows the screen. A row per card (the previous layout) spent
 * a whole card on three numbers and read like a form.
 */
const GridTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <View className="mb-3 overflow-hidden rounded-card border border-ink-700">
    <View className="flex-row border-b border-ink-700 bg-ink-850 px-3 py-2">
      {headers.map((h, c) => (
        <Text
          key={c}
          className={[
            'font-mono-medium text-[10px] uppercase tracking-wider text-ink-400',
            c === 0 ? 'flex-[1.3]' : 'flex-1 pl-2',
          ].join(' ')}
        >
          {h}
        </Text>
      ))}
    </View>
    {rows.map((cells, r) => (
      <View
        key={r}
        className={[
          'flex-row px-3 py-2',
          r < rows.length - 1 ? 'border-b border-ink-800' : '',
        ].join(' ')}
      >
        {headers.map((_, c) => (
          <Text
            key={c}
            className={[
              'text-sm leading-5',
              c === 0 ? 'flex-[1.3] font-sans-semibold text-ink-50' : 'flex-1 pl-2 text-ink-200',
            ].join(' ')}
          >
            {cells[c] ?? ''}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

/** A wide table (more columns than a grid can hold): one card per row, labelled lines. */
const StackedTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <View className="mb-3 gap-2">
    {rows.map((cells, r) => (
      <View key={r} className="rounded-card border border-ink-700 bg-ink-850 p-3">
        {cells.map((value, c) =>
          !value ? null : c === 0 ? (
            <Text key={c} className="text-[15px] font-sans-semibold text-ink-50">
              {value}
            </Text>
          ) : (
            <View key={c} className="mt-1.5 flex-row items-baseline gap-2">
              {headers[c] ? (
                <Text className="w-20 font-mono-medium text-[10px] uppercase tracking-wider text-ink-400">
                  {headers[c]}
                </Text>
              ) : null}
              <Text className="flex-1 text-sm leading-5 text-ink-200">{value}</Text>
            </View>
          ),
        )}
      </View>
    ))}
  </View>
);

/**
 * Markdown render override: tables as a grid (or stacked cards when too wide),
 * never a horizontally scrolling block. Falls back to the default renderer if
 * the table structure can't be parsed.
 */
export const markdownRules: RenderRules = {
  table: (node, children) => {
    const thead = childrenOfType(node, 'thead')[0];
    const tbody = childrenOfType(node, 'tbody')[0];
    const headerRow = childrenOfType(thead, 'tr')[0];
    const headers = (headerRow?.children ?? []).map(nodeText);
    const rows = childrenOfType(tbody, 'tr').map((tr) => (tr.children ?? []).map(nodeText));

    if (rows.length === 0) return <View key={node.key}>{children}</View>;
    return headers.length <= GRID_MAX_COLUMNS ? (
      <GridTable key={node.key} headers={headers} rows={rows} />
    ) : (
      <StackedTable key={node.key} headers={headers} rows={rows} />
    );
  },
};
