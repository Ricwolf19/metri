import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Button, Card, Input, Screen, Select, useToast, type SelectItem } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { createCustomProgram } from '@/features/training/authoring.repo';
import { DIFFICULTY_KEY, GOAL_KEY } from '@/features/training/labels';
import { useT } from '@/i18n';
import type { ProgramDifficulty, ProgramGoal } from '@/db/schema';

const NewProgram = () => {
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>();
  const [goal, setGoal] = useState<ProgramGoal>();

  if (!user) return null;

  const difficultyItems: SelectItem<ProgramDifficulty>[] = (
    Object.keys(DIFFICULTY_KEY) as ProgramDifficulty[]
  ).map((d) => ({ value: d, label: t(DIFFICULTY_KEY[d]) }));
  const goalItems: SelectItem<ProgramGoal>[] = (Object.keys(GOAL_KEY) as ProgramGoal[]).map(
    (g) => ({
      value: g,
      label: t(GOAL_KEY[g]),
    }),
  );

  const create = () => {
    if (name.trim().length < 3) return toast.error(t('editor.programName'));
    const program = createCustomProgram(user.id, {
      name: name.trim(),
      description: description.trim() || null,
      difficulty: difficulty ?? null,
      goal: goal ?? null,
    });
    router.replace({ pathname: '/training/edit/program/[id]', params: { id: program.id } });
  };

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-10">
      <TopBar title={t('editor.newProgram')} showBack showAvatar={false} />

      <Card>
        <View className="gap-4">
          <Input
            label={t('editor.programName')}
            value={name}
            onChangeText={setName}
            placeholder={t('editor.programNamePh')}
            autoCapitalize="sentences"
          />
          <Input
            label={t('editor.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('editor.descriptionPh')}
            multiline
          />
          <Select
            label={t('editor.difficulty')}
            items={difficultyItems}
            value={difficulty}
            onChange={setDifficulty}
            placeholder="—"
          />
          <Select
            label={t('editor.goal')}
            items={goalItems}
            value={goal}
            onChange={setGoal}
            placeholder="—"
          />
        </View>
        <View className="mt-6">
          <Button label={t('editor.create')} onPress={create} disabled={name.trim().length < 3} />
        </View>
      </Card>
    </Screen>
  );
};

export default NewProgram;
