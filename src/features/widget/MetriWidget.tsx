import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

import { localDateKey } from '@/features/training/dates';
import { weekdayLetter } from '@/features/training/labels';
import type { LocaleCode } from '@/lib/storage';

import { dayVisual, WIDGET_COLORS as C, type WidgetSnapshot } from './snapshot';

const MONTHS = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const;

const WEEKDAYS = {
  es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;

const dateLabel = (locale: LocaleCode, now: Date): string => {
  const wd = WEEKDAYS[locale][now.getDay()];
  const month = MONTHS[locale][now.getMonth()];
  return locale === 'es' ? `${wd} ${now.getDate()} ${month}` : `${wd}, ${month} ${now.getDate()}`;
};

const dayLetter = (date: string, locale: LocaleCode): string => {
  const [y, m, d] = date.split('-').map(Number);
  return weekdayLetter(locale, new Date(y, m - 1, d).getDay() + 1);
};

const PILL_URIS = ['metri://training', 'metri://metrics', 'metri://progress'];
/** Tallest monthly bar, in dp. */
const BAR_MAX = 30;

type MetriWidgetProps = {
  snapshot: WidgetSnapshot | null;
  /** Widget height in dp, used to drop the pill row on short grids. */
  height?: number;
};

/**
 * The home-screen widget, in four rows: the header (date and how today
 * stands), the session — the workout in progress with its next set, else the
 * split up next and when — beside six months of finished sessions, the
 * current week Monday-first in the adherence colours, and on a tall grid the
 * shortcuts. Taps: the session row opens the workout (or the Train tab), the
 * chart and TDEE open Metrics, "Mark today" marks the day headlessly and only
 * shows while today is unmarked and no workout is open.
 */
export const MetriWidget = ({ snapshot, height }: MetriWidgetProps) => {
  // The widget library calls this component as a raw function (outside React),
  // so the React Compiler must not inject its memo-cache hook here.
  'use no memo';

  const now = new Date();
  const locale = snapshot?.locale ?? 'en';
  const week = snapshot?.week ?? [];
  const todayKey = week.find((d) => d.date === localDateKey(now))?.date ?? null;
  const live = snapshot?.live ?? null;
  const next = snapshot?.next ?? null;
  const monthly = snapshot?.monthly ?? [];
  const peak = Math.max(1, ...monthly);
  const showPills = (height ?? 999) >= 150;
  const canMark = !!snapshot && !live && snapshot.today === 'none';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: C.bg,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      {/* Header: the mark, the date, how today stands. */}
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <ImageWidget
          image={require('@/assets/images/favicon.png')}
          imageWidth={18}
          imageHeight={18}
          radius={4}
        />
        <TextWidget
          text="metri"
          style={{ fontSize: 13, fontWeight: 'bold', color: C.brand, marginLeft: 7 }}
        />
        <FlexWidget style={{ flex: 1 }} />
        <TextWidget
          text={dateLabel(locale, now)}
          style={{ fontSize: 10, color: C.faint, marginRight: 8 }}
        />
        {snapshot ? (
          <FlexWidget
            {...(canMark
              ? { clickAction: 'MARK_TRAINED' }
              : {
                  clickAction: 'OPEN_URI',
                  clickActionData: { uri: live?.url ?? 'metri://training' },
                })}
            style={{
              backgroundColor: canMark || live ? C.brand : C.card,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <TextWidget
              text={snapshot.copy.badge}
              style={{
                fontSize: 11,
                fontWeight: canMark || live ? 'bold' : 'normal',
                color: canMark || live ? C.onBrand : C.brand,
              }}
            />
          </FlexWidget>
        ) : null}
      </FlexWidget>

      {/* The session, and six months of them. */}
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
          clickActionData={{ uri: live?.url ?? 'metri://training' }}
          style={{ flex: 1, flexDirection: 'column', marginRight: 8 }}
        >
          <TextWidget
            text={live ? (live.line ?? live.title) : (next?.name ?? snapshot?.copy.empty ?? '')}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 16, fontWeight: 'bold', color: live ? C.brand : C.text }}
          />
          <TextWidget
            text={live ? live.title : next ? (next.when ?? '') : (snapshot?.copy.emptyHint ?? '')}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 11, color: C.dim, marginTop: 1 }}
          />
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <FlexWidget
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand }}
            />
            <TextWidget
              text={snapshot?.copy.streak ?? ''}
              style={{ fontSize: 11, color: C.brand, marginLeft: 5 }}
            />
          </FlexWidget>
        </FlexWidget>

        {monthly.length ? (
          <FlexWidget
            clickAction="OPEN_URI"
            clickActionData={{ uri: 'metri://metrics' }}
            style={{ flexDirection: 'column', alignItems: 'flex-end' }}
          >
            <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              {monthly.map((count, i) => (
                <FlexWidget
                  key={`bar-${i}`}
                  style={{
                    width: 10,
                    marginLeft: i ? 3 : 0,
                    // An empty month still shows a stub: a missing bar reads as no data.
                    height: Math.max(3, Math.round((count / peak) * BAR_MAX)),
                    borderRadius: 3,
                    backgroundColor: i === monthly.length - 1 ? C.brand : C.muted,
                  }}
                />
              ))}
            </FlexWidget>
            <TextWidget
              text={snapshot?.copy.monthly ?? ''}
              style={{ fontSize: 10, color: C.faint, marginTop: 3 }}
            />
          </FlexWidget>
        ) : null}
      </FlexWidget>

      {/* The week, Monday first. */}
      {week.length === 7 ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'metri://training' }}
          {...(snapshot?.copy.week ? { accessibilityLabel: snapshot.copy.week } : {})}
          style={{ width: 'match_parent', flexDirection: 'row', marginTop: 8 }}
        >
          {week.map((day, i) => {
            const when =
              day.date === todayKey ? 'today' : todayKey && day.date > todayKey ? 'future' : 'past';
            const visual = dayVisual(day.status, when);
            const border = visual.ring ? C.brand : visual.outline ? C.muted : null;
            return (
              <FlexWidget
                key={day.date}
                style={{
                  flex: 1,
                  height: 20,
                  borderRadius: 6,
                  marginLeft: i === 0 ? 0 : 4,
                  backgroundColor: visual.bg,
                  ...(border ? { borderWidth: 1, borderColor: border } : {}),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TextWidget
                  text={`${dayLetter(day.date, locale)}${visual.cross ? ' ×' : ''}`}
                  style={{ fontSize: 10, fontWeight: 'bold', color: visual.fg }}
                />
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ) : null}

      {/* Tall grids: the shortcuts, and the maintenance estimate. */}
      {showPills && snapshot ? (
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          {snapshot.copy.pills.map((label, i) => (
            <FlexWidget
              key={label}
              clickAction="OPEN_URI"
              clickActionData={{ uri: PILL_URIS[i] }}
              style={{
                backgroundColor: C.card,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginLeft: i === 0 ? 0 : 6,
              }}
            >
              <TextWidget text={label} style={{ fontSize: 10, color: C.dim }} />
            </FlexWidget>
          ))}
          <FlexWidget style={{ flex: 1 }} />
          {snapshot.tdee != null ? (
            <FlexWidget
              clickAction="OPEN_URI"
              clickActionData={{ uri: 'metri://metrics' }}
              style={{ flexDirection: 'row', alignItems: 'flex-end' }}
            >
              <TextWidget
                text={`${Math.round(snapshot.tdee)}`}
                style={{ fontSize: 13, fontWeight: 'bold', color: C.text }}
              />
              <TextWidget
                text={` ${snapshot.copy.tdee}`}
                style={{ fontSize: 9, color: C.faint, marginBottom: 1 }}
              />
            </FlexWidget>
          ) : null}
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
};
