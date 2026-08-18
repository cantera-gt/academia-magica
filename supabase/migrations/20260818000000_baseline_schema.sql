-- ============================================================================
-- BASELINE SCHEMA SNAPSHOT — academia-magica (Supabase project wlxgvbabljflvhtxuzue)
-- Generado el 18/08/2026 a partir del estado real de produccion.
--
-- Esto NO es una migracion incremental: es una FOTO del schema completo tal
-- como estaba en produccion el 18/08/2026, hecha porque el repo nunca tuvo
-- las migraciones versionadas (se aplicaban directo en el SQL Editor de
-- Supabase). Sirve como punto de partida para reconstruir la base desde cero
-- si hiciera falta (backup/disaster recovery, o para levantar un ambiente
-- nuevo). El historial narrativo de COMO se llego a este schema (que se
-- construyo, por que, en que orden) esta documentado en el vault de Obsidian
-- del proyecto (proyectos/Academia-Magica.md), no acá.
--
-- A partir de esta fecha, cualquier cambio de schema nuevo debe agregarse
-- como un archivo de migracion nuevo en supabase/migrations/ (no editar este
-- archivo), para que el repo y Supabase queden sincronizados hacia adelante.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensiones
-- ----------------------------------------------------------------------------
create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;
create extension if not exists unaccent with schema public;
create extension if not exists "uuid-ossp" with schema extensions;

-- ----------------------------------------------------------------------------
-- Schemas adicionales
-- ----------------------------------------------------------------------------
create schema if not exists private;

-- ----------------------------------------------------------------------------
-- Tipos enum (public)
-- ----------------------------------------------------------------------------
create type public.age_bracket as enum ('4-7', '7-10', '10-12');
create type public.character_gender as enum ('girl', 'boy');
create type public.exercise_type as enum ('multiple_choice', 'true_false', 'fill_blank', 'matching', 'drag_drop', 'ordering', 'open_text');
create type public.item_category as enum ('decoracion', 'mueble', 'mascota', 'traje', 'accesorio', 'fondo', 'color_ropa', 'extra', 'deporte');
create type public.item_zone as enum ('habitacion', 'estudio', 'jardin');
create type public.user_role as enum ('admin', 'student');

-- ----------------------------------------------------------------------------
-- Tablas (public)
-- ----------------------------------------------------------------------------
create table public.achievements (
  id uuid not null default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  icon text,
  criteria jsonb not null
);

create table public.admin_activity_log (
  id uuid not null default gen_random_uuid(),
  household_id uuid not null,
  admin_id uuid,
  student_id uuid,
  action text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table public.affiliate_commissions (
  id uuid not null default gen_random_uuid(),
  affiliate_id uuid not null,
  household_id uuid not null,
  source_type text not null,
  source_id uuid not null,
  sale_amount_usd numeric(10,2) not null,
  commission_rate numeric(5,2) not null,
  commission_amount_usd numeric(10,2) not null,
  status text not null default 'pending'::text,
  paid_at timestamp with time zone,
  paid_note text,
  created_at timestamp with time zone not null default now()
);

create table public.affiliates (
  id uuid not null default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  code text not null,
  commission_rate numeric(5,2) not null default 30,
  status text not null default 'active'::text,
  notes text,
  auth_user_id uuid,
  created_at timestamp with time zone not null default now()
);

create table public.agenda_events (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  subject_id uuid,
  title text not null,
  scheduled_for timestamp with time zone not null,
  recurrence text,
  reminder_minutes_before integer,
  completed boolean not null default false,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

create table public.characters (
  id text not null,
  gender character_gender not null,
  display_name text not null,
  model_url text,
  thumbnail_url text,
  height_m numeric not null default 1.7,
  sort_order integer not null default 0,
  active boolean not null default true,
  image_url text,
  age_min integer,
  age_max integer
);

create table public.deleted_students_backup (
  id uuid not null default gen_random_uuid(),
  original_student_id uuid not null,
  household_id uuid not null,
  username text,
  display_name text,
  deleted_by uuid,
  deleted_at timestamp with time zone not null default now(),
  snapshot jsonb not null
);

create table public.diamond_transactions (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  amount integer not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_at timestamp with time zone not null default now()
);

create table public.enrollment_application_subjects (
  application_id uuid not null,
  subject_id uuid not null,
  subject_slug text not null,
  subject_name text not null,
  subject_icon text,
  subject_category text not null,
  unit_price_usd numeric(10,2) not null,
  created_at timestamp with time zone not null default now()
);

create table public.enrollment_applications (
  id uuid not null default gen_random_uuid(),
  public_reference text not null default ('AM-'::text || upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 8))),
  applicant_type text not null,
  contact_full_name text not null,
  contact_email text not null,
  whatsapp_phone text not null,
  country text not null,
  city text not null,
  student_first_name text,
  student_last_name text,
  student_email text,
  status text not null default 'new'::text,
  payment_status text not null default 'not_started'::text,
  payment_provider text not null default 'paypal'::text,
  paypal_order_id text,
  tags text[] not null default '{}'::text[],
  admin_notes text,
  next_follow_up_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone not null,
  privacy_version text not null default '2026-08-11'::text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamp with time zone,
  source text not null default 'landing'::text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  sheet_sync_status text not null default 'pending'::text,
  sheet_synced_at timestamp with time zone,
  sheet_sync_error text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  terms_accepted_at timestamp with time zone not null,
  terms_version text not null default '2026-08-11'::text,
  subject_count smallint,
  unit_price_usd numeric(10,2),
  total_price_usd numeric(10,2),
  currency text not null default 'USD'::text,
  access_months smallint not null default 3,
  payment_token uuid not null default gen_random_uuid(),
  paypal_capture_id text,
  paypal_paid_at timestamp with time zone,
  claimed_at timestamp with time zone,
  household_id uuid,
  student_id uuid,
  affiliate_id uuid
);

create table public.exercise_attempts (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  exercise_id uuid not null,
  given_answer jsonb,
  is_correct boolean not null,
  diamonds_earned integer not null default 0,
  time_spent_seconds integer,
  attempted_at timestamp with time zone not null default now()
);

create table public.exercises (
  id uuid not null default gen_random_uuid(),
  topic_id uuid not null,
  type exercise_type not null,
  difficulty integer not null default 1,
  prompt jsonb not null,
  options jsonb,
  correct_answer jsonb not null,
  explanation text,
  diamond_reward integer not null default 5,
  active boolean not null default true,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  is_exam boolean not null default false,
  lesson_id uuid
);

create table public.game_plays (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  game_code text not null,
  won boolean not null default false,
  moves integer,
  diamonds_earned integer not null default 0,
  played_at timestamp with time zone not null default now()
);

create table public.households (
  id uuid not null default gen_random_uuid(),
  name text not null,
  invite_code text not null default substr(md5((random())::text), 1, 6),
  owner_id uuid not null,
  created_at timestamp with time zone not null default now(),
  affiliate_id uuid
);

