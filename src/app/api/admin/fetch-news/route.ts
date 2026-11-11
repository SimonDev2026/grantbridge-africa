// POST /api/admin/fetch-news — admin only. Polls the news_sources RSS feeds
// and queues new items as DRAFTS for admin review. Nothing is auto-published
// and no full article text is copied: each queued draft carries the title,
// the source name + link, the feed date, and a 1–2 sentence summary derived
// from the item's own description. A per-feed failure is a soft error — the
// other feeds still run and the result reports each feed separately.
import { NextResponse } from 'next/server';

import { isAdmin } from '@/app/admin/actions';
import { makeSummary, parseRss, type RssItem,slugify } from '@/libs/news/rss';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_ITEMS_PER_FEED = 10;

async function fetchFeed(url: string): Promise<{ items: RssItem[]; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent':
          'GrantBridgeAfrica/1.0 (+https://grantbridge-africa-git-main-simondev2026.vercel.app/news)',
        accept: 'application/rss+xml, application/xml, text/xml',
      },
    });
    if (!res.ok) return { items: [], error: `HTTP ${res.status}` };
    const text = await res.text();
    const items = parseRss(text);
    if (items.length === 0) return { items: [], error: 'No RSS items found (feed may be blocked)' };
    return { items };
  } catch (e) {
    return { items: [], error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 401 });
  }

  const { data: sources, error: sourcesError } = await db
    .from('news_sources')
    .select('id, name, feed_url')
    .eq('active', true)
    .order('name');

  if (sourcesError) return NextResponse.json({ error: sourcesError.message }, { status: 500 });
  if (!sources?.length) {
    return NextResponse.json({
      error: 'No active news sources. Apply migration 20261111000700_news.sql first.',
    });
  }

  // Existing curated links, for dedup (table is small; one read is enough).
  const { data: existing } = await db
    .from('news_posts')
    .select('source_url')
    .eq('origin', 'curated');
  const seenUrls = new Set((existing ?? []).map((r: any) => r.source_url).filter(Boolean));
  const seenSlugs = new Set<string>();

  const results: { source: string; fetched: number; inserted: number; skipped: number; error?: string }[] = [];

  for (const source of sources as any[]) {
    const { items, error } = await fetchFeed(source.feed_url);
    const result = { source: source.name, fetched: items.length, inserted: 0, skipped: 0, error };
    if (error) {
      await db
        .from('news_sources')
        .update({ last_fetched_at: new Date().toISOString(), last_status: `error: ${error}` })
        .eq('id', source.id);
      results.push(result);
      continue;
    }

    for (const item of items.slice(0, MAX_ITEMS_PER_FEED)) {
      if (seenUrls.has(item.link)) {
        result.skipped += 1;
        continue;
      }
      seenUrls.add(item.link);
      let slug = slugify(item.title) || 'news-post';
      let n = 1;
      while (seenSlugs.has(slug)) {
        n += 1;
        slug = `${slugify(item.title) || 'news-post'}-${n}`;
      }
      seenSlugs.add(slug);
      const summary = makeSummary(item.description, item.title);
      const { error: insertError } = await db.from('news_posts').insert({
        title: item.title,
        slug,
        summary,
        body: summary,
        source_name: source.name,
        source_url: item.link,
        origin: 'curated',
        status: 'draft',
        published_at: item.pubDate ? item.pubDate.toISOString() : new Date().toISOString(),
      });
      if (insertError) {
        // Slug collision with a post created since the run started — skip it.
        result.skipped += 1;
        continue;
      }
      result.inserted += 1;
    }

    await db
      .from('news_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        last_status: `ok: ${result.inserted} new, ${result.skipped} skipped`,
      })
      .eq('id', source.id);
    results.push(result);
  }

  return NextResponse.json({ ok: true, results });
}
