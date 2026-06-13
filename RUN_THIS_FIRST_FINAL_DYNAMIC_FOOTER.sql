create extension if not exists "pgcrypto";

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price int default 0,
  tier text default 'premium',
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table packages add column if not exists tier text default 'premium';

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

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
  child_name text not null,
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
  created_at timestamptz default now()
);
alter table invitations add column if not exists package_tier text default 'premium';
alter table invitations add column if not exists father_name text;
alter table invitations add column if not exists mother_name text;
alter table invitations add column if not exists family_name text;
alter table invitations add column if not exists closing_text text;
alter table invitations add column if not exists qris_url text;

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text not null,
  created_at timestamptz default now()
);
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text,
  attendance text,
  total_guest text,
  message text,
  created_at timestamptz default now()
);
alter table rsvps add column if not exists message text;
create table if not exists wishes (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text,
  message text,
  created_at timestamptz default now()
);
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text,
  checked_at timestamptz default now()
);
create table if not exists timelines (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  time_text text,
  title text,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table invitations enable row level security;
alter table galleries enable row level security;
alter table guests enable row level security;
alter table rsvps enable row level security;
alter table wishes enable row level security;
alter table checkins enable row level security;
alter table timelines enable row level security;
alter table songs enable row level security;
alter table packages enable row level security;

drop policy if exists "public crud invitations" on invitations;
drop policy if exists "public crud galleries" on galleries;
drop policy if exists "public crud guests" on guests;
drop policy if exists "public crud rsvps" on rsvps;
drop policy if exists "public crud wishes" on wishes;
drop policy if exists "public crud checkins" on checkins;
drop policy if exists "public crud timelines" on timelines;
drop policy if exists "public crud songs" on songs;
drop policy if exists "public crud packages" on packages;

create policy "public crud invitations" on invitations for all using (true) with check (true);
create policy "public crud galleries" on galleries for all using (true) with check (true);
create policy "public crud guests" on guests for all using (true) with check (true);
create policy "public crud rsvps" on rsvps for all using (true) with check (true);
create policy "public crud wishes" on wishes for all using (true) with check (true);
create policy "public crud checkins" on checkins for all using (true) with check (true);
create policy "public crud timelines" on timelines for all using (true) with check (true);
create policy "public crud songs" on songs for all using (true) with check (true);
create policy "public crud packages" on packages for all using (true) with check (true);

insert into packages (id, name, price, tier, is_active)
values
('22222222-2222-4222-8222-222222222221','Basic',50000,'basic',true),
('22222222-2222-4222-8222-222222222222','Premium',100000,'premium',true),
('22222222-2222-4222-8222-222222222223','Custom Premium',250000,'premium',true)
on conflict (id) do update set name=excluded.name, price=excluded.price, tier=excluded.tier, is_active=excluded.is_active;

insert into invitations (
  id, owner_name, owner_email, slug, package_name, package_tier, template, status, payment_status,
  title, child_name, nickname, father_name, mother_name, family_name, closing_text, event_type, event_day, event_date, event_date_text, event_time,
  address_title, address_detail, maps_url, whatsapp, bank_name, bank_account, bank_owner, main_photo, published_at
) values (
  '11111111-1111-4111-8111-111111111111', 'Customer', 'customer@email.com', 'khitan-fathir', 'Premium', 'premium', 'emerald-mosque', 'published', 'paid',
  'Undangan Khitanan', 'FATHIR IBRAHIM MUCHTAR', 'BA''IM', 'Ayahanda', 'Ibunda', 'Keluarga Besar Fathir', 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.', 'Khitanan', 'Minggu', '2026-06-28', '28 Juni 2026', '10.00 WIB s/d selesai',
  'Kepa Duri', 'Jln Duri Intan 5 RT 003/RW 012 No 127, Kec. Kebon Jeruk, Jakarta Barat', 'https://www.google.com/maps', '62895322266675',
  'BCA', '1234567890', 'Briesdy Branstanata', '/fathir.jpeg', now()
) on conflict (slug) do update set
  child_name=excluded.child_name,
  nickname=excluded.nickname,
  father_name=excluded.father_name,
  mother_name=excluded.mother_name,
  family_name=excluded.family_name,
  closing_text=excluded.closing_text,
  status='published',
  package_name=excluded.package_name,
  package_tier=excluded.package_tier,
  template=excluded.template,
  main_photo=excluded.main_photo;

with inv as (select id from invitations where slug = 'khitan-fathir' limit 1)
insert into galleries (invitation_id, image_url, sort_order)
select id, '/fathir.jpeg', 0 from inv
where not exists (select 1 from galleries g where g.invitation_id = (select id from inv) and g.image_url = '/fathir.jpeg');

with inv as (select id from invitations where slug = 'khitan-fathir' limit 1)
insert into guests (invitation_id, guest_name)
select id, 'Bapak Budi' from inv
where not exists (select 1 from guests g where g.invitation_id = (select id from inv) and g.guest_name = 'Bapak Budi');

with inv as (select id from invitations where slug = 'khitan-fathir' limit 1)
insert into timelines (invitation_id, time_text, title, description, sort_order)
select id, x.time_text, x.title, x.description, x.sort_order
from inv, (values
  ('10.00','Pembukaan','Pembukaan acara dan doa bersama',0),
  ('10.30','Acara Khitanan','Prosesi utama khitanan',1),
  ('11.30','Ramah Tamah','Makan bersama dan silaturahmi',2)
) as x(time_text,title,description,sort_order)
where not exists (select 1 from timelines t where t.invitation_id = (select id from inv));

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
