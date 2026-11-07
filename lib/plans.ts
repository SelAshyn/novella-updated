export type Plan = "free" | "plus" | "schools"

export interface PlanLimits {
  maxBooks: number
  maxVocabularyWords: number
  dailyReviewLimit: number
  canUseAskLibrary: boolean
  canCreateClass: boolean
  canExportData: boolean
}

// Single tier — no paid plans until launch is validated.
// All users get the same generous limits.
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxBooks: 30,
    maxVocabularyWords: 300,   // was 30 → tripled to 90... but 300 is more generous for launch
    dailyReviewLimit: Infinity,
    canUseAskLibrary: false,
    canCreateClass: true,
    canExportData: false,
  },
  plus: {
    maxBooks: Infinity,
    maxVocabularyWords: Infinity,
    dailyReviewLimit: Infinity,
    canUseAskLibrary: true,
    canCreateClass: true,
    canExportData: true,
  },
  schools: {
    maxBooks: Infinity,
    maxVocabularyWords: Infinity,
    dailyReviewLimit: Infinity,
    canUseAskLibrary: true,
    canCreateClass: true,
    canExportData: true,
  },
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  const normalizedPlan = (plan?.toLowerCase() || "free") as Plan
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.free
}

export function canAddBook(currentCount: number, plan: string | null | undefined): boolean {
  const limits = getPlanLimits(plan)
  return currentCount < limits.maxBooks
}

export function canAddVocabulary(currentCount: number, plan: string | null | undefined): boolean {
  const limits = getPlanLimits(plan)
  return currentCount < limits.maxVocabularyWords
}

export function getDailyReviewLimit(plan: string | null | undefined): number {
  const limits = getPlanLimits(plan)
  return limits.dailyReviewLimit
}

export function canUseFeature(feature: keyof PlanLimits, plan: string | null | undefined): boolean {
  const limits = getPlanLimits(plan)
  return limits[feature] as boolean
}
