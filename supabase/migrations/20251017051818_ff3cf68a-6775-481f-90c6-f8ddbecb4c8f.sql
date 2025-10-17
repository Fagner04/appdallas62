-- Drop the overly permissive policy that allows customers to manage appointments
DROP POLICY IF EXISTS "Barbershop users can manage appointments" ON public.appointments;

-- Create specific UPDATE policy - only admins and barbers can update appointments
CREATE POLICY "Only admins and barbers can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = appointments.barber_id 
    AND barbers.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE barbershops.id = appointments.barbershop_id 
    AND barbershops.owner_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = appointments.barber_id 
    AND barbers.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE barbershops.id = appointments.barbershop_id 
    AND barbershops.owner_id = auth.uid()
  )
);

-- Create specific DELETE policy - only admins and barbershop owners can delete appointments
CREATE POLICY "Only admins and owners can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE barbershops.id = appointments.barbershop_id 
    AND barbershops.owner_id = auth.uid()
  )
);