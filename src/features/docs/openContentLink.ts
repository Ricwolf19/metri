import type { useRouter } from 'expo-router';
import { Linking } from 'react-native';

import type { CalcId } from '@/features/calculators/types';
import { WEB_URL } from '@/lib/env';

type Router = ReturnType<typeof useRouter>;

/**
 * Doc bodies are prose shared with the website, so their markdown links are WEB
 * paths (`/docs/x`, `/es/herramientas/calculadora-x`) — and Android has no
 * Activity for a bare path, so handing one to `Linking.openURL` throws.
 *
 * Resolution order: docs open in-app, known tool slugs open the in-app
 * calculator, anything else opens the website page in the browser. Never
 * throws; worst case is a captured no-op.
 */

/** Web tool slugs (EN + ES) → in-app calculator ids. Content-driven: covers
 * every slug the doc bodies link today; unknown slugs fall back to the site. */
const TOOL_SLUG_TO_CALC: Record<string, CalcId> = {
  '1rm-calculator': 'onerm',
  'calculadora-1rm': 'onerm',
  'tdee-calculator': 'tdee',
  'calculadora-tdee': 'tdee',
  'macro-calculator': 'macros',
  'calculadora-macros': 'macros',
  'body-fat-calculator': 'bodyfat',
  'calculadora-grasa-corporal': 'bodyfat',
  'ffmi-calculator': 'ffmi',
  'calculadora-ffmi': 'ffmi',
  'water-intake-calculator': 'water',
  'calculadora-agua': 'water',
  'ideal-weight-calculator': 'idealweight',
  'calculadora-peso-ideal': 'idealweight',
  'protein-calculator': 'protein',
  'calculadora-proteina': 'protein',
  'calorie-deficit-calculator': 'deficit',
  'calculadora-deficit-calorico': 'deficit',
  'bmi-calculator': 'bmi',
  'calculadora-imc': 'bmi',
  'lean-body-mass-calculator': 'leanmass',
  'lean-mass-calculator': 'leanmass',
  'calculadora-masa-magra': 'leanmass',
  'plate-calculator': 'plates',
  'plates-calculator': 'plates',
  'calculadora-discos': 'plates',
  'wilks-dots-calculator': 'wilks',
  'wilks-calculator': 'wilks',
  'calculadora-wilks-dots': 'wilks',
  'calculadora-wilks': 'wilks',
  'heart-rate-zone-calculator': 'heartrate',
  'heart-rate-calculator': 'heartrate',
  'calculadora-zonas-frecuencia-cardiaca': 'heartrate',
  'calculadora-frecuencia-cardiaca': 'heartrate',
  'calories-burned-calculator': 'calsburned',
  'calculadora-calorias-quemadas': 'calsburned',
  'waist-to-height-ratio-calculator': 'whtr',
  'calculadora-cintura-altura': 'whtr',
  'hydration-calculator': 'water',
  'macros-calculator': 'macros',
};

const openExternally = (url: string): void => {
  // No browser installed, or a scheme the OS refuses: environmental, and the
  // user already sees nothing happen. Not a defect to report.
  void Linking.openURL(url).catch(() => {});
};

/** Handle a markdown link tap. Returns false so the renderer's default
 * `Linking.openURL` never runs. */
export const openContentLink = (href: string, router: Router): false => {
  if (/^https?:\/\//.test(href)) {
    openExternally(href);
    return false;
  }
  if (!href.startsWith('/')) {
    // mailto:, tel:, anchors — hand to the OS as-is, guarded.
    openExternally(href);
    return false;
  }

  // Strip the web locale prefix: /es/docs/x → /docs/x, /es/herramientas → /herramientas.
  const path = href.replace(/^\/es(\/|$)/, '/');
  const [, section, slug] = path.split('/');

  if (section === 'docs' && slug) {
    router.push({ pathname: '/docs/[id]', params: { id: slug } });
    return false;
  }
  // The knowledge base's food tables link straight to the in-app food card.
  if (section === 'food' && slug) {
    router.push({ pathname: '/food/[id]', params: { id: slug } });
    return false;
  }
  const calcId =
    (section === 'tools' || section === 'herramientas') && slug
      ? TOOL_SLUG_TO_CALC[slug]
      : undefined;
  if (calcId) {
    router.push({ pathname: '/calculators/[id]', params: { id: calcId } });
    return false;
  }

  // Unknown web path — open the real page on the site.
  openExternally(`${WEB_URL}${href}`);
  return false;
};
