-- Remove barbershop_name from replace_template_variables function
CREATE OR REPLACE FUNCTION public.replace_template_variables(
  template_text text,
  customer_name text,
  barber_name text,
  service_name text,
  appointment_date date,
  appointment_time time without time zone,
  hours_text text DEFAULT NULL
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
  );
END;
$function$;

-- Update send_appointment_confirmation to not use barbershop_name
CREATE OR REPLACE FUNCTION public.send_appointment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
  service_name TEXT;
  settings_enabled BOOLEAN;
  template_record RECORD;
  final_title TEXT;
  final_message TEXT;
BEGIN
  SELECT c.user_id, c.name, c.notifications_enabled
  INTO customer_user_id, customer_name, customer_notifications_enabled
  FROM customers c
  WHERE c.id = NEW.customer_id;

  IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
    RETURN NEW;
  END IF;

  SELECT appointment_confirmation_enabled
  INTO settings_enabled
  FROM notification_settings
  WHERE user_id = customer_user_id;

  IF settings_enabled = FALSE THEN
    RETURN NEW;
  END IF;

  SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;
  SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

  SELECT title, message INTO template_record
  FROM notification_templates
  WHERE type = 'confirmation' AND is_system = true
  LIMIT 1;

  IF template_record IS NOT NULL THEN
    final_title := replace_template_variables(
      template_record.title,
      customer_name,
      barber_name,
      service_name,
      NEW.appointment_date,
      NEW.appointment_time,
      NULL
    );
    final_message := replace_template_variables(
      template_record.message,
      customer_name,
      barber_name,
      service_name,
      NEW.appointment_date,
      NEW.appointment_time,
      NULL
    );
  ELSE
    final_title := 'Agendamento Confirmado';
    final_message := 'Olá ' || customer_name || '! Seu agendamento com ' || COALESCE(barber_name, 'barbeiro') || 
      ' para ' || COALESCE(service_name, 'serviço') || ' foi confirmado para ' || 
      TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.appointment_time || '. Te esperamos!';
  END IF;

  INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
  VALUES (
    customer_user_id,
    final_title,
    final_message,
    'confirmation',
    NEW.id,
    false
  );

  RETURN NEW;
END;
$function$;

-- Update send_appointment_cancellation to not use barbershop_name
CREATE OR REPLACE FUNCTION public.send_appointment_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
  service_name TEXT;
  settings_enabled BOOLEAN;
  template_record RECORD;
  final_title TEXT;
  final_message TEXT;
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    SELECT c.user_id, c.name, c.notifications_enabled
    INTO customer_user_id, customer_name, customer_notifications_enabled
    FROM customers c
    WHERE c.id = NEW.customer_id;

    IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
      RETURN NEW;
    END IF;

    SELECT appointment_cancelled_enabled
    INTO settings_enabled
    FROM notification_settings
    WHERE user_id = customer_user_id;

    IF settings_enabled = FALSE THEN
      RETURN NEW;
    END IF;

    SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;
    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

    SELECT title, message INTO template_record
    FROM notification_templates
    WHERE type = 'cancellation' AND is_system = true
    LIMIT 1;

    IF template_record IS NOT NULL THEN
      final_title := replace_template_variables(
        template_record.title,
        customer_name,
        barber_name,
        service_name,
        NEW.appointment_date,
        NEW.appointment_time,
        NULL
      );
      final_message := replace_template_variables(
        template_record.message,
        customer_name,
        barber_name,
        service_name,
        NEW.appointment_date,
        NEW.appointment_time,
        NULL
      );
    ELSE
      final_title := 'Agendamento Cancelado';
      final_message := 'Olá ' || customer_name || '! Seu agendamento com ' || COALESCE(barber_name, 'barbeiro') || 
        ' para ' || COALESCE(service_name, 'serviço') || ' do dia ' || 
        TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.appointment_time || ' foi cancelado.';
    END IF;

    INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
    VALUES (
      customer_user_id,
      final_title,
      final_message,
      'cancellation',
      NEW.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Update send_appointment_rescheduled to not use barbershop_name
CREATE OR REPLACE FUNCTION public.send_appointment_rescheduled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
  service_name TEXT;
  settings_enabled BOOLEAN;
  template_record RECORD;
  final_title TEXT;
  final_message TEXT;
BEGIN
  IF OLD.appointment_date != NEW.appointment_date OR OLD.appointment_time != NEW.appointment_time THEN
    SELECT c.user_id, c.name, c.notifications_enabled
    INTO customer_user_id, customer_name, customer_notifications_enabled
    FROM customers c
    WHERE c.id = NEW.customer_id;

    IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
      RETURN NEW;
    END IF;

    SELECT appointment_rescheduled_enabled
    INTO settings_enabled
    FROM notification_settings
    WHERE user_id = customer_user_id;

    IF settings_enabled = FALSE THEN
      RETURN NEW;
    END IF;

    SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;
    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

    SELECT title, message INTO template_record
    FROM notification_templates
    WHERE type = 'update' AND is_system = true
    LIMIT 1;

    IF template_record IS NOT NULL THEN
      final_title := replace_template_variables(
        template_record.title,
        customer_name,
        barber_name,
        service_name,
        NEW.appointment_date,
        NEW.appointment_time,
        NULL
      );
      final_message := replace_template_variables(
        template_record.message,
        customer_name,
        barber_name,
        service_name,
        NEW.appointment_date,
        NEW.appointment_time,
        NULL
      );
    ELSE
      final_title := 'Agendamento Reagendado';
      final_message := 'Olá ' || customer_name || '! Seu agendamento com ' || COALESCE(barber_name, 'barbeiro') || 
        ' para ' || COALESCE(service_name, 'serviço') || ' foi reagendado para ' || 
        TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.appointment_time || '. Te esperamos!';
    END IF;

    INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
    VALUES (
      customer_user_id,
      final_title,
      final_message,
      'update',
      NEW.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Update send_appointment_thanks to not use barbershop_name
CREATE OR REPLACE FUNCTION public.send_appointment_thanks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
  template_record RECORD;
  final_title TEXT;
  final_message TEXT;
BEGIN
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    SELECT c.user_id, c.name, c.notifications_enabled
    INTO customer_user_id, customer_name, customer_notifications_enabled
    FROM customers c
    WHERE c.id = NEW.customer_id;

    IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
      RETURN NEW;
    END IF;

    SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;

    SELECT title, message INTO template_record
    FROM notification_templates
    WHERE type = 'system' AND is_system = true
    LIMIT 1;

    IF template_record IS NOT NULL THEN
      final_title := replace_template_variables(
        template_record.title,
        customer_name,
        barber_name,
        NULL,
        NEW.appointment_date,
        NEW.appointment_time,
        NULL
      );
      final_message := replace_template_variables(
        template_record.message,
        customer_name,
        barber_name,
        NULL,
        NEW.appointment_date,
        NEW.appointment_time,
        NULL
      );
    ELSE
      final_title := 'Obrigado pela Visita!';
      final_message := 'Olá ' || customer_name || '! Agradecemos sua visita com ' || COALESCE(barber_name, 'nosso barbeiro') || 
        '. Esperamos vê-lo novamente em breve! Se tiver algum feedback, ficaremos felizes em ouvir.';
    END IF;

    INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
    VALUES (
      customer_user_id,
      final_title,
      final_message,
      'system',
      NEW.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Update existing notification templates to remove {barbershop_name} prefix
UPDATE notification_templates
SET title = REPLACE(title, '{barbershop_name} - ', '')
WHERE is_system = true AND title LIKE '{barbershop_name} - %';