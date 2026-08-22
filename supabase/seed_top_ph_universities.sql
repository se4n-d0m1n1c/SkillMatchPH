-- SkillMatchPH catalog seed: leading Philippine universities and selected
-- undergraduate programs they offer.
--
-- Run this after supabase/schema.sql in the Supabase SQL Editor. It is safe to
-- run more than once: existing programs, universities, and links are retained.
-- The catalog intentionally uses normalized program names so one program can
-- be linked to more than one university.

insert into public.programs (title, category, description, icon_name)
values
  ('Accountancy', 'Business', 'Prepares students for professional accounting, auditing, taxation, and financial reporting careers.', 'Calculator'),
  ('Architecture', 'Engineering', 'Develops design, planning, and technical skills for the built environment.', 'Building'),
  ('Biology', 'Sciences', 'Studies living systems and prepares students for research, health, and environmental fields.', 'Microscope'),
  ('Business Administration', 'Business', 'Builds foundations in management, marketing, finance, operations, and entrepreneurship.', 'Briefcase'),
  ('Chemical Engineering', 'Engineering', 'Applies chemistry, physics, and engineering to industrial processes and products.', 'FlaskConical'),
  ('Civil Engineering', 'Engineering', 'Focuses on the design and construction of infrastructure and the built environment.', 'Building'),
  ('Communication', 'Arts & Humanities', 'Develops skills in media, journalism, strategic communication, and public-facing storytelling.', 'PenTool'),
  ('Computer Science', 'Technology', 'Covers computing theory, software development, algorithms, and modern digital systems.', 'Code'),
  ('Economics', 'Business', 'Examines markets, policy, resource allocation, and data-informed economic decision-making.', 'Coins'),
  ('Education', 'Education', 'Prepares future educators to design learning experiences and teach diverse learners.', 'GraduationCap'),
  ('Electrical Engineering', 'Engineering', 'Covers electrical systems, power, electronics, and control technologies.', 'Zap'),
  ('Industrial Engineering', 'Engineering', 'Improves systems, processes, quality, and operations across organizations.', 'Factory'),
  ('Information Technology', 'Technology', 'Builds practical skills in information systems, networks, databases, and IT services.', 'Server'),
  ('Mechanical Engineering', 'Engineering', 'Applies engineering principles to machines, energy systems, and manufacturing.', 'Wrench'),
  ('Medical Technology', 'Health', 'Prepares students for laboratory science and diagnostic support roles in healthcare.', 'TestTube'),
  ('Nursing', 'Health', 'Prepares students for patient care, health promotion, and clinical nursing practice.', 'HeartHandshake'),
  ('Pharmacy', 'Health', 'Studies medicines, patient safety, and pharmaceutical care.', 'Pill'),
  ('Political Science', 'Arts & Humanities', 'Explores government, public policy, political systems, and civic life.', 'Scale'),
  ('Psychology', 'Sciences', 'Studies behavior and mental processes using scientific and ethical approaches.', 'BrainCircuit'),
  ('Tourism and Hospitality Management', 'Business', 'Prepares students for tourism, hospitality, events, and service-management careers.', 'Utensils')
on conflict (title) do nothing;

insert into public.universities (name, location, website)
values
  ('University of the Philippines Diliman', 'Quezon City, Metro Manila', 'https://upd.edu.ph'),
  ('Ateneo de Manila University', 'Quezon City, Metro Manila', 'https://www.ateneo.edu'),
  ('De La Salle University', 'Manila, Metro Manila', 'https://www.dlsu.edu.ph'),
  ('University of Santo Tomas', 'Manila, Metro Manila', 'https://www.ust.edu.ph'),
  ('Mapúa University', 'Manila, Metro Manila', 'https://www.mapua.edu.ph'),
  ('Polytechnic University of the Philippines', 'Manila, Metro Manila', 'https://www.pup.edu.ph'),
  ('University of the Philippines Los Baños', 'Los Baños, Laguna', 'https://uplb.edu.ph'),
  ('Far Eastern University', 'Manila, Metro Manila', 'https://www.feu.edu.ph'),
  ('University of San Carlos', 'Cebu City, Cebu', 'https://www.usc.edu.ph'),
  ('University of the Philippines Manila', 'Manila, Metro Manila', 'https://www.upm.edu.ph')
