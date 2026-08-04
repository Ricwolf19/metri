import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  Screen,
  ScreenTitle,
  SegmentedControl,
  Select,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { saveBmr } from '@/features/auth/users.repo';
import { useI18n, useT } from '@/i18n';

import { CALC_CONTENT } from '../content';
import {
  type ActivityLevel,
  type BmrFormula,
  type Sex,
  bmr as computeBmr,
  bodyFatNavy,
  tdee as computeTdee,
} from '../math';
import { CALCULATORS } from '../registry';
import type { CalcChart as ChartSpec, CalcConfig, CalcField, CalcId, CalcValues } from '../types';
import { CalcChart } from './CalcChart';

/** Reserved height per chart kind (size="lg") — the plate stack, bar rows or
 * gauge can redraw with every input without ever resizing the layout. */
const CHART_HEIGHT: Record<ChartSpec['kind'], number> = {
  scale: 265,
  split: 115,
  bars: 200,
  ring: 185,
  barbell: 135,
};

/** Maps the calculator's short formula key to the profile's stored enum. */
const FORMULA_ENUM: Record<BmrFormula, string> = {
  mifflin: 'mifflin_st_jeor',
  harris: 'harris_benedict',
  katch: 'katch_mcardle',
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const initialValues = (config: CalcConfig): CalcValues =>
  Object.fromEntries(config.fields.map((f) => [f.name, f.default]));

const NumberField = ({
  field,
  value,
  onChange,
}: {
  field: Extract<CalcField, { kind: 'number' }>;
  value: number | string;
  onChange: (v: number | string) => void;
}) => {
  const t = useT();
  const min = field.min ?? 0;
  const max = field.max ?? 9999;
  const step = field.step ?? 1;
  const current = Number(value) || 0;

  // While the input has focus the user edits a local draft — the result only
  // recomputes on commit (blur or steppers), so charts and layout never mutate
  // under their thumbs mid-typing. Commit clamps to the field's real-world
  // bounds, so impossible values can't reach the math.
  const [draft, setDraft] = useState<string | null>(null);
  const parseDraft = (): number => {
    if (draft === null) return current;
    const n = Number(draft.replace(',', '.'));
    return Number.isFinite(n) && draft.trim() !== '' ? n : current;
  };
  const commit = () => {
    onChange(clamp(Math.round(parseDraft() * 100) / 100, min, max));
    setDraft(null);
  };
  const nudge = (dir: 1 | -1) => {
    onChange(clamp(Math.round((parseDraft() + dir * step) * 100) / 100, min, max));
    setDraft(null);
  };

  return (
    <View>
      <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
        {t(field.labelKey)}
        {field.unit ? <Text className="text-ink-500"> ({field.unit})</Text> : null}
      </Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => nudge(-1)}
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-field border border-ink-600 bg-ink-800 active:bg-ink-700"
        >
          <Text className="text-lg text-ink-100">−</Text>
        </Pressable>
        <View className="flex-1">
          <Input
            value={draft ?? String(value)}
            onChangeText={setDraft}
            onFocus={() => setDraft(String(value))}
            onBlur={commit}
            keyboardType="decimal-pad"
            className="text-center font-mono"
            maxLength={7}
          />
        </View>
        <Pressable
          onPress={() => nudge(1)}
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-field border border-ink-600 bg-ink-800 active:bg-ink-700"
        >
          <Text className="text-lg text-ink-100">+</Text>
        </Pressable>
      </View>
    </View>
  );
};

const Field = ({
  field,
  value,
  onChange,
}: {
  field: CalcField;
  value: number | string;
  onChange: (v: number | string) => void;
}) => {
  const t = useT();
  if (field.kind === 'number') {
    return <NumberField field={field} value={value} onChange={onChange} />;
  }
  const items = field.options.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  // Few options fit a segmented control; more open a dropdown.
  if (items.length <= 3) {
    return (
      <SegmentedControl
        label={t(field.labelKey)}
        segments={items}
        value={String(value)}
        onChange={(val) => onChange(val)}
      />
    );
  }
  return (
    <Select
      label={t(field.labelKey)}
      items={items}
      value={String(value)}
      onChange={(val) => onChange(val)}
    />
  );
};

const Section = ({ title, paragraphs }: { title: string; paragraphs: string[] }) => {
  if (!paragraphs.length) return null;
  return (
    <View className="mt-6">
      <Text className="mb-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {title}
      </Text>
      <View className="gap-2">
        {paragraphs.map((p, i) => (
          <Text key={i} className="text-sm leading-6 text-ink-300">
            {p}
          </Text>
        ))}
      </View>
    </View>
  );
};

