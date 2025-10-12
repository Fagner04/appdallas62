import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Clock, User, Scissors, Pencil, Trash2, Ban, Lock, Unlock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, useAvailableTimeSlots, AppointmentWithDetails } from '@/hooks/useAppointments';
import { useCustomers } from '@/hooks/useCustomers';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useBlockedTimes, useCreateBlockedTime, useDeleteBlockedTime } from '@/hooks/useBlockedTimes';
import { useAuth } from '@/contexts/AuthContext';

export default function Agendamentos() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
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

  const { data: appointments, isLoading } = useAppointments(selectedDate);
  const { data: customers } = useCustomers();
  const { data: barbers } = useBarbers();
  const { data: services } = useServices();
  const { data: blockedTimes } = useBlockedTimes(blockFormData.barber_id, selectedDate);
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const createBlockedTime = useCreateBlockedTime();
  const deleteBlockedTime = useDeleteBlockedTime();

  // Get selected service duration for available slots
  const selectedService = services?.find(s => s.id === formData.service_id);
  const { data: availableSlots } = useAvailableTimeSlots(
    formData.date,
    formData.barber_id,
    selectedService?.duration || 0
  );

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
  }, [editingAppointment]);

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
      await createAppointment.mutateAsync({
        customer_id: formData.customer_id,
        appointment_date: formData.date,
        appointment_time: formData.time,
        service_id: formData.service_id,
        barber_id: formData.barber_id,
        notes: formData.notes,
      });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie todos os horários da barbearia</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={blockTimeOpen} onOpenChange={setBlockTimeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Ban className="h-5 w-5" />
                  Gerenciar Horários
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bloquear Horário</DialogTitle>
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
            
            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) handleDialogClose();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-5 w-5" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAppointment ? 'Editar Agendamento' : 'Criar Novo Agendamento'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Cliente</Label>
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
                      disabled={!formData.barber_id || !formData.service_id || !formData.date || !availableSlots || availableSlots.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.barber_id || !formData.service_id 
                            ? "Selecione barbeiro e serviço primeiro"
                            : availableSlots && availableSlots.length === 0
                            ? "Nenhum horário disponível"
                            : "Selecione um horário disponível"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots && availableSlots.length > 0 && availableSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.barber_id && formData.service_id && formData.date && (
                      <p className="text-xs text-muted-foreground">
                        {availableSlots?.length || 0} horários disponíveis
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Adicione observações sobre o agendamento"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createAppointment.isPending || updateAppointment.isPending}>
                    {editingAppointment ? 'Atualizar Agendamento' : 'Criar Agendamento'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Label htmlFor="filter-date">Filtrar por data:</Label>
          <Input
            id="filter-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" onClick={() => setSelectedDate(today)}>
            Hoje
          </Button>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="calendar">Calendário Visual</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Lista de Agendamentos - {new Date(selectedDate).toLocaleDateString('pt-BR')}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                      >
                        <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-6">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{appointment.appointment_time.slice(0, 5)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span>{appointment.customer?.name || 'Cliente'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">
                              {appointment.service?.name || 'Serviço'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 md:mt-0">
                          <Select
                            value={appointment.status}
                            onValueChange={(value) => handleStatusChange(appointment.id, value as any)}
                          >
                            <SelectTrigger className="w-[130px]">
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(appointment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDeleteDialog(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                  Visualização de Horários - {new Date(selectedDate).toLocaleDateString('pt-BR')}
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
