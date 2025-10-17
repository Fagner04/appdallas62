-- Fix RLS: allow owners to INSERT/UPDATE working hours with proper WITH CHECK
-- INSERT policy
DROP POLICY IF EXISTS "Barbershop owners can insert working hours" ON public.working_hours;
CREATE POLICY "Barbershop owners can insert working hours"
ON public.working_hours
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.barbershops b
    WHERE b.id = working_hours.barbershop_id
      AND b.owner_id = auth.uid()
  )
);

-- UPDATE policy (USING + WITH CHECK)
DROP POLICY IF EXISTS "Barbershop owners can update working hours" ON public.working_hours;
CREATE POLICY "Barbershop owners can update working hours"
ON public.working_hours
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.barbershops b
    WHERE b.id = working_hours.barbershop_id
      AND b.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.barbershops b
    WHERE b.id = working_hours.barbershop_id
      AND b.owner_id = auth.uid()
  )
);
