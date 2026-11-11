// Unit tests for email marketing helpers (src/libs/email/*).
// Pure functions only — no network, no DB. The unsubscribe secret is a
// test-only dummy set here; production reads EMAIL_UNSUBSCRIBE_SECRET (or
// CRON_SECRET) from the environment.
process.env.CRON_SECRET = 'vitest-only-test-secret';

import { describe, expect, it } from 'vitest';

import { renderCampaignEmail } from '@/libs/email/render';
import { EMAIL_TEMPLATES } from '@/libs/email/templates';
import {
  createUnsubscribeToken,
  dedupeEmails,
  normalizeEmail,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from '@/libs/email/unsubscribe';

describe('normalizeEmail / dedupeEmails', () => {
  it('trims and lower-cases', () => {
    expect(normalizeEmail('  Ada@Example.ORG ')).toBe('ada@example.org');
  });

  it('dedupes case-insensitively and drops blanks and invalid addresses', () => {
    expect(
      dedupeEmails(['Ada@Example.org', 'ada@example.org', '  ', null, 'not-an-email', 'B@x.org'])
    ).toEqual(['ada@example.org', 'b@x.org']);
  });
});

describe('unsubscribe tokens', () => {
  it('round-trips: a token created for an email verifies for that email', () => {
    const token = createUnsubscribeToken('ada@example.org');
    expect(verifyUnsubscribeToken('ada@example.org', token)).toBe(true);
    expect(verifyUnsubscribeToken('ADA@EXAMPLE.ORG', token)).toBe(true);
  });

  it('is deterministic for the same address', () => {
    expect(createUnsubscribeToken('ada@example.org')).toBe(
      createUnsubscribeToken('ada@example.org')
    );
  });

  it('rejects a tampered token and the wrong email', () => {
    const token = createUnsubscribeToken('ada@example.org');
    const tampered = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0');
    expect(verifyUnsubscribeToken('ada@example.org', tampered)).toBe(false);
    expect(verifyUnsubscribeToken('other@example.org', token)).toBe(false);
    expect(verifyUnsubscribeToken('ada@example.org', '')).toBe(false);
  });

  it('builds an unsubscribe URL carrying the email and a valid token', () => {
    const url = unsubscribeUrl('ada@example.org');
    expect(url).toContain('/unsubscribe?email=ada%40example.org&token=');
    const token = new URL(url).searchParams.get('token')!;
    expect(verifyUnsubscribeToken('ada@example.org', token)).toBe(true);
  });
});

describe('renderCampaignEmail', () => {
  it('wraps the body in the brand shell with footer, contact and unsubscribe link', () => {
    const { html, text } = renderCampaignEmail('<p>Hello, world.</p>', 'ada@example.org');
    expect(html).toContain('GrantBridge Africa');
    expect(html).toContain('<p>Hello, world.</p>');
    expect(html).toContain('info@grantbridgeafrica.com');
    expect(html).toContain('/unsubscribe?email=ada%40example.org&token=');
    expect(text).toContain('Hello, world.');
    expect(text).toContain('Unsubscribe:');
    expect(text).toContain('/unsubscribe?email=ada%40example.org&token=');
  });
});

describe('EMAIL_TEMPLATES', () => {
  it('has three real templates with subject and body, no placeholder filler', () => {
    expect(EMAIL_TEMPLATES.map((t) => t.key)).toEqual(['welcome', 'new-grants', 'announcement']);
    for (const t of EMAIL_TEMPLATES) {
      expect(t.subject.trim().length).toBeGreaterThan(0);
      expect(t.body.trim().length).toBeGreaterThan(0);
      expect(t.body).not.toContain('Lorem');
    }
  });

  it('names no invented grants, amounts or deadlines', () => {
    const joined = EMAIL_TEMPLATES.map((t) => t.body).join('\n');
    expect(joined).not.toMatch(/\$\d/);
    // The only bracketed line is the admin's instruction to fill in real grants.
    const brackets = joined.match(/\[[^\]]+\]/g) ?? [];
    expect(brackets.length).toBeGreaterThan(0);
    for (const b of brackets) {
      expect(b.toLowerCase()).toMatch(/replace|write the announcement/);
    }
  });
});
