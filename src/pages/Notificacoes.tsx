import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Notificacoes() {
  const [notifications] = useState([
    {
      id: 1,
      type: 'confirmation',
      client: 'João Silva',
      message: 'Confirmou agendamento para amanhã às 10:00',
      time: '2 horas atrás',
      status: 'sent',
    },
    {
      id: 2,
      type: 'reminder',
      client: 'Pedro Santos',
      message: 'Lembrete enviado: Agendamento amanhã às 14:00',
      time: '3 horas atrás',
      status: 'sent',
    },
    {
      id: 3,
      type: 'pending',
      client: 'Carlos Oliveira',
      message: 'Aguardando confirmação do agendamento',
      time: '5 horas atrás',
      status: 'pending',
    },
    {
      id: 4,
      type: 'promotion',
      client: 'Roberto Lima',
      message: 'Promoção enviada: 10% off na próxima visita',
      time: '1 dia atrás',
      status: 'sent',
    },
  ]);

  const stats = [
    { label: 'Enviadas Hoje', value: '24', icon: Send, color: 'text-primary' },
    { label: 'Confirmações', value: '18', icon: CheckCircle2, color: 'text-success' },
    { label: 'Pendentes', value: '6', icon: Clock, color: 'text-warning' },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notificações</h1>
          <p className="text-muted-foreground">Gerencie as notificações automáticas para clientes</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Confirmação de Agendamento</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviada imediatamente após o agendamento
                </p>
                <Button size="sm" variant="outline">Editar Mensagem</Button>
              </div>

              <div className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-warning" />
                  <span className="font-semibold">Lembrete 1h Antes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviada 1 hora antes do horário agendado
                </p>
                <Button size="sm" variant="outline">Editar Mensagem</Button>
              </div>

              <div className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-semibold">Agradecimento Pós-Visita</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviada após a conclusão do atendimento
                </p>
                <Button size="sm" variant="outline">Editar Mensagem</Button>
              </div>

              <div className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-accent" />
                  <span className="font-semibold">Promoções e Ofertas</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviada periodicamente com ofertas especiais
                </p>
                <Button size="sm" variant="outline">Editar Mensagem</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                >
                  <div className={`p-2 rounded-lg ${
                    notification.status === 'sent' ? 'bg-success/10' : 'bg-warning/10'
                  }`}>
                    {notification.status === 'sent' ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Clock className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{notification.client}</span>
                      <Badge variant={notification.status === 'sent' ? 'default' : 'secondary'}>
                        {notification.status === 'sent' ? 'Enviada' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                  {notification.status === 'pending' && (
                    <Button size="sm">Reenviar</Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
