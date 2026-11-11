// GrantBridge — provider-agnostic AI client (all open-weight models, free tiers first).
// Every provider below speaks the OpenAI-compatible API, so switching = changing env vars only.
//
//  PRIMARY  (free 10,000 neurons/day): Cloudflare Workers AI
//     AI_BASE_URL=https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1
//     AI_API_KEY=<Cloudflare API token with Workers AI permission>
//     AI_EXTRACT_MODEL=@cf/qwen/qwen3-30b-a3b-fp8   AI_WRITER_MODEL=@cf/qwen/qwen3-30b-a3b-fp8
//     AI_EMBED_MODEL=@cf/baai/bge-m3                (1024-dim, multilingual)
//  FALLBACK (free tier, rate-limited): Groq
//     AI_FALLBACK_BASE_URL=https://api.groq.com/openai/v1   AI_FALLBACK_API_KEY=<groq key>
//     AI_FALLBACK_MODEL=openai/gpt-oss-120b         (open-weight, Apache-2.0)
//  SELF-HOSTED (optional, Oracle Always Free VM or any server): infra/docker-compose.ai.yml
//     AI_BASE_URL=https://ai.yourdomain.com/v1  models: extractor / writer / embedder (LiteLLM names)
import { getEnvVar } from '@/utils/get-env-var';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };
type Provider = { base: string; key: string; model: string };

const primary = (kind: 'extract' | 'write'): Provider => ({
  base: getEnvVar(process.env.AI_BASE_URL, 'AI_BASE_URL').replace(/\/$/, ''),
  key: getEnvVar(process.env.AI_API_KEY, 'AI_API_KEY'),
  model: getEnvVar(kind === 'extract' ? process.env.AI_EXTRACT_MODEL : process.env.AI_WRITER_MODEL, kind === 'extract' ? 'AI_EXTRACT_MODEL' : 'AI_WRITER_MODEL'),
});
const fallback = (): Provider | null =>
  process.env.AI_FALLBACK_BASE_URL && process.env.AI_FALLBACK_API_KEY && process.env.AI_FALLBACK_MODEL
    ? { base: process.env.AI_FALLBACK_BASE_URL.replace(/\/$/, ''), key: process.env.AI_FALLBACK_API_KEY, model: process.env.AI_FALLBACK_MODEL }
    : null;

async function callChat(p: Provider, messages: Msg[], maxTokens: number, temperature: number) {
  const res = await fetch(`${p.base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`AI ${p.model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/** Chat with automatic fallback when the free quota of the primary provider is used up (HTTP 429 etc.). */
export async function chat(kind: 'extract' | 'write', messages: Msg[], opts: { maxTokens?: number } = {}) {
  const temp = kind === 'extract' ? 0 : 0.4, max = opts.maxTokens ?? 4000;
  try { return await callChat(primary(kind), messages, max, temp); }
  catch (e) { const fb = fallback(); if (!fb) throw e; console.warn('AI primary failed, using fallback:', (e as Error).message); return callChat(fb, messages, max, temp); }
}

/** Parse JSON even if the model wrapped it in text or ``` fences. */
export function parseJson<T = any>(text: string): T {
  const clean = text.replace(/```(?:json)?/g, '').trim();
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('No JSON in AI output');
  return JSON.parse(clean.slice(start, end + 1));
}

export async function embed(texts: string[]): Promise<number[][]> {
  const base = getEnvVar(process.env.AI_EMBED_BASE_URL ?? process.env.AI_BASE_URL, 'AI_BASE_URL').replace(/\/$/, '');
  const key = getEnvVar(process.env.AI_EMBED_API_KEY ?? process.env.AI_API_KEY, 'AI_API_KEY');
  const res = await fetch(`${base}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: getEnvVar(process.env.AI_EMBED_MODEL, 'AI_EMBED_MODEL'), input: texts }),
  });
  if (!res.ok) throw new Error(`Embedding error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding); // bge-m3 -> 1024 numbers
}

/** pgvector accepts the string form "[0.1,0.2,...]" */
export const toVector = (v: number[]) => `[${v.join(',')}]`;
