import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

import type { LocaleCode } from '@/lib/storage';

import type { WeekDay, WidgetSnapshot } from './snapshot';

/** Mock month-over-month adherence — placeholder until the real metric lands. */
const MOCK_MONTHLY = [35, 42, 40, 55, 63, 78];

/** Brand-lime alpha ramp so the mock chart reads as "building toward now". */
const RAMP = ['#bef82b2e', '#bef82b47', '#bef82b61', '#bef82b85', '#bef82bb3', '#bef82b'] as const;

// Widgets render to RemoteViews outside the RN runtime: no NativeWind, no theme
// context. The brand palette is hard-coded for the always-dark widget surface.
const COLORS = {
  bg: '#0c0c0c',
  card: '#18181b',
  ink: '#09090b',
  text: '#fafafa',
  dim: '#a1a1aa',
  faint: '#71717a',
  muted: '#52525b',
  skipped: '#f87171',
  skippedBg: '#2a1215',
  accent: '#bef82b',
} as const;

const WEEKDAY_LETTERS = {
  es: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
} as const;

const MONTHS = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const;

const WEEKDAYS = {
  es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;

const dateLabel = (locale: LocaleCode): string => {
  const now = new Date();
  const wd = WEEKDAYS[locale][now.getDay()];
  const month = MONTHS[locale][now.getMonth()];
  return locale === 'es' ? `${wd} ${now.getDate()} ${month}` : `${wd}, ${month} ${now.getDate()}`;
};

const dayLetter = (date: string, locale: LocaleCode): string => {
  const [y, m, d] = date.split('-').map(Number);
  return WEEKDAY_LETTERS[locale][new Date(y, m - 1, d).getDay()];
};

const badgeLabel = (locale: LocaleCode, trained: boolean): string => {
  if (locale === 'es') return trained ? 'Hoy: entrenado' : 'Marcar hoy';
  return trained ? 'Today: trained' : 'Mark today';
};

const streakLabel = (locale: LocaleCode, n: number): string => {
  if (locale === 'es') return `Racha: ${n} ${n === 1 ? 'día' : 'días'}`;
  return `Streak: ${n} ${n === 1 ? 'day' : 'days'}`;
};

const chartLabel = (locale: LocaleCode): string =>
  locale === 'es' ? 'Mensual (demo)' : 'Monthly (demo)';

const PILLS = {
  es: ['Entrenar', 'Progreso', 'Fotos'],
  en: ['Train', 'Progress', 'Photos'],
} as const;
const PILL_URIS = ['metri://training', 'metri://metrics', 'metri://progress'];

/** Visual for one square of the week strip; today-pending gets an accent ring. */
const dayStyle = (day: WeekDay, isToday: boolean) => {
  if (day.status === 'trained') return { bg: COLORS.accent, fg: COLORS.ink, border: false };
  if (day.status === 'skipped') return { bg: COLORS.skippedBg, fg: COLORS.skipped, border: false };
  if (day.status === 'rest') return { bg: COLORS.card, fg: COLORS.dim, border: false };
  return isToday
    ? { bg: COLORS.bg, fg: COLORS.accent, border: true }
    : { bg: COLORS.card, fg: COLORS.muted, border: false };
};

type MetriWidgetProps = {
  snapshot: WidgetSnapshot | null;
  /** Widget height in dp, used to drop the pill row on short grids. */
  height?: number;
};

/**
 * The home-screen widget. Interactions: root opens the app; the badge marks
 * today as trained (headless write) or opens the training tab once trained;
 * the week strip opens training; TDEE/chart open metrics; pills deep-link to
 * training, metrics and progress photos.
 */
export const MetriWidget = ({ snapshot, height }: MetriWidgetProps) => {
  // The widget library calls this component as a raw function (outside React),
  // so the React Compiler must not inject its memo-cache hook here.
  'use no memo';

  const locale = snapshot?.locale ?? 'en';
  const trained = snapshot?.trainedToday ?? false;
  const tdee = snapshot?.tdee != null ? `${Math.round(snapshot.tdee)}` : '– –';
  const streak = snapshot?.streak ?? 0;
  const week = snapshot?.week ?? [];
  const showPills = (height ?? 999) >= 150;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <ImageWidget
          image={require('@/assets/images/favicon.png')}
          imageWidth={18}
          imageHeight={18}
          radius={4}
        />
        <TextWidget
          text="Metri"
          style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.accent, marginLeft: 7 }}
        />
        <FlexWidget style={{ flex: 1 }} />
        <TextWidget
          text={dateLabel(locale)}
          style={{ fontSize: 10, color: COLORS.faint, marginRight: 8 }}
        />
        {trained ? (
          <FlexWidget
            clickAction="OPEN_URI"
            clickActionData={{ uri: 'metri://training' }}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <TextWidget
              text={badgeLabel(locale, trained)}
              style={{ fontSize: 11, color: COLORS.accent }}
            />
          </FlexWidget>
        ) : (
          <FlexWidget
            clickAction="MARK_TRAINED"
            style={{
              backgroundColor: COLORS.accent,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <TextWidget
              text={badgeLabel(locale, trained)}
              style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.ink }}
            />
          </FlexWidget>
        )}
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginTop: 6,
        }}
      >
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'metri://metrics' }}
          style={{ flex: 1, flexDirection: 'column' }}
        >
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <TextWidget
              text={tdee}
              style={{ fontSize: 30, fontWeight: 'bold', color: COLORS.text }}
            />
            <TextWidget
              text="kcal · TDEE"
              style={{ fontSize: 11, color: COLORS.dim, marginLeft: 6, marginBottom: 5 }}
            />
          </FlexWidget>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <FlexWidget
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent }}
            />
            <TextWidget
              text={streakLabel(locale, streak)}
              style={{ fontSize: 12, color: COLORS.accent, marginLeft: 5 }}
            />
          </FlexWidget>
        </FlexWidget>

        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'metri://metrics' }}
          style={{ flexDirection: 'column', alignItems: 'flex-end' }}
        >
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            {MOCK_MONTHLY.map((value, i) => (
              <FlexWidget
                key={`bar-${i}`}
                style={{
                  width: 10,
                  height: Math.round(value * 0.45),
                  borderRadius: 3,
                  marginLeft: i === 0 ? 0 : 3,
                  backgroundColor: RAMP[i],
                }}
              />
            ))}
          </FlexWidget>
          <TextWidget
            text={chartLabel(locale)}
            style={{ fontSize: 9, color: COLORS.faint, marginTop: 3 }}
          />
        </FlexWidget>
      </FlexWidget>

      {week.length === 7 ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'metri://training' }}
          style={{ width: 'match_parent', flexDirection: 'row', marginTop: 8 }}
        >
          {week.map((day, i) => {
            const visual = dayStyle(day, i === week.length - 1);
            return (
              <FlexWidget
                key={day.date}
                style={{
                  flex: 1,
                  height: 20,
                  borderRadius: 6,
                  marginLeft: i === 0 ? 0 : 4,
                  backgroundColor: visual.bg,
                  ...(visual.border ? { borderWidth: 1, borderColor: COLORS.accent } : {}),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TextWidget
                  text={dayLetter(day.date, locale)}
                  style={{ fontSize: 9, fontWeight: 'bold', color: visual.fg }}
                />
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ) : null}

      {showPills ? (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', marginTop: 8 }}>
          {PILLS[locale].map((label, i) => (
            <FlexWidget
              key={label}
              clickAction="OPEN_URI"
              clickActionData={{ uri: PILL_URIS[i] }}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginLeft: i === 0 ? 0 : 6,
              }}
            >
              <TextWidget text={label} style={{ fontSize: 10, color: COLORS.dim }} />
            </FlexWidget>
          ))}
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
};
