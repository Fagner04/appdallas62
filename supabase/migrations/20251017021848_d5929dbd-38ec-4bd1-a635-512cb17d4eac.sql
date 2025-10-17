-- Adicionar política RLS para permitir que clientes atualizem seus próprios dados
CREATE POLICY "Users can update their own customer record"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);