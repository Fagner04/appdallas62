import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Send, Calendar, CheckCircle2, Clock, Plus, Sparkles, Gift, MessageSquare, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, useNotificationStats } from '@/hooks/useNotifications';
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationTemplateEditor } from '@/components/NotificationTemplateEditor';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function Notificacoes() {
  const { user } = useAuth();
  const { notifications, sendNotification } = useNotifications(user?.id);
  const { data: stats } = useNotificationStats();
  const { data: customers } = useCustomers();
  const { templates } = useNotificationTemplates();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'confirmation' | 'reminder' | 'promotion' | 'system'>('system');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setMessage(template.message);
      setType(template.type as any);
    }
  };

  const handleSendNotification = async () => {
    if ((!selectedCustomer && !sendToAll) || !title || !message) return;

    if (sendToAll) {
      // Enviar apenas para clientes (excluindo admins e barbeiros)
      const customersWithUserId = customers?.filter(c => c.user_id) || [];
      
      if (customersWithUserId.length === 0) {
        toast.error('Nenhum cliente encontrado para enviar notificação');
        return;
      }

      // Filtrar apenas usuários com role 'customer'
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer')
        .in('user_id', customersWithUserId.map(c => c.user_id!));

      const customerUserIds = new Set(userRoles?.map(r => r.user_id) || []);
      const customersOnly = customersWithUserId.filter(c => customerUserIds.has(c.user_id!));

      if (customersOnly.length === 0) {
        toast.error('Nenhum cliente encontrado para enviar notificação');
        return;
      }

      let successCount = 0;
      for (const customer of customersOnly) {
        try {
          await sendNotification.mutateAsync({
            user_id: customer.user_id!,
            title,
            message,
            type,
            related_id: null,
          });
          successCount++;
        } catch (error) {
          console.error('Erro ao enviar notificação para', customer.name, error);
        }
      }

      toast.success(`Notificação enviada para ${successCount} cliente(s)`);
    } else {
      // Enviar para cliente específico
      const customer = customers?.find((c) => c.id === selectedCustomer);
      if (!customer?.user_id) return;

      sendNotification.mutate({
        user_id: customer.user_id,
        title,
        message,
        type,
        related_id: null,
      });
    }

    setIsDialogOpen(false);
    setSelectedCustomer('');
    setSendToAll(false);
    setSelectedTemplate('');
    setTitle('');
    setMessage('');
    setType('system');
  };

  const statsCards = [
    { label: 'Enviadas Hoje', value: stats?.sentToday || 0, icon: Send, color: 'text-primary' },
    { label: 'Confirmações', value: stats?.confirmations || 0, icon: CheckCircle2, color: 'text-success' },
    { label: 'Pendentes', value: stats?.pending || 0, icon: Clock, color: 'text-warning' },
  ];

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Calendar,
      Bell,
      CheckCircle2,
      Sparkles,
      Gift,
      MessageSquare,
    };
    return icons[iconName] || Bell;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notificações</h1>
          <p className="text-muted-foreground">Gerencie as notificações automáticas para clientes</p>
        </div>

        <div className="space-y-6 mt-6">

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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Templates de Notificações</CardTitle>
            <Button size="sm" onClick={() => setIsCreatingTemplate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {templates?.map((template) => {
                const IconComponent = getIconComponent(template.icon);
                return (
                  <div 
                    key={template.id} 
                    className="p-4 rounded-lg border border-border space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{template.title}</span>
                      {template.is_system && (
                        <Badge variant="secondary" className="text-xs">Sistema</Badge>
                      )}
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
                );
              })}
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
                    <label className="text-sm font-medium">Template (Opcional)</label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className={`
                    p-4 rounded-lg border-2 transition-all duration-300
                    ${sendToAll 
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                      : 'border-border bg-muted/30'
                    }
                  `}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-full transition-all duration-300
                          ${sendToAll ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                        `}>
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <label
                            htmlFor="sendToAll"
                            className="text-sm font-semibold cursor-pointer block"
                          >
                            Enviar para todos os clientes
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {sendToAll ? 'Todos receberão esta notificação' : 'Enviar apenas para um cliente'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="sendToAll"
                        checked={sendToAll}
                        onCheckedChange={(checked) => {
                          setSendToAll(checked);
                          if (checked) {
                            setSelectedCustomer('');
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {!sendToAll && (
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
                  )}
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
                    disabled={(!selectedCustomer && !sendToAll) || !title || !message || sendNotification.isPending}
                  >
                    {sendNotification.isPending ? 'Enviando...' : sendToAll ? 'Enviar para Todos' : 'Enviar Notificação'}
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
        </div>
      </div>

      {editingTemplate && (
        <NotificationTemplateEditor
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          template={editingTemplate}
        />
      )}
      
      {isCreatingTemplate && (
        <NotificationTemplateEditor
          isOpen={isCreatingTemplate}
          onClose={() => setIsCreatingTemplate(false)}
          template={{
            type: 'custom',
            title: '',
            description: '',
            message: '',
            icon: 'Bell',
          }}
          isNew={true}
        />
      )}
    </Layout>
  );
}
