-- HCP Imobiliare — Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CONTRACTS
-- ============================================================
create table if not exists public.contracts (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  tip_contract text not null check (tip_contract in ('mandat_exclusivitate','mediere_vanzare','mediere_inchiriere','antecontract_vanzare')),
  client_data jsonb not null default '{}',
  property_data jsonb not null default '{}',
  derogari text,
  status text not null default 'draft' check (status in ('draft','trimis_client','semnat_client','semnat_ambele','finalizat')),
  pdf_url text,
  client_token text unique default encode(gen_random_bytes(24), 'hex'),
  agent_token text unique default encode(gen_random_bytes(24), 'hex'),
  client_semnatura text,
  agent_semnatura text,
  client_semnat_la timestamptz,
  agent_semnat_la timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for contracts
alter table public.contracts enable row level security;

create policy "agents_manage_own_contracts" on public.contracts
  for all using (agent_id = auth.uid());

create policy "public_read_by_token" on public.contracts
  for select using (
    client_token is not null or agent_token is not null
  );

-- ============================================================
-- DEALROOMS
-- ============================================================
create table if not exists public.dealrooms (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references public.contracts(id) on delete set null,
  agent_id uuid not null references auth.users(id) on delete cascade,
  tip_proprietate text not null default 'apartament',
  adresa_scurta text not null default '',
  status text not null default 'activ' check (status in ('activ','oferta_acceptata','inchis')),
  owner_token text unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dealrooms enable row level security;

create policy "agents_manage_own_dealrooms" on public.dealrooms
  for all using (agent_id = auth.uid());

create policy "public_read_dealrooms" on public.dealrooms
  for select using (true);

-- ============================================================
-- DEALROOM DOCUMENTS
-- ============================================================
create table if not exists public.dealroom_documents (
  id uuid primary key default uuid_generate_v4(),
  dealroom_id uuid not null references public.dealrooms(id) on delete cascade,
  nume text not null,
  url text not null,
  tip text not null default 'application/pdf',
  uploaded_at timestamptz not null default now()
);

alter table public.dealroom_documents enable row level security;

create policy "public_read_docs" on public.dealroom_documents
  for select using (true);

create policy "agents_manage_docs" on public.dealroom_documents
  for all using (
    exists (
      select 1 from public.dealrooms dr
      where dr.id = dealroom_id and dr.agent_id = auth.uid()
    )
  );

-- ============================================================
-- BUYERS
-- ============================================================
create table if not exists public.buyers (
  id uuid primary key default uuid_generate_v4(),
  dealroom_id uuid not null references public.dealrooms(id) on delete cascade,
  nume text not null,
  prenume text not null,
  telefon text not null,
  email text,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  added_at timestamptz not null default now()
);

alter table public.buyers enable row level security;

create policy "public_read_buyers_by_token" on public.buyers
  for select using (true);

create policy "agents_manage_buyers" on public.buyers
  for all using (
    exists (
      select 1 from public.dealrooms dr
      where dr.id = dealroom_id and dr.agent_id = auth.uid()
    )
  );

-- ============================================================
-- OFFERS
-- ============================================================
create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  dealroom_id uuid not null references public.dealrooms(id) on delete cascade,
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  suma numeric not null check (suma > 0),
  mesaj text,
  status text not null default 'in_asteptare' check (status in ('in_asteptare','acceptata','respinsa')),
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "public_read_own_offers" on public.offers
  for select using (true);

create policy "public_insert_offers" on public.offers
  for insert with check (true);

create policy "agents_manage_offers" on public.offers
  for update using (
    exists (
      select 1 from public.dealrooms dr
      where dr.id = dealroom_id and dr.agent_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('dealroom-docs', 'dealroom-docs', true)
on conflict (id) do nothing;

-- Storage policy: anyone can read public docs
create policy "public_read_dealroom_docs" on storage.objects
  for select using (bucket_id = 'dealroom-docs');

create policy "agents_upload_dealroom_docs" on storage.objects
  for insert with check (bucket_id = 'dealroom-docs' and auth.role() = 'authenticated');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contracts_updated_at
  before update on public.contracts
  for each row execute function public.handle_updated_at();

create trigger dealrooms_updated_at
  before update on public.dealrooms
  for each row execute function public.handle_updated_at();
