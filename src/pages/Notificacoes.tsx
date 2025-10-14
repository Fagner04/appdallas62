import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, CheckCircle2, Clock, Gift, Calendar, Send, Users, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationTemplates, NotificationTemplate } from '@/hooks/useNotificationTemplates';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { NotificationTemplateEditor } from '@/components/NotificationTemplateEditor';

export default function Notificacoes() {
  const { user } = useAuth();
  const { notifications, markAsRead, sendNotification } = useNotifications(user?.id);
  const { data: customers } = useCustomers();
  const { templates, deleteTemplate } = useNotificationTemplates();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'confirmation' | 'reminder' | 'promotion' | 'system'>('system');
  
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | undefined>();
  const [isNewTemplate, setIsNewTemplate] = useState(false);

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

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
      const customersWithUserId = customers?.filter(c => c.user_id) || [];
      
      if (customersWithUserId.length === 0) {
        toast.error('Nenhum cliente encontrado para enviar notificação');
        return;
      }

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

  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setIsNewTemplate(true);
    setIsTemplateEditorOpen(true);
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setIsNewTemplate(false);
    setIsTemplateEditorOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplate.mutate(templateId);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">Minhas Notificações</h1>
            <p className="text-muted-foreground">Acompanhe suas notificações e atualizações</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notificações Recentes</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Enviar Notificação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Enviar Notificação
                  </DialogTitle>
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
                    <Send className="h-4 w-4 mr-2" />
                    {sendNotification.isPending ? 'Enviando...' : sendToAll ? 'Enviar para Todos' : 'Enviar Notificação'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications?.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhuma notificação encontrada
                  </p>
                </div>
              ) : (
                notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer
                      transition-all duration-300
                      ${notification.is_read 
                        ? 'border-border hover:bg-muted/50' 
                        : 'border-primary/30 bg-primary/5 hover:bg-primary/10 shadow-sm shadow-primary/20'
                      }
                    `}
                  >
                    <div className={`
                      p-3 rounded-lg transition-all duration-300
                      ${notification.is_read ? 'bg-muted' : 'bg-primary/20'}
                    `}>
                      {notification.type === 'confirmation' ? (
                        <CheckCircle2 className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      ) : notification.type === 'reminder' ? (
                        <Clock className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      ) : notification.type === 'promotion' ? (
                        <Gift className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      ) : (
                        <Bell className={`h-5 w-5 ${!notification.is_read && 'text-primary'}`} />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${!notification.is_read && 'text-primary'}`}>
                          {notification.title}
                        </span>
                        <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                          {notification.is_read ? 'Lida' : 'Nova'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Templates de Notificações Automáticas
                </CardTitle>
                <CardDescription>
                  Crie e gerencie templates para envio rápido de notificações
                </CardDescription>
              </div>
              <Button onClick={handleCreateTemplate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {templates?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Nenhum template criado ainda
                </p>
                <Button onClick={handleCreateTemplate} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => (
                  <Card key={template.id} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">{template.title}</CardTitle>
                          {template.description && (
                            <CardDescription className="text-xs">{template.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant={template.is_system ? 'default' : 'secondary'} className="ml-2">
                          {template.is_system ? 'Sistema' : 'Customizado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {template.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        {!template.is_system && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <NotificationTemplateEditor
          isOpen={isTemplateEditorOpen}
          onClose={() => {
            setIsTemplateEditorOpen(false);
            setEditingTemplate(undefined);
            setIsNewTemplate(false);
          }}
          template={editingTemplate}
          isNew={isNewTemplate}
        />
      </div>
    </Layout>
  );
}
