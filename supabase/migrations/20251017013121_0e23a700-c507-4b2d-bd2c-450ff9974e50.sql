-- Fix unique constraint for working_hours to be per barbershop
DO $$ BEGIN
  -- Drop old unique constraint if exists (name from logs)
  ALTER TABLE public.working_hours DROP CONSTRAINT IF EXISTS working_hours_day_of_week_key;
EXCEPTION WHEN undefined_object THEN
  -- ignore if not exists
  NULL;
END $$;

-- Create unique index on (barbershop_id, day_of_week) allowing multiple shops
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS working_hours_unique_barbershop_day
  ON public.working_hours (barbershop_id, day_of_week)
  WHERE barbershop_id IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Optional: ensure day_of_week is within 0-6 using a trigger (avoid CHECK time immutability issues not needed here)
-- Skipping additional constraints to keep change minimal.
