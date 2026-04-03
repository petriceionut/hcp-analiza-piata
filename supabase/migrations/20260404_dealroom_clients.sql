-- dealroom_clients table: stores client/visitor records linked to a dealroom
create table if not exists public.dealroom_clients (
  id             uuid primary key default uuid_generate_v4(),
  dealroom_id    uuid not null references public.dealrooms(id) on delete cascade,
  nume           text not null default '',
  prenume        text not null default '',
  telefon        text not null default '',
  email          text not null default '',
  data_vizionare date,
  ora_vizionare  time,
  created_at     timestamptz not null default now()
);

alter table public.dealroom_clients enable row level security;

create policy "agents_manage_dealroom_clients" on public.dealroom_clients
  for all using (
    exists (
      select 1 from public.dealrooms dr
      where dr.id = dealroom_id and dr.agent_id = auth.uid()
    )
  );
