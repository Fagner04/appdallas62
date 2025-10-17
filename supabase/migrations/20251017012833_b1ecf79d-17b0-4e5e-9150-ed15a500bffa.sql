-- Drop existing INSERT policy for transactions
DROP POLICY IF EXISTS "Admins and barbers can create transactions" ON public.transactions;

-- Create new INSERT policy that allows barbershop owners, admins and barbers
CREATE POLICY "Barbershop owners, admins and barbers can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'barber'::app_role)
  OR EXISTS (
    SELECT 1 FROM barbershops 
    WHERE barbershops.id = barbershop_id 
    AND barbershops.owner_id = auth.uid()
  )
);

-- Also update the SELECT policy to allow owners to view their transactions
DROP POLICY IF EXISTS "Admins and barbers can view transactions" ON public.transactions;

CREATE POLICY "Barbershop owners, admins and barbers can view transactions"
ON public.transactions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'barber'::app_role)
  OR EXISTS (
    SELECT 1 FROM barbershops 
    WHERE barbershops.id = barbershop_id 
    AND barbershops.owner_id = auth.uid()
  )
);