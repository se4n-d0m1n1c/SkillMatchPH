-- Move program weights into the database.
--
-- Adds editable RIASEC and aptitude vectors to public.programs, then seeds every
-- existing program whose title matches a row (or alias) from the SkillMatch PH
-- RIASEC College Program Weighting Guide.
--
-- Generated from src/data/assessmentData.js so the 51 published rows cannot be
-- mis-transcribed. 55 title/alias combinations.
--
-- Safe to re-run: seeding only fills rows that are still empty, so weights
-- edited in the admin UI are never overwritten.
--
-- Run once in the Supabase SQL Editor after schema.sql.

begin;

alter table public.programs
  add column if not exists riasec_weights jsonb,
  add column if not exists aptitude_weights jsonb;

comment on column public.programs.riasec_weights is
  'Percent weights for R, I, A, S, E, C. Null means fall back to the published weighting guide.';
comment on column public.programs.aptitude_weights is
  'Percent weights for verbal, spatial, numerical, logical. Null means fall back to the published weighting guide.';

-- Validation: either null, or an object carrying every key with numbers that
-- total 100. This stops the admin editor (or a hand-written UPDATE) from saving
-- a vector that would silently distort every comparison.
create or replace function public.is_valid_weight_vector(vector jsonb, required_keys text[])
returns boolean
language sql
immutable
as $$
  select vector is null
      or (
        jsonb_typeof(vector) = 'object'
        and not exists (
          select 1
          from unnest(required_keys) as required_key
          where (case when jsonb_typeof(vector -> required_key) = 'number'
                      then (vector ->> required_key)::numeric
                 end) is null
             or (case when jsonb_typeof(vector -> required_key) = 'number'
                      then (vector ->> required_key)::numeric
                 end) not between 0 and 100
        )
        and (
          select coalesce(sum(
            case when jsonb_typeof(vector -> required_key) = 'number'
                 then (vector ->> required_key)::numeric
                 else 0 end
          ), 0)
          from unnest(required_keys) as required_key
        ) between 99.5 and 100.5
      );
$$;

alter table public.programs
  drop constraint if exists programs_riasec_weights_valid;
alter table public.programs
  add constraint programs_riasec_weights_valid
  check (public.is_valid_weight_vector(riasec_weights, array['R', 'I', 'A', 'S', 'E', 'C']));

alter table public.programs
  drop constraint if exists programs_aptitude_weights_valid;
alter table public.programs
  add constraint programs_aptitude_weights_valid
  check (public.is_valid_weight_vector(aptitude_weights, array['verbal', 'spatial', 'numerical', 'logical']));

-- Mirrors the title normalisation used by the client: lowercase, drop the degree
-- prefix, keep only letters/digits/spaces.
create or replace function public.normalize_program_title(value text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(coalesce(value, '')),
        '^(bs|ba|bachelor of science in|bachelor of arts in|bachelor of)\s+',
        ''
      ),
      '[^a-z0-9 ]',
      ' ',
      'g'
    )
  );
$$;

