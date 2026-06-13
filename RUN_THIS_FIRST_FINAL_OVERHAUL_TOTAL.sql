
create extension if not exists "pgcrypto";

alter table invitations add column if not exists father_name text;
alter table invitations add column if not exists mother_name text;
alter table invitations add column if not exists family_name text;
alter table invitations add column if not exists closing_text text;
alter table invitations add column if not exists qris_url text;
alter table invitations add column if not exists package_tier text default 'premium';
alter table packages add column if not exists tier text default 'premium';
alter table rsvps add column if not exists message text;

create table if not exists timelines (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  time_text text,
  title text,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table timelines enable row level security;
drop policy if exists "public crud timelines" on timelines;
create policy "public crud timelines" on timelines for all using (true) with check (true);

update invitations
set
  father_name = coalesce(nullif(father_name,''), 'Bpk. Muchtar'),
  mother_name = coalesce(nullif(mother_name,''), 'Ibu Linah Apriyanti'),
  family_name = 'KELUARGA BESAR BAPAK MUCHTAR',
  closing_text = coalesce(nullif(closing_text,''), 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.')
where slug = 'khitan-fathir';

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
