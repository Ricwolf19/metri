import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Button, Card, Input, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { createCustomProgram } from '@/features/training/authoring.repo';
import { useT } from '@/i18n';

const MIN_NAME = 3;

const NewProgram = () => {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!user) return null;

  const valid = name.trim().length >= MIN_NAME;

  const create = () => {
    if (!valid) return;
    const program = createCustomProgram(user.id, {
      name: name.trim(),
      description: description.trim() || null,
    });
    router.replace({ pathname: '/training/edit/program/[id]', params: { id: program.id } });
  };

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={<TopBar showBack showAvatar={false} title={t('editor.newProgram')} />}
    >
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
        </View>
        <View className="mt-6">
          <Button variant="brand" label={t('editor.create')} onPress={create} disabled={!valid} />
        </View>
      </Card>
    </Screen>
  );
};

export default NewProgram;
