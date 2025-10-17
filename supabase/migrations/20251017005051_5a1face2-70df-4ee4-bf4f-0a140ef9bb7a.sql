-- Remove política ALL existente
DROP POLICY IF EXISTS "Barbershop owners can manage services" ON public.services;

-- Cria políticas específicas com WITH CHECK para INSERT
CREATE POLICY "Barbershop owners can insert services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = barbershop_id 
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Barbershop owners can update services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = barbershop_id 
    AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = barbershop_id 
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Barbershop owners can delete services"
ON public.services
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = barbershop_id 
    AND owner_id = auth.uid()
  )
);