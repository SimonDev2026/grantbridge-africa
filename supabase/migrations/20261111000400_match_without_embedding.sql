-- ============================================================================
-- 20261111000400_match_without_embedding.sql
-- Make match_grants() resilient when embeddings are missing.
--
-- BUG (found 2026-11-11): the original function required
--   g.embedding is not null and p.embedding is not null
-- but every seeded grant had a NULL embedding, so the dashboard matcher
-- returned ZERO rows for every user. Matching must never vanish entirely
-- just because a vector is missing.
--
-- FIX: when either embedding is missing, the vector part is skipped and the
-- other four parts (sectors 0.15 + beneficiaries 0.10 + amount 0.10 +
-- urgency 0.10 = 0.45) are renormalised by / 0.45, so scores stay on the
-- same 0..1 scale and ranking stays comparable. When both embeddings exist
-- the score is byte-identical to the previous version.
--
-- APPLY via the Supabase dashboard SQL Editor (paste verbatim, like the
-- earlier migrations) — then run the admin "Backfill embeddings" button on
-- /admin so grants get real vectors and the vector part applies again.
-- ============================================================================

create or replace function match_grants(p_user uuid, p_limit int default 50)
returns table (grant_id uuid, score numeric)
language sql stable security definer set search_path = public as $$
  select g.id,
    round((
      case
        when g.embedding is not null and p.embedding is not null then
          0.55 * (1 - (g.embedding <=> p.embedding))
          + 0.15 * (case when p.sectors && g.sectors or g.sectors = '{}' then 1 else 0 end)
          + 0.10 * (case when p.beneficiaries && g.beneficiaries or g.beneficiaries = '{}' then 1 else 0 end)
          + 0.10 * (case when g.amount_usd_max is null
                           or p.funding_need between coalesce(g.amount_usd_min,0) and g.amount_usd_max * 1.2 then 1 else 0 end)
          + 0.10 * (case when g.rolling or g.deadline < current_date + 45 then 1 else 0 end)
        else
          -- No vector available: renormalise the other parts (weights sum 0.45).
          (0.15 * (case when p.sectors && g.sectors or g.sectors = '{}' then 1 else 0 end)
          + 0.10 * (case when p.beneficiaries && g.beneficiaries or g.beneficiaries = '{}' then 1 else 0 end)
          + 0.10 * (case when g.amount_usd_max is null
                           or p.funding_need between coalesce(g.amount_usd_min,0) and g.amount_usd_max * 1.2 then 1 else 0 end)
          + 0.10 * (case when g.rolling or g.deadline < current_date + 45 then 1 else 0 end)) / 0.45
      end
    )::numeric, 4)
  from grants g join profiles p on p.user_id = p_user
  where g.approved and not g.fee_charged
    and g.status in ('open','upcoming')
    and (g.deadline is null or g.deadline >= current_date)
    and (g.all_countries or p.country = any(g.eligible_countries) or g.eligible_regions && p.regions)
    and not (p.country = any(g.excluded_countries))
    and (g.foreign_applicants_allowed is distinct from false or g.scope <> 'international')
    and (g.applicant_types = '{}' or p.applicant_type = any(g.applicant_types))
    and (g.registration_required is null or p.registration_type = any(g.registration_required))
    and (g.max_share_of_budget is null or p.annual_budget is null
         or p.funding_need <= p.annual_budget * g.max_share_of_budget)
  order by 2 desc
  limit p_limit;
$$;
