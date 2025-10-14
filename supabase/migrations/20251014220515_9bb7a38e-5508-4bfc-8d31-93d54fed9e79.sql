-- Remover triggers que criam notificações duplicadas
-- O frontend já gerencia as notificações corretamente através de useAppointments

DROP TRIGGER IF EXISTS send_appointment_confirmation_trigger ON appointments;
DROP TRIGGER IF EXISTS send_appointment_cancellation_trigger ON appointments;
DROP TRIGGER IF EXISTS send_appointment_rescheduled_trigger ON appointments;
DROP TRIGGER IF EXISTS send_appointment_thanks_trigger ON appointments;

-- Manter apenas as funções caso sejam usadas em outro lugar
-- (Os triggers serão recriados se necessário no futuro)