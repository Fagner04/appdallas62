import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCustomerProfile, useUpcomingAppointments, useCustomerAppointments } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientArea() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const { data: upcomingAppointments = [], isLoading: upcomingLoading } = useUpcomingAppointments();
  const { data: allAppointments = [], isLoading: allLoading } = useCustomerAppointments();

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
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Agendamentos
            </CardTitle>
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
                <p className="text-muted-foreground">
                  Entre em contato com a barbearia para agendar seu próximo corte.
                </p>
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
                        <Badge 
                          variant="outline" 
                          className={`${statusConfig.color} flex items-center gap-2 px-4 py-2 border`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.label}
                        </Badge>
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
    </Layout>
  );
}