export const Calculator = ({ id, docId }: { id: CalcId; docId?: string }) => {
  const t = useT();
  const { locale } = useI18n();
  const { user, updateMyProfile, reload } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const config = CALCULATORS[id];
  const content = CALC_CONTENT[id][locale];

  const [values, setValues] = useState<CalcValues>(() => initialValues(config));
  const setValue = (name: string, v: number | string) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const result = useMemo(() => config.compute(values), [config, values]);

  // A couple of calculators feed the user profile (Home energy card, Katch/FFMI
  // prefills). Offer to persist their result.
  const num = (k: string) => Number(values[k]) || 0;
  const str = (k: string) => String(values[k] ?? '');
  const canSave = !!user && !!result && (id === 'tdee' || id === 'bodyfat');
  const onSave = () => {
    if (!user) return;
    if (id === 'tdee') {
      const formula = str('formula') as BmrFormula;
      const sex = str('sex') as Sex;
      const activityLevel = str('activity') as ActivityLevel;
      const weightKg = num('weight');
      const heightCm = num('height');
      const age = num('age');
      const b = computeBmr(formula, { sex, weightKg, heightCm, age, bodyFatPct: num('bodyFat') });
      if (b <= 0) return;
      saveBmr(user.id, {
        bmr: b,
        tdee: computeTdee(b, activityLevel),
        bmrFormula: FORMULA_ENUM[formula],
        sex,
        age,
        heightCm,
        weightKg,
        activityLevel,
      });
      reload();
    } else {
      const bf = bodyFatNavy({
        sex: str('sex') as Sex,
        heightCm: num('height'),
        neckCm: num('neck'),
        waistCm: num('waist'),
        hipCm: num('hip'),
      });
      if (bf <= 0) return;
      updateMyProfile({ bodyFatPct: bf });
    }
    toast.success(t('calc.savedToast'));
    router.back();
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-12"
      header={<TopBar showBack showAvatar={false} docId={docId} />}
    >
      <ScreenTitle title={content.h1} subtitle={content.tagline} />

      {/* Live result */}
      {result ? (
        <View className="overflow-hidden rounded-card border border-brand/20 bg-ink-850 p-5">
          <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t(result.primaryLabelKey)}
          </Text>
          <View className="mt-1 flex-row items-baseline">
            <Text className="font-mono-medium text-4xl text-brand">{result.primaryValue}</Text>
            {result.primaryUnit ? (
              <Text className="ml-1 text-lg text-ink-300">{result.primaryUnit}</Text>
            ) : null}
          </View>
          {result.noteKey ? (
            <View className="mt-3 flex-row self-start items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-brand" />
              <Text className="text-xs font-sans-semibold text-brand">{t(result.noteKey)}</Text>
            </View>
          ) : null}

          {/* Fixed height per chart kind: input changes never resize the area. */}
          {result.chart ? (
            <View
              style={{ height: CHART_HEIGHT[result.chart.kind] }}
              className="mt-5 justify-center"
            >
              <CalcChart chart={result.chart} size="lg" />
            </View>
          ) : null}

          {result.rows && result.rows.length > 0 ? (
            <View className="mt-5 gap-2 border-t border-ink-700 pt-4">
              {result.rows.map((row, i) => (
                <View key={i} className="flex-row items-center justify-between">
                  <Text className="text-sm text-ink-300">
                    {row.labelKey ? t(row.labelKey) : row.label}
                  </Text>
                  <Text className="font-mono text-sm text-ink-100">{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View className="items-center justify-center rounded-card border border-dashed border-ink-600 bg-ink-800 p-8">
          <Text className="text-center text-sm text-ink-400">{t('calc.emptyPrompt')}</Text>
        </View>
      )}

      {/* Inputs */}
      <View className="mt-6 gap-5">
        {config.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(v) => setValue(field.name, v)}
          />
        ))}
      </View>

      {canSave ? (
        <View className="mt-5">
          <Button label={t('calc.saveProfile')} variant="brand" onPress={onSave} />
        </View>
      ) : null}

      {/* Educational content */}
      <Section title={t('calc.overviewTitle')} paragraphs={content.about} />
      {content.formula ? (
        <View className="mt-6">
          <Text className="mb-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('calc.formula')}
          </Text>
          <Card padded className="bg-ink-850">
            <Text className="font-mono text-xs leading-5 text-ink-200">{content.formula}</Text>
          </Card>
        </View>
      ) : null}
      <Section title={t('calc.howTitle')} paragraphs={content.how} />
      <Section title={t('calc.interpretTitle')} paragraphs={content.interpret} />

      {content.faq.length > 0 ? (
        <View className="mt-6">
          <Text className="mb-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('calc.faqTitle')}
          </Text>
          <View className="gap-3">
            {content.faq.map((item, i) => (
              <Card key={i} padded className="bg-ink-850">
                <Text className="text-sm font-sans-semibold text-ink-50">{item.q}</Text>
                <Text className="mt-1.5 text-sm leading-6 text-ink-300">{item.a}</Text>
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
};
