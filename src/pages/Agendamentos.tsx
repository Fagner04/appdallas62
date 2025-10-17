import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Clock, User, Scissors, Pencil, Trash2, Ban, Lock, Unlock, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, useAvailableTimeSlots, AppointmentWithDetails } from '@/hooks/useAppointments';
import { useCustomers } from '@/hooks/useCustomers';
import { useBarbers, useClientBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useBlockedTimes, useCreateBlockedTime, useDeleteBlockedTime } from '@/hooks/useBlockedTimes';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayBrasilia, formatBrasiliaDate, toBrasiliaTime } from '@/lib/timezone';
import { DigitalClock } from '@/components/DigitalClock';
import { supabase } from '@/integrations/supabase/client';

export default function Agendamentos() {
  const { user } = useAuth();
  const today = getTodayBrasilia();
  const [selectedDate, setSelectedDate] = useState(today);
  const [open, setOpen] = useState(false);
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithDetails | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    date: today,
    time: '',
    service_id: '',
    barber_id: '',
    notes: '',
  });
  const [blockFormData, setBlockFormData] = useState({
    barber_id: '',
    blocked_date: today,
    start_time: '08:00',
    end_time: '09:00',
    reason: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [validatedCoupon, setValidatedCoupon] = useState<{ code: string; id: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const { data: appointments, isLoading } = useAppointments(selectedDate);
  const { data: customers } = useCustomers();
  const { data: ownerBarbers = [], isLoading: ownerBarbersLoading } = useBarbers();
  const { data: clientBarbers = [], isLoading: clientBarbersLoading } = useClientBarbers();
  const barbers = (user?.role === 'customer' ? clientBarbers : ownerBarbers);
  const barbersLoading = (user?.role === 'customer' ? clientBarbersLoading : ownerBarbersLoading);
  const { data: services } = useServices();
  const { data: blockedTimes } = useBlockedTimes(blockFormData.barber_id, selectedDate);
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const createBlockedTime = useCreateBlockedTime();
  const deleteBlockedTime = useDeleteBlockedTime();

  // Get selected service duration for available slots
  const selectedService = services?.find(s => s.id === formData.service_id);
  const serviceDuration = selectedService?.duration || 30; // Default 30 minutes
  const { data: availableSlots, isLoading: isLoadingSlots } = useAvailableTimeSlots(
    formData.date,
    formData.barber_id,
    serviceDuration
  );

  // Debug logs
  console.log('Agendamentos Form Debug:', {
    date: formData.date,
    barber_id: formData.barber_id,
    service_id: formData.service_id,
    serviceDuration,
    availableSlots,
    isLoadingSlots,
    barbersCount: barbers?.length,
    servicesCount: services?.length,
    userRole: user?.role
  });

  useEffect(() => {
    if (editingAppointment) {
      setFormData({
        customer_id: editingAppointment.customer_id,
        date: editingAppointment.appointment_date,
        time: editingAppointment.appointment_time,
        service_id: editingAppointment.service_id,
        barber_id: editingAppointment.barber_id,
        notes: editingAppointment.notes || '',
      });
    }

  useEffect(() => {
    if (user?.role === 'customer' && customers) {
      const self = (customers as any[]).find((c) => c.user_id === user.id) || (customers?.length === 1 ? (customers as any[])[0] : null);
      if (self && formData.customer_id !== self.id) {
        setFormData((prev) => ({ ...prev, customer_id: self.id }));
      }
    }
  }, [user?.role, user?.id, customers, formData.customer_id]);


  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    if (!formData.customer_id) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const { data: coupons, error } = await supabase
        .from('loyalty_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('customer_id', formData.customer_id)
        .eq('is_redeemed', false)
        .maybeSingle();

      if (error) throw error;

      if (!coupons) {
        toast.error('Cupom inválido ou já utilizado');
        return;
      }

      if (coupons.expires_at && new Date(coupons.expires_at) < new Date()) {
        toast.error('Cupom expirado');
        return;
      }

      setValidatedCoupon({ code: coupons.code, id: coupons.id });
      toast.success('Cupom validado! O valor será R$ 0,00');
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      toast.error('Erro ao validar cupom');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAppointment) {
      await updateAppointment.mutateAsync({
        id: editingAppointment.id,
        data: {
          customer_id: formData.customer_id,
          appointment_date: formData.date,
          appointment_time: formData.time,
          service_id: formData.service_id,
          barber_id: formData.barber_id,
          notes: formData.notes,
        },
      });
    } else {
      const appointment = await createAppointment.mutateAsync({
        customer_id: formData.customer_id,
        appointment_date: formData.date,
        appointment_time: formData.time,
        service_id: formData.service_id,
        barber_id: formData.barber_id,
        notes: formData.notes,
      });

      // Se houver cupom validado, resgatar o cupom
      if (validatedCoupon && appointment) {
        try {
          const { data, error } = await supabase.functions.invoke('redeem-coupon', {
            body: { code: validatedCoupon.code, appointment_id: appointment.id }
          });

          if (error) throw error;
          if (!data.success) {
            toast.error(data.error || 'Erro ao aplicar cupom');
          }
        } catch (error) {
          console.error('Erro ao resgatar cupom:', error);
          toast.error('Agendamento criado, mas erro ao aplicar cupom');
        }
      }
    }

    handleDialogClose();
  };

  const handleEdit = (appointment: AppointmentWithDetails) => {
    setEditingAppointment(appointment);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (appointmentToDelete) {
      await deleteAppointment.mutateAsync(appointmentToDelete);
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setAppointmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditingAppointment(null);
    setFormData({
      customer_id: '',
      date: today,
      time: '',
      service_id: '',
      barber_id: '',
      notes: '',
    });
    setCouponCode('');
    setValidatedCoupon(null);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    await updateAppointment.mutateAsync({
      id: appointmentId,
      data: { status: newStatus },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success';
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-warning/10 text-warning';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendente';
    }
  };

  const handleBlockTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Você precisa estar logado para bloquear horários');
      return;
    }

    await createBlockedTime.mutateAsync({
      barber_id: blockFormData.barber_id,
      blocked_date: blockFormData.blocked_date,
      start_time: blockFormData.start_time,
      end_time: blockFormData.end_time,
      reason: blockFormData.reason,
      created_by: user.id,
    });

    setBlockTimeOpen(false);
    setBlockFormData({
      barber_id: '',
      blocked_date: today,
      start_time: '08:00',
      end_time: '09:00',
      reason: '',
    });
  };

  const handleUnblockTime = async (id: string) => {
    await deleteBlockedTime.mutateAsync(id);
  };

  // Generate all time slots for visualization
  const generateAllTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getSlotStatus = (slot: string, barberId: string) => {
    if (!barberId) return 'available';
    
    const slotTime = slot;
    const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
    
    // Check if slot is in blocked times
    const isBlocked = blockedTimes?.some(blocked => {
      const startMinutes = parseInt(blocked.start_time.split(':')[0]) * 60 + parseInt(blocked.start_time.split(':')[1]);
      const endMinutes = parseInt(blocked.end_time.split(':')[0]) * 60 + parseInt(blocked.end_time.split(':')[1]);
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });

    if (isBlocked) return 'blocked';

    // Check if slot has an appointment
    const hasAppointment = appointments?.some(apt => {
      if (apt.barber_id !== barberId) return false;
      return apt.appointment_time.slice(0, 5) === slotTime;
    });

    return hasAppointment ? 'booked' : 'available';
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Relógio Digital */}
        <DigitalClock />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Agendamentos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie todos os horários da barbearia</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {user?.role !== 'customer' && (
              <Dialog open={blockTimeOpen} onOpenChange={setBlockTimeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-none text-sm sm:text-base">
                    <Ban className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Gerenciar Horários</span>
                    <span className="sm:hidden">Gerenciar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-lg p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Bloquear Horário</DialogTitle>
                    <DialogDescription className="sr-only">Selecione barbeiro, data e intervalo para bloquear.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleBlockTimeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="block-barber">Barbeiro</Label>
                      <Select 
                        value={blockFormData.barber_id} 
                        onValueChange={(value) => setBlockFormData({ ...blockFormData, barber_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o barbeiro" />
                        </SelectTrigger>
                        <SelectContent>
                          {barbers?.map((barber) => (
                            <SelectItem key={barber.id} value={barber.id}>
                              {barber.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="block-date">Data</Label>
                      <Input
                        id="block-date"
                        type="date"
                        value={blockFormData.blocked_date}
                        onChange={(e) => setBlockFormData({ ...blockFormData, blocked_date: e.target.value })}
                        min={today}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Hora Início</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={blockFormData.start_time}
                          onChange={(e) => setBlockFormData({ ...blockFormData, start_time: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">Hora Fim</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={blockFormData.end_time}
                          onChange={(e) => setBlockFormData({ ...blockFormData, end_time: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Motivo (opcional)</Label>
                      <Textarea
                        id="reason"
                        value={blockFormData.reason}
                        onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                        placeholder="Ex: Folga, Evento pessoal, Curso..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={createBlockedTime.isPending}>
                      Bloquear Horário
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            
            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) handleDialogClose();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 flex-1 sm:flex-none text-sm sm:text-base">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Novo Agendamento</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-lg p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>
                    {editingAppointment ? 'Editar Agendamento' : 'Criar Novo Agendamento'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">Preencha os dados do agendamento.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Cliente</Label>
                    {user?.role === 'customer' ? (
                      <Input id="customer" value={(customers?.find((c: any) => c.user_id === user?.id)?.name || customers?.[0]?.name || 'Meu perfil')} readOnly disabled />
                    ) : (
                      <Select 
                        value={formData.customer_id} 
                        onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Serviço</Label>
                    <Select 
                      value={formData.service_id} 
                      onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - {service.duration}min - R$ {service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barber">Barbeiro</Label>
                    <Select 
                      value={formData.barber_id} 
                      onValueChange={(value) => setFormData({ ...formData, barber_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers?.map((barber) => (
                          <SelectItem key={barber.id} value={barber.id}>
                            {barber.name} {barber.specialty ? `- ${barber.specialty}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={today}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Horário Disponível</Label>
                    <Select 
                      value={formData.time} 
                      onValueChange={(value) => setFormData({ ...formData, time: value })}
                      required
                      disabled={!formData.barber_id || !formData.service_id || !formData.date || isLoadingSlots}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingSlots
                            ? "Carregando horários..."
                            : !formData.barber_id || !formData.service_id 
                            ? "Selecione barbeiro e serviço primeiro"
                            : availableSlots && availableSlots.length === 0
                            ? "Nenhum horário disponível nesta data"
                            : "Selecione um horário disponível"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots && availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))
                        ) : !isLoadingSlots && formData.barber_id && formData.service_id && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhum horário disponível
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.barber_id && formData.service_id && formData.date && (
                    <p className="text-xs text-muted-foreground">
                      {availableSlots?.length || 0} horários disponíveis
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Adicione observações sobre o agendamento"
                    />
                  </div>

                  {!editingAppointment && formData.customer_id && (
                    <div className="space-y-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-accent" />
                        <Label className="text-base font-semibold">Cupom de Fidelidade</Label>
                      </div>
                      
                      {!validatedCoupon ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Digite o código do cupom"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleValidateCoupon}
                              disabled={isValidatingCoupon || !couponCode.trim()}
                            >
                              {isValidatingCoupon ? 'Validando...' : 'Validar'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Cliente pode usar cupom para corte grátis
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-success" />
                              <span className="font-semibold text-success">Cupom validado!</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setValidatedCoupon(null);
                                setCouponCode('');
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Código: {validatedCoupon.code}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.service_id && (
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
                      <h4 className="font-semibold text-sm">Resumo do Valor</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Serviço:</span>
                          <span className={validatedCoupon ? 'line-through text-muted-foreground' : 'font-bold'}>
                            R$ {services?.find(s => s.id === formData.service_id)?.price}
                          </span>
                        </div>
                        {validatedCoupon && (
                          <>
                            <div className="flex justify-between text-sm text-accent">
                              <span>Desconto (Cupom):</span>
                              <span className="font-bold">
                                - R$ {services?.find(s => s.id === formData.service_id)?.price}
                              </span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between text-base font-bold">
                              <span>Total:</span>
                              <span className="text-success">R$ 0,00</span>
                            </div>
                          </>
                        )}
                        {!validatedCoupon && (
                          <div className="flex justify-between text-base font-bold pt-2 border-t">
                            <span>Total:</span>
                            <span className="text-success">
                              R$ {services?.find(s => s.id === formData.service_id)?.price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={createAppointment.isPending || updateAppointment.isPending}>
                    {editingAppointment ? 'Atualizar Agendamento' : 'Criar Agendamento'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4">
          <Label htmlFor="filter-date" className="text-sm sm:text-base">Filtrar por data:</Label>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              id="filter-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none sm:w-auto text-sm"
            />
            <Button variant="outline" onClick={() => setSelectedDate(today)} className="text-sm sm:text-base px-3 sm:px-4">
              Hoje
            </Button>
          </div>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="appointments" className="text-xs sm:text-sm py-2">Agendamentos</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm py-2">Calendário Visual</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Lista de Agendamentos - {formatBrasiliaDate(toBrasiliaTime(selectedDate + 'T12:00:00'), 'dd/MM/yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {isLoading ? (
                  <div className="text-center py-8">Carregando agendamentos...</div>
                ) : !appointments || appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum agendamento encontrado para esta data
                  </div>
                ) : (
                  <div className="space-y-4">
                     {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-medium">
                                {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{appointment.appointment_time.slice(0, 5)}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{appointment.customer?.name || 'Cliente'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Scissors className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {appointment.service?.name || 'Serviço'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-medium text-primary">
                                {appointment.barber?.name || 'Barbeiro'}
                              </span>
                            </div>
                            {appointment.loyalty_coupons && appointment.loyalty_coupons.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 border border-accent/20">
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                                <span className="text-xs sm:text-sm font-bold text-accent">Grátis</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Select
                            value={appointment.status}
                            onValueChange={(value) => handleStatusChange(appointment.id, value as any)}
                          >
                            <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs sm:text-sm">
                              <SelectValue>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                  {getStatusLabel(appointment.status)}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="confirmed">Confirmado</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(appointment)}
                              className="flex-1 sm:flex-none h-9"
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0" />
                              <span className="ml-2 sm:hidden">Editar</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openDeleteDialog(appointment.id)}
                              className="flex-1 sm:flex-none h-9"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0" />
                              <span className="ml-2 sm:hidden">Excluir</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Visualização de Horários - {formatBrasiliaDate(toBrasiliaTime(selectedDate + 'T12:00:00'), 'dd/MM/yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label>Barbeiro:</Label>
                    <Select 
                      value={blockFormData.barber_id} 
                      onValueChange={(value) => setBlockFormData({ ...blockFormData, barber_id: value })}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione o barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers?.map((barber) => (
                          <SelectItem key={barber.id} value={barber.id}>
                            {barber.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-success/20 border border-success"></div>
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary/20 border border-primary"></div>
                      <span>Agendado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive"></div>
                      <span>Bloqueado</span>
                    </div>
                  </div>

                  {!blockFormData.barber_id ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Selecione um barbeiro para visualizar os horários
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {generateAllTimeSlots().map((slot) => {
                        const status = getSlotStatus(slot, blockFormData.barber_id);
                        const statusStyles = {
                          available: 'bg-success/20 border-success hover:bg-success/30',
                          booked: 'bg-primary/20 border-primary',
                          blocked: 'bg-destructive/20 border-destructive',
                        };

                        return (
                          <div
                            key={slot}
                            className={`p-3 rounded-lg border-2 text-center font-medium transition-smooth ${statusStyles[status]}`}
                          >
                            <div className="text-sm">{slot}</div>
                            {status === 'booked' && (
                              <div className="text-xs opacity-70 mt-1">Ocupado</div>
                            )}
                            {status === 'blocked' && (
                              <Lock className="h-3 w-3 mx-auto mt-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {blockFormData.barber_id && blockedTimes && blockedTimes.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Horários Bloqueados</h3>
                      <div className="space-y-2">
                        {blockedTimes.map((blocked) => (
                          <div
                            key={blocked.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <Lock className="h-4 w-4 text-destructive" />
                              <div>
                                <div className="font-medium">
                                  {blocked.start_time.slice(0, 5)} - {blocked.end_time.slice(0, 5)}
                                </div>
                                {blocked.reason && (
                                  <div className="text-sm text-muted-foreground">{blocked.reason}</div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblockTime(blocked.id)}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
