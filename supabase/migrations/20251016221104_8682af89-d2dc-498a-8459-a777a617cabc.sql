-- Fix barbershops RLS policies to allow authenticated users to create barbershops

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active barbershops" ON barbershops;
DROP POLICY IF EXISTS "Owners can manage their barbershop" ON barbershops;
DROP POLICY IF EXISTS "Users can create barbershops" ON barbershops;

-- Recreate policies with correct logic
CREATE POLICY "Anyone can view active barbershops"
ON barbershops
FOR SELECT
USING (is_active = true);

CREATE POLICY "Owners can manage their barbershop"
ON barbershops
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create barbershops"
ON barbershops
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);