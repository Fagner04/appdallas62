-- Habilitar realtime para a tabela appointments
ALTER TABLE public.appointments REPLICA IDENTITY FULL;

-- Adicionar a tabela appointments à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;