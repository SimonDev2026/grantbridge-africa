// Unit tests for the deterministic quiz scoring (src/features/matching/score.ts).
// Fixtures are real seed grants — see tests/fixtures/seed-grants.ts. No DB, no AI.
import { describe, expect, it } from 'vitest';

import { isEligible, rankGrants, scoreGrant } from '@/features/matching/score';

import {
  AWESOME_DISABILITY,
  D_PRIZE,
  GEF_MALAWI,
  JAPAN_GGP_NIGERIA,
  KENYA_NGO,
  MASTERCARD_CAMBRIDGE,
  NIGERIA_NGO,
  NIGERIA_REGIONS,
  POLLINATION,
  SEED_GRANTS,
  TONY_ELUMELU,
  US_ONLY_GRANT,
  USADF,
} from '../fixtures/seed-grants';

describe('isEligible', () => {
  it('shows an international grant to a Nigerian NGO (D-Prize, Africa region)', () => {
    expect(isEligible(NIGERIA_NGO, D_PRIZE, NIGERIA_REGIONS)).toBe(true);
  });

  it('shows an all-countries grant to anyone (Pollination Project)', () => {
    expect(isEligible(NIGERIA_NGO, POLLINATION, NIGERIA_REGIONS)).toBe(true);
    expect(isEligible(KENYA_NGO, POLLINATION, ['East Africa', 'Africa'])).toBe(true);
  });

  it('hides a US-only national grant from a Nigerian NGO', () => {
    expect(isEligible(NIGERIA_NGO, US_ONLY_GRANT, NIGERIA_REGIONS)).toBe(false);
  });

  it('hides a US-only national grant even when the applicant type matches', () => {
    // The synthetic grant accepts NGOs — country alone must still exclude it.
    expect(US_ONLY_GRANT.applicant_types).toContain('ngo');
    expect(isEligible(NIGERIA_NGO, US_ONLY_GRANT, NIGERIA_REGIONS)).toBe(false);
  });

  it('shows a national grant to its own country and hides it from others', () => {
    expect(isEligible(NIGERIA_NGO, JAPAN_GGP_NIGERIA, NIGERIA_REGIONS)).toBe(true);
    expect(isEligible(KENYA_NGO, JAPAN_GGP_NIGERIA, ['East Africa', 'Africa'])).toBe(false);
    expect(isEligible(NIGERIA_NGO, GEF_MALAWI, NIGERIA_REGIONS)).toBe(false);
  });

  it('filters out a grant with the wrong applicant type', () => {
    // Tony Elumelu takes individual/startup only; Mastercard Cambridge is individual only.
    expect(isEligible(NIGERIA_NGO, TONY_ELUMELU, NIGERIA_REGIONS)).toBe(false);
    expect(isEligible(NIGERIA_NGO, MASTERCARD_CAMBRIDGE, NIGERIA_REGIONS)).toBe(false);
    // ...but the same grants ARE eligible for an individual applicant.
    expect(isEligible({ ...NIGERIA_NGO, applicant_type: 'individual' }, TONY_ELUMELU, NIGERIA_REGIONS)).toBe(true);
    expect(isEligible({ ...NIGERIA_NGO, applicant_type: 'individual' }, MASTERCARD_CAMBRIDGE, NIGERIA_REGIONS)).toBe(true);
  });

  it('shows a grant with no country/region restriction stated', () => {
    const unrestricted = { ...D_PRIZE, eligible_countries: null, eligible_regions: null };
    expect(isEligible(NIGERIA_NGO, unrestricted, NIGERIA_REGIONS)).toBe(true);
  });
});

