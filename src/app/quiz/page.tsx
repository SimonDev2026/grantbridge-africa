'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { GrantCard, GrantCardData } from '@/components/grant-card';
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

const MATCH_STEPS = [
  'Checking 54 countries against funder eligibility rules…',
  'Reading grant calls for your sector…',
  'Ranking by fit score…',
  'Preparing your shortlist…',
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    applicant_type: '',
    registration_type: '',
    country: '',
    description: '',
    sector: '',
    beneficiaries: '',
    funding_need: '',
    annual_budget: '',
    stage: '',
  });
  const [phase, setPhase] = useState<'quiz' | 'matching' | 'results'>('quiz');
  const [matchRow, setMatchRow] = useState(0);
  const [matches, setMatches] = useState<GrantCardData[]>([]);
  const [matchError, setMatchError] = useState('');
  const [email, setEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Skip the registration step for individuals.
  const visibleSteps = STEPS.filter(
    (s) => !(s.key === 'registration_type' && answers.applicant_type === 'individual')
  );
  const current = visibleSteps[step];
  const currentValue = answers[current.key];
  const canNext = currentValue.trim().length > 0;

  useEffect(() => {
    if (phase !== 'matching') return;
    const t = setInterval(() => setMatchRow((r) => Math.min(r + 1, MATCH_STEPS.length - 1)), 900);
    return () => clearInterval(t);
  }, [phase]);

  function setAnswer(key: keyof Answers, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  async function finish() {
    setPhase('matching');
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
    setTimeout(() => setPhase('results'), 3600);
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
        body: JSON.stringify({ answers, email, marketingConsent: true, eventId, fbp, fbc }),
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

  if (phase === 'matching') {
    return (
      <div className='mx-auto max-w-xl py-16 text-center'>
        <h1>Finding your grants…</h1>
        <div className='mt-8 flex flex-col gap-3 text-left'>
          {MATCH_STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                'rounded-xl border p-4 text-sm',
                i <= matchRow ? 'border-brand-green bg-brand-greenSoft text-brand-ink' : 'border-brand-line bg-white text-brand-muted'
              )}
            >
              {i <= matchRow ? '✓ ' : '○ '}
              {s}
            </div>
          ))}
        </div>
        <p className='mt-6 text-sm text-brand-muted'>
          This is real work — we check every open grant against your answers.
        </p>
      </div>
    );
  }

  if (phase === 'results') {
    const top3 = matches.slice(0, 3);
    const rest = matches.slice(3);
    return (
      <div className='mx-auto max-w-4xl py-10'>
        <h1 className='text-center'>Your matches</h1>
        <p className='mt-2 text-center text-brand-muted'>
          {matches.length > 0
            ? `${matches.length} grant${matches.length === 1 ? '' : 's'} match your organisation, ranked by fit.`
            : 'No open grants match your answers right now — new grants are added daily, and we will email you when one fits.'}
        </p>
        {matchError && <p className='mt-4 rounded-xl bg-red-50 p-4 text-center text-sm text-red-700'>{matchError}</p>}

        {top3.length > 0 && (
          <div className='mt-8 grid gap-4 md:grid-cols-3'>
            {top3.map((g) => (
              <GrantCard key={g.id} grant={g} />
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className='mt-8'>
            {!unlocked ? (
              <div className='relative'>
                <div className='grid gap-4 opacity-40 blur-sm md:grid-cols-3' aria-hidden>
                  {rest.slice(0, 3).map((g) => (
                    <GrantCard key={g.id} grant={g} />
                  ))}
                </div>
                <form
                  onSubmit={unlock}
                  className='absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 p-6 text-center'
                >
                  <h2 className='text-2xl'>See all {matches.length} matches</h2>
                  <p className='max-w-md text-sm text-brand-muted'>
                    Enter your email to unlock the full shortlist. We’ll also send you new matches
                    weekly. No spam, unsubscribe any time.
                  </p>
                  <div className='flex w-full max-w-md flex-col gap-2 sm:flex-row'>
                    <input
                      type='email'
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder='you@organisation.org'
                      className='min-h-11 flex-1 rounded-lg border border-brand-line bg-white px-3 text-base'
                    />
                    <Button type='submit' disabled={unlocking} className='bg-brand-green text-white hover:bg-brand-green/90'>
                      {unlocking ? 'Unlocking…' : 'Unlock my matches'}
                    </Button>
                  </div>
                  {unlockError && <p className='text-sm text-red-600'>{unlockError}</p>}
                </form>
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-3'>
                {rest.map((g) => (
                  <GrantCard key={g.id} grant={g} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className='mt-10 rounded-2xl bg-brand-greenSoft p-6 text-center'>
          <h2>Save these matches and get AI drafts</h2>
          <p className='mx-auto mt-2 max-w-xl text-sm text-brand-muted'>
            Create your free account to save matches, track deadlines, and draft applications.
          </p>
          <div className='mt-4'>
            <Button className='bg-brand-green text-white hover:bg-brand-green/90' asChild>
              <Link href='/signup'>Create your free account →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-xl py-10'>
      <div className='mb-2 flex items-center justify-between text-sm text-brand-muted'>
        <span>
          Step {step + 1} of {visibleSteps.length}
        </span>
        <span>{Math.round(((step + 1) / visibleSteps.length) * 100)}%</span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-brand-line'>
        <div
          className='h-full rounded-full bg-brand-green transition-all'
          style={{ width: `${((step + 1) / visibleSteps.length) * 100}%` }}
        />
      </div>

      <h1 className='mt-8 text-3xl lg:text-4xl'>{current.title}</h1>
      <p className='mt-2 text-brand-muted'>Why this matters: {current.why}</p>

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
                  : 'border-brand-line bg-white text-brand-ink hover:border-brand-green'
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
        <Button
          variant='outline'
          onClick={() => {
            if (step === 0) window.location.href = '/';
            else setStep(step - 1);
          }}
        >
          ← Back
        </Button>
        {step < visibleSteps.length - 1 ? (
          <Button
            disabled={!canNext}
            className='bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50'
            onClick={() => setStep(step + 1)}
          >
            Continue →
          </Button>
        ) : (
          <Button
            disabled={!canNext}
            className='bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50'
            onClick={finish}
          >
            See my matches →
          </Button>
        )}
      </div>
    </div>
  );
}
