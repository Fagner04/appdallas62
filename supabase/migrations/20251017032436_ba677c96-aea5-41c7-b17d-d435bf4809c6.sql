-- Adicionar colunas para configuração do WhatsApp Business API
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS whatsapp_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT;