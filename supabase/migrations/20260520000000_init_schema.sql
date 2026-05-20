-- Migration: 20260520000000_init_schema.sql
-- Description: Initialize Generali Radar database tables, RLS policies, and seed products

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Create generali_products table
create table public.generali_products (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  name text not null,
  category text not null,
  description text not null,
  key_benefits text[] not null,
  target_audience text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on generali_products
alter table public.generali_products enable row level security;

-- Policies for generali_products
create policy "Allow read access to all users"
  on public.generali_products for select
  to authenticated, anon
  using (true);

-- 2. Create public_events table
create table public.public_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  source_url text,
  region text not null,
  category text not null,
  published_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on public_events
alter table public.public_events enable row level security;

-- Policies for public_events
create policy "Allow read access to all users"
  on public.public_events for select
  to authenticated, anon
  using (true);

create policy "Allow system service to insert events"
  on public.public_events for insert
  to authenticated, anon, service_role
  with check (true);

-- 3. Create acquisition_recommendations table
create table public.acquisition_recommendations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.public_events(id) on delete cascade not null,
  product_id uuid references public.generali_products(id) on delete cascade not null,
  agent_id uuid default auth.uid(),
  why_opportunity text not null,
  call_script text not null,
  status text default 'new' not null constraint status_check check (status in ('new', 'contacted', 'ignored', 'converted')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on acquisition_recommendations
alter table public.acquisition_recommendations enable row level security;

-- Policies for acquisition_recommendations (Agent-private data)
create policy "Allow agents to view their own recommendations"
  on public.acquisition_recommendations for select
  to authenticated, anon
  using (auth.uid() = agent_id or agent_id is null);

create policy "Allow agents to insert recommendations"
  on public.acquisition_recommendations for insert
  to authenticated, anon
  with check (auth.uid() = agent_id or agent_id is null);

create policy "Allow agents to update their own recommendations"
  on public.acquisition_recommendations for update
  to authenticated, anon
  using (auth.uid() = agent_id or agent_id is null)
  with check (auth.uid() = agent_id or agent_id is null);

-- 4. Auto-update updated_at trigger helper
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_recommendations
  before update on public.acquisition_recommendations
  for each row execute function public.handle_updated_at();

-- 5. Seed initial Generali products
insert into public.generali_products (code, name, category, description, key_benefits, target_audience) values
(
  'DOMOV_KLASIK',
  'Pojištění domova a stavby',
  'Majetek',
  'Komplexní pojištění rodinného domu, bytu, chaty nebo domácnosti. Kryje živelní škody, krádeže i odpovědnost za škody.',
  array[
    'Krytí všech standardních živelních rizik v základní ceně.',
    'Pojištění odpovědnosti z držby nemovitosti s celosvětovým krytím.',
    'Asistenční služby 24/7 pro případ havárie (instalatér, zámečník atd.).',
    'Možnost připojistit zahradní architekturu nebo bazén.'
  ],
  'Majitelé rodinných domů, bytů v osobním vlastnictví a rekreačních objektů.'
),
(
  'AUTO_COMPLEX',
  'Pojištění vozidel (POV + HAV)',
  'Auto',
  'Povinné ručení a havarijní pojištění s volitelnými připojištěními na míru (skla, střet se zvěří, vandalismus, odtah).',
  array[
    'Limit plnění povinného ručení až do výše 150 mil. Kč.',
    'Garance mobility - zapůjčení náhradního vozidla zdarma při nehodě.',
    'Připojištění střetu se zvěří a poškození kabelů hlodavci bez vlivu na bonus.',
    'Rychlá likvidace škod přes mobilní aplikaci.'
  ],
  'Aktivní řidiči, majitelé nových i ojetých osobních automobilů.'
),
(
  'ZIVOT_PROFIT',
  'Životní pojištění a ochrana příjmu',
  'Život',
  'Flexibilní pojištění, které chrání klienta a jeho rodinu při ztrátě příjmu, vážné nemoci, invaliditě nebo úrazu.',
  array[
    'Výplata peněz přímo na účet pro pokrytí životních nákladů při neschopnosti.',
    'Krytí více než 60 závažných onemocnění včetně rakoviny a infarktu.',
    'Možnost daňových úlev (odpočet ze základu daně).',
    'Bonus za věrnost a zdravý životní styl.'
  ],
  'Živitelé rodiny, lidé s hypotékou nebo vysokými finančními závazky a OSVČ.'
),
(
  'ODPOVEDNOST_BEX',
  'Pojištění odpovědnosti v běžném životě',
  'Odpovědnost',
  'Pojištění pro případ, že vy, vaše děti nebo domácí mazlíčci způsobíte někomu jinému škodu na zdraví či majetku.',
  array[
    'Vztahuje se na škody způsobené při sportu (lyžování, cyklistika atd.).',
    'Kryje škody způsobené domácími zvířaty (např. pokousání psem).',
    'Platnost po celé Evropě a v zámoří.',
    'Nízké pojistné s vysokými limity plnění.'
  ],
  'Rodiny s dětmi, majitelé psů a koček, aktivní sportovci.'
),
(
  'PODNIKATEL_PRO',
  'Pojištění podnikatelů a živnostníků',
  'Podnikání',
  'Ochrana majetku firmy, zásob, strojů a pojištění provozní odpovědnosti za škody způsobené třetím osobám.',
  array[
    'Pojištění přerušení provozu (krytí fixních nákladů při nucené odstávce).',
    'Krytí profesní odpovědnosti na míru pro řemeslníky, lékaře, IT atd.',
    'Pojištění elektroniky a přenosných zařízení i mimo provozovnu.',
    'Jednoduché sjednání bez složitého oceňování pro malé živnostníky.'
  ],
  'Drobní živnostníci, řemeslníci, majitelé obchodů, restaurací a menších kanceláří.'
)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  key_benefits = excluded.key_benefits,
  target_audience = excluded.target_audience;
