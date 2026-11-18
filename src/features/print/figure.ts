import type { BodyPart, Slug } from 'react-native-body-highlighter';
import { bodyBack } from 'react-native-body-highlighter/dist/assets/bodyBack';
import { bodyFemaleBack } from 'react-native-body-highlighter/dist/assets/bodyFemaleBack';
import { bodyFemaleFront } from 'react-native-body-highlighter/dist/assets/bodyFemaleFront';
import { bodyFront } from 'react-native-body-highlighter/dist/assets/bodyFront';

import { HIDDEN_REGIONS } from '@/features/training/body-regions';

import { esc } from './html';
import { PRINT } from './palette';

/**
 * The muscle map as inline SVG for the PDF, from the SAME path data the app's
 * `BodyMap` draws (`react-native-body-highlighter`, MIT) — the printed figure
 * is the on-screen silhouette. Only the library's data modules are read here;
 * its component stays in `BodyMap.tsx`. The view boxes are the library's own
 * wrappers' (`SvgMaleWrapper` / `SvgFemaleWrapper`).
 */

type Side = 'front' | 'back';
type Figure = { viewBox: string; parts: BodyPart[] };

const FIGURES: Record<'male' | 'female', Record<Side, Figure>> = {
  male: {
    front: { viewBox: '0 0 724 1448', parts: bodyFront },
    back: { viewBox: '724 0 724 1448', parts: bodyBack },
  },
  female: {
    front: { viewBox: '-50 -40 734 1538', parts: bodyFemaleFront },
    back: { viewBox: '756 0 774 1448', parts: bodyFemaleBack },
  },
};

const pathsOf = (part: BodyPart): string[] => [
  ...(part.path?.common ?? []),
  ...(part.path?.left ?? []),
  ...(part.path?.right ?? []),
];

/** One side of the figure, each drawn region filled from `fills` (untrained otherwise). */
export const figureSvg = (input: {
  sex: 'male' | 'female';
  side: Side;
  fills: ReadonlyMap<Slug, string>;
  label: string;
}): string => {
  const figure = FIGURES[input.sex][input.side];
  const regions = figure.parts
    .filter((p) => p.slug && !HIDDEN_REGIONS.includes(p.slug))
    .map((p) => {
      const fill = (p.slug && input.fills.get(p.slug)) || PRINT.untrained;
      return `<g fill="${esc(fill)}" stroke="${PRINT.outline}" stroke-width="2">${pathsOf(p)
        .map((d) => `<path d="${esc(d)}"/>`)
        .join('')}</g>`;
    })
    .join('');
  return `<svg viewBox="${figure.viewBox}" role="img" aria-label="${esc(input.label)}" style="height:100%;width:auto;max-width:100%">${regions}</svg>`;
};
