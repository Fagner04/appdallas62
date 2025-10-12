import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function Relatorios() {
  const [period, setPeriod] = useState('month');

  const stats = [
    { label: 'Faturamento Total', value: 'R$ 25.480', change: '+12%', icon: TrendingUp, color: 'text-success' },
    { label: 'Total de Atendimentos', value: '438', change: '+8%', icon: Users, color: 'text-primary' },
    { label: 'Ticket Médio', value: 'R$ 58', change: '+5%', icon: BarChart3, color: 'text-accent' },
    { label: 'Taxa de Ocupação', value: '87%', change: '+3%', icon: Calendar, color: 'text-warning' },
  ];

  const topServices = [
    { name: 'Corte + Barba', count: 156, revenue: 'R$ 9.360', percentage: 37 },
    { name: 'Corte Simples', count: 189, revenue: 'R$ 7.560', percentage: 43 },
    { name: 'Barba', count: 67, revenue: 'R$ 2.010', percentage: 15 },
    { name: 'Outros', count: 26, revenue: 'R$ 1.550', percentage: 5 },
  ];

  const topClients = [
    { name: 'Carlos Oliveira', visits: 23, spent: 'R$ 1.380' },
    { name: 'João Silva', visits: 15, spent: 'R$ 900' },
    { name: 'Roberto Lima', visits: 12, spent: 'R$ 720' },
    { name: 'Pedro Santos', visits: 8, spent: 'R$ 480' },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Relatórios</h1>
            <p className="text-muted-foreground">Análise de desempenho e estatísticas</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
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

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-success mt-2">
                  {stat.change} vs período anterior
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Services */}
          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Realizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topServices.map((service, index) => (
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
                      {service.revenue}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes Mais Frequentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                  >
                    <div>
                      <div className="font-semibold">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.visits} visitas</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-success">{client.spent}</div>
                      <div className="text-xs text-muted-foreground">total gasto</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Horários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {['09h', '10h', '11h', '12h', '14h', '15h', '16h', '17h'].map((hour, index) => {
                const heights = [60, 80, 75, 45, 70, 90, 85, 65];
                return (
                  <div key={hour} className="flex flex-col items-center gap-2">
                    <div className="w-full h-32 bg-muted rounded-lg overflow-hidden flex items-end">
                      <div
                        className="w-full gradient-primary rounded-t-lg transition-all"
                        style={{ height: `${heights[index]}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{hour}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
