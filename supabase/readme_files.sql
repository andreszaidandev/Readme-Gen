create extension if not exists "pgcrypto";

create table if not exists public.readme_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  repo_url text not null,
  repo_full_name text,
  repo_info jsonb,
  markdown text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.readme_files to authenticated;

create index if not exists readme_files_user_updated_idx
  on public.readme_files (user_id, updated_at desc);

create or replace function public.set_readme_files_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_readme_files_updated_at on public.readme_files;
create trigger trg_readme_files_updated_at
before update on public.readme_files
for each row
execute function public.set_readme_files_updated_at();

alter table public.readme_files enable row level security;

drop policy if exists "readme_files_select_own" on public.readme_files;
create policy "readme_files_select_own"
on public.readme_files
for select
using (auth.uid() = user_id);

drop policy if exists "readme_files_insert_own" on public.readme_files;
create policy "readme_files_insert_own"
on public.readme_files
for insert
with check (auth.uid() = user_id);

drop policy if exists "readme_files_update_own" on public.readme_files;
create policy "readme_files_update_own"
on public.readme_files
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "readme_files_delete_own" on public.readme_files;
create policy "readme_files_delete_own"
on public.readme_files
for delete
using (auth.uid() = user_id);
