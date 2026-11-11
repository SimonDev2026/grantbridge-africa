import {
  ANNUAL_BUDGETS,
  FUNDING_NEEDS,
} from '@/config/countries';

/** The quiz answers, as the quiz page collects them (10 steps). */
export type QuizAnswers = {
  org_name: string;
  applicant_type: string;
  registration_type: string;
  country: string;
  description: string;
  sector: string;
  beneficiaries: string;
  funding_need: string;
  annual_budget: string;
  stage: string;
};

/**
 * Map quiz answers onto the `profiles` row shape. The quiz stores ranges
 * as slugs ("5000_25000"); the profile stores numbers — funding_need is
 * the top of the chosen range, annual_budget is the range's amount — the
 * same mapping the profile page's localStorage pre-fill already used.
 * Pure function, unit-tested.
 */
export function quizAnswersToProfile(answers: QuizAnswers) {
  const need = FUNDING_NEEDS.find((n) => n.value === answers.funding_need);
  const budget = ANNUAL_BUDGETS.find((b) => b.value === answers.annual_budget);
  return {
    org_name: answers.org_name.trim(),
    applicant_type: answers.applicant_type,
    registration_type: answers.registration_type ?? '',
    country: answers.country,
    description: answers.description,
    sectors: answers.sector ? [answers.sector] : [],
    beneficiaries: answers.beneficiaries ? [answers.beneficiaries] : [],
    funding_need: need ? need.max : null,
    annual_budget: budget ? budget.amount : null,
    stage: answers.stage,
  };
}