on conflict (name) do nothing;

-- Create the many-to-many university/program relationships. Each pair is a
-- selected undergraduate offering; refer to the university's current catalog
-- before presenting this list as a complete set of its offerings.
with offerings (university_name, program_title) as (
  values
    -- University of the Philippines Diliman
    ('University of the Philippines Diliman', 'Accountancy'),
    ('University of the Philippines Diliman', 'Architecture'),
    ('University of the Philippines Diliman', 'Biology'),
    ('University of the Philippines Diliman', 'Business Administration'),
    ('University of the Philippines Diliman', 'Chemical Engineering'),
    ('University of the Philippines Diliman', 'Civil Engineering'),
    ('University of the Philippines Diliman', 'Communication'),
    ('University of the Philippines Diliman', 'Computer Science'),
    ('University of the Philippines Diliman', 'Economics'),
    ('University of the Philippines Diliman', 'Education'),
    ('University of the Philippines Diliman', 'Electrical Engineering'),
    ('University of the Philippines Diliman', 'Industrial Engineering'),
    ('University of the Philippines Diliman', 'Mechanical Engineering'),
    ('University of the Philippines Diliman', 'Political Science'),
    ('University of the Philippines Diliman', 'Psychology'),
    ('University of the Philippines Diliman', 'Tourism and Hospitality Management'),

    -- Ateneo de Manila University
    ('Ateneo de Manila University', 'Biology'),
    ('Ateneo de Manila University', 'Communication'),
    ('Ateneo de Manila University', 'Computer Science'),
    ('Ateneo de Manila University', 'Economics'),
    ('Ateneo de Manila University', 'Education'),
    ('Ateneo de Manila University', 'Political Science'),
    ('Ateneo de Manila University', 'Psychology'),

    -- De La Salle University
    ('De La Salle University', 'Accountancy'),
    ('De La Salle University', 'Biology'),
    ('De La Salle University', 'Business Administration'),
    ('De La Salle University', 'Chemical Engineering'),
    ('De La Salle University', 'Civil Engineering'),
    ('De La Salle University', 'Communication'),
    ('De La Salle University', 'Computer Science'),
    ('De La Salle University', 'Economics'),
    ('De La Salle University', 'Electrical Engineering'),
    ('De La Salle University', 'Industrial Engineering'),
    ('De La Salle University', 'Mechanical Engineering'),
    ('De La Salle University', 'Political Science'),
    ('De La Salle University', 'Psychology'),

    -- University of Santo Tomas
    ('University of Santo Tomas', 'Accountancy'),
    ('University of Santo Tomas', 'Architecture'),
    ('University of Santo Tomas', 'Biology'),
    ('University of Santo Tomas', 'Business Administration'),
    ('University of Santo Tomas', 'Chemical Engineering'),
    ('University of Santo Tomas', 'Civil Engineering'),
    ('University of Santo Tomas', 'Communication'),
    ('University of Santo Tomas', 'Computer Science'),
    ('University of Santo Tomas', 'Education'),
    ('University of Santo Tomas', 'Electrical Engineering'),
    ('University of Santo Tomas', 'Industrial Engineering'),
    ('University of Santo Tomas', 'Information Technology'),
    ('University of Santo Tomas', 'Mechanical Engineering'),
    ('University of Santo Tomas', 'Medical Technology'),
    ('University of Santo Tomas', 'Nursing'),
    ('University of Santo Tomas', 'Pharmacy'),
    ('University of Santo Tomas', 'Psychology'),
    ('University of Santo Tomas', 'Tourism and Hospitality Management'),

    -- Mapúa University
    ('Mapúa University', 'Architecture'),
    ('Mapúa University', 'Chemical Engineering'),
    ('Mapúa University', 'Civil Engineering'),
    ('Mapúa University', 'Computer Science'),
    ('Mapúa University', 'Electrical Engineering'),
    ('Mapúa University', 'Industrial Engineering'),
    ('Mapúa University', 'Information Technology'),
    ('Mapúa University', 'Mechanical Engineering'),

    -- Polytechnic University of the Philippines
    ('Polytechnic University of the Philippines', 'Accountancy'),
    ('Polytechnic University of the Philippines', 'Architecture'),
    ('Polytechnic University of the Philippines', 'Business Administration'),
    ('Polytechnic University of the Philippines', 'Civil Engineering'),
    ('Polytechnic University of the Philippines', 'Communication'),
    ('Polytechnic University of the Philippines', 'Computer Science'),
    ('Polytechnic University of the Philippines', 'Economics'),
    ('Polytechnic University of the Philippines', 'Electrical Engineering'),
    ('Polytechnic University of the Philippines', 'Industrial Engineering'),
    ('Polytechnic University of the Philippines', 'Information Technology'),
    ('Polytechnic University of the Philippines', 'Mechanical Engineering'),
    ('Polytechnic University of the Philippines', 'Political Science'),
    ('Polytechnic University of the Philippines', 'Psychology'),
    ('Polytechnic University of the Philippines', 'Tourism and Hospitality Management'),

    -- University of the Philippines Los Baños
    ('University of the Philippines Los Baños', 'Biology'),
    ('University of the Philippines Los Baños', 'Chemical Engineering'),
    ('University of the Philippines Los Baños', 'Computer Science'),
    ('University of the Philippines Los Baños', 'Economics'),
    ('University of the Philippines Los Baños', 'Education'),

    -- Far Eastern University
    ('Far Eastern University', 'Accountancy'),
    ('Far Eastern University', 'Architecture'),
    ('Far Eastern University', 'Business Administration'),
    ('Far Eastern University', 'Communication'),
    ('Far Eastern University', 'Computer Science'),
    ('Far Eastern University', 'Education'),
    ('Far Eastern University', 'Information Technology'),
    ('Far Eastern University', 'Medical Technology'),
    ('Far Eastern University', 'Nursing'),
    ('Far Eastern University', 'Psychology'),
    ('Far Eastern University', 'Tourism and Hospitality Management'),

    -- University of San Carlos
    ('University of San Carlos', 'Accountancy'),
    ('University of San Carlos', 'Architecture'),
    ('University of San Carlos', 'Biology'),
    ('University of San Carlos', 'Business Administration'),
    ('University of San Carlos', 'Chemical Engineering'),
    ('University of San Carlos', 'Civil Engineering'),
    ('University of San Carlos', 'Computer Science'),
    ('University of San Carlos', 'Electrical Engineering'),
    ('University of San Carlos', 'Industrial Engineering'),
    ('University of San Carlos', 'Information Technology'),
    ('University of San Carlos', 'Mechanical Engineering'),
    ('University of San Carlos', 'Nursing'),
    ('University of San Carlos', 'Pharmacy'),
    ('University of San Carlos', 'Psychology'),

    -- University of the Philippines Manila
    ('University of the Philippines Manila', 'Biology'),
    ('University of the Philippines Manila', 'Nursing'),
    ('University of the Philippines Manila', 'Pharmacy'),
    ('University of the Philippines Manila', 'Political Science'),
    ('University of the Philippines Manila', 'Computer Science')
)
insert into public.program_universities (program_id, university_id)
select programs.id, universities.id
from offerings
join public.programs on programs.title = offerings.program_title
join public.universities on universities.name = offerings.university_name
on conflict (program_id, university_id) do nothing;
