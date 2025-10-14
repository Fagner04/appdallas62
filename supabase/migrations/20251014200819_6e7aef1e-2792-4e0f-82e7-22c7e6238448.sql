-- Criar trigger para adicionar pontos de fidelidade quando agendamento é completado
CREATE TRIGGER trigger_add_loyalty_points
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION add_loyalty_points();
