// POST /api/admin/backfill-embeddings — admin only.
// Embeds every approved grant whose embedding is NULL, using the configured
// embed model (Cloudflare bge-m3, 1024-dim, via AI_API_KEY from the Vercel
// environment — no key value ever leaves the server). The embedding text
// uses the exact same shape as the collector's embed step
// (collector/pipeline.py): title + summary + sectors + beneficiaries +
// eligible regions. Batched like the collector (32 per call).
// Grants embedded here make the vector part of match_grants() apply again;
// until then matching still works via the fallback score (see migration
// 20261111000400).
import { NextResponse } from 'next/server';

import { isAdmin } from '@/app/admin/actions';
import { embed, toVector } from '@/libs/ai/client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;
const BATCH = 32;

function grantText(g: any): string {
  return [
    g.title,
    g.summary,
    (g.sectors ?? []).join(' '),
    (g.beneficiaries ?? []).join(' '),
    (g.eligible_regions ?? []).join(' '),
  ]
    .filter(Boolean)
    .join('. ');
}

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 401 });
  }

  const { data: rows, error } = await db
    .from('grants')
    .select('id,title,summary,sectors,beneficiaries,eligible_regions')
    .eq('approved', true)
    .is('embedding', null)
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grants = rows ?? [];
  let embedded = 0;
  const failed: string[] = [];

  for (let i = 0; i < grants.length; i += BATCH) {
    const batch = grants.slice(i, i + BATCH);
    let vecs: number[][];
    try {
      vecs = await embed(batch.map(grantText));
    } catch (e) {
      failed.push(...batch.map((g: any) => g.id));
      console.error('backfill-embeddings: embed call failed:', (e as Error).message);
      continue;
    }
    for (let j = 0; j < batch.length; j++) {
      if (!vecs[j] || vecs[j].length !== 1024) {
        failed.push(batch[j].id);
        continue;
      }
      const { error: upErr } = await db
        .from('grants')
        .update({ embedding: toVector(vecs[j]) })
        .eq('id', batch[j].id);
      if (upErr) failed.push(batch[j].id);
      else embedded++;
    }
  }

  const { count: remaining } = await db
    .from('grants')
    .select('id', { count: 'exact', head: true })
    .eq('approved', true)
    .is('embedding', null);

  return NextResponse.json({
    total: grants.length,
    embedded,
    failed: failed.length,
    remaining: remaining ?? 0,
  });
}
