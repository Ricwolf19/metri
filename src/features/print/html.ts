import { PRINT } from './palette';

/**
 * The printed document's building blocks — the same structure as metri.info's
 * body page in print (header with an eyebrow, title and subtitle, a "printed
 * on" mono line, stat tiles, then sections of title + hint that never split
 * across a page). Pure string builders: every user-supplied string goes
 * through `esc`; parameters named `html` are markup a builder already made.
 */

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Text → safe inside an element or a quoted attribute. */
export const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ENTITIES[c]);

export type Tile = { label: string; value: string; unit?: string; tone?: 'brand' | 'warn' };

export const statTiles = (tiles: readonly Tile[]): string =>
  `<dl class="tiles">${tiles
    .map(
      (tile) =>
        `<div class="tile"><dt>${esc(tile.label)}</dt><dd class="${tile.tone ?? ''}">${esc(tile.value)}${
          tile.unit ? `<span class="unit">${esc(tile.unit)}</span>` : ''
        }</dd></div>`,
    )
    .join('')}</dl>`;

/** A titled block. It never splits across pages unless `flow` (a long one — a program phase —
 * whose rows refuse to split instead). */
export const section = (s: {
  title: string;
  hint?: string;
  html: string;
  flow?: boolean;
}): string =>
  `<section${s.flow ? ' class="flow"' : ''}><h2>${esc(s.title)}</h2>${s.hint ? `<p class="hint">${esc(s.hint)}</p>` : ''}<div class="section-body">${s.html}</div></section>`;

/** A line of muted copy, for an empty state or a note. */
export const note = (text: string): string => `<p class="note">${esc(text)}</p>`;

const STYLES = `
@page { size: A4; margin: 14mm 12mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: ${PRINT.paper}; color: ${PRINT.ink}; }
body { font-family: -apple-system, 'Roboto', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.mono { font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; }
header { border-bottom: 1px solid ${PRINT.rule}; padding-bottom: 14px; margin-bottom: 18px; }
.brand { font-weight: 700; letter-spacing: -0.02em; font-size: 15px; }
.eyebrow { margin: 10px 0 0; font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: ${PRINT.brandText}; }
h1 { margin: 4px 0 0; font-size: 24px; line-height: 1.2; font-weight: 700; }
.subtitle { margin: 6px 0 0; color: ${PRINT.muted}; font-size: 12px; max-width: 46em; }
.printed { margin: 10px 0 0; font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; font-size: 10px; color: ${PRINT.faint}; }
.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0; }
.tile { border: 1px solid ${PRINT.rule}; border-radius: 10px; padding: 10px 12px; break-inside: avoid; }
.tile dt { font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: ${PRINT.muted}; }
.tile dd { margin: 4px 0 0; font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; font-size: 20px; font-weight: 700; }
.tile dd.brand { color: ${PRINT.brandText}; }
.tile dd.warn { color: ${PRINT.under}; }
.unit { margin-left: 4px; font-size: 11px; font-weight: 400; color: ${PRINT.muted}; }
section { margin-top: 22px; break-inside: avoid; page-break-inside: avoid; }
section.flow { break-inside: auto; page-break-inside: auto; }
h2 { margin: 0; font-size: 15px; font-weight: 600; }
h3 { margin: 14px 0 6px; font-size: 13px; font-weight: 600; break-after: avoid; }
.hint { margin: 2px 0 0; color: ${PRINT.muted}; font-size: 11px; }
.section-body { margin-top: 10px; }
.card { border: 1px solid ${PRINT.rule}; border-radius: 12px; padding: 12px 14px; break-inside: avoid; }
.note { margin: 6px 0 0; color: ${PRINT.muted}; font-size: 11px; }
.axis { display: flex; justify-content: space-between; margin-top: 4px; font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; font-size: 9px; color: ${PRINT.faint}; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid ${PRINT.rule}; }
th { font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: ${PRINT.muted}; font-weight: 500; }
tr { break-inside: avoid; page-break-inside: avoid; }
.legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 8px; font-size: 10px; color: ${PRINT.muted}; }
.legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: -1px; }
footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid ${PRINT.rule}; color: ${PRINT.faint}; font-size: 9px; }
`;

export type DocumentInput = {
  lang: string;
  /** The document's <title> and the file a "save as" would suggest. */
  title: string;
  eyebrow: string;
  subtitle?: string | null;
  printedOn: string;
  footer: string;
  /** Extra document-specific CSS, appended after the shared sheet. */
  css?: string;
  html: string;
};

/** The whole printable page around `html`. */
export const documentHtml = (doc: DocumentInput): string =>
  `<!doctype html><html lang="${esc(doc.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(
    doc.title,
  )}</title><style>${STYLES}${doc.css ?? ''}</style></head><body><header><div class="brand">metri</div><p class="eyebrow">${esc(
    doc.eyebrow,
  )}</p><h1>${esc(doc.title)}</h1>${
    doc.subtitle ? `<p class="subtitle">${esc(doc.subtitle)}</p>` : ''
  }<p class="printed">${esc(doc.printedOn)}</p></header>${doc.html}<footer>${esc(
    doc.footer,
  )}</footer></body></html>`;
