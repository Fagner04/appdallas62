-- Create barbershops table
CREATE TABLE public.barbershops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for barbershops
CREATE POLICY "Anyone can view active barbershops"
ON public.barbershops FOR SELECT
USING (is_active = true);

CREATE POLICY "Owners can manage their barbershop"
ON public.barbershops FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create barbershops"
ON public.barbershops FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Add barbershop_id to existing tables
ALTER TABLE public.barbers ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.working_hours ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.blocked_times ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;

-- Create function to check barbershop access
CREATE OR REPLACE FUNCTION public.has_barbershop_access(_user_id uuid, _barbershop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Owner has access
    SELECT 1 FROM barbershops WHERE id = _barbershop_id AND owner_id = _user_id
    UNION
    -- Barber has access
    SELECT 1 FROM barbers WHERE barbershop_id = _barbershop_id AND user_id = _user_id
    UNION
    -- Customer has access
    SELECT 1 FROM customers WHERE barbershop_id = _barbershop_id AND user_id = _user_id
  )
$$;

-- Update RLS policies for barbers
DROP POLICY IF EXISTS "Admins can manage barbers" ON public.barbers;
DROP POLICY IF EXISTS "Everyone can view active barbers" ON public.barbers;

CREATE POLICY "Barbershop owners can manage their barbers"
ON public.barbers FOR ALL
USING (
  EXISTS (SELECT 1 FROM barbershops WHERE id = barbers.barbershop_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can view barbers from their barbershop"
ON public.barbers FOR SELECT
USING (
  (is_active = true AND barbershop_id IS NOT NULL) 
  OR has_barbershop_access(auth.uid(), barbershop_id)
);

-- Update RLS policies for customers
DROP POLICY IF EXISTS "Admins and barbers can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Barbers and admins can view customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customer record" ON public.customers;

CREATE POLICY "Barbershop owners and barbers can manage customers"
ON public.customers FOR ALL
USING (
  EXISTS (SELECT 1 FROM barbershops WHERE id = customers.barbershop_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM barbers WHERE barbershop_id = customers.barbershop_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view customers from their barbershop"
ON public.customers FOR SELECT
USING (
  auth.uid() = user_id OR has_barbershop_access(auth.uid(), barbershop_id)
);

CREATE POLICY "Users can create customer record in barbershop"
ON public.customers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for services
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Everyone can view active services" ON public.services;

CREATE POLICY "Barbershop owners can manage services"
ON public.services FOR ALL
USING (
  EXISTS (SELECT 1 FROM barbershops WHERE id = services.barbershop_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can view services from barbershops"
ON public.services FOR SELECT
USING (
  (is_active = true AND barbershop_id IS NOT NULL)
  OR has_barbershop_access(auth.uid(), barbershop_id)
);

-- Update RLS policies for appointments
DROP POLICY IF EXISTS "Barbers and admins can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Customers can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

CREATE POLICY "Barbershop users can manage appointments"
ON public.appointments FOR ALL
USING (
  has_barbershop_access(auth.uid(), barbershop_id)
);

CREATE POLICY "Customers can create appointments in their barbershop"
ON public.appointments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM customers WHERE id = appointments.customer_id AND user_id = auth.uid() AND barbershop_id = appointments.barbershop_id)
);

CREATE POLICY "Users can view appointments from their barbershop"
ON public.appointments FOR SELECT
USING (
  has_barbershop_access(auth.uid(), barbershop_id)
);

-- Update RLS policies for working_hours
DROP POLICY IF EXISTS "Anyone can read working hours" ON public.working_hours;
DROP POLICY IF EXISTS "Only admins can modify working hours" ON public.working_hours;

CREATE POLICY "Users can view working hours from barbershops"
ON public.working_hours FOR SELECT
USING (barbershop_id IS NOT NULL OR has_barbershop_access(auth.uid(), barbershop_id));

CREATE POLICY "Barbershop owners can manage working hours"
ON public.working_hours FOR ALL
USING (
  EXISTS (SELECT 1 FROM barbershops WHERE id = working_hours.barbershop_id AND owner_id = auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_barbershops_updated_at
BEFORE UPDATE ON public.barbershops
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();