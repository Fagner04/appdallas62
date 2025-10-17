-- Update existing customers without barbershop_id to link to their owner's barbershop
UPDATE customers c
SET barbershop_id = b.id
FROM barbershops b
WHERE c.user_id = b.owner_id 
  AND c.barbershop_id IS NULL;

-- Update the handle_new_user function to also check if user is creating a barbershop owner account
-- and link to the barbershop if it exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  owner_barbershop_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Assign customer role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  -- Check if user is owner of a barbershop
  SELECT id INTO owner_barbershop_id
  FROM public.barbershops
  WHERE owner_id = NEW.id
  LIMIT 1;
  
  -- Create customer record automatically with barbershop_id if user owns a barbershop
  INSERT INTO public.customers (user_id, name, phone, email, barbershop_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.email, ''),
    owner_barbershop_id
  );
  
  RETURN NEW;
END;
$$;