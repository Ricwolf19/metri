import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ControlledInput, useSaveForm } from '@/components/form';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, SectionLabel, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { createCustomFood } from '@/features/nutrition/food-log.repo';
import { useT } from '@/i18n';

const num = (raw: string): number => {
  const v = Number(raw.replace(',', '.'));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

type FoodDraft = {
  name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  serving: string;
};

type NumberField = Exclude<keyof FoodDraft, 'name'>;

/** A food from its label: per-100 g values, exactly as printed on the package. */
const NewFood = () => {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  // `create`: one food per visit — a double tap on Save used to store two.
  const form = useSaveForm<FoodDraft>({
    kind: 'create',
    defaultValues: {
      name: '',
      kcal: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      serving: '100',
    },
    onSave: (v) => {
      if (!user) return false;
      createCustomFood(user.id, {
        name: v.name.trim(),
        kcal: num(v.kcal),
        proteinG: num(v.protein),
        carbsG: num(v.carbs),
        fatG: num(v.fat),
        fiberG: num(v.fiber),
        servingG: num(v.serving) || 100,
      });
      toast.success(t('diary.foodSaved'));
      router.back();
    },
  });

  if (!user) return null;

  const field = (label: string, name: NumberField, required = false) => (
    <View className="flex-1">
      <ControlledInput
        control={form.control}
        name={name}
        rules={required ? { validate: (v) => num(v) > 0 } : undefined}
        label={label}
        keyboardType="decimal-pad"
        maxLength={6}
      />
    </View>
  );

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('diary.newFood')}
          subtitle={t('diary.newFoodSubtitle')}
        />
      }
      footer={
        <Button
          label={t('editor.save')}
          variant="brand"
          fullWidth
          disabled={!form.canSave}
          onPress={() => form.submit()}
        />
      }
    >
      <SectionLabel label={t('diary.foodName')} className="mt-2" />
      <Card>
        <ControlledInput
          control={form.control}
          name="name"
          rules={{ validate: (v) => v.trim().length >= 2 }}
          maxLength={60}
        />
      </Card>

      <SectionLabel label={t('diary.per100Label')} hint={t('diary.per100Hint')} />
      <Card className="gap-3">
        <View className="flex-row gap-2">
          {field(t('goal.kcal'), 'kcal', true)}
          {field(`${t('goal.protein')} g`, 'protein')}
        </View>
        <View className="flex-row gap-2">
          {field(`${t('goal.carbs')} g`, 'carbs')}
          {field(`${t('goal.fat')} g`, 'fat')}
        </View>
        <View className="flex-row gap-2">
          {field(`${t('diary.fiber')} g`, 'fiber')}
          {field(t('diary.servingG'), 'serving')}
        </View>
        <Text className="text-[11px] leading-4 text-ink-500">{t('diary.servingHint')}</Text>
      </Card>
    </Screen>
  );
};

export default NewFood;
