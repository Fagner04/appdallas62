-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for owners if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'Owners can insert settings'
  ) THEN
    CREATE POLICY "Owners can insert settings"
    ON public.settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.owner_id = auth.uid()
      ) OR public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- Create UPDATE policy for owners if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'Owners can update settings'
  ) THEN
    CREATE POLICY "Owners can update settings"
    ON public.settings
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.owner_id = auth.uid()
      ) OR public.has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.owner_id = auth.uid()
      ) OR public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- Create DELETE policy for owners if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'Owners can delete settings'
  ) THEN
    CREATE POLICY "Owners can delete settings"
    ON public.settings
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.owner_id = auth.uid()
      ) OR public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- Ensure updated_at is automatically maintained on updates to settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'handle_settings_updated_at'
  ) THEN
    CREATE TRIGGER handle_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;