import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useReportStats, useTopServices, useTopClients, useHourlyDistribution } from '@/hooks/useReports';

type Period = 'week' | 'month' | 'quarter' | 'year';

export default function Relatorios() {
  const [period, setPeriod] = useState<Period>('month');

  const { data: stats, isLoading: statsLoading } = useReportStats(period);
  const { data: topServices, isLoading: servicesLoading } = useTopServices(period);
  const { data: topClients, isLoading: clientsLoading } = useTopClients(period);
  const { data: hourlyData, isLoading: hourlyLoading } = useHourlyDistribution(period);

  const isLoading = statsLoading || servicesLoading || clientsLoading || hourlyLoading;

  const handlePeriodChange = (value: string) => {
    setPeriod(value as Period);
  };

  const statsCards = [
    { 
      label: 'Faturamento Total', 
      value: `R$ ${stats?.revenue.toFixed(2).replace('.', ',')}`, 
      icon: TrendingUp, 
      color: 'text-success' 
    },
    { 
      label: 'Total de Atendimentos', 
      value: stats?.totalAppointments.toString() || '0', 
      icon: Users, 
      color: 'text-primary' 
    },
    { 
      label: 'Ticket Médio', 
      value: `R$ ${stats?.averageTicket.toFixed(2).replace('.', ',')}`, 
      icon: BarChart3, 
      color: 'text-accent' 
    },
    { 
      label: 'Taxa de Ocupação', 
      value: `${stats?.occupancyRate.toFixed(0)}%`, 
      icon: Calendar, 
      color: 'text-warning' 
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Relatórios</h1>
            <p className="text-muted-foreground">Análise de desempenho e estatísticas</p>
          </div>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {statsCards.map((stat, index) => (
                <Card key={index} className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {!isLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Realizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topServices && topServices.length > 0 ? (
                  topServices.map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-muted-foreground">{service.count} atendimentos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary"
                            style={{ width: `${service.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-success min-w-[80px] text-right">
                          R$ {service.revenue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum serviço realizado no período
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes Mais Frequentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topClients && topClients.length > 0 ? (
                    topClients.map((client, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                      >
                        <div>
                          <div className="font-semibold">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.visits} visitas</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-success">
                            R$ {client.spent.toFixed(2).replace('.', ',')}
                          </div>
                          <div className="text-xs text-muted-foreground">total gasto</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum cliente no período
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Horários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {hourlyData?.map((data) => (
                  <div key={data.hour} className="flex flex-col items-center gap-2">
                    <div className="w-full h-32 bg-muted rounded-lg overflow-hidden flex items-end">
                      <div
                        className="w-full gradient-primary rounded-t-lg transition-all"
                        style={{ height: `${data.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{data.hour}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
