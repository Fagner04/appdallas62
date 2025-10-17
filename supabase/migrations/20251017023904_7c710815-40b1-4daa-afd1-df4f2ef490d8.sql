-- Remover o trigger antigo de confirmação
DROP TRIGGER IF EXISTS trigger_appointment_confirmation ON appointments;

-- Recriar o trigger para funcionar tanto em INSERT quanto em UPDATE
CREATE TRIGGER trigger_appointment_confirmation
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION send_appointment_confirmation();

-- Também adicionar trigger para agradecimento
DROP TRIGGER IF EXISTS trigger_appointment_thanks ON appointments;

CREATE TRIGGER trigger_appointment_thanks
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION send_appointment_thanks();