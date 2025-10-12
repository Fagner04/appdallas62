import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import { useCustomerProfile, useUpcomingAppointments, useCustomerAppointments } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useCreateAppointment, useUpdateAppointment, useDeleteAppointment, useAvailableTimeSlots } from '@/hooks/useAppointments';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ptBR } from 'date-fns/locale';

export default function ClientArea() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const { data: upcomingAppointments = [], isLoading: upcomingLoading, refetch: refetchUpcoming } = useUpcomingAppointments();
  const { data: allAppointments = [], isLoading: allLoading, refetch: refetchAll } = useCustomerAppointments();
  const { data: barbers = [] } = useBarbers();
  const { data: services = [] } = useServices();
  
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    barber_id: '',
    service_id: '',
    appointment_time: '',
    notes: ''
  });

  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const selectedService = services.find(s => s.id === formData.service_id);
  const { data: availableSlots = [] } = useAvailableTimeSlots(
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    formData.barber_id,
    selectedService?.duration || 0
  );

  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: { 
        icon: CheckCircle2, 
        label: 'Confirmado', 
        color: 'bg-success/10 text-success border-success/20' 
      },
      pending: { 
        icon: AlertCircle, 
        label: 'Pendente', 
        color: 'bg-warning/10 text-warning border-warning/20' 
      },
      completed: { 
        icon: CheckCircle2, 
        label: 'Concluído', 
        color: 'bg-primary/10 text-primary border-primary/20' 
      },
      cancelled: { 
        icon: XCircle, 
        label: 'Cancelado', 
        color: 'bg-destructive/10 text-destructive border-destructive/20' 
      },
      no_show: { 
        icon: XCircle, 
        label: 'Não Compareceu', 
        color: 'bg-muted text-muted-foreground border-muted' 
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || '';
  };

  const handleOpenNewAppointment = () => {
    setEditingAppointment(null);
    setSelectedDate(undefined);
    setFormData({
      barber_id: '',
      service_id: '',
      appointment_time: '',
      notes: ''
    });
    setAppointmentDialogOpen(true);
  };

  const handleOpenEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setSelectedDate(new Date(appointment.appointment_date));
    setFormData({
      barber_id: appointment.barber_id,
      service_id: appointment.service_id,
      appointment_time: appointment.appointment_time,
      notes: appointment.notes || ''
    });
    setAppointmentDialogOpen(true);
  };

  const handleSubmitAppointment = async () => {
    if (!profile?.id) {
      toast.error('Erro ao identificar cliente');
      return;
    }

    if (!selectedDate || !formData.barber_id || !formData.service_id || !formData.appointment_time) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingAppointment) {
        await updateAppointment.mutateAsync({
          id: editingAppointment.id,
          data: {
            barber_id: formData.barber_id,
            service_id: formData.service_id,
            appointment_date: format(selectedDate, 'yyyy-MM-dd'),
            appointment_time: formData.appointment_time,
            notes: formData.notes
          }
        });
      } else {
        await createAppointment.mutateAsync({
          customer_id: profile.id,
          barber_id: formData.barber_id,
          service_id: formData.service_id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: formData.appointment_time,
          notes: formData.notes
        });
      }
      
      setAppointmentDialogOpen(false);
      refetchUpcoming();
      refetchAll();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        data: { status: 'cancelled' }
      });
      refetchUpcoming();
      refetchAll();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este agendamento?')) {
      return;
    }

    try {
      await deleteAppointment.mutateAsync(appointmentId);
      refetchUpcoming();
      refetchAll();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    }
  };

  if (profileLoading || upcomingLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header com perfil */}
        <Card className="shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-white">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold mb-1">Olá, {user?.name}! 👋</h1>
                  <p className="text-muted-foreground">Bem-vindo à sua área pessoal</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.email || user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {upcomingAppointments.length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Total de Visitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {allAppointments.filter(a => a.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pontos de Fidelidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {profile?.loyalty_points || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos agendamentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                Próximos Agendamentos
              </CardTitle>
              <Button onClick={handleOpenNewAppointment} size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum agendamento próximo</h3>
                <p className="text-muted-foreground mb-6">
                  Que tal agendar seu próximo corte?
                </p>
                <Button onClick={handleOpenNewAppointment} className="gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  Agendar Agora
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment: any) => {
                  const statusConfig = getStatusConfig(appointment.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={appointment.id}
                      className="p-6 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg gradient-primary">
                              <Scissors className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {appointment.service?.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(appointment.appointment_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {formatTime(appointment.appointment_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-success">
                              <span className="font-semibold">
                                R$ {appointment.service?.price}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.service?.duration} min</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${statusConfig.color} flex items-center gap-2 px-4 py-2 border`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig.label}
                          </Badge>
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditAppointment(appointment)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : allAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Você ainda não tem agendamentos registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {allAppointments.slice(0, 5).map((appointment: any) => {
                  const statusConfig = getStatusConfig(appointment.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-smooth"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <div className="text-sm text-muted-foreground">
                            {new Date(appointment.appointment_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {formatTime(appointment.appointment_time)}
                          </div>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div>
                          <div className="font-semibold">{appointment.service?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.service?.duration} min • R$ {appointment.service?.price}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1.5 border`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Agendamento */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Seleção de Barbeiro */}
            <div className="space-y-2">
              <Label htmlFor="barber">Barbeiro *</Label>
              <Select
                value={formData.barber_id}
                onValueChange={(value) => setFormData({ ...formData, barber_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.filter(b => b.is_active).map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Serviço */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço *</Label>
              <Select
                value={formData.service_id}
                onValueChange={(value) => setFormData({ ...formData, service_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.filter(s => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Data */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={ptBR}
                className="rounded-md border pointer-events-auto"
              />
            </div>

            {/* Seleção de Horário */}
            {selectedDate && formData.barber_id && formData.service_id && (
              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                <Select
                  value={formData.appointment_time}
                  onValueChange={(value) => setFormData({ ...formData, appointment_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Nenhum horário disponível
                      </div>
                    ) : (
                      availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Alguma observação ou preferência?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setAppointmentDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitAppointment}
                disabled={!selectedDate || !formData.barber_id || !formData.service_id || !formData.appointment_time}
              >
                {editingAppointment ? 'Salvar Alterações' : 'Criar Agendamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
