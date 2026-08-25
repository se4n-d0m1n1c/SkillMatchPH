-- Expands the RIASEC section to 30 original, activity-preference items.
-- Run this AFTER supabase/assessment_schema.sql. Existing attempts remain linked to v1.

-- An assessment version is immutable once learners have used it. Make v2 the only active version.
update public.assessment_versions set is_active = false where code <> 'v2' and is_active;

insert into public.assessment_versions (code, name, is_active)
values ('v2', 'Career assessment v2 — expanded RIASEC', true)
on conflict (code) do update set name = excluded.name, is_active = true;

-- Retain the existing, server-scored aptitude screen in the new version.
insert into public.assessment_questions (
  assessment_version_id, section, sequence, prompt, riasec_letter,
  aptitude_domain, options, correct_option_index, is_active
)
select v2.id, q.section, q.sequence, q.prompt, q.riasec_letter,
       q.aptitude_domain, q.options, q.correct_option_index, q.is_active
from public.assessment_questions q
join public.assessment_versions v1 on v1.id = q.assessment_version_id and v1.code = 'v1'
join public.assessment_versions v2 on v2.code = 'v2'
where q.section = 'aptitude'
on conflict (assessment_version_id, section, sequence) do update
set prompt = excluded.prompt, aptitude_domain = excluded.aptitude_domain,
    options = excluded.options, correct_option_index = excluded.correct_option_index,
    is_active = excluded.is_active;

insert into public.assessment_questions (assessment_version_id, section, sequence, prompt, riasec_letter)
select v.id, 'interest', seed.sequence, seed.prompt, seed.riasec_letter
from public.assessment_versions v
cross join (values
  -- Realistic: practical, hands-on, technical activity preferences
  (1,  'I would enjoy repairing a bicycle, appliance, or other everyday object.', 'R'),
  (2,  'I would enjoy using hand tools to build something useful.', 'R'),
  (3,  'I would enjoy operating, testing, or maintaining equipment.', 'R'),
  (4,  'I would enjoy doing practical work outdoors, such as maintaining a site or collecting field samples.', 'R'),
  (5,  'I would enjoy assembling parts by following a technical diagram.', 'R'),
  -- Investigative: analysis, inquiry, and evidence-based problem solving
  (6,  'I would enjoy designing an experiment to find out why something happens.', 'I'),
  (7,  'I would enjoy looking for patterns in data before making a decision.', 'I'),
  (8,  'I would enjoy researching an unfamiliar science or technology topic in depth.', 'I'),
  (9,  'I would enjoy diagnosing a problem by gathering evidence and testing possible causes.', 'I'),
  (10, 'I would enjoy solving a difficult puzzle that has a logical answer.', 'I'),
  -- Artistic: creative expression and open-ended design
  (11, 'I would enjoy creating a visual concept for a poster, logo, or campaign.', 'A'),
  (12, 'I would enjoy writing a story, script, or article in my own style.', 'A'),
  (13, 'I would enjoy generating several original ideas for the same problem.', 'A'),
  (14, 'I would enjoy designing the look and layout of a room, product, or digital page.', 'A'),
  (15, 'I would enjoy creating or editing music, video, photographs, or other media.', 'A'),
  -- Social: teaching, support, and people-centered work
  (16, 'I would enjoy tutoring a classmate until they understand a lesson.', 'S'),
  (17, 'I would enjoy listening carefully to help someone work through a concern.', 'S'),
  (18, 'I would enjoy explaining useful information to a group in a clear and supportive way.', 'S'),
  (19, 'I would enjoy helping a team cooperate when members have different views.', 'S'),
  (20, 'I would enjoy volunteering in an activity that directly helps other people.', 'S'),
  -- Enterprising: influence, leadership, and initiative
  (21, 'I would enjoy pitching an idea to persuade others to support it.', 'E'),
  (22, 'I would enjoy leading a group to complete a shared goal.', 'E'),
  (23, 'I would enjoy negotiating an agreement that works for different people.', 'E'),
  (24, 'I would enjoy organizing an event, campaign, or project from idea to launch.', 'E'),
  (25, 'I would enjoy starting a small project or business and finding ways to improve it.', 'E'),
  -- Conventional: organization, accuracy, and structured information work
  (26, 'I would enjoy keeping records accurate and easy for others to find.', 'C'),
  (27, 'I would enjoy organizing schedules, files, or supplies so work runs smoothly.', 'C'),
  (28, 'I would enjoy following a detailed procedure carefully and consistently.', 'C'),
  (29, 'I would enjoy maintaining a spreadsheet or list with complete, up-to-date information.', 'C'),
  (30, 'I would enjoy checking a document or report for small errors before it is submitted.', 'C')
) as seed(sequence, prompt, riasec_letter)
where v.code = 'v2'
on conflict (assessment_version_id, section, sequence) do update
set prompt = excluded.prompt, riasec_letter = excluded.riasec_letter, is_active = true;
