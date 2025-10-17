-- Remove the old version of replace_template_variables function
-- Keep only the version with barbershop_name parameter

DROP FUNCTION IF EXISTS public.replace_template_variables(text, text, text, text, date, time without time zone, text);

-- Recreate the complete version to ensure it's correct
CREATE OR REPLACE FUNCTION public.replace_template_variables(
  template_text text, 
  customer_name text, 
  barber_name text, 
  service_name text, 
  appointment_date date, 
  appointment_time time without time zone, 
  hours_text text DEFAULT NULL::text,
  barbershop_name text DEFAULT NULL::text
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                template_text,
                '{customer_name}', COALESCE(customer_name, 'Cliente')
              ),
              '{barber_name}', COALESCE(barber_name, 'barbeiro')
            ),
            '{service_name}', COALESCE(service_name, 'serviço')
          ),
          '{appointment_date}', TO_CHAR(appointment_date, 'DD/MM/YYYY')
        ),
        '{appointment_time}', appointment_time::TEXT
      ),
      '{hours_text}', COALESCE(hours_text, '')
    ),
    '{barbershop_name}', COALESCE(barbershop_name, 'Barbearia')
  );
END;
$function$;