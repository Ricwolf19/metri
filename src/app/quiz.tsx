import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { QUIZ_QUESTIONS } from '@/features/quiz/content';
import {
  answerCurrent,
  currentQuestion,
  isQuizComplete,
  quizScores,
  startQuiz,
  type QuizState,
} from '@/features/quiz/engine';
import { AREA_KEY, LEVEL_KEY } from '@/features/quiz/areas';
import { QuizRadar } from '@/features/quiz/QuizRadar';
import { loadScores, saveScores, type QuizScores } from '@/features/quiz/scores';
import { useI18n, useT } from '@/i18n';

/** An option's resting look, then how it reads once the answer is revealed. */
const optionClass = (revealed: boolean, isAnswer: boolean, isPicked: boolean): string => {
  if (!revealed) return 'border-ink-600 bg-ink-800';
  if (isAnswer) return 'border-brand bg-brand/15';
  if (isPicked) return 'border-ink-400 bg-ink-800';
  return 'border-ink-700 bg-ink-850 opacity-60';
};

/**
 * Knowledge check (H2): one question per area at a time, climbing basic → pro
 * while the answers hold and closing an area at the first miss. Every answer
 * is revealed before moving on — the quiz teaches as much as it measures.
 * Reached from Explore and, optionally, as the last onboarding step.
 */
const Quiz = () => {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromOnboarding = from === 'onboarding';

  const [state, setState] = useState<QuizState | null>(null);
  /** Index picked for the current question (-1 = "I don't know"); null until answered. */
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<QuizScores | null>(null);
  const [asked, setAsked] = useState(0);

  const leave = useCallback(
    () => (fromOnboarding ? router.replace('/(tabs)') : router.back()),
    [fromOnboarding, router],
  );
  // Reached through `router.replace`, so the stack has no onboarding step to pop
  // back to: the hardware back button leaves the flow like the header does.
  useFocusEffect(
    useCallback(() => {
      if (!fromOnboarding) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        leave();
        return true;
      });
      return () => sub.remove();
    }, [fromOnboarding, leave]),
  );

  const question = state ? currentQuestion(state, QUIZ_QUESTIONS) : null;

  const next = () => {
    if (!state || !question || picked === null) return;
    const after = answerCurrent(state, picked === question.answer);
    setPicked(null);
    setAsked((n) => n + 1);
    if (isQuizComplete(after) || !currentQuestion(after, QUIZ_QUESTIONS)) {
      setResult(saveScores(quizScores(after)));
      setState(null);
      return;
    }
    setState(after);
  };

  const restart = () => {
    setResult(null);
    setAsked(0);
    setState(startQuiz());
  };

  const header = (
    <TopBar
      showBack
      onBack={fromOnboarding ? leave : undefined}
      showAvatar={false}
      title={t('quiz.title')}
    />
  );

  if (result) {
    return (
      <Screen scroll contentClassName="px-5 pb-12" header={header}>
        <Text className="text-xl font-sans-bold text-ink-50">{t('quiz.resultTitle')}</Text>
        <Text className="mb-6 mt-1 text-sm text-ink-400">{t('quiz.resultBody')}</Text>
        <Card>
          <QuizRadar scores={result} />
        </Card>
        <View className="mt-6 gap-3">
          <Button variant="brand" label={t('quiz.done')} onPress={leave} />
          <Button variant="ghost" label={t('quiz.retake')} onPress={restart} />
        </View>
      </Screen>
    );
  }

  if (!state || !question) {
    const previous = loadScores();
    return (
      <Screen scroll contentClassName="px-5 pb-12" header={header}>
        <Text className="text-xl font-sans-bold text-ink-50">{t('quiz.introTitle')}</Text>
        <Text className="mt-2 text-sm leading-6 text-ink-300">{t('quiz.introBody')}</Text>
        {previous ? (
          <Card className="mt-6">
            <QuizRadar scores={previous} />
          </Card>
        ) : null}
        <View className="mt-8 gap-3">
          <Button
            variant="brand"
            label={t(previous ? 'quiz.retake' : 'quiz.start')}
            onPress={restart}
          />
          {fromOnboarding ? (
            <Button variant="ghost" label={t('common.skip')} onPress={leave} />
          ) : null}
        </View>
      </Screen>
    );
  }

  const revealed = picked !== null;
  const correct = revealed && picked === question.answer;

  return (
    <Screen scroll contentClassName="px-5 pb-12" header={header}>
      <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('quiz.questionN', { n: asked + 1 })} · {t(AREA_KEY[question.area])} ·{' '}
        {t(LEVEL_KEY[question.level])}
      </Text>
      <Text className="mt-3 text-lg font-sans-semibold leading-7 text-ink-50">
        {question.prompt[locale]}
      </Text>

      <View className="mt-6 gap-3">
        {question.options.map((option, i) => (
          <Pressable
            key={option.en}
            disabled={revealed}
            onPress={() => setPicked(i)}
            accessibilityRole="button"
            accessibilityState={{ disabled: revealed, selected: picked === i }}
            className={[
              'min-h-12 justify-center rounded-field border px-4 py-3',
              optionClass(revealed, i === question.answer, picked === i),
            ].join(' ')}
          >
            <Text
              className="text-sm font-sans-medium text-ink-100"
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            >
              {option[locale]}
            </Text>
          </Pressable>
        ))}
        {!revealed ? (
          <Button variant="ghost" label={t('quiz.dontKnow')} onPress={() => setPicked(-1)} />
        ) : null}
      </View>

      {revealed ? (
        <View className="mt-6">
          <Text className="text-sm font-sans-semibold text-ink-50">
            {t(correct ? 'quiz.correct' : 'quiz.incorrect')}
          </Text>
          {!correct ? (
            <Text className="mt-1 text-sm text-ink-300">
              {t('quiz.answerWas', { answer: question.options[question.answer]![locale] })}
            </Text>
          ) : null}
          <Button variant="brand" label={t('quiz.next')} onPress={next} className="mt-5" />
        </View>
      ) : null}
    </Screen>
  );
};

export default Quiz;
