-- Verificar e corrigir triggers de pontos de fidelidade
-- Primeiro, remover qualquer trigger duplicado
DROP TRIGGER IF EXISTS add_loyalty_points_trigger ON appointments;
DROP TRIGGER IF EXISTS on_appointment_completed ON appointments;

-- Recriar o trigger corretamente (apenas uma vez)
CREATE TRIGGER add_loyalty_points_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION add_loyalty_points();

-- Verificar e remover trigger de remoção de pontos se existir duplicado
DROP TRIGGER IF EXISTS remove_loyalty_points_trigger ON appointments;
DROP TRIGGER IF EXISTS on_appointment_deleted ON appointments;

-- Recriar o trigger de remoção
CREATE TRIGGER remove_loyalty_points_trigger
  BEFORE DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION remove_loyalty_points();