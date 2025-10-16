-- Ensure proper privileges for RLS-protected access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE public.barbershops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.barbershops TO authenticated;