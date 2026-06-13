
create extension if not exists "pgcrypto";

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  owner_name text,
  owner_email text,
  slug text unique not null,
  package_name text default 'Premium',
  package_tier text default 'premium',
  template text default 'blue-islamic',
  status text default 'draft',
  payment_status text default 'unpaid',
  suspended boolean default false,
  title text,
  child_name text,
  nickname text,
  father_name text,
  mother_name text,
  family_name text,
  closing_text text,
  event_type text,
  event_day text,
  event_date date,
  event_date_text text,
  event_time text,
  address_title text,
  address_detail text,
  maps_url text,
  whatsapp text,
  music_title text,
  music_url text,
  bank_name text,
  bank_account text,
  bank_owner text,
  qris_url text,
  custom_domain text,
  subdomain text,
  main_photo text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table invitations add column if not exists package_tier text default 'premium';
alter table invitations add column if not exists father_name text;
alter table invitations add column if not exists mother_name text;
alter table invitations add column if not exists family_name text;
alter table invitations add column if not exists closing_text text;
alter table invitations add column if not exists qris_url text;
alter table invitations add column if not exists updated_at timestamptz default now();

create table if not exists invitation_gallery (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  image_url text not null,
  caption text,
  storage_path text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invitation_timeline (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  time_text text,
  title text,
  description text,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invitation_guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invitation_rsvp (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text,
  attendance text,
  total_guest text,
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invitation_wishes (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text,
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invitation_envelopes (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  bank_name text,
  bank_account text,
  bank_owner text,
  qris_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invitation_music (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  title text not null,
  url text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price int default 0,
  tier text default 'premium',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text,
  checked_at timestamptz default now()
);

-- Migration from old tables if they exist
insert into invitation_gallery (id, invitation_id, image_url, sort_order, created_at)
select id, invitation_id, image_url, sort_order, created_at from galleries
where exists (select 1 from information_schema.tables where table_schema='public' and table_name='galleries')
on conflict (id) do nothing;

insert into invitation_timeline (id, invitation_id, time_text, title, description, sort_order, created_at)
select id, invitation_id, time_text, title, description, sort_order, created_at from timelines
where exists (select 1 from information_schema.tables where table_schema='public' and table_name='timelines')
on conflict (id) do nothing;

insert into invitation_guests (id, invitation_id, guest_name, created_at)
select id, invitation_id, guest_name, created_at from guests
where exists (select 1 from information_schema.tables where table_schema='public' and table_name='guests')
on conflict (id) do nothing;

insert into invitation_rsvp (id, invitation_id, guest_name, attendance, total_guest, message, created_at)
select id, invitation_id, guest_name, attendance, total_guest, message, created_at from rsvps
where exists (select 1 from information_schema.tables where table_schema='public' and table_name='rsvps')
on conflict (id) do nothing;

insert into invitation_wishes (id, invitation_id, guest_name, message, created_at)
select id, invitation_id, guest_name, message, created_at from wishes
where exists (select 1 from information_schema.tables where table_schema='public' and table_name='wishes')
on conflict (id) do nothing;

alter table invitations enable row level security;
alter table invitation_gallery enable row level security;
alter table invitation_timeline enable row level security;
alter table invitation_guests enable row level security;
alter table invitation_rsvp enable row level security;
alter table invitation_wishes enable row level security;
alter table invitation_envelopes enable row level security;
alter table invitation_music enable row level security;
alter table packages enable row level security;
alter table checkins enable row level security;

drop policy if exists "public crud invitations" on invitations;
drop policy if exists "public crud invitation_gallery" on invitation_gallery;
drop policy if exists "public crud invitation_timeline" on invitation_timeline;
drop policy if exists "public crud invitation_guests" on invitation_guests;
drop policy if exists "public crud invitation_rsvp" on invitation_rsvp;
drop policy if exists "public crud invitation_wishes" on invitation_wishes;
drop policy if exists "public crud invitation_envelopes" on invitation_envelopes;
drop policy if exists "public crud invitation_music" on invitation_music;
drop policy if exists "public crud packages" on packages;
drop policy if exists "public crud checkins" on checkins;

create policy "public crud invitations" on invitations for all using (true) with check (true);
create policy "public crud invitation_gallery" on invitation_gallery for all using (true) with check (true);
create policy "public crud invitation_timeline" on invitation_timeline for all using (true) with check (true);
create policy "public crud invitation_guests" on invitation_guests for all using (true) with check (true);
create policy "public crud invitation_rsvp" on invitation_rsvp for all using (true) with check (true);
create policy "public crud invitation_wishes" on invitation_wishes for all using (true) with check (true);
create policy "public crud invitation_envelopes" on invitation_envelopes for all using (true) with check (true);
create policy "public crud invitation_music" on invitation_music for all using (true) with check (true);
create policy "public crud packages" on packages for all using (true) with check (true);
create policy "public crud checkins" on checkins for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('invitation-gallery','invitation-gallery',true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('invitation-music','invitation-music',true)
on conflict (id) do update set public = true;

drop policy if exists "public read invitation files" on storage.objects;
drop policy if exists "public upload invitation files" on storage.objects;
drop policy if exists "public update invitation files" on storage.objects;
drop policy if exists "public delete invitation files" on storage.objects;

create policy "public read invitation files" on storage.objects
for select using (bucket_id in ('invitation-gallery','invitation-music'));

create policy "public upload invitation files" on storage.objects
for insert with check (bucket_id in ('invitation-gallery','invitation-music'));

create policy "public update invitation files" on storage.objects
for update using (bucket_id in ('invitation-gallery','invitation-music'))
with check (bucket_id in ('invitation-gallery','invitation-music'));

create policy "public delete invitation files" on storage.objects
for delete using (bucket_id in ('invitation-gallery','invitation-music'));

update invitations
set family_name = coalesce(nullif(family_name,''),'KELUARGA BESAR BAPAK MUCHTAR')
where slug = 'khitan-fathir';
