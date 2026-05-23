-- Check-in de participantes
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
