import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Button, Card, Input, Screen, SectionLabel, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { createCustomFood } from '@/features/nutrition/food-log.repo';
import { useT } from '@/i18n';

const num = (raw: string): number => {
  const v = Number(raw.replace(',', '.'));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

/** A food from its label: per-100 g values, exactly as printed on the package. */
const NewFood = () => {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [serving, setServing] = useState('100');

  if (!user) return null;

  const valid = name.trim().length >= 2 && num(kcal) > 0;

  const save = () => {
    if (!valid) return;
    createCustomFood(user.id, {
      name: name.trim(),
      kcal: num(kcal),
      proteinG: num(protein),
      carbsG: num(carbs),
      fatG: num(fat),
      fiberG: num(fiber),
      servingG: num(serving) || 100,
    });
    toast.success(t('diary.foodSaved'));
    router.back();
  };

  const field = (label: string, value: string, onChange: (v: string) => void) => (
    <View className="flex-1">
      <Input
        label={label}
        value={value}
        onChangeText={onChange}
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
          disabled={!valid}
          onPress={save}
        />
      }
    >
      <SectionLabel label={t('diary.foodName')} className="mt-2" />
      <Card>
        <Input value={name} onChangeText={setName} maxLength={60} />
      </Card>

      <SectionLabel label={t('diary.per100Label')} hint={t('diary.per100Hint')} />
      <Card className="gap-3">
        <View className="flex-row gap-2">
          {field(t('goal.kcal'), kcal, setKcal)}
          {field(`${t('goal.protein')} g`, protein, setProtein)}
        </View>
        <View className="flex-row gap-2">
          {field(`${t('goal.carbs')} g`, carbs, setCarbs)}
          {field(`${t('goal.fat')} g`, fat, setFat)}
        </View>
        <View className="flex-row gap-2">
          {field(`${t('diary.fiber')} g`, fiber, setFiber)}
          {field(t('diary.servingG'), serving, setServing)}
        </View>
        <Text className="text-[11px] leading-4 text-ink-500">{t('diary.servingHint')}</Text>
      </Card>
    </Screen>
  );
};

export default NewFood;