create table public.lessons (
  id uuid not null default gen_random_uuid(),
  topic_id uuid not null,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.level_thresholds (
  level integer not null,
  xp_required integer not null,
  title text
);

create table public.profiles (
  id uuid not null,
  household_id uuid not null,
  role user_role not null default 'student'::user_role,
  username text,
  display_name text not null,
  birthdate date,
  avatar_url text,
  gender character_gender,
  diamonds integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  character_id text,
  age_bracket age_bracket,
  xp_total integer not null default 0,
  visual_theme text not null default 'princesa'::text
);

create table public.room_layouts (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  character_type character_gender not null,
  background text,
  layout jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now()
);

create table public.store_items (
  id uuid not null default gen_random_uuid(),
  gender character_gender not null,
  name text not null,
  description text,
  category item_category not null,
  price_diamonds integer not null,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  garment_slot text,
  color_hex text,
  model_url text,
  bone_target text,
  content_url text,
  placement text default 'floor'::text,
  zone item_zone not null default 'habitacion'::item_zone
);

create table public.streaks (
  student_id uuid not null,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date
);

create table public.student_achievements (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  achievement_id uuid not null,
  earned_at timestamp with time zone not null default now()
);

create table public.student_admin_details (
  student_id uuid not null,
  guardian_name text,
  guardian_email text,
  admin_notes text,
  status_reason text,
  tags text[] not null default '{}'::text[],
  last_contacted_at timestamp with time zone,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid
);

create table public.student_characters (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  chosen_name text,
  level integer not null default 1,
  xp integer not null default 0,
  unlocked_items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  character_id text not null
);

create table public.student_inventory (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  item_id uuid not null,
  acquired_at timestamp with time zone not null default now(),
  placed_in_room boolean not null default false,
  "position" jsonb,
  equipped boolean not null default false
);

create table public.student_subject_teacher (
  student_id uuid not null,
  subject_id uuid not null,
  teacher_id uuid not null,
  chosen_at timestamp with time zone not null default now()
);

create table public.student_subjects (
  student_id uuid not null,
  subject_id uuid not null,
  assigned_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone,
  source_order_id uuid
);

create table public.subject_order_items (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  subject_id uuid not null,
  subject_name text not null,
  subject_icon text,
  unit_price_usd numeric(10,2) not null,
  created_at timestamp with time zone not null default now()
);

create table public.subject_orders (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  household_id uuid not null,
  subject_count smallint not null,
  unit_price_usd numeric(10,2) not null,
  total_price_usd numeric(10,2) not null,
  currency text not null default 'USD'::text,
  access_months smallint not null default 3,
  payment_status text not null default 'not_started'::text,
  paypal_order_id text,
  paypal_capture_id text,
  paypal_paid_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  payment_method text not null default 'paypal'::text,
  payment_note text,
  paid_at timestamp with time zone,
  proof_file_path text,
  created_by_admin_id uuid
);

create table public.subjects (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  name text not null,
  category text not null,
  icon text,
  color text,
  sort_order integer not null default 0,
  active boolean not null default true,
  description text,
  included_by_default boolean not null default false
);

create table public.teacher_subjects (
  teacher_id uuid not null,
  subject_id uuid not null
);

create table public.teachers (
  id uuid not null default gen_random_uuid(),
  name text not null,
  gender text not null,
  nationality text not null,
  flag_emoji text not null,
  age integer,
  image_url text not null,
  speak_lang text not null default 'es-ES'::text,
  voice_name_hints jsonb not null default '[]'::jsonb,
  greeting_template text not null,
  greeting_es text,
  sort_order integer not null default 0,
  active boolean not null default true,
  body_image_url text,
  voice_name text not null
);

create table public.topic_progress (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  topic_id uuid not null,
  practice_best_pct integer,
  exam_best_pct integer,
  exam_best_stars smallint not null default 0,
  exam_attempts integer not null default 0,
  passed_at timestamp with time zone,
  last_played_at timestamp with time zone not null default now()
);

create table public.topics (
  id uuid not null default gen_random_uuid(),
  subject_id uuid not null,
  name text not null,
  min_age integer default 6,
  max_age integer default 9,
  sort_order integer not null default 0,
  active boolean not null default true,
  age_bracket age_bracket not null default '4-7'::age_bracket,
  recommended_age smallint,
  prerequisites text,
  curriculum_version text,
  learning_objective text,
  source_refs jsonb not null default '[]'::jsonb,
  submodule text
);

-- ----------------------------------------------------------------------------
-- Tablas (private) — usadas para validar llamadas server-to-server de PayPal
-- ----------------------------------------------------------------------------
create table private.payment_server_secrets (
  secret_hash text not null,
  created_at timestamp with time zone not null default now()
);

create table private.paypal_webhook_events (
  event_id text not null,
  event_type text not null,
  resource_id text,
  order_id text,
  application_id uuid,
  processing_status text not null default 'received'::text,
  error_message text,
  received_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone
);

-- ----------------------------------------------------------------------------
-- Constraints (public)
-- ----------------------------------------------------------------------------
alter table public.achievements add constraint achievements_pkey PRIMARY KEY (id);
alter table public.achievements add constraint achievements_code_key UNIQUE (code);
alter table public.admin_activity_log add constraint admin_activity_log_pkey PRIMARY KEY (id);
alter table public.admin_activity_log add constraint admin_activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.admin_activity_log add constraint admin_activity_log_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table public.admin_activity_log add constraint admin_activity_log_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.admin_activity_log add constraint admin_activity_action_length CHECK (((char_length(action) >= 1) AND (char_length(action) <= 80)));
alter table public.admin_activity_log add constraint admin_activity_summary_length CHECK (((char_length(summary) >= 1) AND (char_length(summary) <= 500)));
alter table public.affiliate_commissions add constraint affiliate_commissions_pkey PRIMARY KEY (id);
alter table public.affiliate_commissions add constraint affiliate_commissions_source_type_source_id_key UNIQUE (source_type, source_id);
alter table public.affiliate_commissions add constraint affiliate_commissions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE;
alter table public.affiliate_commissions add constraint affiliate_commissions_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table public.affiliate_commissions add constraint affiliate_commissions_source_type_check CHECK ((source_type = ANY (ARRAY['enrollment'::text, 'subject_order'::text])));
alter table public.affiliate_commissions add constraint affiliate_commissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text])));
alter table public.affiliates add constraint affiliates_pkey PRIMARY KEY (id);
alter table public.affiliates add constraint affiliates_auth_user_id_key UNIQUE (auth_user_id);
alter table public.affiliates add constraint affiliates_code_key UNIQUE (code);
alter table public.affiliates add constraint affiliates_email_key UNIQUE (email);
alter table public.affiliates add constraint affiliates_commission_rate_check CHECK (((commission_rate >= (0)::numeric) AND (commission_rate <= (100)::numeric)));
alter table public.affiliates add constraint affiliates_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
alter table public.agenda_events add constraint agenda_events_pkey PRIMARY KEY (id);
alter table public.agenda_events add constraint agenda_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
alter table public.agenda_events add constraint agenda_events_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.agenda_events add constraint agenda_events_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id);
alter table public.characters add constraint characters_pkey PRIMARY KEY (id);
alter table public.deleted_students_backup add constraint deleted_students_backup_pkey PRIMARY KEY (id);
alter table public.diamond_transactions add constraint diamond_transactions_pkey PRIMARY KEY (id);
alter table public.diamond_transactions add constraint diamond_transactions_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.enrollment_application_subjects add constraint enrollment_application_subjects_pkey PRIMARY KEY (application_id, subject_id);
alter table public.enrollment_application_subjects add constraint enrollment_application_subjects_application_id_fkey FOREIGN KEY (application_id) REFERENCES enrollment_applications(id) ON DELETE CASCADE;
alter table public.enrollment_application_subjects add constraint enrollment_application_subjects_unit_price_usd_check CHECK ((unit_price_usd = ANY (ARRAY[(6)::numeric, (7)::numeric, (8)::numeric, (10)::numeric])));
alter table public.enrollment_applications add constraint enrollment_applications_pkey PRIMARY KEY (id);
alter table public.enrollment_applications add constraint enrollment_applications_public_reference_key UNIQUE (public_reference);
alter table public.enrollment_applications add constraint enrollment_applications_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE SET NULL;
alter table public.enrollment_applications add constraint enrollment_applications_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id);
alter table public.enrollment_applications add constraint enrollment_applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.enrollment_applications add constraint enrollment_access_months_three CHECK ((access_months = 3));
alter table public.enrollment_applications add constraint enrollment_applications_applicant_type_check CHECK ((applicant_type = ANY (ARRAY['legal_guardian'::text, 'adult_student'::text])));
alter table public.enrollment_applications add constraint enrollment_applications_city_check CHECK (((char_length(city) >= 1) AND (char_length(city) <= 120)));
alter table public.enrollment_applications add constraint enrollment_applications_contact_email_check CHECK ((char_length(contact_email) <= 254));
alter table public.enrollment_applications add constraint enrollment_applications_contact_full_name_check CHECK (((char_length(contact_full_name) >= 2) AND (char_length(contact_full_name) <= 160)));
alter table public.enrollment_applications add constraint enrollment_applications_country_check CHECK (((char_length(country) >= 2) AND (char_length(country) <= 100)));
alter table public.enrollment_applications add constraint enrollment_applications_payment_provider_check CHECK ((payment_provider = 'paypal'::text));
alter table public.enrollment_applications add constraint enrollment_applications_payment_status_check CHECK ((payment_status = ANY (ARRAY['not_started'::text, 'pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text])));
alter table public.enrollment_applications add constraint enrollment_applications_sheet_sync_status_check CHECK ((sheet_sync_status = ANY (ARRAY['pending'::text, 'synced'::text, 'failed'::text])));
alter table public.enrollment_applications add constraint enrollment_applications_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'payment_pending'::text, 'enrolled'::text, 'not_interested'::text])));
alter table public.enrollment_applications add constraint enrollment_applications_whatsapp_phone_check CHECK (((char_length(whatsapp_phone) >= 7) AND (char_length(whatsapp_phone) <= 32)));
alter table public.enrollment_applications add constraint enrollment_currency_usd CHECK ((currency = 'USD'::text));
alter table public.enrollment_applications add constraint enrollment_guardian_student_fields CHECK ((((applicant_type = 'legal_guardian'::text) AND (NULLIF(TRIM(BOTH FROM student_first_name), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM student_last_name), ''::text) IS NOT NULL)) OR ((applicant_type = 'adult_student'::text) AND (student_first_name IS NULL) AND (student_last_name IS NULL) AND (student_email IS NULL))));
alter table public.enrollment_applications add constraint enrollment_notes_limit CHECK (((admin_notes IS NULL) OR (char_length(admin_notes) <= 5000)));
alter table public.enrollment_applications add constraint enrollment_subject_pricing_complete CHECK ((((subject_count IS NULL) AND (unit_price_usd IS NULL) AND (total_price_usd IS NULL)) OR (((subject_count >= 1) AND (subject_count <= 100)) AND (unit_price_usd = ANY (ARRAY[(6)::numeric, (7)::numeric, (8)::numeric, (10)::numeric])) AND (total_price_usd = ((subject_count)::numeric * unit_price_usd)))));
alter table public.enrollment_applications add constraint enrollment_tags_limit CHECK ((cardinality(tags) <= 12));
alter table public.exercise_attempts add constraint exercise_attempts_pkey PRIMARY KEY (id);
alter table public.exercise_attempts add constraint exercise_attempts_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;
alter table public.exercise_attempts add constraint exercise_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.exercises add constraint exercises_pkey PRIMARY KEY (id);
alter table public.exercises add constraint exercises_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
alter table public.exercises add constraint exercises_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
alter table public.exercises add constraint exercises_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;
alter table public.exercises add constraint exercises_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 5)));
alter table public.game_plays add constraint game_plays_pkey PRIMARY KEY (id);
alter table public.game_plays add constraint game_plays_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.households add constraint households_pkey PRIMARY KEY (id);
alter table public.households add constraint households_invite_code_key UNIQUE (invite_code);
alter table public.households add constraint households_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE SET NULL;
alter table public.households add constraint households_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.lessons add constraint lessons_pkey PRIMARY KEY (id);
alter table public.lessons add constraint lessons_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;
alter table public.level_thresholds add constraint level_thresholds_pkey PRIMARY KEY (level);
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_household_id_username_key UNIQUE (household_id, username);
alter table public.profiles add constraint profiles_character_id_fkey FOREIGN KEY (character_id) REFERENCES characters(id);
alter table public.profiles add constraint profiles_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_diamonds_nonnegative CHECK ((diamonds >= 0));
alter table public.profiles add constraint profiles_visual_theme_check CHECK ((visual_theme = ANY (ARRAY['princesa'::text, 'espacial'::text, 'deportivo'::text])));
alter table public.room_layouts add constraint room_layouts_pkey PRIMARY KEY (id);
alter table public.room_layouts add constraint room_layouts_student_id_character_type_key UNIQUE (student_id, character_type);
alter table public.room_layouts add constraint room_layouts_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.store_items add constraint store_items_pkey PRIMARY KEY (id);
alter table public.store_items add constraint store_items_placement_check CHECK ((placement = ANY (ARRAY['floor'::text, 'wall'::text])));
alter table public.streaks add constraint streaks_pkey PRIMARY KEY (student_id);
alter table public.streaks add constraint streaks_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.student_achievements add constraint student_achievements_pkey PRIMARY KEY (id);
alter table public.student_achievements add constraint student_achievements_student_id_achievement_id_key UNIQUE (student_id, achievement_id);
alter table public.student_achievements add constraint student_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE;
alter table public.student_achievements add constraint student_achievements_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.student_admin_details add constraint student_admin_details_pkey PRIMARY KEY (student_id);
alter table public.student_admin_details add constraint student_admin_details_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.student_admin_details add constraint student_admin_details_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.student_admin_details add constraint student_admin_details_guardian_email_format CHECK (((guardian_email IS NULL) OR (guardian_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text)));
alter table public.student_admin_details add constraint student_admin_details_guardian_email_length CHECK (((guardian_email IS NULL) OR (char_length(guardian_email) <= 254)));
alter table public.student_admin_details add constraint student_admin_details_guardian_name_length CHECK (((guardian_name IS NULL) OR (char_length(guardian_name) <= 120)));
alter table public.student_admin_details add constraint student_admin_details_notes_length CHECK (((admin_notes IS NULL) OR (char_length(admin_notes) <= 4000)));
alter table public.student_admin_details add constraint student_admin_details_status_reason_length CHECK (((status_reason IS NULL) OR (char_length(status_reason) <= 500)));
alter table public.student_admin_details add constraint student_admin_details_tags_limit CHECK ((cardinality(tags) <= 8));
alter table public.student_characters add constraint student_characters_pkey PRIMARY KEY (id);
alter table public.student_characters add constraint student_characters_student_character_unique UNIQUE (student_id, character_id);
alter table public.student_characters add constraint student_characters_character_id_fkey FOREIGN KEY (character_id) REFERENCES characters(id);
alter table public.student_characters add constraint student_characters_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.student_inventory add constraint student_inventory_pkey PRIMARY KEY (id);
alter table public.student_inventory add constraint student_inventory_student_id_item_id_key UNIQUE (student_id, item_id);
alter table public.student_inventory add constraint student_inventory_unique UNIQUE (student_id, item_id);
alter table public.student_inventory add constraint student_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES store_items(id) ON DELETE CASCADE;
alter table public.student_inventory add constraint student_inventory_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.student_subject_teacher add constraint student_subject_teacher_pkey PRIMARY KEY (student_id, subject_id);
alter table public.student_subject_teacher add constraint student_subject_teacher_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.student_subject_teacher add constraint student_subject_teacher_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
alter table public.student_subject_teacher add constraint student_subject_teacher_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id);
alter table public.student_subjects add constraint student_subjects_pkey PRIMARY KEY (student_id, subject_id);
alter table public.student_subjects add constraint student_subjects_source_order_id_fkey FOREIGN KEY (source_order_id) REFERENCES subject_orders(id);
alter table public.student_subjects add constraint student_subjects_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.student_subjects add constraint student_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
alter table public.subject_order_items add constraint subject_order_items_pkey PRIMARY KEY (id);
alter table public.subject_order_items add constraint subject_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES subject_orders(id) ON DELETE CASCADE;
alter table public.subject_order_items add constraint subject_order_items_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id);
alter table public.subject_orders add constraint subject_orders_pkey PRIMARY KEY (id);
alter table public.subject_orders add constraint subject_orders_created_by_admin_id_fkey FOREIGN KEY (created_by_admin_id) REFERENCES profiles(id);
alter table public.subject_orders add constraint subject_orders_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id);
alter table public.subject_orders add constraint subject_orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id);
alter table public.subject_orders add constraint subject_orders_access_months_check CHECK ((access_months > 0));
alter table public.subject_orders add constraint subject_orders_currency_check CHECK ((currency = 'USD'::text));
alter table public.subject_orders add constraint subject_orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['paypal'::text, 'manual'::text])));
alter table public.subject_orders add constraint subject_orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['not_started'::text, 'pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'cancelled'::text])));
alter table public.subject_orders add constraint subject_orders_subject_count_check CHECK ((subject_count >= 1));
alter table public.subject_orders add constraint subject_orders_unit_price_usd_check CHECK ((unit_price_usd > (0)::numeric));
alter table public.subjects add constraint subjects_pkey PRIMARY KEY (id);
alter table public.subjects add constraint subjects_slug_key UNIQUE (slug);
alter table public.teacher_subjects add constraint teacher_subjects_pkey PRIMARY KEY (teacher_id, subject_id);
alter table public.teacher_subjects add constraint teacher_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
alter table public.teacher_subjects add constraint teacher_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;
alter table public.teachers add constraint teachers_pkey PRIMARY KEY (id);
alter table public.teachers add constraint teachers_gender_check CHECK ((gender = ANY (ARRAY['mujer'::text, 'hombre'::text])));
alter table public.topic_progress add constraint topic_progress_pkey PRIMARY KEY (id);
alter table public.topic_progress add constraint topic_progress_student_id_topic_id_key UNIQUE (student_id, topic_id);
alter table public.topic_progress add constraint topic_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.topic_progress add constraint topic_progress_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;
alter table public.topics add constraint topics_pkey PRIMARY KEY (id);
alter table public.topics add constraint topics_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- Constraints (private)
-- ----------------------------------------------------------------------------
alter table private.payment_server_secrets add constraint payment_server_secrets_pkey PRIMARY KEY (secret_hash);
alter table private.paypal_webhook_events add constraint paypal_webhook_events_processing_status_check CHECK ((processing_status = ANY (ARRAY['received'::text, 'processed'::text, 'ignored'::text, 'failed'::text])));
alter table private.paypal_webhook_events add constraint paypal_webhook_events_pkey PRIMARY KEY (event_id);
alter table private.paypal_webhook_events add constraint paypal_webhook_events_application_id_fkey FOREIGN KEY (application_id) REFERENCES enrollment_applications(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- Indices adicionales (no cubiertos por PK/UNIQUE de arriba)
-- ----------------------------------------------------------------------------
CREATE INDEX admin_activity_household_date_idx ON public.admin_activity_log USING btree (household_id, created_at DESC);
CREATE INDEX admin_activity_student_date_idx ON public.admin_activity_log USING btree (student_id, created_at DESC) WHERE (student_id IS NOT NULL);
CREATE INDEX diamond_transactions_student_date_idx ON public.diamond_transactions USING btree (student_id, created_at DESC);
CREATE INDEX enrollment_applications_contact_email_idx ON public.enrollment_applications USING btree (lower(contact_email));
CREATE INDEX enrollment_applications_created_at_idx ON public.enrollment_applications USING btree (created_at DESC);
CREATE INDEX enrollment_applications_status_idx ON public.enrollment_applications USING btree (status, created_at DESC);
CREATE UNIQUE INDEX enrollment_payment_token_idx ON public.enrollment_applications USING btree (payment_token);
CREATE UNIQUE INDEX enrollment_paypal_capture_idx ON public.enrollment_applications USING btree (paypal_capture_id) WHERE (paypal_capture_id IS NOT NULL);
CREATE UNIQUE INDEX enrollment_paypal_order_idx ON public.enrollment_applications USING btree (paypal_order_id) WHERE (paypal_order_id IS NOT NULL);
CREATE INDEX exercise_attempts_student_date_idx ON public.exercise_attempts USING btree (student_id, attempted_at DESC);
CREATE INDEX idx_exercises_lesson ON public.exercises USING btree (lesson_id);
CREATE INDEX idx_lessons_topic ON public.lessons USING btree (topic_id, sort_order);
CREATE INDEX profiles_admin_roster_idx ON public.profiles USING btree (household_id, role, is_active, display_name);
CREATE INDEX topic_progress_student_date_idx ON public.topic_progress USING btree (student_id, last_played_at DESC);
CREATE INDEX topics_curriculum_version_idx ON public.topics USING btree (curriculum_version, recommended_age, sort_order) WHERE (active = true);

-- ----------------------------------------------------------------------------
-- Funciones (public) — RPCs de la app, triggers, y helpers de contenido
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._emoji_tema(nombre text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case nombre
    when 'manzanas' then '🍎' when 'estrellas' then '⭐' when 'globos' then '🎈' when 'gomitas' then '🍬'
    when 'autos de juguete' then '🚗' when 'flores' then '🌸' when 'monedas' then '🪙' when 'animalitos' then '🐰'
    when 'libros' then '📚' else '⚽' end;
$function$
;

CREATE OR REPLACE FUNCTION public._es_decimal(n numeric)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select replace(n::text, '.', ',');
$function$
;

CREATE OR REPLACE FUNCTION public._gen_int_options(correct integer, spread integer, allow_negative boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
  candidates int[] := array[correct];
  v int;
  tries int := 0;
  result jsonb;
begin
  while array_length(candidates,1) < 4 and tries < 50 loop
    tries := tries + 1;
    v := correct + (floor(random()*(spread*2+1))::int - spread);
    if v <> correct and (allow_negative or v >= 0) and not (v = any(candidates)) then
      candidates := candidates || v;
    end if;
  end loop;
  tries := 1;
  while array_length(candidates,1) < 4 loop
    v := correct + tries;
    if not (v = any(candidates)) and (allow_negative or v >= 0) then
      candidates := candidates || v;
    end if;
    tries := tries + 1;
  end loop;
  select jsonb_agg(x::text order by random()) into result from unnest(candidates) x;
  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._genero_tema(nombre text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case nombre
    when 'manzanas' then 'f' when 'estrellas' then 'f' when 'globos' then 'm' when 'gomitas' then 'f'
    when 'autos de juguete' then 'm' when 'flores' then 'f' when 'monedas' then 'f' when 'animalitos' then 'm'
    when 'libros' then 'm' else 'f' end; -- pelotas = f
$function$
;

CREATE OR REPLACE FUNCTION public._nombre_tema(i integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select (array['manzanas','estrellas','globos','gomitas','autos de juguete','flores','monedas','animalitos','libros','pelotas'])[(i % 10) + 1];
$function$
;

CREATE OR REPLACE FUNCTION public.admin_adjust_student_diamonds(p_student_id uuid, p_amount integer, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
  v_name text;
  v_balance integer;
begin
  if p_amount = 0 or abs(p_amount) > 5000 then
    raise exception 'El ajuste debe estar entre -5000 y 5000 y no puede ser cero';
  end if;
  if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) > 300 then
    raise exception 'Indica un motivo de hasta 300 caracteres';
  end if;

  if not exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'::public.user_role) then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select student_profile.household_id, student_profile.display_name
    into v_household, v_name
  from public.profiles student_profile
  where student_profile.id = p_student_id and student_profile.role = 'student'::public.user_role;

  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  perform set_config('academia.bypass_profile_guard', 'on', true);
  update public.profiles
  set diamonds = diamonds + p_amount, updated_at = now()
  where id = p_student_id and diamonds + p_amount >= 0
  returning diamonds into v_balance;

  if v_balance is null then raise exception 'El saldo no puede quedar en negativo'; end if;

  insert into public.diamond_transactions(student_id, amount, reason, reference_type)
  values (p_student_id, p_amount, trim(p_reason), 'admin_adjustment');

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id, 'diamonds_adjusted',
          case when p_amount > 0 then 'Premio de ' || p_amount || ' diamantes para ' || v_name
               else 'Ajuste de ' || p_amount || ' diamantes para ' || v_name end,
          jsonb_build_object('amount', p_amount, 'reason', trim(p_reason), 'new_balance', v_balance));

  return jsonb_build_object('diamonds', v_balance);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_affiliate_commissions(p_affiliate_id uuid)
 RETURNS TABLE(id uuid, source_type text, sale_amount_usd numeric, commission_rate numeric, commission_amount_usd numeric, status text, paid_at timestamp with time zone, paid_note text, created_at timestamp with time zone, household_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;

  return query
  select ac.id, ac.source_type, ac.sale_amount_usd, ac.commission_rate,
    ac.commission_amount_usd, ac.status, ac.paid_at, ac.paid_note, ac.created_at,
    h.name
  from affiliate_commissions ac
  join households h on h.id = ac.household_id
  where ac.affiliate_id = p_affiliate_id
  order by ac.created_at desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_backup_and_delete_student(p_student_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_profile jsonb;
  v_household uuid;
  v_username text;
  v_display_name text;
  v_backup_id uuid;
  v_snapshot jsonb;
begin
  if not is_admin() then
    raise exception 'Solo un administrador puede eliminar alumnos';
  end if;

  select to_jsonb(p), p.household_id, p.username, p.display_name
    into v_profile, v_household, v_username, v_display_name
  from profiles p
  where p.id = p_student_id and p.role = 'student'
  limit 1;

  if v_profile is null then
    raise exception 'Alumno no encontrado';
  end if;

  select jsonb_build_object(
    'profile', v_profile,
    'student_subjects', coalesce((select jsonb_agg(to_jsonb(t)) from student_subjects t where t.student_id = p_student_id), '[]'::jsonb),
    'student_subject_teacher', coalesce((select jsonb_agg(to_jsonb(t)) from student_subject_teacher t where t.student_id = p_student_id), '[]'::jsonb),
    'student_characters', coalesce((select jsonb_agg(to_jsonb(t)) from student_characters t where t.student_id = p_student_id), '[]'::jsonb),
    'student_inventory', coalesce((select jsonb_agg(to_jsonb(t)) from student_inventory t where t.student_id = p_student_id), '[]'::jsonb),
    'room_layouts', coalesce((select jsonb_agg(to_jsonb(t)) from room_layouts t where t.student_id = p_student_id), '[]'::jsonb),
    'diamond_transactions', coalesce((select jsonb_agg(to_jsonb(t)) from diamond_transactions t where t.student_id = p_student_id), '[]'::jsonb),
    'topic_progress', coalesce((select jsonb_agg(to_jsonb(t)) from topic_progress t where t.student_id = p_student_id), '[]'::jsonb),
    'student_achievements', coalesce((select jsonb_agg(to_jsonb(t)) from student_achievements t where t.student_id = p_student_id), '[]'::jsonb),
    'agenda_events', coalesce((select jsonb_agg(to_jsonb(t)) from agenda_events t where t.student_id = p_student_id), '[]'::jsonb),
    'exercise_attempts', coalesce((select jsonb_agg(to_jsonb(t)) from exercise_attempts t where t.student_id = p_student_id), '[]'::jsonb),
    'game_plays', coalesce((select jsonb_agg(to_jsonb(t)) from game_plays t where t.student_id = p_student_id), '[]'::jsonb),
    'streaks', coalesce((select jsonb_agg(to_jsonb(t)) from streaks t where t.student_id = p_student_id), '[]'::jsonb)
  ) into v_snapshot;

  insert into deleted_students_backup (original_student_id, household_id, username, display_name, deleted_by, snapshot)
  values (p_student_id, v_household, v_username, v_display_name, auth.uid(), v_snapshot)
  returning id into v_backup_id;

  delete from profiles where id = p_student_id;

  return v_backup_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_create_manual_subject_order(p_student_id uuid, p_subject_ids uuid[], p_access_months smallint, p_total_price_usd numeric, p_payment_status text, p_payment_method_note text, p_paid_at timestamp with time zone, p_proof_file_path text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household uuid;
  v_count integer;
  v_valid_count integer;
  v_unit_price numeric(10,2);
  v_order_id uuid;
begin
  if not exists (select 1 from profiles ap where ap.id = auth.uid() and ap.role = 'admin'::user_role) then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select student_profile.household_id into v_household
  from profiles student_profile
  where student_profile.id = p_student_id and student_profile.role = 'student'::user_role;
  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  if p_payment_status not in ('pending','paid','cancelled') then
    raise exception 'Estado de pedido no valido';
  end if;
  if p_access_months is null or p_access_months < 1 then
    raise exception 'Meses de acceso invalidos';
  end if;
  if p_total_price_usd is null or p_total_price_usd <= 0 then
    raise exception 'Importe invalido';
  end if;

  select count(distinct rid) into v_count from unnest(coalesce(p_subject_ids, '{}'::uuid[])) as requested(rid);
  if v_count < 1 then raise exception 'Selecciona al menos una materia'; end if;

  select count(*) into v_valid_count from subjects s where s.active = true and s.id = any(p_subject_ids);
  if v_valid_count <> v_count then raise exception 'Una materia seleccionada ya no esta disponible'; end if;

  v_unit_price := round(p_total_price_usd / v_count, 2);

  insert into subject_orders (
    student_id, household_id, subject_count, unit_price_usd, total_price_usd,
    access_months, payment_status, payment_method, payment_note, paid_at,
    proof_file_path, created_by_admin_id
  )
  values (
    p_student_id, v_household, v_count, v_unit_price, p_total_price_usd,
    p_access_months, p_payment_status, 'manual', nullif(trim(p_payment_method_note), ''),
    coalesce(p_paid_at, now()), nullif(trim(p_proof_file_path), ''), auth.uid()
  )
  returning id into v_order_id;

  insert into subject_order_items (order_id, subject_id, subject_name, subject_icon, unit_price_usd)
  select v_order_id, s.id, s.name, s.icon, v_unit_price
  from subjects s where s.active = true and s.id = any(p_subject_ids)
  order by s.sort_order, s.name;

  if p_payment_status = 'paid' then
    insert into student_subjects (student_id, subject_id, assigned_at, expires_at, source_order_id)
    select
      p_student_id, oi.subject_id, now(),
      (case when existing.expires_at is not null and existing.expires_at > now()
        then existing.expires_at else now() end) + (p_access_months || ' months')::interval,
      v_order_id
    from subject_order_items oi
    left join student_subjects existing on existing.student_id = p_student_id and existing.subject_id = oi.subject_id
    where oi.order_id = v_order_id
    on conflict (student_id, subject_id) do update set
      expires_at = excluded.expires_at, source_order_id = excluded.source_order_id, assigned_at = now();
  end if;

  insert into admin_activity_log (household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id, 'manual_order_created',
    'Pedido manual registrado (' || p_payment_status || ')',
    jsonb_build_object('order_id', v_order_id, 'subject_ids', p_subject_ids, 'total_price_usd', p_total_price_usd));

  return v_order_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_dashboard_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_result jsonb;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'::public.user_role) then
    raise exception 'Acceso reservado al administrador';
  end if;

  with roster as (
    select * from public.admin_students_overview()
  ), all_students as (
    select p.id from public.profiles p where p.role = 'student'::public.user_role
  ), daily as (
    select day::date as day,
           count(ea.id)::int as attempts,
           count(ea.id) filter (where ea.is_correct)::int as correct,
           count(distinct ea.student_id)::int as active_students
    from generate_series(current_date - 13, current_date, interval '1 day') day
    left join public.exercise_attempts ea
      on ea.attempted_at >= day
     and ea.attempted_at < day + interval '1 day'
     and ea.student_id in (select id from all_students)
    group by day
    order by day
  ), subject_stats as (
    select s.id, s.name, s.icon, s.color,
           count(ea.id)::int as attempts,
           count(ea.id) filter (where ea.is_correct)::int as correct,
           count(distinct ea.student_id)::int as students
    from public.subjects s
    left join public.topics t on t.subject_id = s.id
    left join public.exercises e on e.topic_id = t.id
    left join public.exercise_attempts ea
      on ea.exercise_id = e.id
     and ea.student_id in (select id from all_students)
    where s.active
    group by s.id, s.name, s.icon, s.color, s.sort_order
    order by count(ea.id) desc, s.sort_order
    limit 8
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'households_total', (select count(*) from public.households),
      'students_total', (select count(*) from roster),
      'students_active', (select count(*) from roster where is_active),
      'students_inactive', (select count(*) from roster where not is_active),
      'active_last_7d', (select count(*) from roster where last_activity_at >= now() - interval '7 days'),
      'needs_attention', (select count(*) from roster where is_active and (last_activity_at is null or last_activity_at < now() - interval '14 days' or (attempt_count >= 3 and accuracy_pct < 60))),
      'attempts_last_7d', (select count(*) from public.exercise_attempts ea where ea.student_id in (select id from all_students) and ea.attempted_at >= now() - interval '7 days'),
      'accuracy_last_7d', (select round(100.0 * count(*) filter (where ea.is_correct) / nullif(count(*), 0), 1) from public.exercise_attempts ea where ea.student_id in (select id from all_students) and ea.attempted_at >= now() - interval '7 days'),
      'topics_passed', (select count(*) from public.topic_progress tp where tp.student_id in (select id from all_students) and tp.passed_at is not null),
      'diamonds_in_circulation', (select coalesce(sum(p.diamonds), 0) from public.profiles p where p.id in (select id from all_students)),
      'purchases_total', (select count(*) from public.student_inventory si where si.student_id in (select id from all_students)),
      'content_subjects', (select count(*) from public.subjects where active),
      'content_exercises', (select count(*) from public.exercises where active)
    ),
    'daily_activity', (select coalesce(jsonb_agg(to_jsonb(daily)), '[]'::jsonb) from daily),
    'subject_performance', (select coalesce(jsonb_agg(jsonb_build_object(
      'subject_id', id, 'name', name, 'icon', icon, 'color', color,
      'attempts', attempts,
      'accuracy_pct', case when attempts = 0 then null else round(100.0 * correct / attempts, 1) end,
      'students', students
    )), '[]'::jsonb) from subject_stats),
    'attention', (select coalesce(jsonb_agg(jsonb_build_object(
      'student_id', student_id, 'display_name', display_name, 'household_name', household_name,
      'last_activity_at', last_activity_at, 'accuracy_pct', accuracy_pct, 'attempt_count', attempt_count,
      'reason', case
        when last_activity_at is null then 'Todavia no ha empezado'
        when last_activity_at < now() - interval '14 days' then 'Sin actividad reciente'
        when attempt_count >= 3 and accuracy_pct < 60 then 'Puede necesitar apoyo'
        else 'Revisar seguimiento'
      end
    ) order by last_activity_at nulls first), '[]'::jsonb)
      from roster
      where is_active and (last_activity_at is null or last_activity_at < now() - interval '14 days' or (attempt_count >= 3 and accuracy_pct < 60))
    ),
    'recent_admin_activity', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select l.id, l.action, l.summary, l.student_id, l.created_at, p.display_name as student_name
      from public.admin_activity_log l
      left join public.profiles p on p.id = l.student_id
      order by l.created_at desc
      limit 8
    ) x)
  ) into v_result;

  return v_result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_exists()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(select 1 from profiles where role = 'admin');
$function$
;

CREATE OR REPLACE FUNCTION public.admin_list_affiliates()
 RETURNS TABLE(id uuid, name text, email text, phone text, code text, commission_rate numeric, status text, notes text, created_at timestamp with time zone, sales_count bigint, total_sales_usd numeric, commission_pending_usd numeric, commission_paid_usd numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;

  return query
  select
    a.id, a.name, a.email, a.phone, a.code, a.commission_rate, a.status, a.notes, a.created_at,
    coalesce(c.sales_count, 0), coalesce(c.total_sales_usd, 0),
    coalesce(c.commission_pending_usd, 0), coalesce(c.commission_paid_usd, 0)
  from affiliates a
  left join (
    select ac.affiliate_id,
      count(*) as sales_count,
      sum(ac.sale_amount_usd) as total_sales_usd,
      sum(ac.commission_amount_usd) filter (where ac.status = 'pending') as commission_pending_usd,
      sum(ac.commission_amount_usd) filter (where ac.status = 'paid') as commission_paid_usd
    from affiliate_commissions ac group by ac.affiliate_id
  ) c on c.affiliate_id = a.id
  order by a.created_at desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_list_subject_orders()
 RETURNS TABLE(order_id uuid, student_id uuid, student_name text, household_id uuid, household_name text, subject_names text[], subject_count smallint, total_price_usd numeric, currency text, access_months smallint, payment_status text, payment_method text, payment_note text, paid_at timestamp with time zone, proof_file_path text, paypal_order_id text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    o.id, o.student_id, p.display_name, p.household_id, h.name,
    coalesce(array_agg(oi.subject_name order by oi.subject_name) filter (where oi.subject_name is not null), '{}'),
    o.subject_count, o.total_price_usd, o.currency, o.access_months,
    o.payment_status, o.payment_method, o.payment_note, o.paid_at,
    o.proof_file_path, o.paypal_order_id, o.created_at
  from subject_orders o
  join profiles p on p.id = o.student_id
  join households h on h.id = p.household_id
  left join subject_order_items oi on oi.order_id = o.id
  where is_admin()
  group by o.id, p.display_name, p.household_id, h.name
  order by o.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_list_subject_subscriptions()
 RETURNS TABLE(student_id uuid, student_name text, household_id uuid, household_name text, subject_id uuid, subject_name text, subject_icon text, assigned_at timestamp with time zone, expires_at timestamp with time zone, days_remaining integer, status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    p.id, p.display_name, p.household_id, h.name, s.id, s.name, s.icon, ss.assigned_at, ss.expires_at,
    case when ss.expires_at is null then null
      else (extract(day from ss.expires_at - now()))::int end,
    case
      when ss.expires_at is null then 'sin_vencimiento'
      when ss.expires_at <= now() then 'vencida'
      when ss.expires_at <= now() + interval '14 days' then 'por_vencer'
      else 'activa'
    end
  from student_subjects ss
  join profiles p on p.id = ss.student_id
  join households h on h.id = p.household_id
  join subjects s on s.id = ss.subject_id
  where public.is_admin()
  order by (ss.expires_at is null), ss.expires_at nulls last, h.name, p.display_name;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_mark_commission_paid(p_commission_id uuid, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;

  update affiliate_commissions set
    status = 'paid', paid_at = now(), paid_note = nullif(trim(p_note), '')
  where id = p_commission_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_mark_students_contacted(p_student_ids uuid[], p_channel text DEFAULT 'email'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
  v_count integer;
begin
  select p.household_id into v_household from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'::public.user_role;
  if v_household is null then raise exception 'Acceso reservado al administrador'; end if;
  if p_channel not in ('email', 'telefono', 'whatsapp', 'otro') then raise exception 'Canal no valido'; end if;

  with valid_students as (
    select distinct p.id
    from public.profiles p
    where p.id = any(coalesce(p_student_ids, '{}'::uuid[]))
      and p.household_id = v_household
      and p.role = 'student'::public.user_role
  ), upserted as (
    insert into public.student_admin_details(student_id, last_contacted_at, updated_at, updated_by)
    select id, now(), now(), auth.uid() from valid_students
    on conflict (student_id) do update
    set last_contacted_at = now(), updated_at = now(), updated_by = auth.uid()
    returning student_id
  )
  select count(*) into v_count from upserted;

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  select v_household, auth.uid(), p.id, 'student_contacted',
         'Contacto registrado por ' || p_channel, jsonb_build_object('channel', p_channel)
  from public.profiles p
  where p.id = any(coalesce(p_student_ids, '{}'::uuid[]))
    and p.household_id = v_household and p.role = 'student'::public.user_role;

  return jsonb_build_object('contacted', v_count);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_set_student_active(p_student_id uuid, p_is_active boolean, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
  v_name text;
begin
  if p_reason is not null and char_length(trim(p_reason)) > 500 then
    raise exception 'El motivo no puede superar 500 caracteres';
  end if;

  if not exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'::public.user_role) then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select student_profile.household_id, student_profile.display_name
    into v_household, v_name
  from public.profiles student_profile
  where student_profile.id = p_student_id and student_profile.role = 'student'::public.user_role;

  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  perform set_config('academia.bypass_profile_guard', 'on', true);
  update public.profiles set is_active = p_is_active, updated_at = now() where id = p_student_id;

  insert into public.student_admin_details(student_id, status_reason, updated_at, updated_by)
  values (p_student_id, nullif(trim(p_reason), ''), now(), auth.uid())
  on conflict (student_id) do update
  set status_reason = excluded.status_reason, updated_at = now(), updated_by = auth.uid();

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id,
          case when p_is_active then 'student_activated' else 'student_deactivated' end,
          case when p_is_active then v_name || ' fue reactivado' else v_name || ' fue desactivado' end,
          jsonb_build_object('is_active', p_is_active, 'reason', nullif(trim(p_reason), '')));

  return jsonb_build_object('is_active', p_is_active, 'status_reason', nullif(trim(p_reason), ''));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_set_student_subjects(p_student_id uuid, p_subject_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
  v_requested integer;
  v_valid integer;
begin
  if not exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'::public.user_role) then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select student_profile.household_id into v_household
  from public.profiles student_profile
  where student_profile.id = p_student_id and student_profile.role = 'student'::public.user_role;
  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  select count(distinct id) into v_requested from unnest(coalesce(p_subject_ids, '{}'::uuid[])) id;
  select count(*) into v_valid from public.subjects s where s.id = any(coalesce(p_subject_ids, '{}'::uuid[])) and s.active;
  if v_requested <> v_valid then raise exception 'Hay materias invalidas o inactivas en la seleccion'; end if;

  delete from public.student_subjects
  where student_id = p_student_id
    and subject_id <> all(coalesce(p_subject_ids, '{}'::uuid[]));

  insert into public.student_subjects(student_id, subject_id)
  select p_student_id, id from unnest(coalesce(p_subject_ids, '{}'::uuid[])) id
  on conflict (student_id, subject_id) do nothing;

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id, 'subjects_updated',
          'Materias asignadas actualizadas', jsonb_build_object('subject_count', v_valid));

  return jsonb_build_object('subject_count', v_valid);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_set_subject_expiry(p_student_id uuid, p_subject_id uuid, p_expires_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household uuid;
begin
  if not exists (select 1 from profiles ap where ap.id = auth.uid() and ap.role = 'admin'::user_role) then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select student_profile.household_id into v_household
  from profiles student_profile
  where student_profile.id = p_student_id and student_profile.role = 'student'::user_role;
  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  if not exists (select 1 from subjects where id = p_subject_id and active = true) then
    raise exception 'Materia no valida';
  end if;

  insert into student_subjects (student_id, subject_id, assigned_at, expires_at)
  values (p_student_id, p_subject_id, now(), p_expires_at)
  on conflict (student_id, subject_id) do update set expires_at = excluded.expires_at;

  insert into admin_activity_log (household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id, 'subject_expiry_updated',
          'Vencimiento de materia actualizado a mano',
          jsonb_build_object('subject_id', p_subject_id, 'expires_at', p_expires_at));

  return jsonb_build_object('ok', true);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_student_detail(p_student_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
  v_result jsonb;
begin
  if not exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'::public.user_role) then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select student_profile.household_id into v_household
  from public.profiles student_profile
  where student_profile.id = p_student_id and student_profile.role = 'student'::public.user_role;

  if v_household is null then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select jsonb_build_object(
    'student', (
      select jsonb_build_object(
        'id', p.id, 'display_name', p.display_name, 'username', p.username,
        'birthdate', p.birthdate, 'age_bracket', p.age_bracket, 'gender', p.gender,
        'character_id', p.character_id, 'diamonds', p.diamonds,
        'is_active', p.is_active, 'created_at', p.created_at,
        'guardian_name', d.guardian_name, 'guardian_email', d.guardian_email,
        'admin_notes', d.admin_notes, 'status_reason', d.status_reason,
        'tags', coalesce(d.tags, '{}'::text[]), 'last_contacted_at', d.last_contacted_at,
        'household_id', p.household_id, 'household_name', h.name
      )
      from public.profiles p
      join public.households h on h.id = p.household_id
      left join public.student_admin_details d on d.student_id = p.id
      where p.id = p_student_id
    ),
    'overview', (
      select to_jsonb(r) from public.admin_students_overview() r where r.student_id = p_student_id
    ),
    'assigned_subject_ids', (
      select coalesce(jsonb_agg(ss.subject_id), '[]'::jsonb)
      from public.student_subjects ss where ss.student_id = p_student_id
    ),
    'subjects', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb)
      from (
        select s.id as subject_id, s.name, s.icon, s.color, s.sort_order,
               count(distinct ea.id)::int as attempts,
               count(distinct ea.id) filter (where ea.is_correct)::int as correct,
               case when count(distinct ea.id) = 0 then null
                    else round(100.0 * count(distinct ea.id) filter (where ea.is_correct) / count(distinct ea.id), 1) end as accuracy_pct,
               count(distinct tp.id)::int as topics_started,
               count(distinct tp.id) filter (where tp.passed_at is not null)::int as topics_passed,
               max(greatest(ea.attempted_at, tp.last_played_at)) as last_activity_at
        from public.student_subjects ss
        join public.subjects s on s.id = ss.subject_id
        left join public.topics t on t.subject_id = s.id
        left join public.exercises e on e.topic_id = t.id
        left join public.exercise_attempts ea on ea.exercise_id = e.id and ea.student_id = p_student_id
        left join public.topic_progress tp on tp.topic_id = t.id and tp.student_id = p_student_id
        where ss.student_id = p_student_id
        group by s.id, s.name, s.icon, s.color, s.sort_order
      ) x
    ),
    'recent_attempts', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.attempted_at desc), '[]'::jsonb)
      from (
        select ea.id, ea.is_correct, ea.diamonds_earned, ea.time_spent_seconds, ea.attempted_at,
               e.prompt->>'text' as prompt, t.name as topic_name, s.name as subject_name, s.icon as subject_icon
        from public.exercise_attempts ea
        join public.exercises e on e.id = ea.exercise_id
        join public.topics t on t.id = e.topic_id
        join public.subjects s on s.id = t.subject_id
        where ea.student_id = p_student_id
        order by ea.attempted_at desc
        limit 30
      ) x
    ),
    'diamond_transactions', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select dt.id, dt.amount, dt.reason, dt.reference_type, dt.created_at
        from public.diamond_transactions dt
        where dt.student_id = p_student_id
        order by dt.created_at desc
        limit 30
      ) x
    ),
    'daily_activity', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb)
      from (
        select day::date as day, count(ea.id)::int as attempts,
               count(ea.id) filter (where ea.is_correct)::int as correct,
               coalesce(sum(ea.diamonds_earned), 0)::int as diamonds
        from generate_series(current_date - 13, current_date, interval '1 day') day
        left join public.exercise_attempts ea
          on ea.student_id = p_student_id
         and ea.attempted_at >= day
         and ea.attempted_at < day + interval '1 day'
        group by day
      ) x
    ),
    'admin_activity', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select l.id, l.action, l.summary, l.metadata, l.created_at
        from public.admin_activity_log l
        where l.student_id = p_student_id and l.household_id = v_household
        order by l.created_at desc
        limit 30
      ) x
    )
  ) into v_result;

  return v_result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_students_overview()
 RETURNS TABLE(student_id uuid, display_name text, username text, birthdate date, age_bracket age_bracket, gender character_gender, character_id text, diamonds integer, xp_total integer, level integer, current_streak integer, is_active boolean, created_at timestamp with time zone, guardian_name text, guardian_email text, tags text[], status_reason text, last_contacted_at timestamp with time zone, last_activity_at timestamp with time zone, attempt_count bigint, correct_count bigint, accuracy_pct numeric, topics_started bigint, topics_passed bigint, assigned_subjects bigint, household_id uuid, household_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with attempts as (
    select ea.student_id, count(*) as attempt_count,
           count(*) filter (where ea.is_correct) as correct_count,
           max(ea.attempted_at) as last_attempt_at
    from public.exercise_attempts ea group by ea.student_id
  ), progress as (
    select tp.student_id, count(*) as topics_started,
           count(*) filter (where tp.passed_at is not null) as topics_passed,
           max(tp.last_played_at) as last_progress_at
    from public.topic_progress tp group by tp.student_id
  ), games as (
    select gp.student_id, max(gp.played_at) as last_game_at
    from public.game_plays gp group by gp.student_id
  ), assignments as (
    select ss.student_id, count(*) as assigned_subjects
    from public.student_subjects ss group by ss.student_id
  )
  select p.id, p.display_name, p.username, p.birthdate, p.age_bracket, p.gender,
         p.character_id, p.diamonds, p.xp_total, public.student_level(p.xp_total),
         coalesce(st.current_streak, 0),
         p.is_active, p.created_at,
         d.guardian_name, d.guardian_email, coalesce(d.tags, '{}'::text[]), d.status_reason,
         d.last_contacted_at,
         nullif(greatest(
           coalesce(a.last_attempt_at, '-infinity'::timestamptz),
           coalesce(pr.last_progress_at, '-infinity'::timestamptz),
           coalesce(g.last_game_at, '-infinity'::timestamptz)
         ), '-infinity'::timestamptz),
         coalesce(a.attempt_count, 0), coalesce(a.correct_count, 0),
         case when coalesce(a.attempt_count, 0) = 0 then null
              else round(100.0 * a.correct_count / a.attempt_count, 1) end,
         coalesce(pr.topics_started, 0), coalesce(pr.topics_passed, 0), coalesce(ass.assigned_subjects, 0),
         p.household_id, h.name
  from public.profiles p
  join public.households h on h.id = p.household_id
  left join public.student_admin_details d on d.student_id = p.id
  left join public.streaks st on st.student_id = p.id
  left join attempts a on a.student_id = p.id
  left join progress pr on pr.student_id = p.id
  left join games g on g.student_id = p.id
  left join assignments ass on ass.student_id = p.id
  where p.role = 'student'::public.user_role
    and exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'::public.user_role)
  order by h.name, p.display_name;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_affiliate(p_affiliate_id uuid, p_commission_rate numeric DEFAULT NULL::numeric, p_status text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  if p_status is not null and p_status not in ('active','inactive') then raise exception 'Estado invalido'; end if;
  if p_commission_rate is not null and (p_commission_rate < 0 or p_commission_rate > 100) then raise exception 'Comision invalida'; end if;

  update affiliates set
    commission_rate = coalesce(p_commission_rate, commission_rate),
    status = coalesce(p_status, status),
    notes = coalesce(p_notes, notes)
  where id = p_affiliate_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_enrollment_application(p_id uuid, p_status text, p_payment_status text, p_tags text[], p_admin_notes text, p_next_follow_up_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_tags text[];
  v_updated public.enrollment_applications;
begin
  if not public.is_admin() then raise exception 'Acceso reservado al administrador'; end if;
  if p_status not in ('new', 'contacted', 'qualified', 'payment_pending', 'enrolled', 'not_interested') then raise exception 'Estado no válido'; end if;
  if p_payment_status not in ('not_started', 'pending', 'paid', 'failed', 'refunded') then raise exception 'Estado de pago no válido'; end if;
  if char_length(coalesce(p_admin_notes, '')) > 5000 then raise exception 'Las notas son demasiado largas'; end if;
  select coalesce(array_agg(distinct left(trim(tag), 40)) filter (where nullif(trim(tag), '') is not null), '{}')
    into v_tags from unnest(coalesce(p_tags, '{}')) tag;
  if cardinality(v_tags) > 12 then raise exception 'Puedes guardar hasta 12 etiquetas'; end if;

  update public.enrollment_applications
  set status = p_status, payment_status = p_payment_status, tags = v_tags,
      admin_notes = nullif(trim(p_admin_notes), ''), next_follow_up_at = p_next_follow_up_at,
      updated_at = now()
  where enrollment_applications.id = p_id
  returning * into v_updated;
  if v_updated.id is null then raise exception 'Solicitud no encontrada'; end if;
  return to_jsonb(v_updated);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_student_details(p_student_id uuid, p_guardian_name text, p_guardian_email text, p_admin_notes text, p_tags text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
  v_email text := nullif(lower(trim(p_guardian_email)), '');
  v_name text := nullif(trim(p_guardian_name), '');
  v_notes text := nullif(trim(p_admin_notes), '');
  v_tags text[];
begin
  if not exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'::public.user_role) then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select student_profile.household_id into v_household
  from public.profiles student_profile
  where student_profile.id = p_student_id and student_profile.role = 'student'::public.user_role;
  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  if v_name is not null and char_length(v_name) > 120 then raise exception 'El nombre es demasiado largo'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'El correo no es valido';
  end if;
  if v_notes is not null and char_length(v_notes) > 4000 then raise exception 'Las notas no pueden superar 4000 caracteres'; end if;

  select coalesce(array_agg(distinct left(trim(tag), 40)) filter (where nullif(trim(tag), '') is not null), '{}'::text[])
    into v_tags
  from unnest(coalesce(p_tags, '{}'::text[])) tag;
  if cardinality(v_tags) > 8 then raise exception 'Puedes guardar hasta 8 etiquetas'; end if;

  insert into public.student_admin_details(student_id, guardian_name, guardian_email, admin_notes, tags, updated_at, updated_by)
  values (p_student_id, v_name, v_email, v_notes, v_tags, now(), auth.uid())
  on conflict (student_id) do update
  set guardian_name = excluded.guardian_name,
      guardian_email = excluded.guardian_email,
      admin_notes = excluded.admin_notes,
      tags = excluded.tags,
      updated_at = now(),
      updated_by = auth.uid();

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary)
  values (v_household, auth.uid(), p_student_id, 'student_details_updated', 'Datos de seguimiento actualizados');

  return jsonb_build_object('guardian_name', v_name, 'guardian_email', v_email, 'admin_notes', v_notes, 'tags', v_tags);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_subject_order_status(p_order_id uuid, p_status text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order subject_orders;
begin
  if not exists (select 1 from profiles ap where ap.id = auth.uid() and ap.role = 'admin'::user_role) then
    raise exception 'Sin permiso sobre este pedido';
  end if;

  if p_status not in ('pending','paid','cancelled') then
    raise exception 'Estado de pedido no valido';
  end if;

  select o.* into v_order from subject_orders o where o.id = p_order_id;
  if v_order.id is null then raise exception 'Pedido no encontrado'; end if;

  update subject_orders
  set payment_status = p_status,
      payment_note = coalesce(nullif(trim(p_note), ''), payment_note),
      paid_at = case when p_status = 'paid' and paid_at is null then now() else paid_at end,
      updated_at = now()
  where id = p_order_id;

  if p_status = 'paid' and v_order.payment_status <> 'paid' then
    insert into student_subjects (student_id, subject_id, assigned_at, expires_at, source_order_id)
    select
      v_order.student_id, oi.subject_id, now(),
      (case when existing.expires_at is not null and existing.expires_at > now()
        then existing.expires_at else now() end) + (v_order.access_months || ' months')::interval,
      v_order.id
    from subject_order_items oi
    left join student_subjects existing on existing.student_id = v_order.student_id and existing.subject_id = oi.subject_id
    where oi.order_id = v_order.id
    on conflict (student_id, subject_id) do update set
      expires_at = excluded.expires_at, source_order_id = excluded.source_order_id, assigned_at = now();
  end if;

  insert into admin_activity_log (household_id, admin_id, student_id, action, summary, metadata)
  values (v_order.household_id, auth.uid(), v_order.student_id, 'manual_order_status_changed',
    'Estado del pedido actualizado a ' || p_status,
    jsonb_build_object('order_id', p_order_id, 'status', p_status));

  return jsonb_build_object('ok', true);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.assigned_subjects(p_student_id uuid)
 RETURNS SETOF subjects
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_student_id != auth.uid() and not (
    public.is_admin() and exists (
      select 1 from public.profiles p
      where p.id = p_student_id and p.household_id = public.my_household()
    )
  ) then
    raise exception 'No autorizado';
  end if;

  return query
    select s.*
    from public.subjects s
    join public.student_subjects ss on ss.subject_id = s.id
    where ss.student_id = p_student_id
    order by s.sort_order;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.assigned_subjects_with_status(p_student_id uuid)
 RETURNS TABLE(id uuid, slug text, name text, category text, icon text, color text, sort_order integer, active boolean, expires_at timestamp with time zone, status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_student_id != auth.uid() and not (
    public.is_admin() and exists (
      select 1 from public.profiles p
      where p.id = p_student_id and p.household_id = public.my_household()
    )
  ) then
    raise exception 'No autorizado';
  end if;

  return query
    select s.id, s.slug, s.name, s.category, s.icon, s.color, s.sort_order, s.active,
      ss.expires_at,
      case
        when ss.expires_at is null then 'sin_vencimiento'
        when ss.expires_at <= now() then 'vencida'
        when ss.expires_at <= now() + interval '14 days' then 'por_vencer'
        else 'activa'
      end
    from public.subjects s
    join public.student_subjects ss on ss.subject_id = s.id
    where ss.student_id = p_student_id
    order by s.sort_order;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_assign_default_subjects()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.role = 'student' then
    insert into public.student_subjects (student_id, subject_id, expires_at)
    select new.id, s.id, null
    from public.subjects s
    where s.included_by_default = true and s.active = true
    on conflict (student_id, subject_id) do nothing;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(p_display_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household_id uuid;
begin
  if exists(select 1 from profiles where role = 'admin') then
    raise exception 'Ya existe un administrador';
  end if;

  insert into households (name, owner_id) values (p_display_name || ' - Academia Magica', auth.uid())
  returning id into v_household_id;

  insert into profiles (id, household_id, role, display_name)
  values (auth.uid(), v_household_id, 'admin', p_display_name);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.choose_subject_teacher(p_subject_id uuid, p_teacher_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from student_subjects ss
    where ss.student_id = auth.uid() and ss.subject_id = p_subject_id
  ) then
    raise exception 'No tenes esta materia asignada';
  end if;

  if not exists (
    select 1 from teacher_subjects ts
    where ts.subject_id = p_subject_id and ts.teacher_id = p_teacher_id
  ) then
    raise exception 'Ese profesor no da esta materia';
  end if;

  insert into student_subject_teacher (student_id, subject_id, teacher_id)
  values (auth.uid(), p_subject_id, p_teacher_id)
  on conflict (student_id, subject_id) do update set teacher_id = excluded.teacher_id, chosen_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_enrollment_paypal_order(p_public_reference text, p_payment_token uuid, p_paypal_order_id text, p_paypal_capture_id text, p_captured_amount numeric, p_currency text, p_server_secret text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_application public.enrollment_applications;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;

  select * into v_application from public.enrollment_applications
  where public_reference = p_public_reference and payment_token = p_payment_token
  for update;
  if v_application.id is null then raise exception 'Matrícula no encontrada'; end if;

  if v_application.payment_status = 'paid' then
    if v_application.paypal_order_id = p_paypal_order_id
       and v_application.paypal_capture_id = p_paypal_capture_id then return true; end if;
    raise exception 'La matrícula ya tiene otro pago confirmado';
  end if;
  if v_application.paypal_order_id is distinct from p_paypal_order_id then raise exception 'La orden de PayPal no coincide'; end if;
  if v_application.total_price_usd is distinct from p_captured_amount
     or v_application.currency is distinct from upper(p_currency) then raise exception 'El importe capturado no coincide con la matrícula'; end if;
  if char_length(trim(coalesce(p_paypal_capture_id, ''))) not between 8 and 80 then raise exception 'Captura de PayPal no válida'; end if;

  update public.enrollment_applications
  set paypal_capture_id = trim(p_paypal_capture_id), paypal_paid_at = now(),
      payment_status = 'paid', status = 'enrolled', updated_at = now()
  where id = v_application.id;
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_subject_order_paypal_order(p_order_id uuid, p_paypal_order_id text, p_paypal_capture_id text, p_captured_amount numeric, p_currency text, p_server_secret text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_order public.subject_orders;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;

  select * into v_order from public.subject_orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Orden no encontrada'; end if;

  if v_order.payment_status = 'paid' then
    if v_order.paypal_order_id = p_paypal_order_id
       and v_order.paypal_capture_id = p_paypal_capture_id then return true; end if;
    raise exception 'La orden ya tiene otro pago confirmado';
  end if;
  if v_order.paypal_order_id is distinct from p_paypal_order_id then
    raise exception 'La orden de PayPal no coincide';
  end if;
  if v_order.total_price_usd is distinct from p_captured_amount
     or v_order.currency is distinct from upper(p_currency) then
    raise exception 'El importe capturado no coincide con la orden';
  end if;
  if char_length(trim(coalesce(p_paypal_capture_id, ''))) not between 8 and 80 then
    raise exception 'Captura de PayPal no valida';
  end if;

  update public.subject_orders
  set paypal_capture_id = trim(p_paypal_capture_id), paypal_paid_at = now(),
      payment_status = 'paid', updated_at = now()
  where id = v_order.id;

  insert into public.student_subjects (student_id, subject_id, assigned_at, expires_at, source_order_id)
  select
    v_order.student_id,
    oi.subject_id,
    now(),
    (case
      when existing.expires_at is not null and existing.expires_at > now()
        then existing.expires_at
      else now()
    end) + (v_order.access_months || ' months')::interval,
    v_order.id
  from public.subject_order_items oi
  left join public.student_subjects existing
    on existing.student_id = v_order.student_id and existing.subject_id = oi.subject_id
  where oi.order_id = v_order.id
  on conflict (student_id, subject_id) do update set
    expires_at = excluded.expires_at,
    source_order_id = excluded.source_order_id,
    assigned_at = now();

  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_subject_order(p_subject_ids uuid[])
 RETURNS TABLE(id uuid, subject_count smallint, unit_price_usd numeric, total_price_usd numeric, currency text, access_months smallint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household uuid;
  v_requested_count integer;
  v_valid_count integer;
  v_already_active_count integer;
  v_unit_price numeric(10,2);
  v_order_id uuid;
begin
  select p.household_id into v_household from profiles p where p.id = auth.uid() and p.role = 'student';
  if v_household is null then raise exception 'Solo un alumno puede comprar materias'; end if;

  select count(distinct rid) into v_requested_count
  from unnest(coalesce(p_subject_ids, '{}'::uuid[])) as requested(rid);
  if v_requested_count < 1 then raise exception 'Selecciona al menos una materia'; end if;

  select count(*) into v_valid_count from subjects s
  where s.active = true and s.id = any(p_subject_ids);
  if v_valid_count <> v_requested_count then
    raise exception 'Una de las materias seleccionadas ya no esta disponible';
  end if;

  select count(*) into v_already_active_count
  from student_subjects ss
  where ss.student_id = auth.uid()
    and ss.subject_id = any(p_subject_ids)
    and (ss.expires_at is null or ss.expires_at > now());
  if v_already_active_count > 0 then
    raise exception 'Ya tenes acceso activo a alguna de esas materias';
  end if;

  v_unit_price := case
    when v_requested_count <= 3 then 10
    when v_requested_count <= 6 then 8
    when v_requested_count <= 10 then 7
    else 6
  end;

  insert into subject_orders (student_id, household_id, subject_count, unit_price_usd, total_price_usd)
  values (auth.uid(), v_household, v_requested_count, v_unit_price, v_requested_count * v_unit_price)
  returning subject_orders.id into v_order_id;

  insert into subject_order_items (order_id, subject_id, subject_name, subject_icon, unit_price_usd)
  select v_order_id, s.id, s.name, s.icon, v_unit_price
  from subjects s where s.active = true and s.id = any(p_subject_ids)
  order by s.sort_order, s.name;

  return query select v_order_id, v_requested_count::smallint, v_unit_price,
    v_requested_count * v_unit_price, 'USD'::text, 3::smallint;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.finish_game(p_game_code text, p_won boolean, p_moves integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_plays_today int;
  v_daily_cap constant int := 5;
  v_reward int := 0;
  v_new_diamonds int;
begin
  select count(*) into v_plays_today
  from game_plays
  where student_id = auth.uid()
    and game_code = p_game_code
    and played_at::date = current_date;

  if p_won and v_plays_today < v_daily_cap then
    v_reward := greatest(3, 10 - coalesce(p_moves, 20) / 4);
    if v_reward > 10 then
      v_reward := 10;
    end if;
  end if;

  insert into game_plays (student_id, game_code, won, moves, diamonds_earned)
  values (auth.uid(), p_game_code, p_won, p_moves, v_reward);

  if v_reward > 0 then
    perform set_config('academia.bypass_profile_guard', 'on', true);
    update profiles set diamonds = diamonds + v_reward where id = auth.uid()
    returning diamonds into v_new_diamonds;

    insert into diamond_transactions (student_id, amount, reason, reference_type, reference_id)
    values (auth.uid(), v_reward, 'game_won', 'game', null);
  else
    select diamonds into v_new_diamonds from profiles where id = auth.uid();
  end if;

  return jsonb_build_object(
    'diamonds_earned', v_reward,
    'total_diamonds', v_new_diamonds,
    'plays_today', v_plays_today + 1,
    'daily_cap', v_daily_cap
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.finish_topic(p_topic_id uuid, p_practice_correct integer, p_practice_total integer, p_exam_correct integer, p_exam_total integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_practice_pct int;
  v_exam_pct int;
  v_stars smallint;
  v_passed boolean;
  v_was_passed_before boolean;
  v_bonus int := 0;
  v_new_diamonds int;
begin
  if not exists (
    select 1
    from topics t
    join student_subjects ss on ss.subject_id = t.subject_id
    where t.id = p_topic_id and ss.student_id = auth.uid()
      and (ss.expires_at is null or ss.expires_at > now())
  ) then
    raise exception 'No tenes esta materia asignada o tu acceso vencio';
  end if;

  v_practice_pct := case when p_practice_total > 0 then round(100.0 * p_practice_correct / p_practice_total) else null end;
  v_exam_pct := case when p_exam_total > 0 then round(100.0 * p_exam_correct / p_exam_total) else null end;

  v_stars := case
    when v_exam_pct is null then 0
    when v_exam_pct >= 100 then 3
    when v_exam_pct >= 80 then 2
    when v_exam_pct >= 60 then 1
    else 0
  end;
  v_passed := coalesce(v_exam_pct, 0) >= 60;

  select (passed_at is not null) into v_was_passed_before
  from topic_progress where student_id = auth.uid() and topic_id = p_topic_id;

  insert into topic_progress (student_id, topic_id, practice_best_pct, exam_best_pct, exam_best_stars, exam_attempts, passed_at, last_played_at)
  values (
    auth.uid(), p_topic_id, v_practice_pct, v_exam_pct, v_stars,
    case when p_exam_total > 0 then 1 else 0 end,
    case when v_passed then now() else null end,
    now()
  )
  on conflict (student_id, topic_id) do update set
    practice_best_pct = greatest(coalesce(topic_progress.practice_best_pct, 0), coalesce(excluded.practice_best_pct, 0)),
    exam_best_pct = greatest(coalesce(topic_progress.exam_best_pct, 0), coalesce(excluded.exam_best_pct, 0)),
    exam_best_stars = greatest(topic_progress.exam_best_stars, excluded.exam_best_stars),
    exam_attempts = topic_progress.exam_attempts + (case when p_exam_total > 0 then 1 else 0 end),
    passed_at = coalesce(topic_progress.passed_at, excluded.passed_at),
    last_played_at = now();

  if v_passed and not coalesce(v_was_passed_before, false) then
    v_bonus := 20;
    perform set_config('academia.bypass_profile_guard', 'on', true);
    update profiles set diamonds = diamonds + v_bonus where id = auth.uid()
    returning diamonds into v_new_diamonds;

    insert into diamond_transactions (student_id, amount, reason, reference_type, reference_id)
    values (auth.uid(), v_bonus, 'topic_exam_passed', 'topic', p_topic_id);
  else
    select diamonds into v_new_diamonds from profiles where id = auth.uid();
  end if;

  return jsonb_build_object(
    'practice_pct', v_practice_pct,
    'exam_pct', v_exam_pct,
    'stars', v_stars,
    'passed', v_passed,
    'is_first_pass', v_passed and not coalesce(v_was_passed_before, false),
    'bonus_diamonds', v_bonus,
    'total_diamonds', v_new_diamonds
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_comparar(p_topic uuid, p_l1 uuid, p_l2 uuid, p_cap1 integer, p_cap2 integer, p_cap3 integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  i int; a int; b int; cap int; lesson uuid; is_exam_row boolean; diff int;
  signo text; ex_type exercise_type; prompt_txt text;
begin
  for i in 0..8 loop
    if i < 3 then cap := p_cap1; lesson := p_l1; is_exam_row := false; diff := 1;
    elsif i < 6 then cap := p_cap2; lesson := p_l2; is_exam_row := false; diff := 2;
    else cap := p_cap3; lesson := null; is_exam_row := true; diff := 3;
    end if;

    a := 1 + floor(random() * cap)::int;
    b := 1 + floor(random() * cap)::int;
    signo := case when a > b then '>' when a < b then '<' else '=' end;
    ex_type := (array['multiple_choice','true_false']::exercise_type[])[(i % 2) + 1];

    if ex_type = 'true_false' then
      declare shown_signo text; is_true boolean; begin
        is_true := (i % 3 <> 0);
        shown_signo := case when is_true then signo else (array['>','<','='])[1 + floor(random()*3)::int] end;
        prompt_txt := format('¿Es correcto que %s %s %s?', a, shown_signo, b);
        insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
        values (p_topic, lesson, 'true_false', diff, jsonb_build_object('text', prompt_txt),
                jsonb_build_array('Verdadero','Falso'),
                jsonb_build_object('value', case when shown_signo = signo then 'Verdadero' else 'Falso' end),
                is_exam_row, case when is_exam_row then 8 else 5 end);
      end;
    else
      prompt_txt := format('¿Qué signo va en el espacio? %s ___ %s', a, b);
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'multiple_choice', diff, jsonb_build_object('text', prompt_txt, 'hint', 'Usá mayor que, menor que o igual'),
              jsonb_build_array('>','<','='), jsonb_build_object('value', signo), is_exam_row, case when is_exam_row then 8 else 5 end);
    end if;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_comparar_decimales(p_topic uuid, p_l1 uuid, p_l2 uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  i int; a numeric; b numeric; lesson uuid; is_exam_row boolean; diff int; signo text; prompt_txt text;
begin
  for i in 0..8 loop
    if i < 3 then lesson := p_l1; is_exam_row := false; diff := 1;
    elsif i < 6 then lesson := p_l2; is_exam_row := false; diff := 2;
    else lesson := null; is_exam_row := true; diff := 3;
    end if;
    a := round((1 + random()*90)::numeric, case when i<3 then 1 else 2 end);
    b := round((1 + random()*90)::numeric, case when i<3 then 1 else 2 end);
    signo := case when a>b then '>' when a<b then '<' else '=' end;
    prompt_txt := format('¿Qué signo va en el espacio? %s ___ %s', _es_decimal(a), _es_decimal(b));
    insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
    values (p_topic, lesson, 'multiple_choice', diff, jsonb_build_object('text', prompt_txt, 'hint', 'Compará primero la parte entera y después los decimales'),
            jsonb_build_array('>','<','='), jsonb_build_object('value', signo), is_exam_row, case when is_exam_row then 8 else 5 end);
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_decimales(p_topic uuid, p_l1 uuid, p_l2 uuid, p_op text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  i int; a numeric; b numeric; correct numeric; decs int; lesson uuid; is_exam_row boolean; diff int;
  ex_type exercise_type; prompt_txt text; opts jsonb;
begin
  for i in 0..8 loop
    if i < 3 then decs := 1; lesson := p_l1; is_exam_row := false; diff := 1;
    elsif i < 6 then decs := 2; lesson := p_l2; is_exam_row := false; diff := 2;
    else decs := 2; lesson := null; is_exam_row := true; diff := 3;
    end if;

    if decs = 1 then
      a := round((1 + random()*20)::numeric, 1);
      b := round((1 + random()*20)::numeric, 1);
    else
      a := round((1 + random()*30)::numeric, 2);
      b := round((1 + random()*30)::numeric, 2);
    end if;
    if p_op = 'resta' and b > a then declare t numeric; begin t := a; a := b; b := t; end; end if;
    correct := round((case when p_op='suma' then a+b else a-b end)::numeric, decs);

    ex_type := (array['multiple_choice','fill_blank']::exercise_type[])[(i % 2) + 1];
    prompt_txt := format('%s %s %s = ?', _es_decimal(a), case when p_op='suma' then '+' else '-' end, _es_decimal(b));

    if ex_type = 'fill_blank' then
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'fill_blank', diff, jsonb_build_object('text', prompt_txt, 'hint', 'Usa coma para los decimales, ej: 3,5'),
              null, jsonb_build_object('value', _es_decimal(correct)), is_exam_row, case when is_exam_row then 8 else 5 end);
    else
      opts := jsonb_build_array(_es_decimal(correct), _es_decimal(round(correct+0.1,decs)), _es_decimal(round(correct-0.1,decs)), _es_decimal(round(correct+1,decs)));
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'multiple_choice', diff, jsonb_build_object('text', prompt_txt, 'hint', 'Alineá la coma decimal'),
              opts, jsonb_build_object('value', _es_decimal(correct)), is_exam_row, case when is_exam_row then 8 else 5 end);
    end if;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_div_exact(p_topic uuid, p_l1 uuid, p_l2 uuid, p_divisores integer[], p_lo_cociente integer, p_hi_cociente integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  i int; divisor int; cociente int; dividendo int; lesson uuid; is_exam_row boolean; diff int;
  ex_type exercise_type; nombre text; emoji text; cuantos text; los_las text; prompt_txt text; opts jsonb;
begin
  for i in 0..8 loop
    if i < 3 then lesson := p_l1; is_exam_row := false; diff := 1;
    elsif i < 6 then lesson := p_l2; is_exam_row := false; diff := 2;
    else lesson := null; is_exam_row := true; diff := 3;
    end if;

    divisor := p_divisores[1 + floor(random()*array_length(p_divisores,1))::int];
    cociente := p_lo_cociente + floor(random() * (p_hi_cociente - p_lo_cociente + 1))::int;
    dividendo := divisor * cociente;
    nombre := _nombre_tema(i); emoji := _emoji_tema(nombre);
    cuantos := case when _genero_tema(nombre) = 'f' then 'Cuántas' else 'Cuántos' end;
    los_las := case when _genero_tema(nombre) = 'f' then 'las' else 'los' end;
    ex_type := (array['multiple_choice','fill_blank','true_false']::exercise_type[])[(i % 3) + 1];

    if ex_type = 'true_false' then
      declare shown int; is_true boolean; begin
        is_true := (i % 2 = 0);
        shown := case when is_true then cociente else cociente + (case when random()<0.5 then 1 else -1 end) end;
        prompt_txt := format('¿Es correcto que %s ÷ %s = %s?', dividendo, divisor, shown);
        insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
        values (p_topic, lesson, 'true_false', diff, jsonb_build_object('text', prompt_txt), jsonb_build_array('Verdadero','Falso'),
                jsonb_build_object('value', case when is_true then 'Verdadero' else 'Falso' end), is_exam_row, case when is_exam_row then 8 else 5 end);
      end;
    elsif ex_type = 'fill_blank' then
      prompt_txt := format('Tenés %s %s %s y %s repartís en %s grupos iguales. ¿%s %s hay en cada grupo?', dividendo, nombre, emoji, los_las, divisor, cuantos, nombre);
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'fill_blank', diff, jsonb_build_object('text', prompt_txt, 'hint', format('%s ÷ %s', dividendo, divisor)),
              null, jsonb_build_object('value', cociente::text), is_exam_row, case when is_exam_row then 8 else 5 end);
    else
      prompt_txt := format('%s ÷ %s = ?', dividendo, divisor);
      opts := _gen_int_options(cociente, greatest(divisor,2), false);
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'multiple_choice', diff, jsonb_build_object('text', prompt_txt, 'hint', 'Pensá en la tabla de multiplicar relacionada'),
              opts, jsonb_build_object('value', cociente::text), is_exam_row, case when is_exam_row then 8 else 5 end);
    end if;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_div_residuo(p_topic uuid, p_l1 uuid, p_l2 uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  i int; divisor int; cociente int; residuo int; dividendo int; lesson uuid; is_exam_row boolean; diff int;
  prompt_txt text; opts text[]; d2 int; d3 int; d4 int;
begin
  for i in 0..8 loop
    if i < 3 then lesson := p_l1; is_exam_row := false; diff := 1;
    elsif i < 6 then lesson := p_l2; is_exam_row := false; diff := 2;
    else lesson := null; is_exam_row := true; diff := 3;
    end if;
    divisor := 2 + floor(random()*8)::int;
    cociente := 10 + floor(random()*40)::int;
    residuo := floor(random()*divisor)::int;
    dividendo := divisor*cociente + residuo;
    prompt_txt := format('%s ÷ %s = ? (cociente y residuo)', dividendo, divisor);

    d2 := residuo + 1;
    if d2 >= divisor then d2 := greatest(residuo - 1, 0); end if;
    if d2 = residuo then d2 := residuo + 1; end if;
    d3 := residuo - 1;
    if d3 < 0 or d3 = residuo or d3 = d2 then d3 := residuo + 2; end if;
    if d3 = residuo or d3 = d2 then d3 := -1; end if;

    opts := array[
      format('%s residuo %s', cociente, residuo),
      format('%s residuo %s', cociente + 1, residuo),
      format('%s residuo %s', cociente, d2),
      format('%s residuo %s', cociente - 1, case when d3 >= 0 then d3 else residuo end)
    ];
    if opts[3] = opts[1] then opts[3] := format('%s residuo %s', cociente + 2, residuo); end if;
    if opts[4] = opts[1] or opts[4] = opts[2] or opts[4] = opts[3] then
      opts[4] := format('%s residuo %s', cociente - 2, residuo);
    end if;

    insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
    values (p_topic, lesson, 'multiple_choice', diff,
            jsonb_build_object('text', prompt_txt, 'hint', 'El residuo siempre es menor que el divisor'),
            to_jsonb(opts), jsonb_build_object('value', format('%s residuo %s', cociente, residuo)),
            is_exam_row, case when is_exam_row then 8 else 5 end);
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_mult(p_topic uuid, p_l1 uuid, p_l2 uuid, p_set1 integer[], p_lo2 integer, p_hi2 integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  i int; a int; b int; correct int; lesson uuid; is_exam_row boolean; diff int;
  ex_type exercise_type; nombre text; emoji text; cuantos text; prompt_txt text; opts jsonb;
begin
  for i in 0..8 loop
    if i < 3 then lesson := p_l1; is_exam_row := false; diff := 1;
    elsif i < 6 then lesson := p_l2; is_exam_row := false; diff := 2;
    else lesson := null; is_exam_row := true; diff := 3;
    end if;

    a := p_set1[1 + floor(random()*array_length(p_set1,1))::int];
    b := p_lo2 + floor(random() * (p_hi2 - p_lo2 + 1))::int;
    correct := a * b;
    nombre := _nombre_tema(i); emoji := _emoji_tema(nombre);
    cuantos := case when _genero_tema(nombre) = 'f' then 'Cuántas' else 'Cuántos' end;
    ex_type := (array['multiple_choice','fill_blank','true_false']::exercise_type[])[(i % 3) + 1];

    if ex_type = 'true_false' then
      declare shown int; is_true boolean; begin
        is_true := (i % 2 = 0);
        shown := case when is_true then correct else correct + (case when random()<0.5 then a else -a end) end;
        prompt_txt := format('¿Es correcto que %s x %s = %s?', a, b, shown);
        insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
        values (p_topic, lesson, 'true_false', diff, jsonb_build_object('text', prompt_txt), jsonb_build_array('Verdadero','Falso'),
                jsonb_build_object('value', case when is_true then 'Verdadero' else 'Falso' end), is_exam_row, case when is_exam_row then 8 else 5 end);
      end;
    elsif ex_type = 'fill_blank' then
      prompt_txt := format('Hay %s grupos de %s %s %s. ¿%s %s hay en total?', a, b, nombre, emoji, cuantos, nombre);
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'fill_blank', diff, jsonb_build_object('text', prompt_txt, 'hint', format('%s x %s', a, b)),
              null, jsonb_build_object('value', correct::text), is_exam_row, case when is_exam_row then 8 else 5 end);
    else
      prompt_txt := format('%s x %s = ?', a, b);
      opts := _gen_int_options(correct, greatest(a,5), false);
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'multiple_choice', diff, jsonb_build_object('text', prompt_txt, 'hint', 'Pensá en la tabla de multiplicar'),
              opts, jsonb_build_object('value', correct::text), is_exam_row, case when is_exam_row then 8 else 5 end);
    end if;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_sumrest(p_topic uuid, p_l1 uuid, p_l2 uuid, p_op text, p_cap1 integer, p_cap2 integer, p_cap3 integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  i int;
  a int; b int; correct int;
  cap int; lesson uuid; is_exam_row boolean; diff int;
  ex_type exercise_type;
  nombre text; emoji text; cuantos text;
  prompt_txt text; opts jsonb;
begin
  for i in 0..8 loop
    if i < 3 then cap := p_cap1; lesson := p_l1; is_exam_row := false; diff := 1;
    elsif i < 6 then cap := p_cap2; lesson := p_l2; is_exam_row := false; diff := 2;
    else cap := p_cap3; lesson := null; is_exam_row := true; diff := 3;
    end if;

    if p_op = 'suma' then
      a := 1 + floor(random() * greatest(cap - 1, 1))::int;
      b := 1 + floor(random() * greatest(cap - a, 1))::int;
      correct := a + b;
    else
      a := 2 + floor(random() * greatest(cap - 2, 1))::int;
      b := floor(random() * (a+1))::int;
      correct := a - b;
    end if;

    nombre := _nombre_tema(i);
    emoji := _emoji_tema(nombre);
    cuantos := case when _genero_tema(nombre) = 'f' then 'Cuántas' else 'Cuántos' end;
    ex_type := (array['multiple_choice','fill_blank','true_false']::exercise_type[])[(i % 3) + 1];

    if ex_type = 'true_false' then
      declare shown int; is_true boolean; begin
        is_true := (i % 2 = 0);
        shown := case when is_true then correct else correct + (case when random() < 0.5 then 1 else -1 end) end;
        prompt_txt := format('¿Es correcto que %s %s %s %s = %s?', a, case when p_op='suma' then '+' else '-' end, b, emoji, shown);
        insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
        values (p_topic, lesson, 'true_false', diff, jsonb_build_object('text', prompt_txt),
                jsonb_build_array('Verdadero','Falso'),
                jsonb_build_object('value', case when is_true then 'Verdadero' else 'Falso' end),
                is_exam_row, case when is_exam_row then 8 else 5 end);
      end;
    elsif ex_type = 'fill_blank' then
      if p_op = 'resta' then
        prompt_txt := format('Tenés %s %s %s. Se van %s. ¿%s %s te quedan?', a, nombre, emoji, b, cuantos, nombre);
      else
        prompt_txt := format('Tenés %s %s %s. Te dan %s más. ¿%s %s tenés en total?', a, nombre, emoji, b, cuantos, nombre);
      end if;
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'fill_blank', diff, jsonb_build_object('text', prompt_txt, 'hint', 'Escribe solo el número'),
              null, jsonb_build_object('value', correct::text), is_exam_row, case when is_exam_row then 8 else 5 end);
    else
      prompt_txt := format('%s %s %s = ?', a, case when p_op='suma' then '+' else '-' end, b);
      opts := _gen_int_options(correct, greatest(cap/4,2), false);
      insert into exercises (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, is_exam, diamond_reward)
      values (p_topic, lesson, 'multiple_choice', diff, jsonb_build_object('text', prompt_txt, 'hint', format('Pensá en %s %s', nombre, emoji)),
              opts, jsonb_build_object('value', correct::text), is_exam_row, case when is_exam_row then 8 else 5 end);
    end if;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_claimable_enrollment(p_ref text, p_token uuid)
 RETURNS TABLE(application_id uuid, public_reference text, student_first_name text, student_last_name text, contact_full_name text, contact_email text, suggested_username text, total_price_usd numeric, currency text, access_months smallint, subject_names text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_app enrollment_applications%rowtype;
begin
  select ea.* into v_app
  from enrollment_applications ea
  where ea.public_reference = p_ref
    and ea.payment_token = p_token
    and ea.payment_status = 'paid'
    and ea.claimed_at is null
  limit 1;

  if not found then
    return;
  end if;

  return query
  select
    v_app.id,
    v_app.public_reference,
    v_app.student_first_name,
    v_app.student_last_name,
    v_app.contact_full_name,
    v_app.contact_email,
    lower(regexp_replace(
      unaccent(coalesce(v_app.student_first_name, 'alumno')),
      '[^a-zA-Z0-9]', '', 'g'
    )) || floor(random() * 90 + 10)::int::text as suggested_username,
    v_app.total_price_usd,
    v_app.currency,
    v_app.access_months,
    coalesce((
      select array_agg(s.subject_name order by s.subject_name)
      from enrollment_application_subjects s
      where s.application_id = v_app.id
    ), array[]::text[]);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_enrollment_payment_summary(p_public_reference text, p_payment_token uuid)
 RETURNS TABLE(public_reference text, subject_count smallint, total_price_usd numeric, currency text, access_months smallint, payment_status text, subject_names text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select e.public_reference, e.subject_count, e.total_price_usd, e.currency,
         e.access_months, e.payment_status,
         coalesce(array_agg(s.subject_name order by s.created_at)
           filter (where s.subject_name is not null), '{}')::text[]
  from public.enrollment_applications e
  left join public.enrollment_application_subjects s on s.application_id = e.id
  where e.public_reference = p_public_reference
    and e.payment_token = p_payment_token
  group by e.id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_enrollment_receipt(p_ref text, p_token uuid)
 RETURNS TABLE(contact_full_name text, contact_email text, student_first_name text, total_price_usd numeric, currency text, access_months smallint, subject_names text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_app enrollment_applications%rowtype;
begin
  select ea.* into v_app
  from enrollment_applications ea
  where ea.public_reference = p_ref
    and ea.payment_token = p_token
    and ea.payment_status = 'paid'
  limit 1;

  if not found then
    return;
  end if;

  return query
  select
    v_app.contact_full_name,
    v_app.contact_email,
    v_app.student_first_name,
    v_app.total_price_usd,
    v_app.currency,
    v_app.access_months,
    coalesce((
      select array_agg(s.subject_name order by s.subject_name)
      from enrollment_application_subjects s
      where s.application_id = v_app.id
    ), array[]::text[]);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_enrollment_subject_catalog()
 RETURNS TABLE(id uuid, slug text, name text, category text, icon text, color text, description text, sort_order integer, active boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select s.id, s.slug, s.name, s.category, s.icon, s.color, s.description, s.sort_order, s.active
  from public.subjects s
  where s.active = true and s.included_by_default = false
  order by s.sort_order, s.name;
$function$
;

CREATE OR REPLACE FUNCTION public.get_student_login_avatar(p_username text)
 RETURNS TABLE(username text, display_name text, avatar_url text, character_id text, thumbnail_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.username, p.display_name, p.avatar_url, p.character_id, c.thumbnail_url
  from profiles p
  left join characters c on c.id = p.character_id
  where p.role = 'student'
    and p.is_active = true
    and p.username is not null
    and lower(p.username) = lower(trim(p_username))
  limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_subject_order_summary(p_order_id uuid)
 RETURNS TABLE(id uuid, subject_count smallint, total_price_usd numeric, currency text, access_months smallint, payment_status text, subject_names text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select so.id, so.subject_count, so.total_price_usd, so.currency,
         so.access_months, so.payment_status,
         coalesce(array_agg(oi.subject_name order by oi.created_at) filter (where oi.subject_name is not null), '{}')::text[]
  from subject_orders so
  left join subject_order_items oi on oi.order_id = so.id
  where so.id = p_order_id and (so.student_id = auth.uid() or public.is_admin())
  group by so.id;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_profile_self_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if is_admin() then
    return new;
  end if;

  if current_setting('academia.bypass_profile_guard', true) = 'on' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.household_id is distinct from old.household_id
     or new.diamonds is distinct from old.diamonds
     or new.username is distinct from old.username
     or new.is_active is distinct from old.is_active then
    raise exception 'No autorizado a modificar estos campos';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_enrollment_claimed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.claimed_at is not null and old.claimed_at is null
     and new.affiliate_id is not null and new.household_id is not null then

    update households set affiliate_id = new.affiliate_id
    where id = new.household_id and affiliate_id is null;

    insert into affiliate_commissions (
      affiliate_id, household_id, source_type, source_id,
      sale_amount_usd, commission_rate, commission_amount_usd
    )
    select new.affiliate_id, new.household_id, 'enrollment', new.id,
      new.total_price_usd, a.commission_rate,
      round(coalesce(new.total_price_usd, 0) * a.commission_rate / 100, 2)
    from affiliates a where a.id = new.affiliate_id
    on conflict (source_type, source_id) do nothing;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_subject_order_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_affiliate_id uuid;
  v_rate numeric(5,2);
begin
  if new.payment_status = 'paid'
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid') then

    select h.affiliate_id into v_affiliate_id from households h where h.id = new.household_id;

    if v_affiliate_id is not null then
      select a.commission_rate into v_rate from affiliates a where a.id = v_affiliate_id;

      insert into affiliate_commissions (
        affiliate_id, household_id, source_type, source_id,
        sale_amount_usd, commission_rate, commission_amount_usd
      )
      values (
        v_affiliate_id, new.household_id, 'subject_order', new.id,
        new.total_price_usd, v_rate, round(new.total_price_usd * v_rate / 100, 2)
      )
      on conflict (source_type, source_id) do nothing;
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$function$
;

CREATE OR REPLACE FUNCTION public.list_active_students()
 RETURNS TABLE(username text, display_name text, avatar_url text, gender character_gender, character_id text, thumbnail_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.username, p.display_name, p.avatar_url, p.gender, p.character_id, c.thumbnail_url
  from profiles p
  left join characters c on c.id = p.character_id
  where p.role = 'student' and p.is_active = true and p.username is not null
  order by p.display_name;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_topic_started(p_topic_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1
    from topics t
    join student_subjects ss on ss.subject_id = t.subject_id
    where t.id = p_topic_id and ss.student_id = auth.uid()
  ) then
    raise exception 'No tenes esta materia asignada';
  end if;

  insert into topic_progress (student_id, topic_id, last_played_at)
  values (auth.uid(), p_topic_id, now())
  on conflict (student_id, topic_id) do update set last_played_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.my_affiliate_commissions()
 RETURNS TABLE(id uuid, source_type text, sale_amount_usd numeric, commission_amount_usd numeric, status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select ac.id, ac.source_type, ac.sale_amount_usd, ac.commission_amount_usd, ac.status, ac.created_at
  from affiliate_commissions ac
  join affiliates a on a.id = ac.affiliate_id
  where a.auth_user_id = auth.uid()
  order by ac.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.my_affiliate_profile()
 RETURNS TABLE(id uuid, name text, code text, commission_rate numeric, status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.id, a.name, a.code, a.commission_rate, a.status
  from affiliates a where a.auth_user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.my_household()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select household_id from profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.my_is_active()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(is_active, false) from profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.my_parent_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_student_id uuid := auth.uid();
  v_display_name text;
  v_diamonds integer;
  v_xp_total integer;
  v_result jsonb;
begin
  select display_name, diamonds, xp_total into v_display_name, v_diamonds, v_xp_total
  from profiles
  where id = v_student_id;

  select jsonb_build_object(
    'display_name', v_display_name,
    'diamonds_balance', coalesce(v_diamonds, 0),
    'xp_total', coalesce(v_xp_total, 0),
    'level', student_level(coalesce(v_xp_total, 0)),
    'level_title', (select title from level_thresholds where level = student_level(coalesce(v_xp_total, 0))),
    'generated_at', now(),

    'total_seconds', coalesce((
      select sum(time_spent_seconds) from exercise_attempts where student_id = v_student_id
    ), 0),
    'total_exercises', (
      select count(*) from exercise_attempts where student_id = v_student_id
    ),
    'accuracy_pct', (
      select case when count(*) = 0 then null
        else round(100.0 * count(*) filter (where is_correct) / count(*), 0) end
      from exercise_attempts where student_id = v_student_id
    ),

    'seconds_last_7d', coalesce((
      select sum(time_spent_seconds) from exercise_attempts
      where student_id = v_student_id and attempted_at > now() - interval '7 days'
    ), 0),
    'seconds_last_30d', coalesce((
      select sum(time_spent_seconds) from exercise_attempts
      where student_id = v_student_id and attempted_at > now() - interval '30 days'
    ), 0),

    'diamonds_last_30d', coalesce((
      select sum(amount) from diamond_transactions
      where student_id = v_student_id and amount > 0 and created_at > now() - interval '30 days'
    ), 0),

    'current_streak', coalesce((
      select current_streak from streaks where student_id = v_student_id
    ), 0),
    'longest_streak', coalesce((
      select longest_streak from streaks where student_id = v_student_id
    ), 0),
    'last_activity_date', (
      select last_activity_date from streaks where student_id = v_student_id
    ),

    'topics_passed_total', coalesce((
      select count(*) from topic_progress
      where student_id = v_student_id and passed_at is not null
    ), 0),
    'achievements_count', coalesce((
      select count(*) from student_achievements where student_id = v_student_id
    ), 0),

    'by_subject', coalesce((
      select jsonb_agg(to_jsonb(s2.*) order by s2.seconds desc)
      from (
        select s.*,
          case
            when s.expires_at is null then 'sin_vencimiento'
            when s.expires_at <= now() then 'vencida'
            when s.expires_at <= now() + interval '14 days' then 'por_vencer'
            else 'activa'
          end as subscription_status
        from (
          select
            sub.id as subject_id,
            sub.name as subject_name,
            sub.icon as subject_icon,
            sub.color as subject_color,
            coalesce(sum(ea.time_spent_seconds), 0) as seconds,
            count(ea.id) as exercises,
            case when count(ea.id) = 0 then null
              else round(100.0 * count(*) filter (where ea.is_correct) / count(ea.id), 0) end as accuracy_pct,
            count(distinct tp.topic_id) filter (where tp.passed_at is not null) as topics_passed,
            max(ss.expires_at) as expires_at
          from student_subjects ss
          join subjects sub on sub.id = ss.subject_id
          left join topics t on t.subject_id = sub.id
          left join exercises ex on ex.topic_id = t.id
          left join exercise_attempts ea on ea.exercise_id = ex.id and ea.student_id = v_student_id
          left join topic_progress tp on tp.topic_id = t.id and tp.student_id = v_student_id
          where ss.student_id = v_student_id
          group by sub.id, sub.name, sub.icon, sub.color, sub.sort_order
          order by sub.sort_order
        ) s
      ) s2
    ), '[]'::jsonb),

    'daily_last_14d', coalesce((
      select jsonb_agg(to_jsonb(d.*) order by d.day)
      from (
        select
          gs::date as day,
          coalesce(sum(ea.time_spent_seconds), 0) as seconds,
          count(ea.id) as exercises
        from generate_series(current_date - interval '13 days', current_date, interval '1 day') gs
        left join exercise_attempts ea
          on ea.student_id = v_student_id and ea.attempted_at::date = gs::date
        group by gs
        order by gs
      ) d
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.my_profile()
 RETURNS TABLE(id uuid, role text, display_name text, username text, avatar_url text, gender text, age_bracket text, character_id text, diamonds integer, household_id uuid, birthdate date, visual_theme text, xp_total integer, level integer, level_title text, xp_into_level integer, xp_for_next_level integer, current_streak integer, longest_streak integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    p.id,
    p.role,
    p.display_name,
    p.username,
    p.avatar_url,
    p.gender,
    p.age_bracket,
    p.character_id,
    p.diamonds,
    p.household_id,
    p.birthdate,
    p.visual_theme,
    p.xp_total,
    public.student_level(p.xp_total) as level,
    lt_cur.title as level_title,
    p.xp_total - lt_cur.xp_required as xp_into_level,
    lt_next.xp_required - lt_cur.xp_required as xp_for_next_level,
    coalesce(st.current_streak, 0) as current_streak,
    coalesce(st.longest_streak, 0) as longest_streak
  from public.profiles p
  left join public.level_thresholds lt_cur
    on lt_cur.level = public.student_level(p.xp_total)
  left join public.level_thresholds lt_next
    on lt_next.level = public.student_level(p.xp_total) + 1
  left join public.streaks st
    on st.student_id = p.id
  where p.id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.my_subject_purchase_options()
 RETURNS SETOF subjects
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.*
  from public.subjects s
  where s.active = true
    and not exists (
      select 1 from public.student_subjects ss
      where ss.student_id = auth.uid()
        and ss.subject_id = s.id
        and (ss.expires_at is null or ss.expires_at > now())
    )
  order by s.sort_order;
$function$
;

CREATE OR REPLACE FUNCTION public.my_subject_scores()
 RETURNS TABLE(subject_id uuid, subject_name text, subject_icon text, topics_total integer, topics_passed integer, avg_exam_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_bracket age_bracket;
begin
  select p.age_bracket into v_bracket from profiles p where p.id = auth.uid();

  return query
    select
      s.id,
      s.name,
      s.icon,
      count(t.id)::int,
      count(t.id) filter (where tp.passed_at is not null)::int,
      round(avg(tp.exam_best_pct), 0)
    from student_subjects ss
    join subjects s on s.id = ss.subject_id
    left join topics t on t.subject_id = s.id and t.active = true and t.age_bracket = v_bracket
    left join topic_progress tp on tp.topic_id = t.id and tp.student_id = auth.uid()
    where ss.student_id = auth.uid()
    group by s.id, s.name, s.icon, s.sort_order
    order by s.sort_order;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.my_subject_teacher(p_subject_id uuid)
 RETURNS TABLE(teacher_id uuid, name text, gender text, nationality text, flag_emoji text, age integer, image_url text, body_image_url text, voice_name text, greeting_template text, greeting_es text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select tc.id, tc.name, tc.gender, tc.nationality, tc.flag_emoji, tc.age, tc.image_url,
         tc.body_image_url, tc.voice_name, tc.greeting_template, tc.greeting_es
  from student_subject_teacher sst
  join teachers tc on tc.id = sst.teacher_id
  where sst.student_id = auth.uid() and sst.subject_id = p_subject_id;
$function$
;

CREATE OR REPLACE FUNCTION public.playable_exercises(p_subject_id uuid)
 RETURNS TABLE(id uuid, topic_id uuid, topic_name text, type exercise_type, difficulty integer, prompt jsonb, options jsonb, diamond_reward integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from student_subjects ss
    where ss.student_id = auth.uid() and ss.subject_id = p_subject_id
  ) then
    raise exception 'No tenes esta materia asignada';
  end if;

  return query
    select e.id, e.topic_id, t.name, e.type, e.difficulty, e.prompt, e.options, e.diamond_reward
    from exercises e
    join topics t on t.id = e.topic_id
    where t.subject_id = p_subject_id
      and e.active = true
      and t.active = true
    order by e.difficulty, t.sort_order;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.playable_topic_exercises(p_topic_id uuid)
 RETURNS TABLE(id uuid, type exercise_type, difficulty integer, prompt jsonb, options jsonb, diamond_reward integer, is_exam boolean, lesson_id uuid, lesson_name text, lesson_sort_order integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1
    from topics t
    join student_subjects ss on ss.subject_id = t.subject_id
    where t.id = p_topic_id and ss.student_id = auth.uid()
      and (ss.expires_at is null or ss.expires_at > now())
  ) then
    raise exception 'No tenes esta materia asignada o tu acceso vencio';
  end if;

  return query
    select e.id, e.type, e.difficulty, e.prompt, e.options, e.diamond_reward, e.is_exam,
           l.id, l.name, l.sort_order
    from exercises e
    left join lessons l on l.id = e.lesson_id
    where e.topic_id = p_topic_id and e.active = true
    order by e.is_exam, coalesce(l.sort_order, 999), e.difficulty;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_enrollment_paypal_webhook(p_event_id text, p_event_type text, p_resource_id text, p_order_id text, p_capture_id text, p_amount numeric, p_currency text, p_server_secret text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_application public.enrollment_applications;
  v_inserted text;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;

  if char_length(trim(coalesce(p_event_id, ''))) not between 8 and 100
     or char_length(trim(coalesce(p_event_type, ''))) not between 3 and 120 then
    raise exception 'Evento PayPal no válido';
  end if;

  insert into private.paypal_webhook_events(
    event_id, event_type, resource_id, order_id
  ) values (
    trim(p_event_id), trim(p_event_type), nullif(trim(p_resource_id), ''),
    nullif(trim(p_order_id), '')
  )
  on conflict (event_id) do nothing
  returning event_id into v_inserted;

  if v_inserted is null then return 'duplicate'; end if;

  select * into v_application
  from public.enrollment_applications
  where (nullif(trim(p_order_id), '') is not null and paypal_order_id = trim(p_order_id))
     or (nullif(trim(p_capture_id), '') is not null and paypal_capture_id = trim(p_capture_id))
  order by created_at desc
  limit 1
  for update;

  if v_application.id is null then
    update private.paypal_webhook_events
    set processing_status = 'ignored', processed_at = now(),
        error_message = 'No matching enrollment'
    where event_id = trim(p_event_id);
    return 'ignored';
  end if;

  if p_event_type = 'PAYMENT.CAPTURE.COMPLETED' then
    if v_application.total_price_usd is distinct from p_amount
       or v_application.currency is distinct from upper(p_currency)
       or nullif(trim(p_resource_id), '') is null then
      update private.paypal_webhook_events
      set application_id = v_application.id, processing_status = 'failed',
          processed_at = now(), error_message = 'Amount, currency or capture mismatch'
      where event_id = trim(p_event_id);
      raise exception 'El pago de PayPal no coincide con la matrícula';
    end if;

    update public.enrollment_applications
    set paypal_capture_id = trim(p_resource_id), paypal_paid_at = coalesce(paypal_paid_at, now()),
        payment_status = 'paid', status = 'enrolled', updated_at = now()
    where id = v_application.id
      and (paypal_capture_id is null or paypal_capture_id = trim(p_resource_id));

  elsif p_event_type in ('PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED') then
    update public.enrollment_applications
    set payment_status = 'failed', updated_at = now()
    where id = v_application.id and payment_status <> 'paid';

  elsif p_event_type = 'PAYMENT.CAPTURE.PENDING' then
    update public.enrollment_applications
    set payment_status = 'pending', status = 'payment_pending', updated_at = now()
    where id = v_application.id and payment_status <> 'paid';

  elsif p_event_type in ('PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED') then
    update public.enrollment_applications
    set payment_status = 'refunded', status = 'not_interested', updated_at = now()
    where id = v_application.id;

  else
    update private.paypal_webhook_events
    set application_id = v_application.id, processing_status = 'ignored',
        processed_at = now(), error_message = 'Event type not actionable'
    where event_id = trim(p_event_id);
    return 'ignored';
  end if;

  update private.paypal_webhook_events
  set application_id = v_application.id, processing_status = 'processed',
      processed_at = now(), error_message = null
  where event_id = trim(p_event_id);

  return 'processed';
exception when others then
  update private.paypal_webhook_events
  set processing_status = 'failed', processed_at = now(),
      error_message = left(sqlerrm, 500)
  where event_id = trim(coalesce(p_event_id, ''));
  raise;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.purchase_store_item(p_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item record;
  v_gender character_gender;
  v_remaining int;
begin
  select id, price_diamonds, gender, active into v_item
  from store_items where id = p_item_id;

  if v_item.id is null or v_item.active = false then
    raise exception 'Este item ya no esta disponible';
  end if;

  select gender into v_gender from profiles where id = auth.uid();

  if v_gender is null or v_gender != v_item.gender then
    raise exception 'Este item no es para tu personaje';
  end if;

  if exists (select 1 from student_inventory where student_id = auth.uid() and item_id = p_item_id) then
    raise exception 'Ya tenes este item';
  end if;

  perform set_config('academia.bypass_profile_guard', 'on', true);
  update profiles
  set diamonds = diamonds - v_item.price_diamonds
  where id = auth.uid() and diamonds >= v_item.price_diamonds
  returning diamonds into v_remaining;

  if v_remaining is null then
    raise exception 'No tenes suficientes diamantes';
  end if;

  insert into diamond_transactions (student_id, amount, reason, reference_type, reference_id)
  values (auth.uid(), -v_item.price_diamonds, 'store_purchase', 'store_item', p_item_id);

  insert into student_inventory (student_id, item_id, placed_in_room)
  values (auth.uid(), p_item_id, false);

  return jsonb_build_object(
    'success', true,
    'remaining_diamonds', v_remaining
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.register_enrollment_paypal_order(p_public_reference text, p_payment_token uuid, p_paypal_order_id text, p_server_secret text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_updated integer;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;
  if char_length(trim(coalesce(p_paypal_order_id, ''))) not between 8 and 80 then
    raise exception 'Identificador de PayPal no válido';
  end if;

  update public.enrollment_applications
  set paypal_order_id = trim(p_paypal_order_id), payment_status = 'pending',
      status = case when status = 'new' then 'payment_pending' else status end,
      updated_at = now()
  where public_reference = p_public_reference and payment_token = p_payment_token
    and payment_status in ('not_started', 'pending')
    and (paypal_order_id is null or paypal_order_id = trim(p_paypal_order_id));

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'No se pudo vincular la orden de PayPal'; end if;
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.register_subject_order_paypal_order(p_order_id uuid, p_paypal_order_id text, p_server_secret text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_updated integer;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;
  if char_length(trim(coalesce(p_paypal_order_id, ''))) not between 8 and 80 then
    raise exception 'Identificador de PayPal no valido';
  end if;

  update public.subject_orders
  set paypal_order_id = trim(p_paypal_order_id), payment_status = 'pending', updated_at = now()
  where id = p_order_id
    and payment_status in ('not_started', 'pending')
    and (paypal_order_id is null or paypal_order_id = trim(p_paypal_order_id));

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'No se pudo vincular la orden de PayPal'; end if;
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sell_store_item(p_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inv_id uuid;
  v_price int;
  v_refund int;
  v_equipped boolean;
begin
  select si.id, si.equipped into v_inv_id, v_equipped
  from student_inventory si
  where si.student_id = auth.uid() and si.item_id = p_item_id;

  if v_inv_id is null then
    raise exception 'No tenes este item';
  end if;

  select price_diamonds into v_price from store_items where id = p_item_id;

  if v_price is null then
    raise exception 'Item no encontrado';
  end if;

  v_refund := floor(v_price * 0.8)::int;

  perform set_config('academia.bypass_profile_guard', 'on', true);
  update profiles set diamonds = diamonds + v_refund where id = auth.uid();

  insert into diamond_transactions (student_id, amount, reason, reference_type, reference_id)
  values (auth.uid(), v_refund, 'store_sale', 'store_item', p_item_id);

  delete from student_inventory where id = v_inv_id;

  return jsonb_build_object('success', true, 'refund', v_refund, 'was_equipped', coalesce(v_equipped, false));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_item_equipped(p_item_id uuid, p_equipped boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item record;
  v_owned boolean;
begin
  select id, category, garment_slot into v_item
  from store_items where id = p_item_id;

  if v_item.id is null then
    raise exception 'Item no encontrado';
  end if;

  if v_item.category not in ('color_ropa', 'accesorio') then
    raise exception 'Este item no se puede equipar, se coloca en la habitacion';
  end if;

  select exists(
    select 1 from student_inventory where student_id = auth.uid() and item_id = p_item_id
  ) into v_owned;

  if not v_owned then
    raise exception 'Todavia no tenes este item';
  end if;

  if p_equipped and v_item.category = 'color_ropa' then
    update student_inventory si
    set equipped = false
    from store_items so
    where si.item_id = so.id
      and si.student_id = auth.uid()
      and so.category = 'color_ropa'
      and so.garment_slot = v_item.garment_slot
      and si.item_id != p_item_id;
  end if;

  update student_inventory
  set equipped = p_equipped
  where student_id = auth.uid() and item_id = p_item_id;

  return jsonb_build_object('success', true, 'item_id', p_item_id, 'equipped', p_equipped);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.student_level(p_xp integer)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(max(level), 1) from public.level_thresholds where xp_required <= p_xp;
$function$
;

CREATE OR REPLACE FUNCTION public.subject_teachers(p_subject_id uuid)
 RETURNS TABLE(teacher_id uuid, name text, gender text, nationality text, flag_emoji text, age integer, image_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.id, t.name, t.gender, t.nationality, t.flag_emoji, t.age, t.image_url
  from teachers t
  join teacher_subjects ts on ts.teacher_id = t.id
  where ts.subject_id = p_subject_id and t.active = true
  order by t.sort_order;
$function$
;

CREATE OR REPLACE FUNCTION public.subject_topics(p_subject_id uuid)
 RETURNS TABLE(topic_id uuid, name text, sort_order integer, recommended_age smallint, prerequisites text, submodule text, practice_count integer, exam_count integer, practice_best_pct integer, exam_best_pct integer, exam_best_stars smallint, exam_attempts integer, passed boolean, last_played_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from student_subjects ss
    where ss.student_id = auth.uid() and ss.subject_id = p_subject_id
  ) then
    raise exception 'No tenes esta materia asignada';
  end if;

  if exists (
    select 1 from student_subjects ss
    where ss.student_id = auth.uid() and ss.subject_id = p_subject_id
      and ss.expires_at is not null and ss.expires_at <= now()
  ) then
    raise exception 'Tu acceso a esta materia vencio. Pedile a un adulto que la renueve desde el Panel para padres.';
  end if;

  return query
    select
      t.id,
      t.name,
      t.sort_order,
      t.recommended_age,
      t.prerequisites,
      t.submodule,
      count(e.id) filter (where not e.is_exam and e.active)::int,
      count(e.id) filter (where e.is_exam and e.active)::int,
      tp.practice_best_pct,
      tp.exam_best_pct,
      coalesce(tp.exam_best_stars, 0::smallint),
      coalesce(tp.exam_attempts, 0),
      (tp.passed_at is not null),
      tp.last_played_at
    from topics t
    left join exercises e on e.topic_id = t.id
    left join topic_progress tp on tp.topic_id = t.id and tp.student_id = auth.uid()
    where t.subject_id = p_subject_id
      and t.active = true
    group by t.id, t.name, t.sort_order, t.recommended_age, t.prerequisites, t.submodule, tp.practice_best_pct, tp.exam_best_pct, tp.exam_best_stars, tp.exam_attempts, tp.passed_at, tp.last_played_at
    order by coalesce(t.recommended_age, 99), t.sort_order;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_enrollment_application(p_applicant_type text, p_contact_full_name text, p_contact_email text, p_whatsapp_phone text, p_country text, p_city text, p_subject_ids uuid[], p_student_first_name text DEFAULT NULL::text, p_student_last_name text DEFAULT NULL::text, p_student_email text DEFAULT NULL::text, p_privacy_accepted boolean DEFAULT false, p_terms_accepted boolean DEFAULT false, p_marketing_consent boolean DEFAULT false, p_source text DEFAULT 'landing'::text, p_utm_source text DEFAULT NULL::text, p_utm_medium text DEFAULT NULL::text, p_utm_campaign text DEFAULT NULL::text, p_affiliate_code text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, public_reference text, payment_token uuid, subject_count smallint, unit_price_usd numeric, total_price_usd numeric, currency text, access_months smallint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_email text := lower(trim(coalesce(p_contact_email, '')));
  v_student_email text := nullif(lower(trim(coalesce(p_student_email, ''))), '');
  v_recent_count integer;
  v_requested_count integer;
  v_active_count integer;
  v_unit_price numeric(10,2);
  v_application_id uuid;
  v_public_reference text;
  v_payment_token uuid;
  v_affiliate_id uuid;
begin
  if p_applicant_type not in ('legal_guardian', 'adult_student') then raise exception 'Selecciona quién realiza la matrícula'; end if;
  if char_length(trim(coalesce(p_contact_full_name, ''))) not between 2 and 160 then raise exception 'Indica el nombre y los apellidos'; end if;
  if char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'El correo electrónico no es válido'; end if;
  if char_length(trim(coalesce(p_whatsapp_phone, ''))) not between 7 and 32 then raise exception 'Indica un número de WhatsApp válido'; end if;
  if char_length(trim(coalesce(p_country, ''))) not between 2 and 100 or char_length(trim(coalesce(p_city, ''))) not between 1 and 120 then raise exception 'Indica el país y la ciudad'; end if;
  if p_applicant_type = 'legal_guardian' and (char_length(trim(coalesce(p_student_first_name, ''))) not between 1 and 100 or char_length(trim(coalesce(p_student_last_name, ''))) not between 1 and 120) then raise exception 'Indica el nombre y los apellidos del alumno'; end if;
  if v_student_email is not null and (char_length(v_student_email) > 254 or v_student_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'El correo del alumno no es válido'; end if;
  if not p_privacy_accepted then raise exception 'Debes aceptar la política de privacidad'; end if;
  if not p_terms_accepted then raise exception 'Debes aceptar las condiciones de matrícula'; end if;

  select count(distinct requested_id) into v_requested_count
  from unnest(coalesce(p_subject_ids, '{}'::uuid[])) as requested(requested_id);
  if v_requested_count < 1 then raise exception 'Selecciona al menos una materia'; end if;

  select count(*) into v_active_count from public.subjects s
  where s.active = true and s.id = any(p_subject_ids);
  if v_active_count <> v_requested_count then raise exception 'Una de las materias seleccionadas ya no está disponible'; end if;

  v_unit_price := case when v_requested_count <= 3 then 10 when v_requested_count <= 6 then 8 when v_requested_count <= 10 then 7 else 6 end;

  select count(*) into v_recent_count from public.enrollment_applications e
  where lower(e.contact_email) = v_email and e.created_at >= now() - interval '24 hours';
  if v_recent_count >= 3 then raise exception 'Ya hemos recibido tu solicitud. Contactaremos contigo muy pronto'; end if;

  if p_affiliate_code is not null and trim(p_affiliate_code) <> '' then
    select af.id into v_affiliate_id from public.affiliates af
    where af.code = lower(trim(p_affiliate_code)) and af.status = 'active';
  end if;

  insert into public.enrollment_applications (
    applicant_type, contact_full_name, contact_email, whatsapp_phone, country, city,
    student_first_name, student_last_name, student_email, privacy_accepted_at,
    terms_accepted_at, marketing_consent, marketing_consent_at, source,
    utm_source, utm_medium, utm_campaign, subject_count, unit_price_usd,
    total_price_usd, currency, access_months, affiliate_id
  ) values (
    p_applicant_type, trim(p_contact_full_name), v_email, trim(p_whatsapp_phone), trim(p_country), trim(p_city),
    case when p_applicant_type = 'legal_guardian' then trim(p_student_first_name) else null end,
    case when p_applicant_type = 'legal_guardian' then trim(p_student_last_name) else null end,
    case when p_applicant_type = 'legal_guardian' then v_student_email else null end,
    now(), now(), p_marketing_consent, case when p_marketing_consent then now() else null end,
    left(coalesce(nullif(trim(p_source), ''), 'landing'), 80), left(nullif(trim(p_utm_source), ''), 120),
    left(nullif(trim(p_utm_medium), ''), 120), left(nullif(trim(p_utm_campaign), ''), 120),
    v_requested_count, v_unit_price, v_requested_count * v_unit_price, 'USD', 3, v_affiliate_id
  )
  returning enrollment_applications.id, enrollment_applications.public_reference, enrollment_applications.payment_token
  into v_application_id, v_public_reference, v_payment_token;

  insert into public.enrollment_application_subjects (
    application_id, subject_id, subject_slug, subject_name, subject_icon,
    subject_category, unit_price_usd
  )
  select v_application_id, s.id, s.slug, s.name, s.icon, s.category, v_unit_price
  from public.subjects s where s.active = true and s.id = any(p_subject_ids)
  order by s.sort_order, s.name;

  return query select v_application_id, v_public_reference, v_payment_token,
    v_requested_count::smallint, v_unit_price, v_requested_count * v_unit_price,
    'USD'::text, 3::smallint;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_exercise_attempt(p_exercise_id uuid, p_given_answer jsonb, p_time_spent_seconds integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_exercise record;
  v_is_correct boolean;
  v_given_text text;
  v_correct_text text;
  v_today date := (now() at time zone 'utc')::date;
  v_prev_streak integer;
  v_last_date date;
  v_new_streak integer;
  v_streak_changed boolean := false;
  v_old_xp integer;
  v_new_xp integer;
  v_xp_earned integer := 0;
  v_old_level integer;
  v_new_level integer;
begin
  select e.id, e.type, e.correct_answer, e.explanation, e.diamond_reward, e.active, t.subject_id
  into v_exercise
  from exercises e
  join topics t on t.id = e.topic_id
  where e.id = p_exercise_id;

  if v_exercise.id is null or v_exercise.active = false then
    raise exception 'Ejercicio no disponible';
  end if;

  if not exists (
    select 1 from student_subjects ss
    where ss.student_id = auth.uid() and ss.subject_id = v_exercise.subject_id
      and (ss.expires_at is null or ss.expires_at > now())
  ) then
    raise exception 'No tenes esta materia asignada o tu acceso vencio';
  end if;

  v_given_text := lower(trim(both from (p_given_answer->>'value')));
  v_correct_text := lower(trim(both from (v_exercise.correct_answer->>'value')));
  v_is_correct := v_given_text is not distinct from v_correct_text;

  insert into exercise_attempts (student_id, exercise_id, given_answer, is_correct, diamonds_earned, time_spent_seconds)
  values (auth.uid(), p_exercise_id, p_given_answer, v_is_correct, case when v_is_correct then v_exercise.diamond_reward else 0 end, p_time_spent_seconds);

  select xp_total into v_old_xp from profiles where id = auth.uid();
  v_old_level := student_level(v_old_xp);

  if v_is_correct then
    v_xp_earned := v_exercise.diamond_reward;
    perform set_config('academia.bypass_profile_guard', 'on', true);
    update profiles set diamonds = diamonds + v_exercise.diamond_reward, xp_total = xp_total + v_xp_earned where id = auth.uid();

    insert into diamond_transactions (student_id, amount, reason, reference_type, reference_id)
    values (auth.uid(), v_exercise.diamond_reward, 'exercise_correct', 'exercise', p_exercise_id);
  end if;

  v_new_xp := v_old_xp + v_xp_earned;
  v_new_level := student_level(v_new_xp);

  select current_streak, last_activity_date into v_prev_streak, v_last_date
  from streaks where student_id = auth.uid() for update;

  if not found then
    v_new_streak := 1;
    v_streak_changed := true;
    insert into streaks (student_id, current_streak, longest_streak, last_activity_date)
    values (auth.uid(), v_new_streak, v_new_streak, v_today);
  else
    if v_last_date = v_today then
      v_new_streak := v_prev_streak;
    elsif v_last_date = v_today - 1 then
      v_new_streak := v_prev_streak + 1;
      v_streak_changed := true;
    else
      v_new_streak := 1;
      v_streak_changed := true;
    end if;

    if v_streak_changed then
      update streaks set
        current_streak = v_new_streak,
        longest_streak = greatest(longest_streak, v_new_streak),
        last_activity_date = v_today
      where student_id = auth.uid();
    end if;
  end if;

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'diamonds_earned', case when v_is_correct then v_exercise.diamond_reward else 0 end,
    'correct_answer', v_exercise.correct_answer,
    'explanation', v_exercise.explanation,
    'xp_earned', v_xp_earned,
    'xp_total', v_new_xp,
    'level', v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'level_title', (select title from level_thresholds where level = v_new_level),
    'current_streak', v_new_streak,
    'streak_extended', v_streak_changed and v_new_streak > 1,
    'streak_started', v_streak_changed and v_new_streak = 1 and v_prev_streak is distinct from null
  );
end;
$function$
;

-- Nota: existe un segundo overload mas viejo de submit_enrollment_application
-- (sin p_affiliate_code) que sigue vivo en produccion pero ya no se usa
-- (los call sites pasan siempre el parametro de afiliado). No se replica aca
-- a proposito -- es candidato a limpieza (DROP FUNCTION) en una migracion
-- futura, no forma parte del baseline "deseado" hacia adelante.

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_enrollment_claimed AFTER UPDATE ON public.enrollment_applications FOR EACH ROW EXECUTE FUNCTION handle_enrollment_claimed();

CREATE TRIGGER trg_auto_assign_default_subjects AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION auto_assign_default_subjects();

CREATE TRIGGER trg_guard_profile_self_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION guard_profile_self_update();

CREATE TRIGGER trg_subject_order_paid AFTER INSERT OR UPDATE ON public.subject_orders FOR EACH ROW EXECUTE FUNCTION handle_subject_order_paid();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.achievements enable row level security;
alter table public.admin_activity_log enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliates enable row level security;
alter table public.agenda_events enable row level security;
alter table public.characters enable row level security;
alter table public.deleted_students_backup enable row level security;
alter table public.diamond_transactions enable row level security;
alter table public.enrollment_application_subjects enable row level security;
alter table public.enrollment_applications enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.exercises enable row level security;
alter table public.game_plays enable row level security;
alter table public.households enable row level security;
alter table public.lessons enable row level security;
alter table public.profiles enable row level security;
alter table public.room_layouts enable row level security;
alter table public.store_items enable row level security;
alter table public.streaks enable row level security;
alter table public.student_achievements enable row level security;
alter table public.student_admin_details enable row level security;
alter table public.student_characters enable row level security;
alter table public.student_inventory enable row level security;
alter table public.student_subject_teacher enable row level security;
alter table public.student_subjects enable row level security;
alter table public.subject_order_items enable row level security;
alter table public.subject_orders enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.teachers enable row level security;
alter table public.topic_progress enable row level security;
alter table public.topics enable row level security;

-- ----------------------------------------------------------------------------
-- Politicas RLS
-- ----------------------------------------------------------------------------
create policy "achievements admin write" on public.achievements as permissive for ALL to public using (is_admin()) with check (is_admin());
create policy "achievements read all" on public.achievements as permissive for SELECT to public using ((auth.role() = 'authenticated'::text));
create policy admin_read_activity_log on public.admin_activity_log as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM profiles admin_profile
  WHERE ((admin_profile.id = ( SELECT auth.uid() AS uid)) AND (admin_profile.role = 'admin'::user_role) AND (admin_profile.household_id = admin_activity_log.household_id)))));
create policy "agenda select household" on public.agenda_events as permissive for SELECT to public using ((student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.household_id = my_household()))));
create policy "agenda write household" on public.agenda_events as permissive for ALL to public using ((student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.household_id = my_household())))) with check ((student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.household_id = my_household()))));
create policy "characters read for authenticated" on public.characters as permissive for SELECT to authenticated using ((active = true));
create policy "backup admin select" on public.deleted_students_backup as permissive for SELECT to public using ((is_admin() AND (household_id = my_household())));
create policy "diamonds select self or admin" on public.diamond_transactions as permissive for SELECT to public using (((student_id = auth.uid()) OR is_admin()));
create policy enrollment_subjects_admin_read on public.enrollment_application_subjects as permissive for SELECT to authenticated using (is_admin());
create policy enrollment_admin_read on public.enrollment_applications as permissive for SELECT to authenticated using (is_admin());
create policy enrollment_admin_update on public.enrollment_applications as permissive for UPDATE to authenticated using (is_admin()) with check (is_admin());
create policy "attempts select self or admin" on public.exercise_attempts as permissive for SELECT to public using (((student_id = auth.uid()) OR is_admin()));
create policy "attempts self insert" on public.exercise_attempts as permissive for INSERT to public with check ((student_id = auth.uid()));
create policy "exercises admin write" on public.exercises as permissive for ALL to public using (is_admin()) with check (is_admin());
create policy game_plays_insert_own on public.game_plays as permissive for INSERT to public with check ((student_id = auth.uid()));
create policy game_plays_select_admin on public.game_plays as permissive for SELECT to public using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))));
create policy game_plays_select_own on public.game_plays as permissive for SELECT to public using ((student_id = auth.uid()));
create policy "household admin insert" on public.households as permissive for INSERT to public with check ((owner_id = auth.uid()));
create policy "household admin update" on public.households as permissive for UPDATE to public using ((owner_id = auth.uid()));
create policy "household select admin" on public.households as permissive for SELECT to public using (is_admin());
create policy "household select own" on public.households as permissive for SELECT to public using ((id = my_household()));
create policy "lessons admin write" on public.lessons as permissive for ALL to public using (is_admin()) with check (is_admin());
create policy "profiles admin delete" on public.profiles as permissive for DELETE to public using (is_admin());
create policy "profiles admin insert" on public.profiles as permissive for INSERT to public with check (is_admin());
create policy "profiles admin update" on public.profiles as permissive for UPDATE to public using (is_admin());
create policy "profiles select same household" on public.profiles as permissive for SELECT to public using ((household_id = my_household()));
create policy "profiles self update" on public.profiles as permissive for UPDATE to public using ((id = auth.uid()));
create policy "room insert self" on public.room_layouts as permissive for INSERT to public with check ((student_id = auth.uid()));
create policy "room select self or admin" on public.room_layouts as permissive for SELECT to public using (((student_id = auth.uid()) OR is_admin()));
create policy "room update self" on public.room_layouts as permissive for UPDATE to public using ((student_id = auth.uid()));
create policy "store admin write" on public.store_items as permissive for ALL to public using (is_admin()) with check (is_admin());
create policy "store read all" on public.store_items as permissive for SELECT to public using ((auth.role() = 'authenticated'::text));
create policy "streaks select self or admin" on public.streaks as permissive for SELECT to public using (((student_id = auth.uid()) OR is_admin()));
create policy "streaks write self" on public.streaks as permissive for ALL to public using ((student_id = auth.uid())) with check ((student_id = auth.uid()));
create policy "sa select self or admin" on public.student_achievements as permissive for SELECT to public using (((student_id = auth.uid()) OR is_admin()));
create policy admin_read_student_details on public.student_admin_details as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM (profiles admin_profile
     JOIN profiles student_profile ON ((student_profile.id = student_admin_details.student_id)))
  WHERE ((admin_profile.id = ( SELECT auth.uid() AS uid)) AND (admin_profile.role = 'admin'::user_role) AND (student_profile.role = 'student'::user_role) AND (student_profile.household_id = admin_profile.household_id)))));
create policy "sc select household" on public.student_characters as permissive for SELECT to public using ((student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.household_id = my_household()))));
create policy "sc self insert" on public.student_characters as permissive for INSERT to public with check (((student_id = auth.uid()) OR is_admin()));
create policy "sc self update" on public.student_characters as permissive for UPDATE to public using (((student_id = auth.uid()) OR is_admin()));
create policy "inventory select self or admin" on public.student_inventory as permissive for SELECT to public using (((student_id = auth.uid()) OR is_admin()));
create policy "inventory update self or admin" on public.student_inventory as permissive for UPDATE to public using (((student_id = auth.uid()) OR is_admin()));
create policy sst_select_admin on public.student_subject_teacher as permissive for SELECT to public using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))));
create policy sst_select_own on public.student_subject_teacher as permissive for SELECT to public using ((student_id = auth.uid()));
create policy sst_write_own on public.student_subject_teacher as permissive for ALL to public using ((student_id = auth.uid())) with check ((student_id = auth.uid()));
create policy admin_manage_student_subjects on public.student_subjects as permissive for ALL to public using (is_admin()) with check (is_admin());
create policy student_view_own_subjects on public.student_subjects as permissive for SELECT to public using ((student_id = auth.uid()));
create policy subject_order_items_select_own on public.subject_order_items as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM subject_orders so
  WHERE ((so.id = subject_order_items.order_id) AND ((so.student_id = auth.uid()) OR is_admin())))));
create policy subject_orders_select_own on public.subject_orders as permissive for SELECT to authenticated using (((student_id = auth.uid()) OR is_admin()));
create policy "subjects admin write" on public.subjects as permissive for ALL to public using (is_admin()) with check (is_admin());
create policy "subjects read all" on public.subjects as permissive for SELECT to public using ((auth.role() = 'authenticated'::text));
create policy teacher_subjects_select_all on public.teacher_subjects as permissive for SELECT to public using (true);
create policy teachers_select_all on public.teachers as permissive for SELECT to public using (true);
create policy topic_progress_select_admin on public.topic_progress as permissive for SELECT to public using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))));
create policy topic_progress_select_own on public.topic_progress as permissive for SELECT to public using ((student_id = auth.uid()));
create policy topic_progress_write_own on public.topic_progress as permissive for ALL to public using ((student_id = auth.uid())) with check ((student_id = auth.uid()));
create policy "topics admin write" on public.topics as permissive for ALL to public using (is_admin()) with check (is_admin());
create policy "topics read all" on public.topics as permissive for SELECT to public using ((auth.role() = 'authenticated'::text));
