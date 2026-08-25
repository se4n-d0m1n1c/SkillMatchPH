-- Database-backed, versioned career assessment.
-- Run this AFTER supabase/schema.sql in the Supabase SQL Editor.

create table public.assessment_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index assessment_versions_one_active_idx
  on public.assessment_versions (is_active) where is_active;

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_version_id uuid not null references public.assessment_versions(id) on delete cascade,
  section text not null check (section in ('interest', 'aptitude')),
  sequence smallint not null check (sequence > 0),
  prompt text not null,
  riasec_letter char(1) check (riasec_letter is null or riasec_letter in ('R', 'I', 'A', 'S', 'E', 'C')),
  aptitude_domain text check (aptitude_domain is null or aptitude_domain in ('verbal', 'numerical', 'logical', 'spatial')),
  options jsonb not null default '[]'::jsonb,
  correct_option_index smallint check (correct_option_index is null or correct_option_index >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (assessment_version_id, section, sequence),
  check (
    (section = 'interest' and riasec_letter is not null and aptitude_domain is null and correct_option_index is null)
    or
    (section = 'aptitude' and aptitude_domain is not null and riasec_letter is null and correct_option_index is not null)
  )
);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  assessment_version_id uuid not null references public.assessment_versions(id),
  interest_answers jsonb not null,
  aptitude_answers jsonb not null,
  result jsonb not null,
  completed_at timestamptz not null default now()
);

create index assessment_attempts_user_completed_idx
  on public.assessment_attempts (user_id, completed_at desc);

alter table public.assessment_versions enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;

-- Only administrators edit assessment content. Students access questions and submit
-- attempts through the functions below, so aptitude answer keys never reach the browser.
create policy "admin manages assessment versions" on public.assessment_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages assessment questions" on public.assessment_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "students read own assessment attempts" on public.assessment_attempts
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.get_active_assessment_questions()
returns table (
  version_id uuid,
  question_id uuid,
  section text,
  sequence smallint,
  prompt text,
  riasec_letter char(1),
  aptitude_domain text,
  options jsonb
)
language sql
stable
security definer set search_path = public
as $$
  select v.id, q.id, q.section, q.sequence, q.prompt, q.riasec_letter, q.aptitude_domain, q.options
  from public.assessment_versions v
  join public.assessment_questions q on q.assessment_version_id = v.id
  where v.is_active and q.is_active
  order by q.section, q.sequence;
$$;

