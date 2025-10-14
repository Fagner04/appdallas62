-- Atualizar templates com variáveis corretas
UPDATE notification_templates 
SET 
  message = 'Olá {customer_name}! Seu agendamento com {barber_name} para {service_name} foi confirmado para o dia {appointment_date} às {appointment_time}. Te esperamos!'
WHERE type = 'confirmation' AND is_system = true;

UPDATE notification_templates 
SET 
  message = 'Olá {customer_name}! Lembrando que seu agendamento com {barber_name} para {service_name} é {hours_text} ({appointment_time}). Te esperamos!'
WHERE type = 'reminder' AND is_system = true;

UPDATE notification_templates 
SET 
  message = 'Olá {customer_name}! Seu agendamento com {barber_name} para {service_name} foi reagendado para {appointment_date} às {appointment_time}. Te esperamos!'
WHERE type = 'update' AND is_system = true;

UPDATE notification_templates 
SET 
  message = 'Olá {customer_name}! Seu agendamento com {barber_name} para {service_name} do dia {appointment_date} às {appointment_time} foi cancelado.'
WHERE type = 'cancellation' AND is_system = true;

UPDATE notification_templates 
SET 
  message = 'Olá {customer_name}! Agradecemos sua visita com {barber_name}. Esperamos vê-lo novamente em breve! Se tiver algum feedback, ficaremos felizes em ouvir.'
WHERE type = 'system' AND is_system = true;