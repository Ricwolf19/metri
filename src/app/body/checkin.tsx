import { and, eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  DatePicker,
  HoldButton,
  Input,
  Screen,
  SectionLabel,
  TextLink,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import { db } from '@/db/client';
import { bodyMeasurements, bodyMetrics } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { lbToKg } from '@/features/bmr/calc';
import {
  formulaFromProfile,
  profileEnergySnapshot,
  readingUpdatesProfile,
} from '@/features/calculators/energy-snapshot';
import { storeEnergySnapshot } from '@/features/calculators/energy-snapshot.repo';
import { saveMeasurements } from '@/features/body/body-measurements.repo';
import { fmt } from '@/features/calculators/_shared';
import { keptValue, recordCalculation } from '@/features/calculators/history.repo';
import { deleteBodyMetric, saveBodyMetric } from '@/features/body/body-metrics.repo';
import { navyFromTape } from '@/features/body/navy';
import { enabledSites, siteHintKey, siteLabelKey, type SiteId } from '@/features/body/sites';
import { fromCm, lengthUnitFor, toCm } from '@/features/body/units';
import { dateFromKey, localDateKey } from '@/features/training/dates';
import { fromKg } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTodayKey } from '@/lib/useTodayKey';

type Draft = { weight: string; sites: Partial<Record<SiteId, string>> };

const parse = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** What is already saved for a day, as the strings the form edits. */
const loadDraft = (userId: string, date: string, sites: SiteId[], units: 'kg' | 'lb') => {
  const [metric] = db
    .select()
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), eq(bodyMetrics.date, date)))
    .all();
  const tape = db
    .select()
    .from(bodyMeasurements)
    .where(and(eq(bodyMeasurements.userId, userId), eq(bodyMeasurements.date, date)))
    .all();
  const draft: Draft = {
    weight: metric?.weightKg != null ? String(fromKg(metric.weightKg, units)) : '',
    sites: {},
  };
  for (const site of sites) {
    const row = tape.find((r) => r.site === site);
    if (row) draft.sites[site] = String(fromCm(row.valueCm, units));
  }
  return { draft, metricId: metric?.id ?? null };
};

/**
 * The weekly check-in: scale and tape in one sitting, for any day. Picking a
 * past date loads what was saved then, so this screen is also how a day is
 * corrected or removed.
 */
const BodyCheckin = () => {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { user, updateMyProfile, reload } = useAuth();
  const { dateKey } = useDateFormat();
  const today = useTodayKey();
  const units = settings.getUnits();
  const userId = user?.id ?? '';
  const [sites] = useState(() => enabledSites(settings.getEnabledProSites()));

  const [date, setDate] = useState(today);
  const [pickingDate, setPickingDate] = useState(false);
  const [loaded, setLoaded] = useState(() => loadDraft(userId, today, sites, units));
  const [draft, setDraft] = useState<Draft>(loaded.draft);
  const [dirty, setDirty] = useState(false);

  const changeDate = (next: Date) => {
    // The future has no readings; clamp instead of refusing the wheel.
    const key = localDateKey(next) > today ? today : localDateKey(next);
    const fresh = loadDraft(userId, key, sites, units);
    setDate(key);
    setLoaded(fresh);
    setDraft(fresh.draft);
    setDirty(false);
  };

  // Body fat from what is typed right now (US Navy method). A complete tape is
  // saved automatically with the day — the estimate and the calculator agree
  // by construction (both run the same formula on the same values).
  const navyPctNow = (): number | null => {
    const typedCm: Partial<Record<SiteId, number>> = {};
    for (const site of sites) {
      const typed = parse(draft.sites[site]);
      if (typed != null) typedCm[site] = toCm(typed, units);
    }
    const navy = navyFromTape({
      latestCm: typedCm,
      sex: user?.sex ?? null,
      heightCm: user?.heightCm ?? null,
    });
    return navy && 'pct' in navy ? navy.pct : null;
  };

  // What the kept body-fat entry lists as its inputs — the calculator's field names.
  const tapeInputs = (): Record<string, number | string> => {
    const out: Record<string, number | string> = {};
    if (user?.sex) out.sex = user.sex;
    if (user?.heightCm) out.height = user.heightCm;
    for (const [site, field] of [
      ['neck', 'neck'],
      ['waist', 'waist'],
      ['hips', 'hip'],
    ] as const) {
      const typed = parse(draft.sites[site]);
      if (typed != null) out[field] = toCm(typed, units);
    }
    return out;
  };

  const save = () => {
    const weight = parse(draft.weight);
    const kg = weight != null ? (units === 'lb' ? lbToKg(weight) : weight) : null;
    if (kg != null) {
      saveBodyMetric(userId, date, { weightKg: Math.round(kg * 100) / 100 });
    }
    const values: Partial<Record<SiteId, number | null>> = {};
    for (const site of sites) {
      const typed = parse(draft.sites[site]);
      // An emptied field clears a reading that existed; an untouched blank is skipped.
      if (typed != null) values[site] = toCm(typed, units);
      else if (loaded.draft.sites[site]) values[site] = null;
    }
    saveMeasurements(userId, date, values);

    // A complete tape auto-fills body fat (Navy) and, with a complete profile,
    // the TDEE snapshot — no manual calculator round-trip. The profile only
    // follows a reading dated today: correcting a past day must not roll the
    // current weight and body fat back.
    const pct = navyPctNow();
    const current = readingUpdatesProfile(date, today);
    if (pct != null) {
      saveBodyMetric(userId, date, { bodyFatPct: pct });
      recordCalculation(userId, 'bodyfat', tapeInputs(), keptValue(fmt(pct), '%'));
      if (current) updateMyProfile({ bodyFatPct: pct });
      const snap =
        current && user ? profileEnergySnapshot(user, { weightKg: kg, bodyFatPct: pct }) : null;
      if (snap) {
        recordCalculation(
          userId,
          'tdee',
          {
            weight: snap.weightKg,
            height: snap.heightCm,
            age: snap.age,
            activity: snap.activityLevel ?? '',
            formula: formulaFromProfile(snap.bmrFormula),
          },
          keptValue(fmt(Math.round(snap.tdee)), 'kcal'),
        );
        storeEnergySnapshot(userId, snap);
        reload();
      }
    }
    setDirty(false);
    toast.success(t('body.checkinSaved'));
  };

  const guard = useUnsavedGuard({ dirty, onSave: save, onDiscard: () => setDirty(false) });

  if (!user) return null;

  const removeDay = () => {
    if (loaded.metricId) deleteBodyMetric(loaded.metricId);
    saveMeasurements(
      userId,
      date,
      Object.fromEntries(sites.map((s) => [s, null])) as Partial<Record<SiteId, null>>,
    );
    toast.info(t('body.dayDeleted'));
    changeDate(dateFromKey(date));
  };

  const hasSaved = loaded.metricId != null || Object.keys(loaded.draft.sites).length > 0;

  const navyPct = navyPctNow();
  const lengthUnit = lengthUnitFor(units);

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('body.checkin')}
          subtitle={t('body.checkinSubtitle')}
        />
      }
      footer={
        <Button
          label={t('editor.save')}
          variant="brand"
          fullWidth
          onPress={() => {
            save();
            guard.leave(() => router.back());
          }}
        />
      }
    >
      <SectionLabel label={t('body.day')} className="mt-2" />
      <Card>
        <Pressable
          onPress={() => setPickingDate((v) => !v)}
          accessibilityRole="button"
          className="flex-row items-center justify-between"
        >
          <Text className="text-base font-sans-semibold text-ink-50">{dateKey(date)}</Text>
          <Text className="text-sm text-brand">
            {pickingDate ? t('common.done') : t('body.changeDay')}
          </Text>
        </Pressable>
        {pickingDate ? (
          <View className="mt-3">
            <DatePicker value={dateFromKey(date)} onChange={changeDate} yearsBack={3} />
          </View>
        ) : null}
      </Card>

      <SectionLabel label={t('body.weight')} hint={t('body.weighInHint')} />
      <Card>
        <Input
          value={draft.weight}
          onChangeText={(weight) => {
            setDraft((d) => ({ ...d, weight }));
            setDirty(true);
          }}
          keyboardType="decimal-pad"
          placeholder={units}
          maxLength={6}
        />
      </Card>

      <SectionLabel label={t('body.tape')} hint={t('body.tapeHint')} />
      <Card className="gap-4">
        {sites.map((site) => (
          <View key={site}>
            <Input
              label={`${t(siteLabelKey(site))} · ${lengthUnit}`}
              value={draft.sites[site] ?? ''}
              onChangeText={(value) => {
                setDraft((d) => ({ ...d, sites: { ...d.sites, [site]: value } }));
                setDirty(true);
              }}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <Text className="mt-1 text-[11px] leading-4 text-ink-500">{t(siteHintKey(site))}</Text>
          </View>
        ))}
        <TextLink label={t('body.manageSites')} onPress={() => router.push('/body/sites')} />
      </Card>

      {navyPct != null ? (
        <Card className="mt-3">
          <Text className="text-sm leading-6 text-ink-200">
            {t('body.navyEstimate', { n: navyPct })}
          </Text>
          <Text className="mt-1 text-xs leading-5 text-ink-500">{t('body.navyAutoSaved')}</Text>
        </Card>
      ) : null}

      <SectionLabel label={t('body.photos')} hint={t('body.photosHint')} />
      <Button
        label={t('body.openPhotos')}
        variant="secondary"
        onPress={() => router.push('/progress')}
      />

      {hasSaved ? (
        <View className="mt-8">
          <HoldButton label={t('body.deleteDay')} onComplete={removeDay} />
        </View>
      ) : null}
    </Screen>
  );
};

export default BodyCheckin;
