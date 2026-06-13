/**
 * Macro & calorie targets from maintenance calories (TDEE) + goal.
 *
 * Approach (evidence-based, matches the KB's protein-first emphasis):
 *  - Calories  = TDEE × goal factor (cut −20%, maintain, bulk +10%).
 *  - Protein   = body weight × g/kg (higher when cutting to preserve muscle).
 *  - Fat       = 25% of calories (hormone support).
 *  - Carbs     = remaining calories (training fuel).
 */
export type Goal = 'cut' | 'maintain' | 'bulk';

export const GOALS: Goal[] = ['cut', 'maintain', 'bulk'];

const GOAL_FACTOR: Record<Goal, number> = { cut: 0.8, maintain: 1, bulk: 1.1 };
const PROTEIN_PER_KG: Record<Goal, number> = { cut: 2.2, maintain: 2.0, bulk: 1.8 };
const FAT_CALORIE_PCT = 0.25;

export type MacroResult = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export const calculateMacros = (input: {
  tdee: number;
  goal: Goal;
  weightKg: number;
}): MacroResult => {
  const calories = Math.round(input.tdee * GOAL_FACTOR[input.goal]);
  const proteinG = Math.round(input.weightKg * PROTEIN_PER_KG[input.goal]);
  const fatG = Math.round((calories * FAT_CALORIE_PCT) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { calories, proteinG, carbsG, fatG };
};
