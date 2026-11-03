import { router } from 'expo-router';
import { Text, View } from 'react-native';
import type { ASTNode, RenderRules } from 'react-native-markdown-display';

import { openContentLink } from './openContentLink';

/** Recursively pull the plain text out of a markdown AST node (handles **bold**, etc.). */
const nodeText = (node: ASTNode | undefined): string => {
  if (!node) return '';
  if (typeof node.content === 'string' && node.content.length) return node.content;
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
  return '';
};

const childrenOfType = (node: ASTNode | undefined, type: string): ASTNode[] =>
  (node?.children ?? []).filter((c) => c.type === type);

/** The first link inside a node, if any (`[Oats](/food/oats)` in a food table). */
const linkIn = (node: ASTNode | undefined): string | null => {
  if (!node) return null;
  const href = node.type === 'link' ? node.attributes?.href : null;
  if (typeof href === 'string' && href) return href;
  for (const child of node.children ?? []) {
    const found = linkIn(child);
    if (found) return found;
  }
  return null;
};

/** One table cell: its text, and where it leads when it was a link. */
type Cell = { text: string; href: string | null };

const cellOf = (node: ASTNode): Cell => ({ text: nodeText(node), href: linkIn(node) });

/**
 * A cell's text; a linked one is tappable and looks like every other link in
 * the docs (lime, underlined) — the food tables say "tap a food", and the
 * flattened text used to swallow the link.
 */
const CellText = ({ cell, className }: { cell: Cell; className: string }) => (
  <Text
    onPress={cell.href ? () => openContentLink(cell.href ?? '', router) : undefined}
    accessibilityRole={cell.href ? 'link' : undefined}
    className={[className, cell.href ? 'text-accent underline' : ''].join(' ')}
  >
    {cell.text}
  </Text>
);

/** Up to this many columns a phone-width grid still reads; wider tables stack. */
const GRID_MAX_COLUMNS = 4;

/**
 * A markdown table as a compact grid: one header line, one row per line, the
 * first column a little wider and bold. Cells wrap rather than scroll, so the
 * grid never overflows the screen. A row per card (the previous layout) spent
 * a whole card on three numbers and read like a form.
 */
const GridTable = ({ headers, rows }: { headers: string[]; rows: Cell[][] }) => (
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
          <CellText
            key={c}
            cell={cells[c] ?? { text: '', href: null }}
            className={[
              'text-sm leading-5',
              c === 0 ? 'flex-[1.3] font-sans-semibold text-ink-50' : 'flex-1 pl-2 text-ink-200',
            ].join(' ')}
          />
        ))}
      </View>
    ))}
  </View>
);

/** A wide table (more columns than a grid can hold): one card per row, labelled lines. */
const StackedTable = ({ headers, rows }: { headers: string[]; rows: Cell[][] }) => (
  <View className="mb-3 gap-2">
    {rows.map((cells, r) => (
      <View key={r} className="rounded-card border border-ink-700 bg-ink-850 p-3">
        {cells.map((cell, c) =>
          !cell.text ? null : c === 0 ? (
            <CellText key={c} cell={cell} className="text-[15px] font-sans-semibold text-ink-50" />
          ) : (
            <View key={c} className="mt-1.5 flex-row items-baseline gap-2">
              {headers[c] ? (
                <Text className="w-20 font-mono-medium text-[10px] uppercase tracking-wider text-ink-400">
                  {headers[c]}
                </Text>
              ) : null}
              <CellText cell={cell} className="flex-1 text-sm leading-5 text-ink-200" />
            </View>
          ),
        )}
      </View>
    ))}
  </View>
);

/**
 * Markdown render overrides. Tables render as a grid (or stacked cards when
 * too wide), never a horizontally scrolling block, and fall back to the
 * default renderer if the structure can't be parsed. A soft break (a line
 * break inside a paragraph of the source) is a space: the library draws a
 * '\n', and the bodies are hard-wrapped at 80 columns, so every paragraph broke
 * early on a phone — one extra `<Text>` per source line, too.
 */
export const markdownRules: RenderRules = {
  softbreak: (node) => <Text key={node.key}> </Text>,
  table: (node, children) => {
    const thead = childrenOfType(node, 'thead')[0];
    const tbody = childrenOfType(node, 'tbody')[0];
    const headerRow = childrenOfType(thead, 'tr')[0];
    const headers = (headerRow?.children ?? []).map(nodeText);
    const rows = childrenOfType(tbody, 'tr').map((tr) => (tr.children ?? []).map(cellOf));

    if (rows.length === 0) return <View key={node.key}>{children}</View>;
    return headers.length <= GRID_MAX_COLUMNS ? (
      <GridTable key={node.key} headers={headers} rows={rows} />
    ) : (
      <StackedTable key={node.key} headers={headers} rows={rows} />
    );
  },
};
