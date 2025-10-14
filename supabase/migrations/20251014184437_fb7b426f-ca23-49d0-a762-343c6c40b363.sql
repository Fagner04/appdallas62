-- Criar tabela de templates de notificações personalizados
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'Bell',
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Everyone can view templates"
ON public.notification_templates
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage templates"
ON public.notification_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir templates padrão do sistema
INSERT INTO public.notification_templates (type, title, description, message, icon, is_system) VALUES
('confirmation', 'Confirmação de Agendamento', 'Enviada imediatamente após o agendamento', 'Olá {nome_cliente}! Seu agendamento com {nome_barbeiro} para {servico} foi confirmado para o dia {data} às {horario}. Te esperamos!', 'Calendar', true),
('reminder', 'Lembrete 1h Antes', 'Enviada 1 hora antes do horário agendado', 'Olá {nome_cliente}! Lembrando que seu agendamento com {nome_barbeiro} para {servico} é em 1 hora ({horario}). Te esperamos!', 'Bell', true),
('thanks', 'Agradecimento Pós-Visita', 'Enviada após a conclusão do atendimento', 'Olá {nome_cliente}! Obrigado pela visita! Esperamos ter proporcionado uma excelente experiência. Até a próxima!', 'CheckCircle2', true),
('promotion', 'Promoções e Ofertas', 'Enviada periodicamente com ofertas especiais', 'Olá {nome_cliente}! Confira nossas promoções especiais! Entre em contato para mais informações.', 'Sparkles', true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();