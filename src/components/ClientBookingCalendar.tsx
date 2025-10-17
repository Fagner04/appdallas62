import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock, Scissors, Ban, Gift, CheckCircle, AlertCircle } from 'lucide-react';
import { useClientServices } from '@/hooks/useServices';
import { useClientBarbers } from '@/hooks/useBarbers';
import { useAvailableTimeSlots, useCreateAppointment } from '@/hooks/useAppointments';
import { useBlockedTimes } from '@/hooks/useBlockedTimes';
import { useClientWorkingHours } from '@/hooks/useWorkingHours';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTodayBrasilia, formatBrasiliaDate, getBrasiliaDate } from '@/lib/timezone';
import { useNavigate } from 'react-router-dom';

interface ClientBookingCalendarProps {
  onSuccess?: () => void;
}

export function ClientBookingCalendar({ onSuccess }: ClientBookingCalendarProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getBrasiliaDate());
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string>('');
  const [validatedCoupon, setValidatedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const { data: services = [], isLoading: servicesLoading } = useClientServices();
  const { data: barbers = [], isLoading: barbersLoading, error: barbersError } = useClientBarbers();
  
  // Get customer profile to get customer_id
  const { data: customerProfile, error: customerError } = useQuery({
    queryKey: ['customer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('id, barbershop_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching customer profile:', error);
        throw error;
      }
      
      if (!data) {
        console.error('Customer not found for user:', user.id);
        throw new Error('Perfil de cliente não encontrado');
      }
      
      if (!data.barbershop_id) {
        console.error('Customer has no barbershop_id:', data);
        throw new Error('Cliente não está associado a nenhuma barbearia');
      }
      
      return data;
    },
    enabled: !!user?.id,
    retry: 2
  });
  
  const selectedServiceData = services.find(s => s.id === selectedService);
  const serviceDuration = selectedServiceData?.duration || 30;

  const formattedDate = selectedDate ? formatBrasiliaDate(selectedDate, 'yyyy-MM-dd') : '';
  
  const { data: availableSlots = [], isLoading: slotsLoading } = useAvailableTimeSlots(
    formattedDate,
    selectedBarber,
    serviceDuration
  );

  // Buscar todos os horários bloqueados do barbeiro para marcar no calendário
  const { data: allBlockedTimes = [] } = useBlockedTimes(selectedBarber);
  
  // Buscar horários bloqueados específicos da data selecionada
  const { data: dateBlockedTimes = [] } = useBlockedTimes(selectedBarber, formattedDate);

  // Buscar horários de funcionamento
  const { data: workingHours = [] } = useClientWorkingHours();

  const createAppointment = useCreateAppointment();

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setValidatedCoupon(null);
      return;
    }

    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('loyalty_coupons')
        .select('*, customer:customers(name)')
        .eq('code', couponCode.toUpperCase())
        .eq('is_redeemed', false)
        .eq('customer_id', customerProfile?.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Cupom inválido ou já utilizado');
        setValidatedCoupon(null);
      } else {
        // Verificar se expirou
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          toast.error('Este cupom expirou');
          setValidatedCoupon(null);
        } else {
          toast.success('Cupom válido! Corte grátis aplicado 🎉');
          setValidatedCoupon(data);
        }
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      toast.error('Erro ao validar cupom');
      setValidatedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

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
      const appointmentData: any = {
        customer_id: customerProfile.id,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: formattedDate,
        appointment_time: selectedTime
      };

      // Se tem cupom válido, marcar para resgatar
      if (validatedCoupon) {
        appointmentData.notes = `Cupom aplicado: ${validatedCoupon.code}`;
      }

      const appointment = await createAppointment.mutateAsync(appointmentData);

      // Se usou cupom, resgatar via Edge Function e vincular ao agendamento
      if (validatedCoupon && appointment?.id) {
        const { data, error } = await supabase.functions.invoke('redeem-coupon', {
          body: { code: validatedCoupon.code, appointment_id: appointment.id },
        });
        if (error || !data?.success) {
          console.error('Erro ao resgatar cupom:', error || data);
          toast.error('Não foi possível resgatar o cupom.');
        }
      }

      // Reset form
      setSelectedTime('');
      setCouponCode('');
      setValidatedCoupon(null);
      toast.success(validatedCoupon ? 'Agendamento realizado! Cupom aplicado 🎉' : 'Agendamento realizado com sucesso!');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Redirect to appointments page after a short delay
      setTimeout(() => {
        navigate('/agendamentos');
      }, 1000);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
  };

  const minDate = getBrasiliaDate();

  // Verificar se uma data tem horários bloqueados
  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allBlockedTimes.some(blocked => blocked.blocked_date === dateStr);
  };

  // Verificar se um dia está fechado (sem expediente)
  const isDayClosed = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0=Domingo, 1=Segunda, etc.
    const dayHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    return dayHours ? !dayHours.is_open : false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Agendar Novo Serviço
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {customerError ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 rounded-full bg-destructive/10 w-16 h-16 mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-destructive">Erro ao carregar perfil</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {customerError.message || 'Não foi possível carregar seu perfil de cliente. Por favor, entre em contato com a administração.'}
              </p>
            </div>
          </div>
        ) : barbers.length === 0 && !barbersLoading ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 rounded-full bg-muted/50 w-16 h-16 mx-auto flex items-center justify-center">
              <Scissors className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nenhum barbeiro disponível</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Você ainda não está associado a uma barbearia ou a barbearia não possui barbeiros cadastrados. 
                Entre em contato com a administração para mais informações.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4 order-2 lg:order-1">
            <Label>Selecione a Data</Label>
            <div className="space-y-2">
              {selectedBarber && allBlockedTimes.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                  <Ban className="h-4 w-4 text-destructive" />
                  <span>Datas com fundo vermelho têm horários bloqueados</span>
                </div>
              )}
              {workingHours.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Datas com fundo laranja são dias sem expediente (fechado)</span>
                </div>
              )}
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < minDate || isDayClosed(date)}
              today={getBrasiliaDate()}
              defaultMonth={getBrasiliaDate()}
              locale={ptBR}
              className="rounded-md border"
              modifiers={{
                blocked: (date) => selectedBarber ? isDateBlocked(date) : false,
                closed: (date) => isDayClosed(date)
              }}
              modifiersClassNames={{
                blocked: "bg-destructive/20 text-destructive font-semibold",
                closed: "bg-amber-500/20 text-amber-700 line-through opacity-50"
              }}
            />
          </div>

          {/* Booking form */}
          <div className="space-y-4 order-1 lg:order-2">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
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

            {/* Mostrar horários bloqueados independente do serviço */}
            {selectedDate && selectedBarber && dateBlockedTimes.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-destructive">
                  <Ban className="h-4 w-4" />
                  Horários Bloqueados
                </Label>
                <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md max-h-[200px] overflow-y-auto">
                  {dateBlockedTimes.map((blocked) => (
                    <div 
                      key={blocked.id} 
                      className="flex flex-col gap-1 p-2 bg-background rounded-md border border-destructive/30"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                        <Clock className="h-3 w-3" />
                        {blocked.start_time} - {blocked.end_time}
                      </div>
                      {blocked.reason && (
                        <p className="text-xs text-muted-foreground pl-5">
                          Motivo: {blocked.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo do Valor */}
            {selectedService && (
              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor do Serviço</span>
                  <span className={validatedCoupon ? 'line-through text-muted-foreground' : 'font-bold text-lg'}>
                    R$ {selectedServiceData?.price}
                  </span>
                </div>
                {validatedCoupon && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-success font-semibold">Desconto (Cupom)</span>
                      <span className="text-success font-semibold">- R$ {selectedServiceData?.price}</span>
                    </div>
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-2xl text-success">R$ 0,00</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cupom de Fidelidade */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="coupon" className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-success" />
                Cupom de Fidelidade (Opcional)
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="coupon"
                    placeholder="Digite o código do cupom"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setValidatedCoupon(null);
                    }}
                    className={validatedCoupon ? 'border-success' : ''}
                  />
                  {validatedCoupon && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateCoupon}
                  disabled={!couponCode.trim() || validatingCoupon}
                >
                  {validatingCoupon ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Validar'
                  )}
                </Button>
              </div>
              {validatedCoupon && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 space-y-2">
                  <p className="text-sm text-success font-semibold flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Cupom válido! Corte grátis aplicado 🎉
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O valor do seu corte será R$ 0,00 com este cupom!
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Tem um cupom? Use-o para ganhar um corte grátis!
              </p>
            </div>

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
        )}
      </CardContent>
    </Card>
  );
}
