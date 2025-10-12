import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useTodayAppointments } from '@/hooks/useDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: appointments = [], isLoading: appointmentsLoading } = useTodayAppointments();

  const statsCards = [
    {
      title: 'Agendamentos Hoje',
      value: statsLoading ? '-' : stats?.appointmentsToday.toString() || '0',
      icon: Calendar,
      color: 'text-primary',
      bg: 'bg-primary-light',
      change: 'Hoje',
    },
    {
      title: 'Total de Clientes',
      value: statsLoading ? '-' : stats?.totalCustomers.toString() || '0',
      icon: Users,
      color: 'text-accent',
      bg: 'bg-accent/10',
      change: 'Cadastrados',
    },
    {
      title: 'Faturamento Hoje',
      value: statsLoading ? '-' : `R$ ${stats?.revenue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success/10',
      change: 'Receitas',
    },
    {
      title: 'Sistema',
      value: '✓',
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
      change: 'Conectado ao Supabase',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio hoje, {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover-lift cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={() => navigate('/agendamentos')}
                className="h-auto py-6 flex-col gap-2"
              >
                <Calendar className="h-6 w-6" />
                <span>Novo Agendamento</span>
              </Button>
              <Button 
                onClick={() => navigate('/caixa')}
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
              >
                <DollarSign className="h-6 w-6" />
                <span>Abrir Caixa</span>
              </Button>
              <Button 
                onClick={() => navigate('/clientes')}
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
              >
                <Users className="h-6 w-6" />
                <span>Cadastrar Cliente</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agendamentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento para hoje.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
                    onClick={() => navigate('/agendamentos')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {appointment.appointment_time?.substring(0, 5)}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold">{appointment.customer?.name}</div>
                        <div className="text-sm text-muted-foreground">{appointment.service?.name}</div>
                      </div>
                    </div>
                    <div>
                      {appointment.status === 'completed' && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm font-medium">Concluído</span>
                        </div>
                      )}
                      {appointment.status === 'confirmed' && (
                        <div className="flex items-center gap-2 text-warning">
                          <Clock className="h-5 w-5" />
                          <span className="text-sm font-medium">Confirmado</span>
                        </div>
                      )}
                      {appointment.status === 'pending' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-5 w-5" />
                          <span className="text-sm font-medium">Pendente</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
