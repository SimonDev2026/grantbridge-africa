import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';

import { mapStripeProductsToProductWithPrices } from '@/features/pricing/controllers/map-stripe-products';
import { quizAnswersToProfile } from '@/features/profile/quiz-to-profile';

function stripeProduct(over: Partial<Stripe.Product>): Stripe.Product {
  return {
    id: 'prod_x',
    object: 'product',
    active: true,
    created: 0,
    livemode: false,
    name: 'Seeker',
    description: null,
    images: [],
    metadata: {},
    updated: 0,
    attributes: null,
    default_price: null,
    marketing_features: [],
    package_dimensions: null,
    shippable: null,
    statement_descriptor: null,
    tax_code: null,
    type: 'service',
    unit_label: null,
    url: null,
    ...over,
  } as Stripe.Product;
}

function stripePrice(over: Partial<Stripe.Price>): Stripe.Price {
  return {
    id: 'price_x',
    object: 'price',
    active: true,
    billing_scheme: 'per_unit',
    created: 0,
    currency: 'usd',
    livemode: false,
    lookup_key: null,
    metadata: {},
    nickname: null,
    product: 'prod_seeker',
    recurring: { aggregate_usage: null, interval: 'month', interval_count: 1, trial_period_days: null, usage_type: 'licensed' },
    tax_behavior: 'unspecified',
    tiers_mode: null,
    transform_quantity: null,
    type: 'recurring',
    unit_amount: 1900,
    unit_amount_decimal: '1900',
    ...over,
  } as Stripe.Price;
}

describe('mapStripeProductsToProductWithPrices', () => {
  it('keeps only GrantBridge products and USD prices', () => {
    const products = [
      stripeProduct({ id: 'prod_seeker', name: 'Seeker' }),
      stripeProduct({ id: 'prod_other', name: 'Some Other Business Plan' }),
      stripeProduct({ id: 'prod_inactive', name: 'Writer', active: false }),
    ];
    const prices = [
      stripePrice({ id: 'price_m', product: 'prod_seeker', unit_amount: 1900 }),
      stripePrice({ id: 'price_y', product: 'prod_seeker', recurring: { aggregate_usage: null, interval: 'year', interval_count: 1, trial_period_days: null, usage_type: 'licensed' }, unit_amount: 19000 }),
      stripePrice({ id: 'price_eur', product: 'prod_seeker', currency: 'eur', unit_amount: 1700 }),
      stripePrice({ id: 'price_other', product: 'prod_other', unit_amount: 999 }),
    ];
    const out = mapStripeProductsToProductWithPrices(products, prices);
    expect(out.map((p) => p.name)).toEqual(['Seeker']);
    expect(out[0].prices.map((p) => p.id)).toEqual(['price_m', 'price_y']);
    expect(out[0].prices[0].interval).toBe('month');
    expect(out[0].prices[1].interval).toBe('year');
  });

  it('maps a one-time price with no interval', () => {
    const products = [stripeProduct({ id: 'prod_draft', name: 'Single Application Draft' })];
    const prices = [
      stripePrice({ id: 'price_once', product: 'prod_draft', type: 'one_time', recurring: null, unit_amount: 2900 }),
    ];
    const out = mapStripeProductsToProductWithPrices(products, prices);
    expect(out).toHaveLength(1);
    expect(out[0].prices[0].type).toBe('one_time');
    expect(out[0].prices[0].interval).toBeNull();
    expect(out[0].prices[0].unit_amount).toBe(2900);
  });

  it('drops products with no sellable prices', () => {
    const products = [stripeProduct({ id: 'prod_seeker', name: 'Seeker' })];
    const out = mapStripeProductsToProductWithPrices(products, []);
    expect(out[0].prices).toEqual([]);
  });
});

describe('quizAnswersToProfile', () => {
  it('maps slugs to profile numbers and arrays', () => {
    const out = quizAnswersToProfile({
      org_name: '  Test Youth Foundation ',
      applicant_type: 'ngo',
      registration_type: 'registered_nonprofit',
      country: 'Nigeria',
      description: 'We run free education programs.',
      sector: 'education_youth',
      beneficiaries: 'youth',
      funding_need: '5000_25000',
      annual_budget: '10000_50000',
      stage: 'running',
    });
    expect(out).toEqual({
      org_name: 'Test Youth Foundation',
      applicant_type: 'ngo',
      registration_type: 'registered_nonprofit',
      country: 'Nigeria',
      description: 'We run free education programs.',
      sectors: ['education_youth'],
      beneficiaries: ['youth'],
      funding_need: 25000,
      annual_budget: 50000,
      stage: 'running',
    });
  });

  it('handles missing registration type and unknown slugs', () => {
    const out = quizAnswersToProfile({
      org_name: 'Solo',
      applicant_type: 'individual',
      registration_type: '',
      country: 'Kenya',
      description: 'x',
      sector: '',
      beneficiaries: '',
      funding_need: 'not_a_slug',
      annual_budget: 'not_a_slug',
      stage: 'idea',
    });
    expect(out.registration_type).toBe('');
    expect(out.sectors).toEqual([]);
    expect(out.beneficiaries).toEqual([]);
    expect(out.funding_need).toBeNull();
    expect(out.annual_budget).toBeNull();
  });
});
