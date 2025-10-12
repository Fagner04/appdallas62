-- Add rating column to barbers table
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5);

COMMENT ON COLUMN barbers.rating IS 'Avaliação do barbeiro de 0 a 5 estrelas';