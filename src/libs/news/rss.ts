// Tiny, dependency-free RSS 2.0 parsing + summary helpers for the news feed.
// Only used server-side by POST /api/admin/fetch-news. No network calls here —
// the route fetches, this file parses. Everything returned is derived from the
// feed item itself; nothing is invented.

export type RssItem = {
  title: string;
  link: string;
  pubDate: Date | null;
  description: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => {
      const n = Number(code);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    });
}

/** Extract the inner text of <tag>…</tag> (CDATA-aware), decoded, trimmed. */
function field(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i');
  const m = block.match(re);
  if (!m) return '';
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  if (cdata) v = cdata[1];
  return decodeEntities(v).trim();
}

/** Parse an RSS 2.0 document into items. Returns [] on malformed input. */
export function parseRss(xml: string): RssItem[] {
  if (!xml || !/<rss[\s>]/i.test(xml)) return [];
  const items: RssItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = field(block, 'title');
    const link = field(block, 'link');
    if (!title || !link) continue;
    const rawDate = field(block, 'pubDate');
    const parsed = rawDate ? new Date(rawDate) : null;
    items.push({
      title,
      link,
      pubDate: parsed && !Number.isNaN(parsed.getTime()) ? parsed : null,
      description: field(block, 'description'),
    });
  }
  return items;
}

/** Strip HTML tags from a description, collapse whitespace, decode entities. */
export function plainTextFromHtml(html: string): string {
  if (!html) return '';
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a 1–2 sentence summary from a feed item's description text.
 * Takes the first one or two sentences of the item's own words (never
 * invented), capped at ~280 characters. Falls back to the title when the
 * description is empty.
 */
export function makeSummary(descriptionHtml: string, fallbackTitle: string): string {
  const text = plainTextFromHtml(descriptionHtml);
  if (!text) return fallbackTitle;
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*/g) ?? [];
  const picked = sentences.length > 0 ? sentences.map((s) => s.trim()).slice(0, 2).join(' ') : text;
  const summary = picked || text;
  if (summary.length <= 280) return summary;
  const cut = summary.slice(0, 277);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 200 ? lastSpace : 277).trim()}…`;
}

/** Turn a title into a URL slug: lowercase, words joined with hyphens. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
