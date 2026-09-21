import type { useRouter } from 'expo-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// `react-native` ships Flow source that the node test runner cannot parse, and
// `expo-constants` (pulled in by `@/lib/env`) needs the RN globals. Both are
// stubbed so the resolution logic itself can be exercised as plain JS.
const { openURL } = vi.hoisted(() => ({ openURL: vi.fn(() => Promise.resolve(true)) }));

vi.mock('react-native', () => ({ Linking: { openURL } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));

const { WEB_URL } = await import('@/lib/env');
const { openContentLink } = await import('./openContentLink');

type Router = ReturnType<typeof useRouter>;

const push = vi.fn();
const router = { push } as unknown as Router;

beforeEach(() => {
  push.mockClear();
  openURL.mockClear();
});

describe('in-app routes', () => {
  it('pushes the docs screen for a /docs/<slug> link', () => {
    openContentLink('/docs/progressive-overload', router);
    expect(push).toHaveBeenCalledWith({
      pathname: '/docs/[id]',
      params: { id: 'progressive-overload' },
    });
    expect(openURL).not.toHaveBeenCalled();
  });

  it('pushes the food card for a /food/<slug> link', () => {
    openContentLink('/food/oats', router);
    expect(push).toHaveBeenCalledWith({ pathname: '/food/[id]', params: { id: 'oats' } });
  });

  it('opens the website for a bare /docs with no slug', () => {
    openContentLink('/docs', router);
    expect(push).not.toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(`${WEB_URL}/docs`);
  });
});

describe('the locale prefix', () => {
  it('strips /es/ before resolving a docs link', () => {
    openContentLink('/es/docs/sobrecarga-progresiva', router);
    expect(push).toHaveBeenCalledWith({
      pathname: '/docs/[id]',
      params: { id: 'sobrecarga-progresiva' },
    });
  });

  it('strips /es/ before resolving a tool link', () => {
    openContentLink('/es/herramientas/calculadora-1rm', router);
    expect(push).toHaveBeenCalledWith({ pathname: '/calculators/[id]', params: { id: 'onerm' } });
  });

  it('does not strip a path that merely starts with the letters es', () => {
    openContentLink('/estimator/x', router);
    expect(push).not.toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(`${WEB_URL}/estimator/x`);
  });
});

describe('tool slugs resolve to the same calculator in both locales', () => {
  // The contract that keeps growing: every EN slug the web publishes and its ES
  // counterpart must land on one in-app calculator id.
  const pairs: readonly (readonly [en: string, es: string, calcId: string])[] = [
    ['1rm-calculator', 'calculadora-1rm', 'onerm'],
    ['tdee-calculator', 'calculadora-tdee', 'tdee'],
    ['macro-calculator', 'calculadora-macros', 'macros'],
    ['body-fat-calculator', 'calculadora-grasa-corporal', 'bodyfat'],
    ['ffmi-calculator', 'calculadora-ffmi', 'ffmi'],
    ['water-intake-calculator', 'calculadora-agua', 'water'],
    ['ideal-weight-calculator', 'calculadora-peso-ideal', 'idealweight'],
    ['protein-calculator', 'calculadora-proteina', 'protein'],
    ['calorie-deficit-calculator', 'calculadora-deficit-calorico', 'deficit'],
    ['bmi-calculator', 'calculadora-imc', 'bmi'],
    ['lean-body-mass-calculator', 'calculadora-masa-magra', 'leanmass'],
    ['plate-calculator', 'calculadora-discos', 'plates'],
    ['wilks-dots-calculator', 'calculadora-wilks-dots', 'wilks'],
    ['heart-rate-zone-calculator', 'calculadora-zonas-frecuencia-cardiaca', 'heartrate'],
    ['calories-burned-calculator', 'calculadora-calorias-quemadas', 'calsburned'],
    ['waist-to-height-ratio-calculator', 'calculadora-cintura-altura', 'whtr'],
  ];

  it.each(pairs)('%s and %s both open %s', (en, es, calcId) => {
    openContentLink(`/tools/${en}`, router);
    openContentLink(`/es/herramientas/${es}`, router);
    expect(push).toHaveBeenCalledTimes(2);
    expect(push.mock.calls.map(([arg]) => arg)).toEqual([
      { pathname: '/calculators/[id]', params: { id: calcId } },
      { pathname: '/calculators/[id]', params: { id: calcId } },
    ]);
    expect(openURL).not.toHaveBeenCalled();
  });

  it.each([
    ['lean-mass-calculator', 'leanmass'],
    ['plates-calculator', 'plates'],
    ['wilks-calculator', 'wilks'],
    ['heart-rate-calculator', 'heartrate'],
    ['calculadora-wilks', 'wilks'],
    ['calculadora-frecuencia-cardiaca', 'heartrate'],
    ['hydration-calculator', 'water'],
    ['macros-calculator', 'macros'],
  ])('accepts the alias %s', (slug, calcId) => {
    openContentLink(`/tools/${slug}`, router);
    expect(push).toHaveBeenCalledWith({ pathname: '/calculators/[id]', params: { id: calcId } });
  });

  it('only treats /tools and /herramientas as calculator sections', () => {
    openContentLink('/blog/1rm-calculator', router);
    expect(push).not.toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(`${WEB_URL}/blog/1rm-calculator`);
  });
});

describe('fallbacks', () => {
  it('sends an unknown tool slug to the website instead of throwing', () => {
    expect(() => openContentLink('/tools/not-a-calculator', router)).not.toThrow();
    expect(push).not.toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(`${WEB_URL}/tools/not-a-calculator`);
  });

  it('keeps the original href — locale prefix included — when falling back', () => {
    openContentLink('/es/herramientas/calculadora-inventada', router);
    expect(openURL).toHaveBeenCalledWith(`${WEB_URL}/es/herramientas/calculadora-inventada`);
  });

  it('opens an absolute URL externally and never touches the router', () => {
    openContentLink('https://example.com/a?b=c#d', router);
    expect(openURL).toHaveBeenCalledWith('https://example.com/a?b=c#d');
    expect(push).not.toHaveBeenCalled();
  });

  it('opens a plain http URL externally too', () => {
    openContentLink('http://example.com', router);
    expect(openURL).toHaveBeenCalledWith('http://example.com');
    expect(push).not.toHaveBeenCalled();
  });

  it('hands a non-path scheme to the OS unchanged', () => {
    openContentLink('mailto:hola@metri.info', router);
    expect(openURL).toHaveBeenCalledWith('mailto:hola@metri.info');
    expect(push).not.toHaveBeenCalled();
  });

  it('swallows a rejected openURL — no browser is environmental, not a defect', async () => {
    openURL.mockRejectedValueOnce(new Error('no activity found'));
    expect(() => openContentLink('https://example.com', router)).not.toThrow();
    await Promise.resolve();
  });
});

describe('the return value', () => {
  it('is always false, so the markdown renderer suppresses its own handler', () => {
    const hrefs = [
      'https://example.com',
      'mailto:hola@metri.info',
      '/docs/progressive-overload',
      '/food/oats',
      '/tools/1rm-calculator',
      '/es/herramientas/calculadora-tdee',
      '/tools/not-a-calculator',
      '/whatever',
    ];
    for (const href of hrefs) expect(openContentLink(href, router)).toBe(false);
  });
});
