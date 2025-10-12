import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Scissors,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useCustomerAppointments } from '@/hooks/useCustomerData';
import { formatBrasiliaDate, toBrasiliaTime } from '@/lib/timezone';

export default function HistoricoCliente() {
  const { data: allAppointments = [], isLoading } = useCustomerAppointments();

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

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || '';
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            Histórico de Agendamentos
          </h1>
          <p className="text-muted-foreground">
            Todos os seus agendamentos anteriores
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Todos os Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allAppointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum agendamento registrado</h3>
                <p className="text-muted-foreground">
                  Você ainda não tem agendamentos registrados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAppointments.map((appointment: any) => {
                  const statusConfig = getStatusConfig(appointment.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={appointment.id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent transition-smooth gap-3"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="text-center min-w-[70px] sm:min-w-[90px] p-2 sm:p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 group-hover:border-primary/20 transition-smooth flex-shrink-0">
                          <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {formatBrasiliaDate(toBrasiliaTime(appointment.appointment_date), 'dd/MMM')}
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-primary mt-1">
                            {formatTime(appointment.appointment_time)}
                          </div>
                        </div>
                        <Separator orientation="vertical" className="hidden sm:block h-14" />
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="font-bold text-base sm:text-lg truncate">{appointment.service?.name}</div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
                            <span className="text-muted-foreground whitespace-nowrap">
                              {formatBrasiliaDate(toBrasiliaTime(appointment.appointment_date), "dd 'de' MMMM")}
                            </span>
                            <span className="text-muted-foreground hidden sm:inline">•</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {appointment.service?.duration} min
                            </span>
                            <span className="text-muted-foreground hidden sm:inline">•</span>
                            <span className="font-semibold text-success whitespace-nowrap">
                              R$ {appointment.service?.price}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig.color} flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border font-semibold text-xs w-fit flex-shrink-0`}
                      >
                        <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
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
    </Layout>
  );
}
