import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlusIcon, XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  HoldButton,
  Input,
  Screen,
  SectionLabel,
  SegmentedControl,
  useToast,
  useUnsavedGuard,
} from '@/components/ui';
import type { WarmupStep } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { warmupCopy } from '@/features/training/warmup-content';
import {
  createWarmup,
  deleteWarmup,
  getWarmup,
  updateWarmup,
} from '@/features/training/warmups.repo';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const EMPTY_STEP: WarmupStep = { name: '', detail: '' };

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

  const [kind, setKind] = useState<'warmup' | 'mobility'>(routine?.kind ?? 'warmup');
  const [name, setName] = useState(isNew ? '' : (copy?.name ?? ''));
  const [description, setDescription] = useState(isNew ? '' : (copy?.description ?? ''));
  const [steps, setSteps] = useState<WarmupStep[]>(
    isNew ? [{ ...EMPTY_STEP }] : (copy?.steps ?? []),
  );
  const [dirty, setDirty] = useState(false);

  const patchStep = (index: number, patch: Partial<WarmupStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const save = () => {
    if (!user) return false;
    const clean = steps
      .map((s) => ({ name: s.name.trim(), detail: s.detail?.trim() || undefined }))
      .filter((s) => s.name);
    if (!name.trim()) {
      toast.error(t('warmup.needName'));
      return false;
    }
    if (!clean.length) {
      toast.error(t('warmup.needStep'));
      return false;
    }
    if (isNew) {
      createWarmup(user.id, {
        kind,
        name: name.trim(),
        description: description.trim() || undefined,
        steps: clean,
      });
    } else if (routine) {
      updateWarmup(routine.id, {
        name: name.trim(),
        description: description.trim() || null,
        steps: clean,
      });
    }
    setDirty(false);
    toast.success(t('editor.savedToast'));
    return true;
  };

  const guard = useUnsavedGuard({ dirty: editable && dirty, onSave: save });
  const saveAndClose = () => {
    if (save()) guard.leave(() => router.back());
  };

  if (!user || (!routine && !isNew)) return <Redirect href="/training/warmups" />;

  const duplicate = () => {
    if (!copy) return;
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
    setDirty(false);
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
            disabled={!dirty}
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
            <SegmentedControl
              segments={[
                { value: 'warmup', label: t('warmup.sectionWarmup') },
                { value: 'mobility', label: t('warmup.sectionMobility') },
              ]}
              value={kind}
              onChange={(value) => {
                setKind(value);
                setDirty(true);
              }}
            />
          ) : null}
          <Input
            label={t('warmup.name')}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setDirty(true);
            }}
          />
          <Input
            label={t('editor.description')}
            value={description}
            onChangeText={(v) => {
              setDescription(v);
              setDirty(true);
            }}
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
          {steps.map((step, i) => (
            <Card key={i} className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <Input
                    value={step.name}
                    onChangeText={(v) => patchStep(i, { name: v })}
                    placeholder={t('warmup.stepPh')}
                  />
                </View>
                {steps.length > 1 ? (
                  <Pressable
                    onPress={() => {
                      setSteps((prev) => prev.filter((_, j) => j !== i));
                      setDirty(true);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <XIcon color="#71717a" size={16} />
                  </Pressable>
                ) : null}
              </View>
              <Input
                value={step.detail ?? ''}
                onChangeText={(v) => patchStep(i, { detail: v })}
                placeholder={t('warmup.detailPh')}
              />
            </Card>
          ))}
          <Button
            label={t('warmup.addStep')}
            variant="secondary"
            leftIcon={<PlusIcon color={brand} size={18} />}
            onPress={() => {
              setSteps((prev) => [...prev, { ...EMPTY_STEP }]);
              setDirty(true);
            }}
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

export default WarmupDetail;
