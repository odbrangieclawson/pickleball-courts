--
-- Deep Pickleball — Supabase schema for the verified set.
--
-- The rules this project runs on are enforced here as CONSTRAINTS, not left
-- as conventions in application code. A directory whose value is that its
-- numbers are traceable should not be able to store an untraceable number,
-- and a database that permits it will eventually contain one.
--
-- Import order matters: sources, venues, then the child tables.
--   \copy sources FROM 'sources.csv' WITH (FORMAT csv, HEADER true, NULL '')
--   \copy venues  FROM 'venues.csv'  WITH (FORMAT csv, HEADER true, NULL '')
--   ... and so on. NULL '' is REQUIRED — see the note on tri-state booleans.
--

create table if not exists sources (
  url        text primary key,
  publisher  text,
  -- 1 municipal page, 2 municipal open data, 3 rec centre, 4 club,
  -- 5 venue's own site, 6 anything else. Lower is better.
  tier       smallint check (tier between 1 and 6),
  kind       text check (kind in ('data', 'editorial')),
  retrieved  date
);

create table if not exists venues (
  slug            text primary key,
  name            text not null,
  city            text not null,
  state           char(2) not null,
  county          text,
  postal_code     text,
  street_address  text,
  latitude        double precision,
  longitude       double precision,

  -- Court counts. NULL means not verified, never zero (Decision D6).
  total_courts    integer check (total_courts is null or total_courts > 0),
  indoor_courts   integer check (indoor_courts is null or indoor_courts >= 0),
  outdoor_courts  integer check (outdoor_courts is null or outdoor_courts >= 0),

  -- TRI-STATE. true / false / NULL, and NULL is a real answer meaning
  -- "nobody has checked". Never default these to false.
  light           boolean,
  nets_provided   boolean,
  covered         boolean,
  climate_control boolean,
  restroom        boolean,
  pro_shop        boolean,

  surface             text,
  fee_type            text,
  membership_from_usd numeric(10,2),
  drop_in_fee_usd     numeric(10,2),
  pricing_notes       text,
  access_type         text,
  play_format         text,
  venue_type          text,
  level_of_play       text,
  court_availability  text,
  parking             text,
  amenities           text,
  hours_of_operation  text,
  phone               text,
  website             text,

  -- Rule 12: a row is pending until it earns publication.
  status        text not null default 'pending'
                check (status in ('pending', 'published', 'closed')),

  -- Record-level provenance: the WEAKEST of the field-level ones.
  source_url    text references sources(url),
  date_checked  date,
  verified_by   text check (verified_by in
                  ('municipal_source', 'owner_submission', 'staff_check', 'user_report')),

  -- Rule 11 / Decision D7: CLAIMED IS NOT VERIFIED. An owner claim is an
  -- identity event and lives in its own columns. It can never satisfy the
  -- publication constraint below, and it buys no ranking or placement.
  claimed_by_owner boolean not null default false,
  claim_date       date,

  imported_slug text,

  -- Rule 10: no numeric duplicate suffixes. Resolve collisions with real
  -- disambiguation, never with -2.
  constraint slug_no_numeric_suffix check (slug !~ '-[0-9]+$'),

  -- Rule 13: the arithmetic must hold wherever all three are known.
  constraint court_arithmetic check (
    total_courts is null or indoor_courts is null or outdoor_courts is null
    or total_courts = indoor_courts + outdoor_courts
  ),

  -- Rule 7 + Gate 1: a PUBLISHED venue must carry provenance, an address
  -- and a court count. This is the constraint that makes an unsourced
  -- published row impossible rather than merely discouraged.
  constraint published_rows_are_sourced check (
    status <> 'published' or (
      source_url is not null and date_checked is not null
      and verified_by is not null and street_address is not null
      and total_courts is not null
    )
  ),

  -- Import Gate I2: a competitor directory is not a source.
  constraint source_is_not_a_competitor check (
    source_url is null or source_url !~* 'courtsource\.us'
  ),

  constraint checked_not_in_future check (date_checked is null or date_checked <= current_date)
);

--
-- The point of the whole exercise. One row per FACT, not per venue, so the
-- freshness sweep can ask which facts are stale rather than only which
-- venues are.
--
create table if not exists venue_facts (
  venue_slug   text not null references venues(slug) on delete cascade,
  field        text not null,
  value        text,
  source_url   text not null references sources(url),
  date_checked date not null,
  verified_by  text not null check (verified_by in
                 ('municipal_source', 'owner_submission', 'staff_check', 'user_report')),
  source_tier  smallint check (source_tier between 1 and 6),
  evidence     text,
  primary key (venue_slug, field)
);

create index if not exists venue_facts_staleness on venue_facts (date_checked);
create index if not exists venues_city on venues (state, city) where status = 'published';

--
-- Editorial is prose, and Rule 7 binds prose exactly as it binds a court
-- count: a note with no source does not exist.
--
create table if not exists venue_editorial (
  venue_slug   text not null references venues(slug) on delete cascade,
  slot         text not null check (slot in ('description', 'getting_there', 'what_to_expect')),
  body         text not null,
  date_checked date,
  source_urls  text not null check (length(source_urls) > 0),
  primary key (venue_slug, slot)
);

create table if not exists venue_faqs (
  venue_slug text not null references venues(slug) on delete cascade,
  position   integer not null,
  question   text not null,
  answer     text not null,
  primary key (venue_slug, position)
);

--
-- data_verified is DERIVED and is a view, never a stored column. If it were
-- writable, anyone who could claim a venue could set it, and the headline
-- verified count -- the entire value proposition -- becomes whatever venue
-- owners type in. That is Decision D7 expressed in DDL.
--
create or replace view venue_verification as
select
  v.slug,
  v.name,
  v.city,
  v.state,
  v.status = 'published'
    and v.source_url is not null
    and v.date_checked is not null            as data_verified,
  v.claimed_by_owner,
  count(f.field)                              as verified_fact_count,
  min(f.date_checked)                         as oldest_fact_checked,
  max(f.source_tier)                          as worst_source_tier
from venues v
left join venue_facts f on f.venue_slug = v.slug
group by v.slug, v.name, v.city, v.state, v.status, v.source_url,
         v.date_checked, v.claimed_by_owner;

--
-- Row Level Security. Public reads published venues only; nothing is
-- publicly writable, because a public write path is how an unsourced number
-- gets in.
--
alter table venues          enable row level security;
alter table venue_facts     enable row level security;
alter table venue_editorial enable row level security;
alter table venue_faqs      enable row level security;
alter table sources         enable row level security;

create policy "published venues are public"
  on venues for select using (status = 'published');
create policy "facts of published venues are public"
  on venue_facts for select using (
    exists (select 1 from venues v where v.slug = venue_slug and v.status = 'published'));
create policy "editorial of published venues is public"
  on venue_editorial for select using (
    exists (select 1 from venues v where v.slug = venue_slug and v.status = 'published'));
create policy "faqs of published venues are public"
  on venue_faqs for select using (
    exists (select 1 from venues v where v.slug = venue_slug and v.status = 'published'));
create policy "sources are public"
  on sources for select using (true);
