-- Adicionar configuração para controlar se clientes podem apagar notificações
INSERT INTO settings (key, value)
VALUES ('client_delete_notifications', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Criar função para verificar se clientes podem apagar notificações
CREATE OR REPLACE FUNCTION public.can_delete_notifications(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean;
  setting_value jsonb;
BEGIN
  -- Admins sempre podem apagar
  is_admin := has_role(_user_id, 'admin'::app_role);
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Verificar configuração para clientes
  SELECT value INTO setting_value
  FROM settings
  WHERE key = 'client_delete_notifications';
  
  -- Se configuração não existe ou está como true, permite
  IF setting_value IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (setting_value::text = 'true');
END;
$$;

-- Atualizar policy de deleção para respeitar a configuração
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (
  auth.uid() = user_id 
  AND can_delete_notifications(auth.uid())
);