-- Atualizar função de confirmação de agendamento
CREATE OR REPLACE FUNCTION public.send_appointment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
  service_name TEXT;
  settings_enabled BOOLEAN;
BEGIN
  -- Buscar informações do cliente
  SELECT c.user_id, c.name, c.notifications_enabled
  INTO customer_user_id, customer_name, customer_notifications_enabled
  FROM customers c
  WHERE c.id = NEW.customer_id;

  -- Verificar se cliente tem notificações habilitadas
  IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
    RETURN NEW;
  END IF;

  -- Verificar configurações de notificação do usuário
  SELECT appointment_confirmation_enabled
  INTO settings_enabled
  FROM notification_settings
  WHERE user_id = customer_user_id;

  IF settings_enabled = FALSE THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do barbeiro e serviço
  SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;
  SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

  -- Criar notificação de confirmação
  INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
  VALUES (
    customer_user_id,
    'Agendamento Confirmado',
    'Olá ' || customer_name || '! Seu agendamento com ' || COALESCE(barber_name, 'barbeiro') || 
    ' para ' || COALESCE(service_name, 'serviço') || ' foi confirmado para ' || 
    TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.appointment_time || '. Te esperamos!',
    'confirmation',
    NEW.id,
    false
  );

  RETURN NEW;
END;
$function$;

-- Função para enviar notificação de cancelamento
CREATE OR REPLACE FUNCTION public.send_appointment_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
  service_name TEXT;
  settings_enabled BOOLEAN;
BEGIN
  -- Apenas processar se mudou para cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Buscar informações do cliente
    SELECT c.user_id, c.name, c.notifications_enabled
    INTO customer_user_id, customer_name, customer_notifications_enabled
    FROM customers c
    WHERE c.id = NEW.customer_id;

    -- Verificar se cliente tem notificações habilitadas
    IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
      RETURN NEW;
    END IF;

    -- Verificar configurações de notificação do usuário
    SELECT appointment_cancelled_enabled
    INTO settings_enabled
    FROM notification_settings
    WHERE user_id = customer_user_id;

    IF settings_enabled = FALSE THEN
      RETURN NEW;
    END IF;

    -- Buscar nome do barbeiro e serviço
    SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;
    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

    -- Criar notificação de cancelamento
    INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
    VALUES (
      customer_user_id,
      'Agendamento Cancelado',
      'Olá ' || customer_name || '! Seu agendamento com ' || COALESCE(barber_name, 'barbeiro') || 
      ' para ' || COALESCE(service_name, 'serviço') || ' do dia ' || 
      TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.appointment_time || ' foi cancelado.',
      'cancellation',
      NEW.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Função para enviar notificação de reagendamento
CREATE OR REPLACE FUNCTION public.send_appointment_rescheduled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
  service_name TEXT;
  settings_enabled BOOLEAN;
BEGIN
  -- Apenas processar se data ou hora mudou
  IF OLD.appointment_date != NEW.appointment_date OR OLD.appointment_time != NEW.appointment_time THEN
    -- Buscar informações do cliente
    SELECT c.user_id, c.name, c.notifications_enabled
    INTO customer_user_id, customer_name, customer_notifications_enabled
    FROM customers c
    WHERE c.id = NEW.customer_id;

    -- Verificar se cliente tem notificações habilitadas
    IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
      RETURN NEW;
    END IF;

    -- Verificar configurações de notificação do usuário
    SELECT appointment_rescheduled_enabled
    INTO settings_enabled
    FROM notification_settings
    WHERE user_id = customer_user_id;

    IF settings_enabled = FALSE THEN
      RETURN NEW;
    END IF;

    -- Buscar nome do barbeiro e serviço
    SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;
    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

    -- Criar notificação de reagendamento
    INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
    VALUES (
      customer_user_id,
      'Agendamento Reagendado',
      'Olá ' || customer_name || '! Seu agendamento com ' || COALESCE(barber_name, 'barbeiro') || 
      ' para ' || COALESCE(service_name, 'serviço') || ' foi reagendado para ' || 
      TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.appointment_time || '. Te esperamos!',
      'update',
      NEW.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Função para enviar agradecimento pós-visita
CREATE OR REPLACE FUNCTION public.send_appointment_thanks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  customer_user_id UUID;
  customer_name TEXT;
  customer_notifications_enabled BOOLEAN;
  barber_name TEXT;
BEGIN
  -- Apenas processar se mudou para completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Buscar informações do cliente
    SELECT c.user_id, c.name, c.notifications_enabled
    INTO customer_user_id, customer_name, customer_notifications_enabled
    FROM customers c
    WHERE c.id = NEW.customer_id;

    -- Verificar se cliente tem notificações habilitadas
    IF customer_user_id IS NULL OR NOT customer_notifications_enabled THEN
      RETURN NEW;
    END IF;

    -- Buscar nome do barbeiro
    SELECT b.name INTO barber_name FROM barbers b WHERE b.id = NEW.barber_id;

    -- Criar notificação de agradecimento
    INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
    VALUES (
      customer_user_id,
      'Obrigado pela Visita!',
      'Olá ' || customer_name || '! Agradecemos sua visita com ' || COALESCE(barber_name, 'nosso barbeiro') || 
      '. Esperamos vê-lo novamente em breve! Se tiver algum feedback, ficaremos felizes em ouvir.',
      'system',
      NEW.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS on_appointment_cancelled ON appointments;
DROP TRIGGER IF EXISTS on_appointment_rescheduled ON appointments;
DROP TRIGGER IF EXISTS on_appointment_completed ON appointments;

-- Criar trigger para cancelamento
CREATE TRIGGER on_appointment_cancelled
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION send_appointment_cancellation();

-- Criar trigger para reagendamento
CREATE TRIGGER on_appointment_rescheduled
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION send_appointment_rescheduled();

-- Criar trigger para agradecimento pós-visita
CREATE TRIGGER on_appointment_completed
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION send_appointment_thanks();