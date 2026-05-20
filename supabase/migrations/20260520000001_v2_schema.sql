-- Migration: 20260520000001_v2_schema.sql
-- Description: Update schema to G-Radar requirements (KROK 1)

-- 1. Update public_events table
-- Add guid (unique) and is_real_event (boolean) if they do not exist.
-- source_url is already present, but we ensure it exists as text.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_events' AND column_name='guid') THEN
        ALTER TABLE public.public_events ADD COLUMN guid text UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_events' AND column_name='is_real_event') THEN
        ALTER TABLE public.public_events ADD COLUMN is_real_event boolean DEFAULT false NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_events' AND column_name='source_url') THEN
        ALTER TABLE public.public_events ADD COLUMN source_url text;
    END IF;
END $$;

-- 2. Create user_preferences table if not exists
create table if not exists public.user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  monitored_regions text[] default '{}'::text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on user_preferences
alter table public.user_preferences enable row level security;

-- Create RLS policies for user_preferences
-- Drop policies if they already exist to make the script rerun-friendly
drop policy if exists "Allow users to read their own preferences" on public.user_preferences;
create policy "Allow users to read their own preferences"
  on public.user_preferences for select
  to authenticated, anon
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Allow users to insert their own preferences" on public.user_preferences;
create policy "Allow users to insert their own preferences"
  on public.user_preferences for insert
  to authenticated, anon
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Allow users to update their own preferences" on public.user_preferences;
create policy "Allow users to update their own preferences"
  on public.user_preferences for update
  to authenticated, anon
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Auto-update trigger for user_preferences
drop trigger if exists trigger_update_user_preferences on public.user_preferences;
create trigger trigger_update_user_preferences
  before update on public.user_preferences
  for each row execute function public.handle_updated_at();

-- 3. Update acquisition_recommendations table
-- Add feedback column (text, checked values: 'positive'/'negative'/'none')
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acquisition_recommendations' AND column_name='feedback') THEN
        ALTER TABLE public.acquisition_recommendations ADD COLUMN feedback text DEFAULT 'none' NOT NULL CONSTRAINT feedback_check CHECK (feedback IN ('positive', 'negative', 'none'));
    END IF;
END $$;

-- Update existing statuses to prevent constraint failure on migration
UPDATE public.acquisition_recommendations SET status = 'called' WHERE status = 'contacted';
UPDATE public.acquisition_recommendations SET status = 'new' WHERE status = 'ignored';
UPDATE public.acquisition_recommendations SET status = 'scheduled' WHERE status = 'converted';

-- Drop old status check constraint and apply the new status list constraint
ALTER TABLE public.acquisition_recommendations DROP CONSTRAINT IF EXISTS status_check;
ALTER TABLE public.acquisition_recommendations ADD CONSTRAINT status_check CHECK (status IN ('new', 'called', 'scheduled'));
