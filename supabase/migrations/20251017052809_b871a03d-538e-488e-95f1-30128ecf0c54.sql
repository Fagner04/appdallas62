-- Helper to evaluate boolean settings safely
CREATE OR REPLACE FUNCTION public.is_true_setting(_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE 
      WHEN jsonb_typeof(value) = 'boolean' THEN (value)::boolean
      WHEN value::text IN ('true','"true"') THEN true
      ELSE false
    END, false)
  FROM public.settings
  WHERE key = _key
  LIMIT 1
$$;

-- Policy: allow customers to update ONLY to cancel when feature enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'appointments' 
      AND policyname = 'Customers can cancel their appointments when enabled'
  ) THEN
    CREATE POLICY "Customers can cancel their appointments when enabled"
    ON public.appointments
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = appointments.customer_id AND c.user_id = auth.uid()
      )
      AND public.is_true_setting('client_cancel_appointments')
    )
    WITH CHECK (
      status = 'cancelled' AND
      EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = appointments.customer_id AND c.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Trigger to restrict what customers can change on appointments updates
CREATE OR REPLACE FUNCTION public.restrict_customer_appointment_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  is_admin boolean;
  is_barber boolean;
  is_owner boolean;
  is_customer boolean;
BEGIN
  -- Staff (admin/barber/owner) bypass these restrictions
  is_admin := public.has_role(auth.uid(), 'admin');
  is_barber := EXISTS (
    SELECT 1 FROM public.barbers b
    WHERE b.id = NEW.barber_id AND b.user_id = auth.uid()
  );
  is_owner := EXISTS (
    SELECT 1 FROM public.barbershops s
    WHERE s.id = NEW.barbershop_id AND s.owner_id = auth.uid()
  );
  is_customer := EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = NEW.customer_id AND c.user_id = auth.uid()
  );

  IF is_admin OR is_barber OR is_owner THEN
    RETURN NEW;
  END IF;

  IF is_customer THEN
    -- Feature must be enabled
    IF NOT public.is_true_setting('client_cancel_appointments') THEN
      RAISE EXCEPTION 'Cancelamento por cliente desabilitado';
    END IF;

    -- Only allow transition to cancelled from pending/confirmed
    IF NOT (NEW.status = 'cancelled' AND OLD.status IN ('pending','confirmed')) THEN
      RAISE EXCEPTION 'Clientes só podem cancelar agendamentos pendentes/confirmados';
    END IF;

    -- Prevent changes to other fields
    IF NEW.customer_id <> OLD.customer_id OR
       NEW.barber_id <> OLD.barber_id OR
       COALESCE(NEW.barbershop_id, gen_random_uuid()) <> COALESCE(OLD.barbershop_id, gen_random_uuid()) OR
       NEW.service_id <> OLD.service_id OR
       NEW.appointment_date <> OLD.appointment_date OR
       NEW.appointment_time <> OLD.appointment_time OR
       COALESCE(NEW.notes,'') <> COALESCE(OLD.notes,'') THEN
      RAISE EXCEPTION 'Não é permitido alterar campos além do status';
    END IF;

    RETURN NEW;
  END IF;

  -- Others: deny
  RAISE EXCEPTION 'Sem permissão para atualizar agendamento';
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'restrict_customer_appointment_updates_trg'
  ) THEN
    CREATE TRIGGER restrict_customer_appointment_updates_trg
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.restrict_customer_appointment_updates();
  END IF;
END $$;