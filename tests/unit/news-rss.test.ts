// Unit tests for the news RSS helpers (src/libs/news/rss.ts).
// Fixtures are hand-written RSS snippets in the style of the real feeds —
// no network, no DB.
import { describe, expect, it } from 'vitest';

import { makeSummary, parseRss, plainTextFromHtml, slugify } from '@/libs/news/rss';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Example Funding News</title>
<item>
<title><![CDATA[New $50,000 Grant Opens for African Health NGOs]]></title>
<link>https://example.org/news/grant-opens</link>
<pubDate>Tue, 11 Nov 2026 09:00:00 +0000</pubDate>
<description><![CDATA[<p>The fund will support community health programmes across East Africa. Applications close on 15 January 2027. Eligible organisations must be registered non-profits.</p>]]></description>
</item>
<item>
<title>Second story without a description</title>
<link>https://example.org/news/second</link>
<pubDate>Mon, 10 Nov 2026 09:00:00 +0000</pubDate>
</item>
<item>
<link>https://example.org/news/no-title</link>
</item>
</channel>
</rss>`;

describe('parseRss', () => {
  it('parses items with CDATA titles, links, dates and descriptions', () => {
    const items = parseRss(SAMPLE_RSS);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('New $50,000 Grant Opens for African Health NGOs');
    expect(items[0].link).toBe('https://example.org/news/grant-opens');
    expect(items[0].pubDate?.toISOString()).toBe('2026-11-11T09:00:00.000Z');
    expect(items[0].description).toContain('community health programmes');
  });

  it('skips items missing a title or a link', () => {
    const items = parseRss(SAMPLE_RSS);
    expect(items.every((i) => i.title && i.link)).toBe(true);
  });

  it('returns [] for non-RSS input', () => {
    expect(parseRss('<html><body>Just a moment...</body></html>')).toEqual([]);
    expect(parseRss('')).toEqual([]);
  });
});

describe('plainTextFromHtml', () => {
  it('strips tags and collapses whitespace', () => {
    expect(plainTextFromHtml('<p>Hello <b>world</b></p><p>Second line.</p>')).toBe(
      'Hello world Second line.'
    );
  });

  it('decodes entities', () => {
    expect(plainTextFromHtml('Fish &amp; Chips &#8212; tasty')).toBe('Fish & Chips — tasty');
  });
});

describe('makeSummary', () => {
  it('takes the first two sentences of the description', () => {
    const summary = makeSummary(
      '<p>The fund will support community health programmes across East Africa. Applications close on 15 January 2027. Eligible organisations must be registered non-profits.</p>',
      'Fallback title'
    );
    expect(summary).toBe(
      'The fund will support community health programmes across East Africa. Applications close on 15 January 2027.'
    );
  });

  it('falls back to the title when the description is empty', () => {
    expect(makeSummary('', 'Fallback title')).toBe('Fallback title');
  });

  it('caps long summaries at ~280 characters', () => {
    const long = `<p>${'A very long sentence about funding. '.repeat(20)}</p>`;
    const summary = makeSummary(long, 'Title');
    expect(summary.length).toBeLessThanOrEqual(281);
  });
});

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('New $50,000 Grant Opens for African Health NGOs')).toBe(
      'new-50-000-grant-opens-for-african-health-ngos'
    );
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
  });
});
