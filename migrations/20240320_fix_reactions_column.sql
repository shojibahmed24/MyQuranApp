-- Ensure reactions table uses reaction_type instead of phrase
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reactions' AND column_name = 'phrase') THEN
    ALTER TABLE public.reactions RENAME COLUMN phrase TO reaction_type;
  END IF;
END $$;