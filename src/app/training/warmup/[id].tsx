import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { ControlledInput, ControlledSegmentedControl, useSaveForm } from '@/components/form';
import { PlusIcon, XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  HoldButton,
  Screen,
  SectionLabel,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { WarmupStepDemo } from '@/features/training/components/WarmupStepDemo';
import { warmupCopy } from '@/features/training/warmup-content';
import {
  createWarmup,
  deleteWarmup,
  getWarmup,
  updateWarmup,
} from '@/features/training/warmups.repo';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type StepDraft = { name: string; detail: string };
type WarmupDraft = {
  kind: 'warmup' | 'mobility';
  name: string;
  description: string;
  steps: StepDraft[];
};

const EMPTY_STEP: StepDraft = { name: '', detail: '' };

/** As stored: trimmed, and a step without a name is no step. */
const normalizeWarmup = (v: WarmupDraft): WarmupDraft => ({
  kind: v.kind,
  name: v.name.trim(),
  description: v.description.trim(),
  steps: v.steps
    .map((s) => ({ name: s.name.trim(), detail: s.detail.trim() }))
    .filter((s) => s.name),
});

/**
 * One warm-up routine. Shipped routines are read-only and offer a copy —
 * editing metri's would silently fork what the seed keeps refreshing; the copy
 * is the user's from then on.
 */
const WarmupDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const toast = useToast();
  const { user } = useAuth();
  const { brand } = useTheme();

  const isNew = id === 'new';
  const [routine] = useState(() => (id && !isNew ? getWarmup(id) : null));
  const copy = routine ? warmupCopy(routine, locale) : null;
  const owned = !!routine?.isCustom && routine.userId === user?.id;
  const editable = isNew || owned;

  const [initial] = useState<WarmupDraft>(() => ({
    kind: routine?.kind ?? 'warmup',
    name: isNew ? '' : (copy?.name ?? ''),
    description: isNew ? '' : (copy?.description ?? ''),
    steps: (isNew ? [EMPTY_STEP] : (copy?.steps ?? [])).map((s) => ({
      name: s.name,
      detail: s.detail ?? '',
    })),
  }));
  // A new routine is a `create` (one row however fast Save is tapped); an owned
  // one saves only a real change — an added blank step is none.
  const form = useSaveForm<WarmupDraft>({
    kind: isNew ? 'create' : 'edit',
    defaultValues: initial,
    normalize: normalizeWarmup,
    onInvalid: () =>
      toast.error(t(form.getValues('name').trim() ? 'warmup.needStep' : 'warmup.needName')),
    onSave: ({ kind, name, description, steps }) => {
      if (!user) return false;
      const clean = steps.map((s) => ({ name: s.name, detail: s.detail || undefined }));
      if (isNew) {
        createWarmup(user.id, {
          kind,
          name,
          description: description || undefined,
          steps: clean,
        });
      } else if (routine) {
        updateWarmup(routine.id, { name, description: description || null, steps: clean });
      }
      toast.success(t('editor.savedToast'));
    },
  });
  const steps = useFieldArray({
    control: form.control,
    name: 'steps',
    rules: { validate: (all) => all.some((s) => s.name.trim().length > 0) },
  });
  const kind = useWatch({ control: form.control, name: 'kind' });

  const guard = useUnsavedGuard({ dirty: editable && form.isDirty, onSave: form.saveNow });
  const saveAndClose = () => {
    if (form.saveNow()) guard.leave(() => router.back());
  };
  // One copy per press: the screen is replaced right after.
  const duplicated = useRef(false);

  if (!user || (!routine && !isNew)) return <Redirect href="/training/warmups" />;

  const duplicate = () => {
    if (!copy || duplicated.current) return;
    duplicated.current = true;
    const made = createWarmup(user.id, {
      kind: kind,
      name: t('warmup.copyName', { name: copy.name }),
      description: copy.description,
      steps: copy.steps,
    });
    toast.success(t('warmup.duplicated'));
    router.replace({ pathname: '/training/warmup/[id]', params: { id: made.id } });
  };

  const remove = () => {
    if (!routine) return;
    deleteWarmup(routine.id, user.id);
    toast.info(t('editor.deletedToast'));
    guard.leave(() => router.back());
  };

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={isNew ? t('warmup.create') : (copy?.name ?? '')}
          subtitle={t(kind === 'warmup' ? 'warmup.sectionWarmup' : 'warmup.sectionMobility')}
        />
      }
      footer={
        editable ? (
          <Button
            variant="brand"
            label={t('editor.save')}
            disabled={!form.canSave}
            onPress={saveAndClose}
          />
        ) : (
          <Button variant="secondary" label={t('warmup.duplicate')} onPress={duplicate} />
        )
      }
    >
      {editable ? (
        <Card className="gap-4">
          {isNew ? (
            <ControlledSegmentedControl
              control={form.control}
              name="kind"
              segments={[
                { value: 'warmup', label: t('warmup.sectionWarmup') },
                { value: 'mobility', label: t('warmup.sectionMobility') },
              ]}
            />
          ) : null}
          <ControlledInput
            control={form.control}
            name="name"
            rules={{ validate: (v) => v.trim().length > 0 || t('warmup.needName') }}
            label={t('warmup.name')}
          />
          <ControlledInput
            control={form.control}
            name="description"
            label={t('editor.description')}
            multiline
          />
        </Card>
      ) : (
        <Card>
          <Text className="text-sm leading-6 text-ink-200">{copy?.description}</Text>
        </Card>
      )}

      <SectionLabel label={t('warmup.steps')} hint={editable ? t('warmup.stepsHint') : undefined} />

      {editable ? (
        <View className="gap-2">
          {steps.fields.map((field, i) => (
            <StepCard
              key={field.id}
              control={form.control}
              index={i}
              onRemove={steps.fields.length > 1 ? () => steps.remove(i) : undefined}
            />
          ))}
          <Button
            label={t('warmup.addStep')}
            variant="secondary"
            leftIcon={<PlusIcon color={brand} size={18} />}
            onPress={() => steps.append({ ...EMPTY_STEP })}
          />
        </View>
      ) : (
        <Card className="gap-3">
          {copy?.steps.map((step, i) => (
            <View key={i} className="flex-row gap-3">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-brand/15">
                <Text className="text-[11px] font-sans-bold text-brand">{i + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-sans-medium text-ink-100">{step.name}</Text>
                {step.detail ? (
                  <Text className="mt-0.5 text-xs text-ink-400">{step.detail}</Text>
                ) : null}
                <WarmupStepDemo name={step.name} />
              </View>
            </View>
          ))}
        </Card>
      )}

      {owned ? (
        <View className="mt-8">
          <HoldButton label={t('warmup.delete')} onComplete={remove} />
        </View>
      ) : null}
    </Screen>
  );
};

/** One editable step: its name drives the demo under it. */
const StepCard = ({
  control,
  index,
  onRemove,
}: {
  control: Control<WarmupDraft>;
  index: number;
  /** Absent on the last step left: a routine keeps at least one. */
  onRemove?: () => void;
}) => {
  const t = useT();
  const { muted } = useTheme();
  const name = useWatch({ control, name: `steps.${index}.name` });
  return (
    <Card className="gap-2">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <ControlledInput
            control={control}
            name={`steps.${index}.name`}
            placeholder={t('warmup.stepPh')}
          />
        </View>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel={t('common.removeNamed', {
              name: name.trim() || `${t('warmup.steps')} ${index + 1}`,
            })}
          >
            <XIcon color={muted} size={16} />
          </Pressable>
        ) : null}
      </View>
      <ControlledInput
        control={control}
        name={`steps.${index}.detail`}
        placeholder={t('warmup.detailPh')}
      />
      <WarmupStepDemo name={name} />
    </Card>
  );
};

export default WarmupDetail;
