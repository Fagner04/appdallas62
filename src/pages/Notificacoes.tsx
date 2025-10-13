import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Send, Calendar, CheckCircle2, Clock, Plus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNotifications, useNotificationStats } from '@/hooks/useNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationTemplateEditor } from '@/components/NotificationTemplateEditor';
import { toast } from 'sonner';

export default function Notificacoes() {
  const { user } = useAuth();
  const { notifications, sendNotification } = useNotifications(user?.id);
  const { data: stats } = useNotificationStats();
  const { data: customers } = useCustomers();
  const { settings, isLoading, updateSettings } = useNotificationSettings(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'confirmation' | 'reminder' | 'promotion' | 'system'>('system');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const handleNotificationToggle = async (field: string, value: boolean) => {
    await updateSettings.mutateAsync({ [field]: value });
  };

  const handleReminderHoursChange = async (hours: number) => {
    await updateSettings.mutateAsync({ appointment_reminder_hours: hours });
  };

  const handleSendNotification = () => {
    if (!selectedCustomer || !title || !message) return;

    const customer = customers?.find((c) => c.id === selectedCustomer);
    if (!customer?.user_id) return;

    sendNotification.mutate({
      user_id: customer.user_id,
      title,
      message,
      type,
      related_id: null,
    });

    setIsDialogOpen(false);
    setSelectedCustomer('');
    setTitle('');
    setMessage('');
    setType('system');
  };

  const statsCards = [
    { label: 'Enviadas Hoje', value: stats?.sentToday || 0, icon: Send, color: 'text-primary' },
    { label: 'Confirmações', value: stats?.confirmations || 0, icon: CheckCircle2, color: 'text-success' },
    { label: 'Pendentes', value: stats?.pending || 0, icon: Clock, color: 'text-warning' },
  ];

  const templates = [
    { type: 'confirmation', title: 'Confirmação de Agendamento', description: 'Enviada imediatamente após o agendamento', icon: Calendar },
    { type: 'reminder', title: 'Lembrete 1h Antes', description: 'Enviada 1 hora antes do horário agendado', icon: Bell },
    { type: 'thanks', title: 'Agradecimento Pós-Visita', description: 'Enviada após a conclusão do atendimento', icon: CheckCircle2 },
    { type: 'promotion', title: 'Promoções e Ofertas', description: 'Enviada periodicamente com ofertas especiais', icon: Sparkles },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notificações</h1>
          <p className="text-muted-foreground">Gerencie as notificações automáticas para clientes</p>
        </div>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6 mt-6">

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
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

        {/* Notification Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates de Notificações Automáticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <div key={template.type} className="p-4 rounded-lg border border-border space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <template.icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{template.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingTemplate(template)}
                  >
                    Editar Mensagem
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notificações Recentes</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Notificação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Notificação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cliente</label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Sistema</SelectItem>
                        <SelectItem value="confirmation">Confirmação</SelectItem>
                        <SelectItem value="reminder">Lembrete</SelectItem>
                        <SelectItem value="promotion">Promoção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título da notificação"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensagem</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mensagem da notificação"
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleSendNotification} 
                    className="w-full"
                    disabled={!selectedCustomer || !title || !message || sendNotification.isPending}
                  >
                    {sendNotification.isPending ? 'Enviando...' : 'Enviar Notificação'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma notificação encontrada
                </p>
              ) : (
                notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                  >
                    <div className={`p-2 rounded-lg ${
                      notification.is_read ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      {notification.type === 'confirmation' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : notification.type === 'reminder' ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{notification.title}</span>
                        <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                          {notification.is_read ? 'Lida' : 'Nova'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configurações de Notificações
                </CardTitle>
                <CardDescription>
                  Gerencie como e quando você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-4">Carregando configurações...</div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="reminder">Lembretes de Agendamento</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba lembretes antes dos agendamentos
                          </p>
                        </div>
                        <Switch
                          id="reminder"
                          checked={settings?.appointment_reminder_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('appointment_reminder_enabled', checked)
                          }
                        />
                      </div>

                      {settings?.appointment_reminder_enabled && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="reminder-hours">Antecedência do lembrete</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="reminder-hours"
                              type="number"
                              min="1"
                              max="72"
                              value={settings?.appointment_reminder_hours ?? 24}
                              onChange={(e) => handleReminderHoursChange(Number(e.target.value))}
                              onBlur={() => toast.success('Antecedência atualizada')}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">horas antes</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="confirmation">Confirmações de Agendamento</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificação quando um agendamento for criado
                        </p>
                      </div>
                      <Switch
                        id="confirmation"
                        checked={settings?.appointment_confirmation_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('appointment_confirmation_enabled', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="cancelled">Cancelamentos</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificação quando um agendamento for cancelado
                        </p>
                      </div>
                      <Switch
                        id="cancelled"
                        checked={settings?.appointment_cancelled_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('appointment_cancelled_enabled', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="rescheduled">Reagendamentos</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificação quando um agendamento for reagendado
                        </p>
                      </div>
                      <Switch
                        id="rescheduled"
                        checked={settings?.appointment_rescheduled_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('appointment_rescheduled_enabled', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="marketing">Notificações de Marketing</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba promoções e novidades
                        </p>
                      </div>
                      <Switch
                        id="marketing"
                        checked={settings?.marketing_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('marketing_enabled', checked)
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {editingTemplate && (
        <NotificationTemplateEditor
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          template={editingTemplate}
        />
      )}
    </Layout>
  );
}
