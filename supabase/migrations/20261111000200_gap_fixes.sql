-- Step 2 gap fixes (DRAFT — review with the user before copying into the repo and applying).
--
-- Fixes, in order:
--  1. Seed ALL 54 African countries in country_regions (kit ships only 5).
--  2. Enable RLS on funders, sources, raw_pages, country_regions (kit leaves them open).
--  3. De-duplicate grants on official_url + funders on name.
--
-- Tagging rules used for the seed:
--  * UN subregion for every country (North / West / Central / East / Southern Africa).
--  * Regional bloc where the country is a member: ECOWAS (West), EAC (East),
--    SADC (Southern + some East/Central), ECCAS (Central), MENA (North).
--  * LMIC only for lower-middle-income economies (World Bank); low-income and
--    upper-middle/high-income countries do NOT get the LMIC tag.
--  * ODA for every country except the two high-income ones (Mauritius, Seychelles).
--  * NOTE: Burkina Faso, Mali and Niger formally left ECOWAS in Jan 2025, but
--    funders still commonly list ECOWAS eligibility for them, so the ECOWAS tag
--    is kept. Flag to the user at Step 2 review if he wants it dropped.

-- ---------- 1. All 54 countries ----------
insert into country_regions (country, regions) values
 ('Algeria','{Africa,"North Africa",MENA,LMIC,ODA}'),
 ('Angola','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,SADC,LMIC,ODA}'),
 ('Benin','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Botswana','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,ODA}'),
 ('Burkina Faso','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Burundi','{Africa,"Sub-Saharan Africa","East Africa",EAC,ECCAS,ODA}'),
 ('Cabo Verde','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Cameroon','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,LMIC,ODA}'),
 ('Central African Republic','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,ODA}'),
 ('Chad','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,ODA}'),
 ('Comoros','{Africa,"Sub-Saharan Africa","East Africa",SADC,LMIC,ODA}'),
 ('Congo','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,LMIC,ODA}'),
 ('DR Congo','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,EAC,SADC,ODA}'),
 ('Djibouti','{Africa,"Sub-Saharan Africa","East Africa",LMIC,ODA}'),
 ('Egypt','{Africa,"North Africa",MENA,LMIC,ODA}'),
 ('Equatorial Guinea','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,ODA}'),
 ('Eritrea','{Africa,"Sub-Saharan Africa","East Africa",ODA}'),
 ('Eswatini','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,LMIC,ODA}'),
 ('Ethiopia','{Africa,"Sub-Saharan Africa","East Africa",ODA}'),
 ('Gabon','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,ODA}'),
 ('Gambia','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Ghana','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Guinea','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Guinea-Bissau','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Kenya','{Africa,"Sub-Saharan Africa","East Africa",EAC,LMIC,ODA}'),
 ('Lesotho','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,LMIC,ODA}'),
 ('Liberia','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Libya','{Africa,"North Africa",MENA,ODA}'),
 ('Madagascar','{Africa,"Sub-Saharan Africa","East Africa",SADC,ODA}'),
 ('Malawi','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,ODA}'),
 ('Mali','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Mauritania','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Mauritius','{Africa,"Sub-Saharan Africa","East Africa",SADC}'),
 ('Morocco','{Africa,"North Africa",MENA,LMIC,ODA}'),
 ('Mozambique','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,ODA}'),
 ('Namibia','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,ODA}'),
 ('Niger','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Nigeria','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Rwanda','{Africa,"Sub-Saharan Africa","East Africa",EAC,ECCAS,ODA}'),
 ('Senegal','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Seychelles','{Africa,"Sub-Saharan Africa","East Africa",SADC}'),
 ('Sierra Leone','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Somalia','{Africa,"Sub-Saharan Africa","East Africa",EAC,ODA}'),
 ('South Africa','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,ODA}'),
 ('South Sudan','{Africa,"Sub-Saharan Africa","East Africa",EAC,ODA}'),
 ('Sudan','{Africa,"North Africa",MENA,ODA}'),
 ('São Tomé and Príncipe','{Africa,"Sub-Saharan Africa","Central Africa",ECCAS,LMIC,ODA}'),
 ('Tanzania','{Africa,"Sub-Saharan Africa","East Africa",EAC,SADC,LMIC,ODA}'),
 ('Togo','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,ODA}'),
 ('Tunisia','{Africa,"North Africa",MENA,LMIC,ODA}'),
 ('Uganda','{Africa,"Sub-Saharan Africa","East Africa",EAC,ODA}'),
 ('Zambia','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,LMIC,ODA}'),
 ('Zimbabwe','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,LMIC,ODA}'),
 ('Côte d''Ivoire','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}')
on conflict (country) do nothing;

-- ---------- 2. RLS on the four tables the kit left open ----------
alter table funders enable row level security;
alter table sources enable row level security;
alter table raw_pages enable row level security;
alter table country_regions enable row level security;
-- No policies on funders / sources / raw_pages: only the service role
-- (collector + admin) can read or write them. Authenticated users get nothing.
-- country_regions is reference data the quiz needs, so anyone may read it;
-- only the service role may write it (no insert/update/delete policy).
create policy "country regions are public" on country_regions for select using (true);

-- ---------- 3. Grant + funder de-duplication ----------
-- Drop exact duplicate grants first (keep one row per normalised URL),
-- then enforce uniqueness on the normalised URL (case + trailing slash ignored).
delete from grants g using grants d
 where g.id > d.id
   and lower(regexp_replace(g.official_url, '/+$', '')) = lower(regexp_replace(d.official_url, '/+$', ''));
create unique index if not exists grants_official_url_norm_uidx
  on grants (lower(regexp_replace(official_url, '/+$', '')));

delete from funders f using funders d
 where f.id > d.id
   and lower(btrim(f.name)) = lower(btrim(d.name));
create unique index if not exists funders_name_norm_uidx
  on funders (lower(btrim(name)));
