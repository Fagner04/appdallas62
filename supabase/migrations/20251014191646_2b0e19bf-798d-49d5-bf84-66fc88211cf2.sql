-- Criar tabela de cupons de fidelidade
CREATE TABLE public.loyalty_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_appointment_id UUID REFERENCES public.appointments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.loyalty_coupons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cupons de fidelidade
CREATE POLICY "Customers can view their own coupons"
ON public.loyalty_coupons
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = loyalty_coupons.customer_id 
    AND customers.user_id = auth.uid()
  )) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'barber'::app_role)
);

CREATE POLICY "Admins and barbers can manage coupons"
ON public.loyalty_coupons
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'barber'::app_role)
);

-- Criar tabela de histórico de pontos de fidelidade
CREATE TABLE public.loyalty_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  points_change INTEGER NOT NULL,
  points_balance INTEGER NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para histórico
CREATE POLICY "Customers can view their own history"
ON public.loyalty_history
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = loyalty_history.customer_id 
    AND customers.user_id = auth.uid()
  )) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'barber'::app_role)
);

CREATE POLICY "Admins and barbers can manage history"
ON public.loyalty_history
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'barber'::app_role)
);

-- Função para adicionar pontos de fidelidade quando agendamento é completado
CREATE OR REPLACE FUNCTION public.add_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_points INTEGER;
  coupon_code TEXT;
BEGIN
  -- Verifica se o agendamento foi completado
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Incrementa os pontos do cliente
    UPDATE customers 
    SET loyalty_points = COALESCE(loyalty_points, 0) + 1
    WHERE id = NEW.customer_id
    RETURNING loyalty_points INTO new_points;
    
    -- Registra no histórico
    INSERT INTO loyalty_history (customer_id, appointment_id, points_change, points_balance, action, description)
    VALUES (
      NEW.customer_id,
      NEW.id,
      1,
      new_points,
      'earned',
      'Pontos ganhos por agendamento completado'
    );
    
    -- Se atingiu 10 pontos, cria um cupom
    IF new_points >= 10 THEN
      -- Gera código único do cupom
      coupon_code := 'CUPOM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
      
      -- Cria o cupom
      INSERT INTO loyalty_coupons (customer_id, code, expires_at)
      VALUES (
        NEW.customer_id,
        coupon_code,
        NOW() + INTERVAL '90 days'
      );
      
      -- Reseta os pontos para 0
      UPDATE customers 
      SET loyalty_points = 0
      WHERE id = NEW.customer_id;
      
      -- Registra no histórico
      INSERT INTO loyalty_history (customer_id, points_change, points_balance, action, description)
      VALUES (
        NEW.customer_id,
        -10,
        0,
        'coupon_generated',
        'Cupom de fidelidade gerado: ' || coupon_code
      );
      
      -- Envia notificação ao cliente
      INSERT INTO notifications (user_id, title, message, type)
      SELECT 
        c.user_id,
        'Parabéns! 🎉',
        'Você ganhou um cupom de corte grátis! Código: ' || coupon_code || '. Válido por 90 dias.',
        'system'
      FROM customers c
      WHERE c.id = NEW.customer_id AND c.user_id IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para adicionar pontos
CREATE TRIGGER add_loyalty_points_trigger
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.add_loyalty_points();

-- Criar índices para melhor performance
CREATE INDEX idx_loyalty_coupons_customer ON loyalty_coupons(customer_id);
CREATE INDEX idx_loyalty_coupons_code ON loyalty_coupons(code);
CREATE INDEX idx_loyalty_history_customer ON loyalty_history(customer_id);
CREATE INDEX idx_loyalty_history_created ON loyalty_history(created_at DESC);