import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  CalendarPlus,
  User,
  Award
} from 'lucide-react';
import { useCustomerProfile, useUpcomingAppointments, useCustomerAppointments } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { formatBrasiliaDate, toBrasiliaTime } from '@/lib/timezone';
import { ClientBookingCalendar } from '@/components/ClientBookingCalendar';
import { AvatarUpload } from '@/components/AvatarUpload';
import { LoyaltyCard } from '@/components/LoyaltyCard';

export default function ClientArea() {
  const { user } = useAuth();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
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
        {/* Header com perfil - Design moderno */}
        <div className="relative overflow-hidden rounded-xl shadow-elegant bg-card border">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <AvatarUpload 
                avatarUrl={profile?.avatar_url} 
                userName={user?.name}
                size="md"
              />
               <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                    Olá, {user?.name}! 👋
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">Bem-vindo à sua área pessoal</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border text-sm">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium truncate">{profile?.email || user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border text-sm">
                      <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas rápidas - Cards modernos */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover-lift relative overflow-hidden border-primary/20 shadow-elegant group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {upcomingAppointments.length}
                </div>
              </div>
              <h3 className="font-semibold text-base sm:text-lg">Próximos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Agendamentos confirmados</p>
            </CardContent>
          </Card>
          
          <Card className="hover-lift relative overflow-hidden border-success/20 shadow-elegant group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-xl bg-success/10 group-hover:bg-success/20 transition-smooth">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-success">
                  {allAppointments.filter(a => a.status === 'completed').length}
                </div>
              </div>
              <h3 className="font-semibold text-base sm:text-lg">Total de Visitas</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Serviços concluídos</p>
            </CardContent>
          </Card>

          <Card className="hover-lift relative overflow-hidden border-accent/20 shadow-elegant group sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-smooth">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-accent">
                  {profile?.loyalty_points || 0}
                </div>
              </div>
              <h3 className="font-semibold text-base sm:text-lg">Fidelidade</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Pontos acumulados</p>
            </CardContent>
          </Card>
        </div>

        {/* Programa de Fidelidade */}
        <LoyaltyCard />

        {/* Meus Agendamentos */}
        <div className="space-y-6">
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
                Clique no botão flutuante para agendar seu próximo corte.
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
                    className="group relative overflow-hidden p-4 sm:p-6 rounded-xl border border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card to-muted/5 hover:shadow-elegant transition-smooth"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
                    <div className="relative flex flex-col gap-4">
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
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                            <span className="font-semibold text-primary">
                              {formatTime(appointment.appointment_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-sm">
                            <span className="font-bold text-success">
                              R$ {appointment.service?.price}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-muted border border-border text-sm">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{appointment.service?.duration} min</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig.color} flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border text-xs sm:text-sm font-semibold w-fit`}
                      >
                        <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
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

        </div>

        {/* Botão flutuante para novo agendamento */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full shadow-glow hover:shadow-elegant transition-smooth z-40 gradient-primary p-0"
              aria-label="Novo Agendamento"
            >
              <CalendarPlus className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <CalendarPlus className="h-6 w-6 text-primary" />
                Novo Agendamento
              </DialogTitle>
              <DialogDescription>
                Selecione serviço, barbeiro, data e horário para confirmar seu agendamento.
              </DialogDescription>
            </DialogHeader>
            <ClientBookingCalendar onSuccess={() => setIsBookingOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
