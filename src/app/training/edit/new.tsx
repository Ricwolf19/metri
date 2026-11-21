import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ControlledInput, useSaveForm } from '@/components/form';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { createCustomProgram } from '@/features/training/authoring.repo';
import { useT } from '@/i18n';

const MIN_NAME = 3;

const NewProgram = () => {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();

  // `create`: one program per visit — a double tap on Create used to make two.
  const form = useSaveForm<{ name: string; description: string }>({
    kind: 'create',
    defaultValues: { name: '', description: '' },
    normalize: ({ name, description }) => ({ name: name.trim(), description: description.trim() }),
    onSave: ({ name, description }) => {
      if (!user) return false;
      const program = createCustomProgram(user.id, { name, description: description || null });
      router.replace({ pathname: '/training/edit/program/[id]', params: { id: program.id } });
    },
  });

  if (!user) return null;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} title={t('editor.newProgram')} />}
    >
      <Card>
        <View className="gap-4">
          <ControlledInput
            control={form.control}
            name="name"
            rules={{ validate: (v) => v.trim().length >= MIN_NAME }}
            label={t('editor.programName')}
            hint={t('editor.programNameHint')}
            autoCapitalize="sentences"
          />
          <ControlledInput
            control={form.control}
            name="description"
            label={t('editor.description')}
            hint={t('editor.descriptionHint')}
            multiline
          />
        </View>
        <View className="mt-6">
          <Button
            variant="brand"
            label={t('editor.create')}
            onPress={() => form.submit()}
            disabled={!form.canSave}
          />
        </View>
      </Card>
    </Screen>
  );
};

export default NewProgram;
