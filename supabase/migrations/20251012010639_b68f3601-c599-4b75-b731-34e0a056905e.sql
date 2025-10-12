-- Remove unique constraint from barbers.user_id to allow multiple barbers
ALTER TABLE barbers DROP CONSTRAINT IF EXISTS barbers_user_id_key;

-- Make user_id nullable since not all barbers need to be system users
ALTER TABLE barbers ALTER COLUMN user_id DROP NOT NULL;

-- Add a name column to identify barbers
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Barbeiro';

-- Update existing barbers to have a default name
UPDATE barbers SET name = 'Barbeiro ' || SUBSTRING(id::text, 1, 8) WHERE name = 'Barbeiro';