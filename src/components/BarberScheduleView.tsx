import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar as CalendarIcon, Clock, User, Scissors, Phone } from 'lucide-react';
import { useBarbers } from '@/hooks/useBarbers';
import { useAppointments } from '@/hooks/useAppointments';
import { ptBR } from 'date-fns/locale';
import { formatBrasiliaDate, getBrasiliaDate, toBrasiliaTime } from '@/lib/timezone';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export function BarberScheduleView() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getBrasiliaDate());
  const [selectedBarber, setSelectedBarber] = useState<string>('');

  const { data: barbers = [], isLoading: barbersLoading } = useBarbers();
  
  // If user is a barber, default to their ID
  const isBarber = user?.role === 'barber';
  const defaultBarberId = isBarber ? user?.id : '';

  const formattedDate = selectedDate ? formatBrasiliaDate(selectedDate, 'yyyy-MM-dd') : '';
  const barberId = selectedBarber || defaultBarberId;
  
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments(formattedDate);

  // Filter appointments for selected barber and get customer details
  const filteredAppointments = appointments.filter(
    (apt: any) => !barberId || apt.barber_id === barberId
  ).sort((a: any, b: any) => a.appointment_time.localeCompare(b.appointment_time));

  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: { label: 'Confirmado', color: 'bg-success/10 text-success border-success/20' },
      pending: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20' },
      completed: { label: 'Concluído', color: 'bg-primary/10 text-primary border-primary/20' },
      cancelled: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive border-destructive/20' },
      no_show: { label: 'Não Compareceu', color: 'bg-muted text-muted-foreground border-muted' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Agenda do Barbeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              today={getBrasiliaDate()}
              defaultMonth={getBrasiliaDate()}
              locale={ptBR}
              className="rounded-md border"
            />

            {!isBarber && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Filtrar por Barbeiro</label>
                <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os barbeiros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os barbeiros</SelectItem>
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
            )}
          </div>

          {/* Appointments list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Agendamentos - {selectedDate && formatBrasiliaDate(selectedDate, 'dd/MM/yyyy')}
              </h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Nenhum agendamento nesta data
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredAppointments.map((appointment: any) => {
                  const statusConfig = getStatusConfig(appointment.status);
                  
                  return (
                    <div
                      key={appointment.id}
                      className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg gradient-primary">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">
                              {appointment.appointment_time?.substring(0, 5)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.service?.duration} minutos
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${statusConfig.color} border text-xs`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.customer?.name || 'Cliente'}</span>
                        </div>
                        
                        {appointment.customer?.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{appointment.customer.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.service?.name}</span>
                          <span className="text-success font-semibold ml-auto">
                            R$ {appointment.service?.price}
                          </span>
                        </div>

                        {!isBarber && appointment.barber && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Barbeiro: {appointment.barber.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
