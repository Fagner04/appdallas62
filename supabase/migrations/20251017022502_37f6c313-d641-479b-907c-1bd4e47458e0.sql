-- Habilitar realtime para a tabela customers
ALTER TABLE public.customers REPLICA IDENTITY FULL;

-- Adicionar tabela customers à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;