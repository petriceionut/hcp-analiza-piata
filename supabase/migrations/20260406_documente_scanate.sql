create table if not exists public.documente_scanate (
  id uuid primary key default uuid_generate_v4(),
  dealroom_id uuid not null references public.dealrooms(id) on delete cascade,
  agent_id uuid not null references auth.users(id),
  file_url text not null,
  file_name text not null,
  nr_pagini int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.documente_scanate enable row level security;

create policy "agents_manage_documente_scanate" on public.documente_scanate
  for all using (agent_id = auth.uid());

-- Storage bucket: documente-proprietati (run once, idempotent via service role)
-- insert into storage.buckets (id, name, public) values ('documente-proprietati', 'documente-proprietati', false) on conflict (id) do nothing;