with profiles (title_key, riasec_weights, aptitude_weights) as (
  values
  ('information technology', '{"R":20,"I":35,"A":10,"S":5,"E":10,"C":20}'::jsonb, '{"verbal":15,"spatial":20,"numerical":30,"logical":35}'::jsonb),
  ('computer science', '{"R":10,"I":50,"A":10,"S":5,"E":5,"C":20}'::jsonb, '{"verbal":15,"spatial":10,"numerical":35,"logical":40}'::jsonb),
  ('information systems', '{"R":10,"I":25,"A":5,"S":10,"E":25,"C":25}'::jsonb, '{"verbal":25,"spatial":10,"numerical":30,"logical":35}'::jsonb),
  ('cybersecurity', '{"R":25,"I":40,"A":5,"S":5,"E":5,"C":20}'::jsonb, '{"verbal":10,"spatial":20,"numerical":30,"logical":40}'::jsonb),
  ('data science', '{"R":5,"I":55,"A":5,"S":5,"E":10,"C":20}'::jsonb, '{"verbal":10,"spatial":5,"numerical":40,"logical":45}'::jsonb),
  ('software engineering', '{"R":10,"I":45,"A":10,"S":5,"E":10,"C":20}'::jsonb, '{"verbal":15,"spatial":10,"numerical":35,"logical":40}'::jsonb),
  ('computer engineering', '{"R":35,"I":40,"A":5,"S":5,"E":5,"C":10}'::jsonb, '{"verbal":5.51,"spatial":23.69,"numerical":29.2,"logical":41.6}'::jsonb),
  ('civil engineering', '{"R":40,"I":30,"A":5,"S":5,"E":10,"C":10}'::jsonb, '{"verbal":7.27,"spatial":28.2,"numerical":24.42,"logical":40.12}'::jsonb),
  ('mechanical engineering', '{"R":45,"I":30,"A":5,"S":5,"E":5,"C":10}'::jsonb, '{"verbal":5.57,"spatial":30.08,"numerical":23.4,"logical":40.95}'::jsonb),
  ('electrical engineering', '{"R":35,"I":40,"A":5,"S":5,"E":5,"C":10}'::jsonb, '{"verbal":5.51,"spatial":23.69,"numerical":29.2,"logical":41.6}'::jsonb),
  ('electronics engineering', '{"R":30,"I":40,"A":10,"S":5,"E":5,"C":10}'::jsonb, '{"verbal":7.26,"spatial":23.46,"numerical":29.61,"logical":39.66}'::jsonb),
  ('industrial engineering', '{"R":20,"I":25,"A":5,"S":10,"E":20,"C":20}'::jsonb, '{"verbal":15.77,"spatial":19,"numerical":32.62,"logical":32.62}'::jsonb),
  ('architecture', '{"R":20,"I":15,"A":40,"S":5,"E":10,"C":10}'::jsonb, '{"verbal":22.11,"spatial":38.28,"numerical":16.83,"logical":22.77}'::jsonb),
  ('interior design', '{"R":10,"I":10,"A":55,"S":5,"E":10,"C":10}'::jsonb, '{"verbal":29.72,"spatial":42.31,"numerical":13.99,"logical":13.99}'::jsonb),
  ('multimedia arts', '{"R":5,"I":5,"A":60,"S":10,"E":15,"C":5}'::jsonb, '{"verbal":39.77,"spatial":45.08,"numerical":7.58,"logical":7.58}'::jsonb),
  ('communication', '{"R":5,"I":10,"A":25,"S":20,"E":30,"C":10}'::jsonb, '{"verbal":43.05,"spatial":25.11,"numerical":17.94,"logical":13.9}'::jsonb),
  ('journalism', '{"R":5,"I":25,"A":25,"S":15,"E":15,"C":15}'::jsonb, '{"verbal":26.28,"spatial":20.44,"numerical":29.93,"logical":23.36}'::jsonb),
  ('psychology', '{"R":5,"I":30,"A":10,"S":35,"E":10,"C":10}'::jsonb, '{"verbal":31.14,"spatial":10.62,"numerical":30.77,"logical":27.47}'::jsonb),
  ('biology', '{"R":10,"I":55,"A":5,"S":15,"E":5,"C":10}'::jsonb, '{"verbal":10.95,"spatial":8.93,"numerical":40.06,"logical":40.06}'::jsonb),
  ('chemistry', '{"R":15,"I":55,"A":5,"S":5,"E":5,"C":15}'::jsonb, '{"verbal":5.59,"spatial":11.73,"numerical":41.34,"logical":41.34}'::jsonb),
  ('physics', '{"R":20,"I":60,"A":5,"S":5,"E":5,"C":5}'::jsonb, '{"verbal":5.24,"spatial":13.87,"numerical":36.91,"logical":43.98}'::jsonb),
  ('mathematics', '{"R":5,"I":60,"A":5,"S":5,"E":10,"C":15}'::jsonb, '{"verbal":7.25,"spatial":5.8,"numerical":46.09,"logical":40.87}'::jsonb),
  ('statistics', '{"R":5,"I":55,"A":5,"S":5,"E":15,"C":15}'::jsonb, '{"verbal":9.15,"spatial":6.1,"numerical":45.12,"logical":39.63}'::jsonb),
  ('nursing', '{"R":5,"I":20,"A":5,"S":50,"E":10,"C":10}'::jsonb, '{"verbal":43.98,"spatial":8.3,"numerical":25.73,"logical":21.99}'::jsonb),
  ('medical technology', '{"R":15,"I":45,"A":5,"S":20,"E":5,"C":10}'::jsonb, '{"verbal":14.16,"spatial":12.65,"numerical":35.24,"logical":37.95}'::jsonb),
  ('pharmacy', '{"R":10,"I":45,"A":5,"S":20,"E":5,"C":15}'::jsonb, '{"verbal":14.64,"spatial":9.66,"numerical":39.25,"logical":36.45}'::jsonb),
  ('physical therapy', '{"R":15,"I":25,"A":5,"S":40,"E":10,"C":10}'::jsonb, '{"verbal":30.88,"spatial":14.74,"numerical":25.61,"logical":28.77}'::jsonb),
  ('occupational therapy', '{"R":10,"I":20,"A":10,"S":45,"E":10,"C":5}'::jsonb, '{"verbal":39.92,"spatial":15.5,"numerical":20.54,"logical":24.03}'::jsonb),
  ('business administration', '{"R":10,"I":10,"A":5,"S":15,"E":40,"C":20}'::jsonb, '{"verbal":36.14,"spatial":15.35,"numerical":28.71,"logical":19.8}'::jsonb),
  ('marketing management', '{"R":5,"I":10,"A":20,"S":15,"E":45,"C":5}'::jsonb, '{"verbal":46.83,"spatial":22.93,"numerical":15.12,"logical":15.12}'::jsonb),
  ('entrepreneurship', '{"R":10,"I":10,"A":10,"S":10,"E":50,"C":10}'::jsonb, '{"verbal":40,"spatial":20,"numerical":20,"logical":20}'::jsonb),
  ('financial management', '{"R":5,"I":20,"A":5,"S":5,"E":35,"C":30}'::jsonb, '{"verbal":22.62,"spatial":9.05,"numerical":44.34,"logical":23.98}'::jsonb),
  ('accountancy', '{"R":5,"I":20,"A":5,"S":5,"E":20,"C":45}'::jsonb, '{"verbal":15.02,"spatial":8.58,"numerical":53.65,"logical":22.75}'::jsonb),
  ('human resource management', '{"R":5,"I":10,"A":5,"S":30,"E":35,"C":15}'::jsonb, '{"verbal":48.72,"spatial":10.26,"numerical":25.13,"logical":15.9}'::jsonb),
  ('hospitality management', '{"R":5,"I":5,"A":15,"S":25,"E":40,"C":10}'::jsonb, '{"verbal":54.21,"spatial":20,"numerical":15.26,"logical":10.53}'::jsonb),
  ('tourism management', '{"R":5,"I":5,"A":15,"S":25,"E":40,"C":10}'::jsonb, '{"verbal":54.21,"spatial":20,"numerical":15.26,"logical":10.53}'::jsonb),
  ('culinary management', '{"R":25,"I":5,"A":35,"S":10,"E":20,"C":5}'::jsonb, '{"verbal":29.2,"spatial":43.07,"numerical":7.3,"logical":20.44}'::jsonb),
  ('agriculture', '{"R":40,"I":25,"A":5,"S":10,"E":10,"C":10}'::jsonb, '{"verbal":10.27,"spatial":29.31,"numerical":22.05,"logical":38.37}'::jsonb),
  ('environmental science', '{"R":25,"I":45,"A":5,"S":10,"E":5,"C":10}'::jsonb, '{"verbal":8.19,"spatial":18.08,"numerical":33.05,"logical":40.68}'::jsonb),
  ('fisheries', '{"R":40,"I":30,"A":5,"S":10,"E":5,"C":10}'::jsonb, '{"verbal":8.33,"spatial":27.87,"numerical":24.14,"logical":39.66}'::jsonb),
  ('forestry', '{"R":45,"I":30,"A":5,"S":5,"E":5,"C":10}'::jsonb, '{"verbal":5.57,"spatial":30.08,"numerical":23.4,"logical":40.95}'::jsonb),
  ('sports science', '{"R":30,"I":20,"A":5,"S":30,"E":10,"C":5}'::jsonb, '{"verbal":23.65,"spatial":25.34,"numerical":17.91,"logical":33.11}'::jsonb),
  ('criminology', '{"R":25,"I":25,"A":5,"S":15,"E":20,"C":10}'::jsonb, '{"verbal":18.28,"spatial":22.07,"numerical":25.17,"logical":34.48}'::jsonb),
  ('political science', '{"R":5,"I":15,"A":10,"S":20,"E":40,"C":10}'::jsonb, '{"verbal":41.9,"spatial":13.81,"numerical":24.29,"logical":20}'::jsonb),
  ('economics', '{"R":5,"I":35,"A":5,"S":5,"E":30,"C":20}'::jsonb, '{"verbal":17.05,"spatial":7.58,"numerical":42.8,"logical":32.58}'::jsonb),
  ('international studies', '{"R":5,"I":15,"A":15,"S":25,"E":30,"C":10}'::jsonb, '{"verbal":41.52,"spatial":16.96,"numerical":22.77,"logical":18.75}'::jsonb),
  ('elementary education', '{"R":5,"I":10,"A":10,"S":50,"E":15,"C":10}'::jsonb, '{"verbal":53.92,"spatial":13.36,"numerical":18.43,"logical":14.29}'::jsonb),
  ('secondary education', '{"R":5,"I":15,"A":10,"S":45,"E":15,"C":10}'::jsonb, '{"verbal":46.96,"spatial":12.61,"numerical":22.17,"logical":18.26}'::jsonb),
  ('fine arts', '{"R":5,"I":5,"A":65,"S":10,"E":10,"C":5}'::jsonb, '{"verbal":38.69,"spatial":46.72,"numerical":7.3,"logical":7.3}'::jsonb),
  ('music', '{"R":5,"I":5,"A":70,"S":10,"E":5,"C":5}'::jsonb, '{"verbal":37.68,"spatial":48.24,"numerical":7.04,"logical":7.04}'::jsonb),
  ('film', '{"R":5,"I":10,"A":50,"S":10,"E":20,"C":5}'::jsonb, '{"verbal":37.55,"spatial":38.7,"numerical":11.88,"logical":11.88}'::jsonb),
  ('chemical engineering', '{"R":15,"I":55,"A":5,"S":5,"E":5,"C":15}'::jsonb, '{"verbal":5.59,"spatial":11.73,"numerical":41.34,"logical":41.34}'::jsonb),
  ('criminal justice', '{"R":25,"I":25,"A":5,"S":15,"E":20,"C":10}'::jsonb, '{"verbal":18.28,"spatial":22.07,"numerical":25.17,"logical":34.48}'::jsonb),
  ('education', '{"R":5,"I":15,"A":10,"S":45,"E":15,"C":10}'::jsonb, '{"verbal":46.96,"spatial":12.61,"numerical":22.17,"logical":18.26}'::jsonb),
  ('tourism and hospitality management', '{"R":5,"I":5,"A":15,"S":25,"E":40,"C":10}'::jsonb, '{"verbal":54.21,"spatial":20,"numerical":15.26,"logical":10.53}'::jsonb)
)
update public.programs p
set riasec_weights = profiles.riasec_weights,
    aptitude_weights = profiles.aptitude_weights,
    updated_at = now()
from profiles
where p.riasec_weights is null
  and public.normalize_program_title(p.title) = profiles.title_key;

commit;

-- Programs that matched nothing keep null weights and still score through the
-- client-side fallback. Review them in Admin > Programs and set vectors by hand:
--
--   select title, category
--   from public.programs
--   where riasec_weights is null
--   order by category, title;
