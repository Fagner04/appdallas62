-- Atualizar clientes sem barbershop_id, associando-os à primeira barbearia encontrada
-- (assumindo que há apenas uma barbearia no sistema)
UPDATE public.customers
SET barbershop_id = (
  SELECT id FROM public.barbershops LIMIT 1
)
WHERE barbershop_id IS NULL AND user_id IS NOT NULL;