create or replace function public.submit_assessment_attempt(
  p_version_id uuid,
  p_interest_answers jsonb,
  p_aptitude_answers jsonb
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  q record;
  letter text;
  domain text;
  answer integer;
  question_count integer;
  answer_sum integer;
  correct_count integer;
  interest jsonb := '{}'::jsonb;
  aptitude jsonb := '{}'::jsonb;
  sorted_letters text[];
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to submit an assessment';
  end if;

  if not exists (select 1 from public.assessment_versions where id = p_version_id and is_active) then
    raise exception 'This assessment version is not active';
  end if;

  for q in
    select * from public.assessment_questions
    where assessment_version_id = p_version_id and is_active
    order by section, sequence
  loop
    answer := case when q.section = 'interest'
      then nullif(p_interest_answers ->> q.id::text, '')::integer
      else nullif(p_aptitude_answers ->> q.id::text, '')::integer
    end;
    if answer is null then
      raise exception 'Every question must be answered';
    end if;
    if q.section = 'interest' and answer not between 1 and 5 then
      raise exception 'Interest answers must be between 1 and 5';
    end if;
    if q.section = 'aptitude' and (answer < 0 or answer >= jsonb_array_length(q.options)) then
      raise exception 'Invalid aptitude answer';
    end if;
  end loop;

  foreach letter in array array['R', 'I', 'A', 'S', 'E', 'C'] loop
    select count(*), coalesce(sum((p_interest_answers ->> id::text)::integer), 0)
    into question_count, answer_sum
    from public.assessment_questions
    where assessment_version_id = p_version_id and is_active and riasec_letter = letter;
    interest := interest || jsonb_build_object(letter, round(((answer_sum - question_count)::numeric / (question_count * 4)) * 100));
  end loop;

  foreach domain in array array['verbal', 'numerical', 'logical', 'spatial'] loop
    select count(*), count(*) filter (where (p_aptitude_answers ->> id::text)::integer = correct_option_index)
    into question_count, correct_count
    from public.assessment_questions
    where assessment_version_id = p_version_id and is_active and aptitude_domain = domain;
    aptitude := aptitude || jsonb_build_object(domain, case when question_count = 0 then 0 else round((correct_count::numeric / question_count) * 100) end);
  end loop;

  select array_agg(key order by value::integer desc, key)
  into sorted_letters
  from jsonb_each_text(interest);
  result := jsonb_build_object(
    'interest', interest,
    'aptitude', aptitude,
    'sortedLetters', to_jsonb(sorted_letters),
    'code', array_to_string(sorted_letters[1:3], '')
  );

  insert into public.assessment_attempts (user_id, assessment_version_id, interest_answers, aptitude_answers, result)
  values (auth.uid(), p_version_id, p_interest_answers, p_aptitude_answers, result);

  return result;
end;
$$;

revoke all on function public.get_active_assessment_questions() from public;
revoke all on function public.submit_assessment_attempt(uuid, jsonb, jsonb) from public;
grant execute on function public.get_active_assessment_questions() to authenticated;
grant execute on function public.submit_assessment_attempt(uuid, jsonb, jsonb) to authenticated;

insert into public.assessment_versions (code, name, is_active)
values ('v1', 'Career assessment v1', true)
on conflict (code) do update set name = excluded.name, is_active = excluded.is_active;

insert into public.assessment_questions (assessment_version_id, section, sequence, prompt, riasec_letter)
select v.id, seed.section, seed.sequence, seed.prompt, seed.riasec_letter
from public.assessment_versions v
cross join (values
  ('interest', 1, 'I like taking things apart to see how they work, or building things with my hands.', 'R'),
  ('interest', 2, 'I would rather work with tools, machines, or the outdoors than sit at a desk all day.', 'R'),
  ('interest', 3, 'I enjoy figuring out why something happens, not just what happens.', 'I'),
  ('interest', 4, 'I like solving puzzles, running experiments, or working through a hard problem step by step.', 'I'),
  ('interest', 5, 'I like creating things — designs, writing, music, or visuals — that did not exist before.', 'A'),
  ('interest', 6, 'I prefer open-ended tasks with room for my own style, over tasks with one correct answer.', 'A'),
  ('interest', 7, 'I like helping, teaching, or listening to people directly.', 'S'),
  ('interest', 8, 'I feel most useful when I am working through a problem with or for other people.', 'S'),
  ('interest', 9, 'I like convincing people, leading a group, or pushing a plan forward.', 'E'),
  ('interest', 10, 'I would rather start and run something than follow a process someone else made.', 'E'),
  ('interest', 11, 'I like keeping things organized — records, schedules, numbers, or files.', 'C'),
  ('interest', 12, 'I prefer clear instructions and a defined process over figuring it out as I go.', 'C')
) as seed(section, sequence, prompt, riasec_letter)
where v.code = 'v1'
on conflict (assessment_version_id, section, sequence) do update
set prompt = excluded.prompt, riasec_letter = excluded.riasec_letter, is_active = true;

insert into public.assessment_questions (assessment_version_id, section, sequence, prompt, aptitude_domain, options, correct_option_index)
select v.id, 'aptitude', seed.sequence, seed.prompt, seed.domain, seed.options::jsonb, seed.correct_option_index
from public.assessment_versions v
cross join (values
  (1, 'Choose the word closest in meaning to "meticulous".', 'verbal', '["Careless", "Careful and precise", "Fast", "Loud"]', 1),
  (2, '"Cause" is to "effect" as "question" is to ___.', 'verbal', '["Answer", "Word", "Sentence", "Book"]', 0),
  (3, 'A jeepney fare starts at ₱13 for the first 4 km, plus ₱2 per additional km. What is the fare for 10 km?', 'numerical', '["₱25", "₱23", "₱27", "₱21"]', 1),
  (4, 'What number comes next: 2, 6, 18, 54, ___?', 'numerical', '["108", "162", "96", "216"]', 1),
  (5, 'All engineers in the room wear glasses. Ana wears glasses. Which statement is logically true?', 'logical', '["Ana is an engineer", "Ana might not be an engineer", "Ana is not an engineer", "Not enough info about glasses"]', 1),
  (6, 'If it rains, the game is cancelled. The game was not cancelled. What can you conclude?', 'logical', '["It rained", "It did not rain", "It might have rained", "No conclusion possible"]', 1),
  (7, 'If you fold a flat paper square in half twice and cut a small triangle off one folded corner, how many holes appear when unfolded?', 'spatial', '["1 hole", "2 holes", "4 holes", "8 holes"]', 2),
  (8, 'A solid cube is painted red on all sides, then cut into 27 identical smaller cubes. How many small cubes have paint on exactly 2 sides?', 'spatial', '["8", "12", "6", "24"]', 1)
) as seed(sequence, prompt, domain, options, correct_option_index)
where v.code = 'v1'
on conflict (assessment_version_id, section, sequence) do update
set prompt = excluded.prompt, aptitude_domain = excluded.aptitude_domain, options = excluded.options,
    correct_option_index = excluded.correct_option_index, is_active = true;
