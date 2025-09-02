-- db/print_jobs.sql
-- Run this in Supabase SQL editor (or a migration) before using /api/print

-- Storage bucket (create once in the Storage UI or via SQL)
-- select storage.create_bucket('prints', true, 'private'); -- or public as needed

create table if not exists public.print_jobs (
  id bigserial primary key,
  created_at timestamptz default now(),
  project_id text not null,
  project_name text not null,
  file_path text not null,
  file_url text,
  status text not null default 'queued',
  notes text
);

-- RLS policies (adjust to your auth model). For now, allow service role inserts.
-- alter table public.print_jobs enable row level security;
-- create policy "read_print_jobs" on public.print_jobs for select to authenticated using (true);
-- create policy "insert_print_jobs" on public.print_jobs for insert to service_role using (true) with check (true);