describe('scoreGrant', () => {
  it('scores a perfect-fit NGO grant at 100 (D-Prize: 20 scope + 20 type + 30 sector + 20 beneficiaries + 10 amount)', () => {
    const { score, reasons } = scoreGrant(NIGERIA_NGO, D_PRIZE, NIGERIA_REGIONS);
    expect(score).toBe(100);
    expect(reasons).toContain('International funder that accepts applicants from Nigeria');
    expect(reasons).toContain('Accepts ngo applicants');
    expect(reasons).toContain('Funds economic empowerment');
    expect(reasons).toContain('Prioritises rural low income');
  });

  it('gives no amount points when the grant max is below the need floor (Pollination $1,000 vs $5,000–25,000 need)', () => {
    const { score } = scoreGrant(NIGERIA_NGO, POLLINATION, NIGERIA_REGIONS);
    // 20 scope + 20 type + 30 sector + 20 beneficiaries + 0 amount = 90
    expect(score).toBe(90);
  });

  it('gives partial amount points when the grant max overshoots the need (USADF $250,000 vs $5,000–25,000 need)', () => {
    const { score } = scoreGrant(NIGERIA_NGO, USADF, NIGERIA_REGIONS);
    // 20 scope + 20 type + 30 sector + 20 beneficiaries + 5 amount = 95
    expect(score).toBe(95);
  });

  it('gives full amount points when the max sits inside 4x the need (D-Prize $20,000 vs $5,000–25,000)', () => {
    const { score } = scoreGrant(NIGERIA_NGO, D_PRIZE, NIGERIA_REGIONS);
    expect(score).toBe(100);
  });

  it('gives no amount points when the grant publishes no USD max (Japan GGP is JPY-only)', () => {
    const { score } = scoreGrant(NIGERIA_NGO, JAPAN_GGP_NIGERIA, NIGERIA_REGIONS);
    // 20 scope + 20 type + 30 sector + 20 beneficiaries + 0 amount = 90
    expect(score).toBe(90);
  });

  it('scores a sector mismatch lower (Awesome Disability: health/tech, not economic empowerment)', () => {
    const { score } = scoreGrant(NIGERIA_NGO, AWESOME_DISABILITY, NIGERIA_REGIONS);
    // 20 scope + 20 type + 0 sector + 0 beneficiaries + 0 amount = 40
    expect(score).toBe(40);
  });

  it('caps reasons at 4 even when deadline + partner notes also apply', () => {
    const withExtras = { ...D_PRIZE, partner_required: 'a registered local partner' };
    const { reasons } = scoreGrant(NIGERIA_NGO, withExtras, NIGERIA_REGIONS);
    expect(reasons.length).toBeLessThanOrEqual(4);
  });
});

describe('rankGrants', () => {
  it('ranks the seed grants for a Nigerian NGO: D-Prize first, wrong-type grants excluded', () => {
    const ranked = rankGrants(NIGERIA_NGO, SEED_GRANTS, NIGERIA_REGIONS);
    const titles = ranked.map((g) => g.title);
    expect(titles[0]).toBe('D-Prize Global Competition 2026');
    expect(titles).toContain('U.S. African Development Foundation Grants');
    expect(titles).toContain('Japan Grant Assistance for Grass-roots Human Security Projects (GGP) — Nigeria');
    expect(titles).not.toContain('Tony Elumelu Foundation Entrepreneurship Programme');
    expect(titles).not.toContain('Mastercard Foundation Scholars Program — University of Cambridge');
    expect(titles).not.toContain('GEF Small Grants Programme — Malawi (OP8)');
    // Scores descend.
    const scores = ranked.map((g) => g.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('breaks score ties by earliest deadline first', () => {
    const a = { ...D_PRIZE, id: 'a', deadline: '2026-12-06' };
    const b = { ...D_PRIZE, id: 'b', deadline: '2026-11-01' };
    const ranked = rankGrants(NIGERIA_NGO, [a, b], NIGERIA_REGIONS);
    expect(ranked[0].id).toBe('b');
  });

  it('returns an empty list when nothing is eligible', () => {
    expect(rankGrants(NIGERIA_NGO, [US_ONLY_GRANT, GEF_MALAWI], NIGERIA_REGIONS)).toEqual([]);
  });
});
