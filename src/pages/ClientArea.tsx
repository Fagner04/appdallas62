import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  CalendarPlus
} from 'lucide-react';
import { useCustomerProfile, useUpcomingAppointments, useCustomerAppointments } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { formatBrasiliaDate, toBrasiliaTime } from '@/lib/timezone';
import { ClientBookingCalendar } from '@/components/ClientBookingCalendar';

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
    return formatBrasiliaDate(toBrasiliaTime(date), "EEEE, dd 'de' MMMM 'de' yyyy");
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
        {/* Header com perfil - Design moderno com gradiente */}
        <div className="relative overflow-hidden rounded-2xl shadow-elegant">
          <div className="absolute inset-0 gradient-primary opacity-90" />
          <div className="relative p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-1 gradient-primary rounded-full blur opacity-75 animate-pulse" />
                <Avatar className="relative h-28 w-28 border-4 border-white/20 shadow-elegant">
                  <AvatarFallback className="text-4xl font-bold bg-white/10 backdrop-blur-sm text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                    Olá, {user?.name}! 👋
                  </h1>
                  <p className="text-white/90 text-lg">Bem-vindo à sua área pessoal</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                    <Mail className="h-4 w-4 text-white" />
                    <span className="text-white font-medium">{profile?.email || user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                      <Phone className="h-4 w-4 text-white" />
                      <span className="text-white font-medium">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas rápidas - Cards modernos */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover-lift relative overflow-hidden border-primary/20 shadow-elegant group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">
                  {upcomingAppointments.length}
                </div>
              </div>
              <h3 className="font-semibold text-lg">Próximos</h3>
              <p className="text-sm text-muted-foreground">Agendamentos confirmados</p>
            </CardContent>
          </Card>
          
          <Card className="hover-lift relative overflow-hidden border-success/20 shadow-elegant group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 transition-smooth">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div className="text-3xl font-bold text-success">
                  {allAppointments.filter(a => a.status === 'completed').length}
                </div>
              </div>
              <h3 className="font-semibold text-lg">Total de Visitas</h3>
              <p className="text-sm text-muted-foreground">Serviços concluídos</p>
            </CardContent>
          </Card>

          <Card className="hover-lift relative overflow-hidden border-accent/20 shadow-elegant group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-smooth">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <div className="text-3xl font-bold text-accent">
                  {profile?.loyalty_points || 0}
                </div>
              </div>
              <h3 className="font-semibold text-lg">Fidelidade</h3>
              <p className="text-sm text-muted-foreground">Pontos acumulados</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar and appointments tabs - Design melhorado */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-[500px] grid-cols-2 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="upcoming" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-elegant"
            >
              <Calendar className="h-4 w-4" />
              Meus Agendamentos
            </TabsTrigger>
            <TabsTrigger 
              value="book" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-elegant"
            >
              <CalendarPlus className="h-4 w-4" />
              Novo Agendamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <Card className="shadow-elegant border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
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
                      className="group relative overflow-hidden p-6 rounded-xl border border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card to-muted/5 hover:shadow-elegant transition-smooth"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
                      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="absolute inset-0 gradient-primary blur-lg opacity-50" />
                              <div className="relative p-3 rounded-xl gradient-primary shadow-elegant">
                                <Scissors className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-bold text-xl mb-1">
                                {appointment.service?.name}
                              </h3>
                              <p className="text-sm text-muted-foreground font-medium">
                                {formatDate(appointment.appointment_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-primary">
                                {formatTime(appointment.appointment_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                              <span className="font-bold text-success">
                                R$ {appointment.service?.price}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{appointment.service?.duration} min</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${statusConfig.color} flex items-center gap-2 px-4 py-2 border text-sm font-semibold`}
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
            <Card className="shadow-elegant border-muted">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-muted">
                    <Clock className="h-5 w-5" />
                  </div>
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
                      className="group flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent transition-smooth"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[90px] p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 group-hover:border-primary/20 transition-smooth">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {formatBrasiliaDate(toBrasiliaTime(appointment.appointment_date), 'dd/MMM')}
                          </div>
                          <div className="text-xl font-bold text-primary mt-1">
                            {formatTime(appointment.appointment_time)}
                          </div>
                        </div>
                        <Separator orientation="vertical" className="h-14" />
                        <div className="space-y-1">
                          <div className="font-bold text-lg">{appointment.service?.name}</div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">
                              {appointment.service?.duration} min
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-semibold text-success">
                              R$ {appointment.service?.price}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-2 px-3 py-1.5 border font-semibold`}>
                        <StatusIcon className="h-4 w-4" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="book">
            <ClientBookingCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
