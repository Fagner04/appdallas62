import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock, Scissors, Ban } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useBarbers } from '@/hooks/useBarbers';
import { useAvailableTimeSlots, useCreateAppointment } from '@/hooks/useAppointments';
import { useBlockedTimes } from '@/hooks/useBlockedTimes';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTodayBrasilia, formatBrasiliaDate } from '@/lib/timezone';

export function ClientBookingCalendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: barbers = [], isLoading: barbersLoading } = useBarbers();
  
  // Get customer profile to get customer_id
  const { data: customerProfile } = useQuery({
    queryKey: ['customer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });
  
  const selectedServiceData = services.find(s => s.id === selectedService);
  const serviceDuration = selectedServiceData?.duration || 30;

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  const { data: availableSlots = [], isLoading: slotsLoading } = useAvailableTimeSlots(
    formattedDate,
    selectedBarber,
    serviceDuration
  );

  // Buscar horários bloqueados do barbeiro selecionado
  const { data: blockedTimes = [] } = useBlockedTimes(selectedBarber);

  const createAppointment = useCreateAppointment();

  const handleBooking = async () => {
    if (!selectedDate || !selectedService || !selectedBarber || !selectedTime) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (!customerProfile?.id) {
      toast.error('Erro ao identificar cliente');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        customer_id: customerProfile.id,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: formattedDate,
        appointment_time: selectedTime
      });

      // Reset form
      setSelectedTime('');
      toast.success('Agendamento realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
  };

  const minDate = new Date();

  // Verificar se uma data tem horários bloqueados
  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedTimes.some(blocked => blocked.blocked_date === dateStr);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Agendar Novo Serviço
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4">
            <Label>Selecione a Data</Label>
            {selectedBarber && blockedTimes.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                <Ban className="h-4 w-4 text-destructive" />
                <span>Datas com fundo vermelho têm horários bloqueados</span>
              </div>
            )}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < minDate}
              locale={ptBR}
              className="rounded-md border"
              modifiers={{
                blocked: (date) => selectedBarber ? isDateBlocked(date) : false
              }}
              modifiersClassNames={{
                blocked: "bg-destructive/20 text-destructive font-semibold"
              }}
            />
          </div>

          {/* Booking form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicesLoading ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price} ({service.duration}min)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barber">Barbeiro</Label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger id="barber">
                  <SelectValue placeholder="Selecione um barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbersLoading ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedDate && selectedBarber && selectedService && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários Disponíveis em {formatBrasiliaDate(selectedDate, 'dd/MM/yyyy')}
                </Label>
                {slotsLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground border rounded-md">
                    Nenhum horário disponível nesta data
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                        className="text-sm"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleBooking}
              disabled={!selectedDate || !selectedService || !selectedBarber || !selectedTime || createAppointment.isPending}
              className="w-full"
              size="lg"
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
