-- Função para remover pontos de fidelidade quando agendamento completado é deletado
CREATE OR REPLACE FUNCTION remove_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verifica se o agendamento estava completado
  IF OLD.status = 'completed' THEN
    -- Decrementa os pontos do cliente
    UPDATE customers 
    SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) - 1)
    WHERE id = OLD.customer_id;
    
    -- Registra no histórico
    INSERT INTO loyalty_history (customer_id, appointment_id, points_change, points_balance, action, description)
    SELECT 
      OLD.customer_id,
      OLD.id,
      -1,
      COALESCE(loyalty_points, 0),
      'removed',
      'Pontos removidos por exclusão de agendamento completado'
    FROM customers
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Criar trigger para remover pontos quando agendamento completado é deletado
CREATE TRIGGER trigger_remove_loyalty_points
  BEFORE DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION remove_loyalty_points();