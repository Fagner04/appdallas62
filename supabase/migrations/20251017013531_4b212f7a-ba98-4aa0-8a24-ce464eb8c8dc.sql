-- Allow barbershop owners, admins and barbers to delete transactions
CREATE POLICY "Barbershop owners, admins and barbers can delete transactions"
ON public.transactions
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'barber'::app_role)
  OR EXISTS (
    SELECT 1 FROM barbershops 
    WHERE barbershops.id = barbershop_id 
      AND barbershops.owner_id = auth.uid()
  )
);
