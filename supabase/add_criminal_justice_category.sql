-- Add Criminal Justice to the allowed program categories.
-- Run once in the Supabase SQL Editor for an existing project.

alter table public.programs
  drop constraint if exists programs_category_check;

alter table public.programs
  add constraint programs_category_check
  check (category in (
    'Technology',
    'Business',
    'Engineering',
    'Health',
    'Criminal Justice',
    'Arts & Humanities',
    'Sciences',
    'Education'
  ));
