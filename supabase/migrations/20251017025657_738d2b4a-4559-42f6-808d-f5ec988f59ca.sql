-- Add WhatsApp notification fields to notification_settings table
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_phone text;

-- Add comment to explain the fields
COMMENT ON COLUMN notification_settings.whatsapp_enabled IS 'Enable WhatsApp notifications for this user';
COMMENT ON COLUMN notification_settings.whatsapp_phone IS 'WhatsApp phone number in format +5562999999999';