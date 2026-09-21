import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Screen,
  SectionLabel,
  SegmentedControl,
  Select,
  Stat,
  Stepper,
  useToast,
  type Segment,
  type SelectItem,
} from '@/components/ui';
import type { BodyPhase, TrainingLevel } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { startGoal } from '@/features/body/body-goals.repo';
import { suggestPhase } from '@/features/body/phase';
import { clampRate, suggestRate } from '@/features/body/rate';
import { energyTarget } from '@/features/body/targets';
import { useBodyLog } from '@/features/body/useBodyLog';
import { syncWeighInReminder } from '@/features/body/weigh-in-reminder';
import { macroTargets } from '@/features/calculators/math';
import { DAY_ORDER, WEEKDAY_KEY } from '@/features/training/labels';
import { fromKg } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { captureError } from '@/lib/telemetry';

const PHASES: BodyPhase[] = ['cut', 'maintain', 'recomp', 'bulk'];
const LEVELS: TrainingLevel[] = ['beginner', 'intermediate', 'advanced'];
const RATE_STEP = 0.05;

/**
 * Start a nutrition phase: what, how fast, and the targets that follow. The
 * phase is pre-selected from body fat when it is known, with the reason shown —
 * a suggestion to overrule, never a gate.
 */
const BodyGoalEditor = () => {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const units = settings.getUnits();
  const log = useBodyLog(user?.id ?? '', user?.sex ?? null);

  const weightKg = log.thisWeek?.avgKg ?? log.latestWeighIn?.weightKg ?? user?.weightKg ?? null;
  const suggestion = useMemo(
    () => suggestPhase({ sex: user?.sex ?? null, bodyFatPct: user?.bodyFatPct ?? null }),
    [user?.sex, user?.bodyFatPct],
  );

  const [phase, setPhase] = useState<BodyPhase>(suggestion?.phase ?? 'maintain');
  const [level, setLevel] = useState<TrainingLevel>('intermediate');
  const [rate, setRate] = useState<number | null>(null);
  const [weeks, setWeeks] = useState(12);
  const [weekday, setWeekday] = useState('2');

  if (!user) return null;

  const band = suggestRate({ phase, weightKg: weightKg ?? 0, level });
  const moves = phase === 'cut' || phase === 'bulk';
  // The stepper edits a magnitude; the sign comes from the phase.
  const magnitude = rate ?? Math.abs(band.kgPerWeek);
  const signedRate = moves ? clampRate(phase === 'cut' ? -magnitude : magnitude, weightKg ?? 0) : 0;

  const ready = weightKg != null && user.tdee != null;
  const energy = ready
    ? energyTarget({ tdee: user.tdee!, bmr: user.bmr, rateKgPerWeek: signedRate, sex: user.sex })
    : null;
  const macros =
    energy && weightKg != null
      ? macroTargets({ kcal: energy.kcal, weightKg, bodyFatPct: user.bodyFatPct, phase })
      : null;

  const phaseSegments: Segment<BodyPhase>[] = PHASES.map((p) => ({
    value: p,
    label: t(`goal.phase.${p}`),
  }));
  const levelItems: SelectItem<TrainingLevel>[] = LEVELS.map((l) => ({
    value: l,
    label: t(`goal.level.${l}`),
  }));
  const weekdayItems: SelectItem<string>[] = DAY_ORDER.map((w) => ({
    value: String(w),
    label: t(WEEKDAY_KEY[w]),
  }));

  const onStart = () => {
    if (!macros || weightKg == null) return;
    const checkinWeekday = Number(weekday);
    startGoal(user.id, {
      phase,
      startDate: log.today,
      startWeightKg: weightKg,
      rateKgPerWeek: signedRate,
      durationWeeks: weeks,
      checkinWeekday,
      trainingLevel: phase === 'bulk' ? level : null,
      bodyFatPctAtStart: user.bodyFatPct,
      tdeeAtStart: user.tdee,
      targetKcal: macros.kcal,
      proteinG: macros.proteinG,
      fatG: macros.fatG,
      carbsG: macros.carbsG,
    });
    syncWeighInReminder(checkinWeekday).catch(captureError);
    toast.success(t('goal.started'));
    router.back();
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar showBack showAvatar={false} title={t('goal.title')} subtitle={t('goal.subtitle')} />
      }
      footer={
        <Button
          label={t('goal.start')}
          variant="brand"
          fullWidth
          disabled={!macros}
          onPress={onStart}
        />
      }
    >
      {!ready ? (
        <Card className="mt-2">
          <Text className="text-sm leading-6 text-ink-300">{t('goal.needsTdee')}</Text>
          <View className="mt-4">
            <Button
              label={t('home.openBmr')}
              variant="secondary"
              onPress={() => router.push('/calculators/tdee')}
            />
          </View>
        </Card>
      ) : null}

      <SectionLabel label={t('goal.phaseLabel')} className="mt-4" />
      <Card>
        <SegmentedControl
          value={phase}
          segments={phaseSegments}
          onChange={(p) => {
            setPhase(p);
            setRate(null);
          }}
        />
        <Text className="mt-3 text-sm leading-6 text-ink-300">{t(`goal.about.${phase}`)}</Text>
        {suggestion ? (
          <Text className="mt-2 text-xs leading-5 text-ink-500">{t(suggestion.reasonKey)}</Text>
        ) : (
          <Text className="mt-2 text-xs leading-5 text-ink-500">{t('goal.noSuggestion')}</Text>
        )}
      </Card>

      {moves ? (
        <>
          <SectionLabel label={t('goal.rateLabel')} hint={t(`goal.rateHint.${phase}`)} />
          <Card className="gap-4">
            {phase === 'bulk' ? (
              <Select
                label={t('goal.levelLabel')}
                items={levelItems}
                value={level}
                onChange={(l) => {
                  setLevel(l);
                  setRate(null);
                }}
              />
            ) : null}
            <Stepper
              label={t('goal.perWeek', { unit: units })}
              value={magnitude}
              onChange={setRate}
              min={band.minKg}
              max={band.maxKg}
              step={RATE_STEP}
              format={(n) => String(fromKg(n, units))}
            />
          </Card>
        </>
      ) : null}

      <SectionLabel label={t('goal.scheduleLabel')} hint={t('goal.scheduleHint')} />
      <Card className="gap-4">
        <Select
          label={t('goal.checkinDay')}
          items={weekdayItems}
          value={weekday}
          onChange={setWeekday}
        />
        <Stepper
          label={t('goal.duration')}
          value={weeks}
          onChange={setWeeks}
          min={4}
          max={24}
          format={(n) => t('goal.weeks', { n })}
        />
      </Card>

      {macros && energy ? (
        <>
          <SectionLabel label={t('goal.targets')} />
          <Card>
            <View className="flex-row">
              <Stat label={t('goal.kcal')} value={String(macros.kcal)} />
              <Stat label={t('goal.protein')} value={String(macros.proteinG)} unit="g" />
            </View>
            <View className="mt-4 flex-row">
              <Stat label={t('goal.carbs')} value={String(macros.carbsG)} unit="g" />
              <Stat label={t('goal.fat')} value={String(macros.fatG)} unit="g" />
            </View>
            <Text className="mt-4 text-xs leading-5 text-ink-500">
              {t(macros.basis === 'lean' ? 'goal.basisLean' : 'goal.basisBodyweight')}
            </Text>
            {energy.floored ? (
              <Text className="mt-2 text-xs leading-5 text-amber-500">{t('goal.floored')}</Text>
            ) : energy.outsideBand ? (
              <Text className="mt-2 text-xs leading-5 text-amber-500">{t('goal.outsideBand')}</Text>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
};

export default BodyGoalEditor;
