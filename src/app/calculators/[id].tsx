import { Redirect, useLocalSearchParams } from 'expo-router';

import { Calculator } from '@/features/calculators/components/Calculator';
import { CALC_DOC, CALCULATORS } from '@/features/calculators/registry';
import type { CalcId } from '@/features/calculators/types';

const CalculatorScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id || !(id in CALCULATORS)) {
    return <Redirect href="/explore" />;
  }
  const calcId = id as CalcId;
  return <Calculator id={calcId} docId={CALC_DOC[calcId]} />;
};

export default CalculatorScreen;
