-- Update handle_new_user to use barbershop_id from auth metadata when provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  owner_barbershop_id uuid;
  target_barbershop_id uuid;
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

  -- Prefer barbershop_id provided in metadata when available and valid
  BEGIN
    target_barbershop_id := (NEW.raw_user_meta_data->>'barbershop_id')::uuid;
  EXCEPTION WHEN others THEN
    target_barbershop_id := NULL;
  END;
  
  target_barbershop_id := COALESCE(target_barbershop_id, owner_barbershop_id);
  
  -- Create customer record automatically, linking to target barbershop when available
  INSERT INTO public.customers (user_id, name, phone, email, barbershop_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.email, ''),
    target_barbershop_id
  );
  
  RETURN NEW;
END;
$function$;