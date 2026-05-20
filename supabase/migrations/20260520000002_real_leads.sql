-- Migration: 20260520000002_real_leads.sql
-- Description: Create real_leads table for tracking personalized contacts

create table if not exists public.real_leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recommendation_id uuid references public.acquisition_recommendations(id) on delete cascade not null,
  name text not null,
  contact_person text,
  phone text not null,
  website text,
  address text,
  why_target text,
  status text default 'new' not null constraint lead_status_check check (status in ('new', 'called', 'scheduled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on real_leads
alter table public.real_leads enable row level security;

-- Create RLS policies for real_leads
drop policy if exists "Allow users to manage their own leads" on public.real_leads;
create policy "Allow users to manage their own leads"
  on public.real_leads for all
  to authenticated, anon
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Auto-update trigger for real_leads
drop trigger if exists trigger_update_real_leads on public.real_leads;
create trigger trigger_update_real_leads
  before update on public.real_leads
  for each row execute function public.handle_updated_at();
