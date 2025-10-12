-- Create blocked_times table for managing barber schedule blocks
CREATE TABLE IF NOT EXISTS public.blocked_times (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE public.blocked_times IS 'Horários bloqueados pelos barbeiros';
COMMENT ON COLUMN public.blocked_times.barber_id IS 'Barbeiro que tem o horário bloqueado';
COMMENT ON COLUMN public.blocked_times.blocked_date IS 'Data do bloqueio';
COMMENT ON COLUMN public.blocked_times.start_time IS 'Hora de início do bloqueio';
COMMENT ON COLUMN public.blocked_times.end_time IS 'Hora de fim do bloqueio';
COMMENT ON COLUMN public.blocked_times.reason IS 'Motivo do bloqueio (folga, evento, etc)';

-- Enable RLS
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

-- Create policies for blocked_times
CREATE POLICY "Barbers can view their own blocked times"
ON public.blocked_times
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = blocked_times.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Barbers can create their own blocked times"
ON public.blocked_times
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = blocked_times.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Barbers can update their own blocked times"
ON public.blocked_times
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = blocked_times.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Barbers can delete their own blocked times"
ON public.blocked_times
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = blocked_times.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blocked_times_updated_at
BEFORE UPDATE ON public.blocked_times
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_blocked_times_barber_date ON public.blocked_times(barber_id, blocked_date);