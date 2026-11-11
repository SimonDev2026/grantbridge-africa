'use client';

import { useEffect, useState } from 'react';

import type { GrantCardData } from '@/components/grant-card';
import {
  AlmostReadyInterstitial,
  CompletionScreen,
  MapInterstitial,
  ScanInterstitial,
} from '@/components/quiz/interstitials';
import { QuizProgress, StepShell, WhyThisMatters } from '@/components/quiz/quiz-chrome';
import { ResultsGate } from '@/components/quiz/results-gate';
import type { PreviewResult, QuizStats } from '@/components/quiz/types';
import { Button } from '@/components/ui/button';
import {
  AFRICAN_COUNTRIES,
  ANNUAL_BUDGETS,
  APPLICANT_TYPES,
  BENEFICIARIES,
  FUNDING_NEEDS,
  PROJECT_STAGES,
  REGISTRATION_TYPES,
  SECTORS,
} from '@/config/countries';
import { metaCookies, newEventId, track } from '@/libs/meta/pixel';
import { cn } from '@/utils/cn';

type Answers = {
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

// The 9 quiz steps and 5 applicant types are unchanged — the interstitials
// wrap around this flow, they do not replace any step.
const STEPS: {
  key: keyof Answers;
  title: string;
  why: string;
  type: 'options' | 'country' | 'text';
  options?: { value: string; label: string }[];
}[] = [
  { key: 'applicant_type', title: 'Who are you applying as?', why: 'Most funders only accept one type of applicant. This is the strongest filter we use.', type: 'options', options: [...APPLICANT_TYPES] },
  { key: 'registration_type', title: 'How is your organisation registered?', why: 'Many donors need proof of legal registration in your country, for example CAC Incorporated Trustees (Nigeria), the NGO Board (Kenya) or an NPC (South Africa).', type: 'options', options: [...REGISTRATION_TYPES] },
  { key: 'country', title: 'Which country are you based in?', why: 'Most grants are restricted by country. Some cover all of Africa and some cover one country only.', type: 'country' },
  { key: 'description', title: 'In 1–2 sentences, what does your organisation do and who does it serve?', why: 'Funders give to themes. We map your words to the language donors use.', type: 'text' },
  { key: 'sector', title: 'What is your main focus?', why: 'We match this against each funder’s priority areas.', type: 'options', options: [...SECTORS] },
  { key: 'beneficiaries', title: 'Who does your work mainly serve?', why: 'Funders that target a specific group often give larger grants.', type: 'options', options: [...BENEFICIARIES] },
  { key: 'funding_need', title: 'How much funding are you looking for?', why: 'We hide grants that are far too small or far too large for you.', type: 'options', options: [...FUNDING_NEEDS] },
  { key: 'annual_budget', title: 'What is your annual budget?', why: 'Many donors will not grant more than 25–50% of your yearly budget.', type: 'options', options: [...ANNUAL_BUDGETS] },
  { key: 'stage', title: 'What stage is your project at?', why: 'Some funders back new ideas and others only fund proven work.', type: 'options', options: [...PROJECT_STAGES] },
];

// Honest status messages for the loading screen — what is actually happening,
// no fake percentages.
const MATCH_STEPS = [
  'Checking 54 countries against funder eligibility rules…',
  'Reading grant calls for your sector…',
  'Ranking by fit score…',
  'Preparing your shortlist…',
];

type View =
  | 'question'
  | 'map'
  | 'scan'
  | 'almost'
  | 'done'
  | 'matching'
  | 'results';

const EMPTY_ANSWERS: Answers = {
  applicant_type: '',
  registration_type: '',
  country: '',
  description: '',
  sector: '',
  beneficiaries: '',
  funding_need: '',
  annual_budget: '',
  stage: '',
};

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [view, setView] = useState<View>('question');
  const [matchRow, setMatchRow] = useState(0);
  const [matches, setMatches] = useState<GrantCardData[]>([]);
  const [matchError, setMatchError] = useState('');
  const [email, setEmail] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Skip the registration step for individuals.
  const visibleSteps = STEPS.filter(
    (s) => !(s.key === 'registration_type' && answers.applicant_type === 'individual'),
  );
  const current = visibleSteps[step];
  const currentValue = current ? answers[current.key] : '';
  const canNext = currentValue.trim().length > 0;
  const answered = visibleSteps.filter((s) => answers[s.key].trim().length > 0).length;
  const total = visibleSteps.length;

  // Live stats for the interstitials (real open-grant / funder counts).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/quiz-results/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && !d.error) setStats(d);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Mid-quiz scan: count matches from the answers given so far.
  useEffect(() => {
    if (view !== 'scan') return;
    let cancelled = false;
    setPreviewLoading(true);
    fetch('/api/quiz-results/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && !d.error) setPreview(d);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    if (view !== 'matching') return;
    const t = setInterval(() => setMatchRow((r) => Math.min(r + 1, MATCH_STEPS.length - 1)), 900);
    return () => clearInterval(t);
  }, [view]);

  function setAnswer(key: keyof Answers, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  /** Forward from a question: interstitials sit between steps, keyed by step. */
  function next() {
    if (!current) return;
    if (current.key === 'applicant_type') return setView('map');
    if (current.key === 'sector') return setView('scan');
    if (current.key === 'annual_budget') return setView('almost');
    if (step >= visibleSteps.length - 1) return setView('done');
    setStep(step + 1);
  }

  /** Forward from an interstitial: move to the next question. */
  function continueFromInterstitial() {
    setStep((s) => Math.min(s + 1, visibleSteps.length - 1));
    setView('question');
  }

  /** Back from step 2 onward; interstitials step back to their question. */
  function back() {
    if (view === 'map' || view === 'scan' || view === 'almost' || view === 'done') {
      setView('question');
      return;
    }
    if (step === 0) window.location.href = '/';
    else setStep(step - 1);
  }

  async function finish() {
    setView('matching');
    setMatchRow(0);
    try {
      const res = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Matching failed');
      setMatches(data.matches ?? []);
      track('ViewContent', { content_name: 'quiz_results' });
    } catch (e) {
      setMatchError((e as Error).message);
    }
    // Keep the animation honest and short (≤ 20 s, here ~4 s).
    setTimeout(() => setView('results'), 3600);
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlockError('');
    setUnlocking(true);
    const eventId = newEventId();
    const { fbp, fbc } = metaCookies();
    track('Lead', {}, eventId);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, email, marketingConsent: marketing, eventId, fbp, fbc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save your email');
      localStorage.setItem('gb_quiz', JSON.stringify({ ...answers, email }));
      setUnlocked(true);
    } catch (err) {
      setUnlockError((err as Error).message);
    } finally {
      setUnlocking(false);
    }
  }

  const progressLabel =
    view === 'question' ? `Step ${step + 1} of ${total}` : `${answered} of ${total} answered`;

  if (view === 'matching') {
    return (
      <StepShell>
        <QuizProgress answered={total} total={total} label='All questions answered' />
        <h1 className='mt-8 text-center text-3xl lg:text-4xl'>Finding your grants…</h1>
        <div className='mt-8 flex flex-col gap-3 text-left'>
          {MATCH_STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                'rounded-xl border p-4 text-sm',
                i <= matchRow
                  ? 'border-brand-green bg-brand-greenSoft text-brand-ink'
                  : 'border-brand-line bg-white text-brand-muted',
              )}
            >
              {i <= matchRow ? '✓ ' : '○ '}
              {s}
            </div>
          ))}
        </div>
        <p className='mt-6 text-center text-sm text-brand-muted'>
          This is real work — we check every open grant against your answers.
        </p>
      </StepShell>
    );
  }

  if (view === 'results') {
    const totalValueUsd = matches.reduce(
      (sum, g) => sum + (typeof g.amount_usd_max === 'number' ? g.amount_usd_max : 0),
      0,
    );
    return (
      <ResultsGate
        matches={matches}
        matchError={matchError}
        totalValueUsd={totalValueUsd > 0 ? totalValueUsd : null}
        email={email}
        setEmail={setEmail}
        marketing={marketing}
        setMarketing={setMarketing}
        unlocked={unlocked}
        unlocking={unlocking}
        unlockError={unlockError}
        onUnlock={unlock}
      />
    );
  }

  if (view === 'map') {
    return (
      <div className='mx-auto w-full max-w-xl'>
        <QuizProgress answered={answered} total={total} label={progressLabel} />
        <MapInterstitial stats={stats} onBack={back} onContinue={continueFromInterstitial} />
      </div>
    );
  }

  if (view === 'scan') {
    return (
      <div className='mx-auto w-full max-w-xl'>
        <QuizProgress answered={answered} total={total} label={progressLabel} />
        <ScanInterstitial
          preview={preview}
          previewLoading={previewLoading}
          onBack={back}
          onContinue={continueFromInterstitial}
        />
      </div>
    );
  }

  if (view === 'almost') {
    return (
      <div className='mx-auto w-full max-w-xl'>
        <QuizProgress answered={answered} total={total} label={progressLabel} />
        <AlmostReadyInterstitial
          stats={stats}
          onBack={back}
          onContinue={continueFromInterstitial}
        />
      </div>
    );
  }

  if (view === 'done') {
    const recap = [
      { label: 'Applying as', value: labelFor(APPLICANT_TYPES, answers.applicant_type) },
      { label: 'Country', value: answers.country },
      { label: 'Focus', value: labelFor(SECTORS, answers.sector) },
      { label: 'Funding need', value: labelFor(FUNDING_NEEDS, answers.funding_need) },
    ].filter((r) => r.value);
    return (
      <div className='mx-auto w-full max-w-xl'>
        <QuizProgress answered={answered} total={total} label={progressLabel} />
        <CompletionScreen recap={recap} onSeeMatches={finish} onBack={back} />
      </div>
    );
  }

  if (!current) return null;

  return (
    <StepShell>
      <QuizProgress answered={answered} total={total} label={progressLabel} />

      <h1 className='mt-8 text-3xl lg:text-4xl'>{current.title}</h1>
      <WhyThisMatters text={current.why} />

      <div className='mt-6 flex flex-col gap-3'>
        {current.type === 'options' &&
          current.options!.map((o) => (
            <button
              key={o.value}
              type='button'
              onClick={() => setAnswer(current.key, o.value)}
              className={cn(
                'min-h-14 rounded-xl border p-4 text-left text-base font-medium',
                currentValue === o.value
                  ? 'border-brand-green bg-brand-greenSoft text-brand-ink'
                  : 'border-brand-line bg-white text-brand-ink hover:border-brand-green',
              )}
            >
              {o.label}
            </button>
          ))}

        {current.type === 'country' && (
          <select
            value={currentValue}
            onChange={(e) => setAnswer(current.key, e.target.value)}
            className='min-h-14 rounded-xl border border-brand-line bg-white p-4 text-base'
          >
            <option value=''>Select your country…</option>
            {AFRICAN_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {current.type === 'text' && (
          <>
            <textarea
              value={currentValue}
              onChange={(e) => setAnswer(current.key, e.target.value.slice(0, 240))}
              rows={3}
              maxLength={240}
              placeholder='e.g. We run free coding classes for girls in rural Kano State, Nigeria.'
              className='rounded-xl border border-brand-line bg-white p-4 text-base'
            />
            <p className='text-right text-xs text-brand-muted'>{currentValue.length}/240</p>
          </>
        )}
      </div>

      <div className='mt-8 flex justify-between'>
        <Button variant='outline' onClick={back}>
          {step === 0 ? '← Exit' : '← Back'}
        </Button>
        {step < visibleSteps.length - 1 ? (
          <Button disabled={!canNext} variant='brand' onClick={next}>
            Continue →
          </Button>
        ) : (
          <Button disabled={!canNext} variant='brand' onClick={next}>
            Finish →
          </Button>
        )}
      </div>
    </StepShell>
  );
}
