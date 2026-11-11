// GrantBridge Africa — single brand config file.
// Change the name, logo, colours or prices HERE and the whole site follows.
// (The user may rename the product later; nothing else hard-codes these values.)
export const BRAND = {
  name: 'GrantBridge Africa',
  shortName: 'GrantBridge',
  tagline: 'Find the grants your African organisation actually qualifies for',
  description:
    'GrantBridge searches global funders that accept African applicants and Africa-focused donors in one place, checks every eligibility rule for your country, and drafts the application.',
  // Design tokens (also mirrored as CSS variables in src/styles/globals.css)
  colors: {
    ink: '#14211B',
    muted: '#5C6B63',
    line: '#E3E7E1',
    bg: '#FAF8F3',
    green: '#0E6B4A',
    greenSoft: '#E7F3EC',
    sun: '#E8A33D',
    sunSoft: '#FCF1DF',
    blueTag: '#E8EEFB',
  },
  logo: {
    mark: '/brand/logo.png',
    alt: 'GrantBridge Africa logo — a bridge over Africa with the sun rising',
  },
  contact: {
    // One shared mailbox: info, support and admin all land here (owner decision 2026-11-11).
    email: 'info@grantbridgeafrica.com',
    supportEmail: 'info@grantbridgeafrica.com',
  },
  countriesCovered: 54,
  // Prices in US dollars, every country. Names must match the Stripe products exactly.
  plans: [
    {
      key: 'explorer',
      name: 'Explorer',
      tagline: 'Free account, forever',
      monthlyUsd: 0,
      yearlyUsd: 0,
      popular: false,
      features: ['Take the quiz', 'See your top 3 matches', 'Weekly email of new grants'],
      cta: 'Start free',
    },
    {
      key: 'seeker',
      name: 'Seeker',
      tagline: 'Find every grant you qualify for',
      monthlyUsd: 19,
      yearlyUsd: 190,
      popular: false,
      features: [
        'Unlimited international + African matches',
        'Full eligibility details',
        'Deadline alerts and tracker',
        '1 AI application draft a month',
      ],
      cta: 'Choose Seeker',
    },
    {
      key: 'writer',
      name: 'Writer',
      tagline: 'Most popular — find and write',
      monthlyUsd: 49,
      yearlyUsd: 490,
      popular: true,
      features: [
        'Everything in Seeker',
        '10 AI application drafts a month',
        'Every document the funder asks for',
        'Word and PDF export',
      ],
      cta: 'Choose Writer',
    },
    {
      key: 'pro',
      name: 'Pro',
      tagline: 'For consultants and NGO networks',
      monthlyUsd: 149,
      yearlyUsd: 1490,
      popular: false,
      features: [
        'Unlimited AI drafts',
        'Up to 10 organisations',
        'Priority support',
      ],
      cta: 'Choose Pro',
    },
  ],
  // One-time purchases (no subscription). Names must match the Stripe products exactly.
  oneTime: [
    {
      key: 'draft_credit',
      name: 'Single Application Draft',
      priceUsd: 29,
      tagline: 'Full first draft of every required document for one grant',
      features: ['Edit, then export Word/PDF'],
      cta: 'Buy one draft',
    },
    {
      key: 'review',
      name: 'Expert Review',
      priceUsd: 149,
      tagline: 'AI draft improved by a human grant writer',
      features: ['Feedback within 5 working days'],
      cta: 'Book a review',
    },
    {
      key: 'done_for_you',
      name: 'Done-for-you Application',
      priceUsd: 399,
      tagline: 'We write the full application with you',
      features: ['Guided submission on the funder’s portal — you press submit'],
      cta: 'Get it done',
    },
  ],
} as const;

export type PlanKey = (typeof BRAND.plans)[number]['key'];
export type OneTimeKey = (typeof BRAND.oneTime)[number]['key'];
