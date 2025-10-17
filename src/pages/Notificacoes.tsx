import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Users, Plus, Edit, Trash2, FileText, MessageSquare, ChevronDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { WhatsAppQRConnect } from '@/components/WhatsAppQRConnect';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationTemplates, NotificationTemplate } from '@/hooks/useNotificationTemplates';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationTemplateEditor } from '@/components/NotificationTemplateEditor';

export default function Notificacoes() {
  const { user } = useAuth();
  const { sendNotification } = useNotifications(user?.id);
  const { data: customers } = useCustomers();
  const { templates, deleteTemplate } = useNotificationTemplates();
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'confirmation' | 'reminder' | 'promotion' | 'system'>('system');
  
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | undefined>();
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const { settings: notificationSettings, updateSettings } = useNotificationSettings(user?.id);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');

  useEffect(() => {
    if (notificationSettings) {
      setWhatsappPhone(notificationSettings.whatsapp_phone || '');
      setWhatsappToken(notificationSettings.whatsapp_token || '');
      setWhatsappPhoneId(notificationSettings.whatsapp_phone_id || '');
    }
  }, [notificationSettings]);

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
      <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
            <Send className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">Notificações</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Envie notificações para seus clientes</p>
          </div>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Enviar Notificação
            </CardTitle>
            <CardDescription className="text-sm">
              Envie notificações personalizadas para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium">Template (Opcional)</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id} className="text-base sm:text-sm py-3 sm:py-2">
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
                  <label className="text-sm sm:text-base font-medium">Cliente</label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id} className="text-base sm:text-sm py-3 sm:py-2">
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium">Tipo</label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system" className="text-base sm:text-sm py-3 sm:py-2">Sistema</SelectItem>
                    <SelectItem value="confirmation" className="text-base sm:text-sm py-3 sm:py-2">Confirmação</SelectItem>
                    <SelectItem value="reminder" className="text-base sm:text-sm py-3 sm:py-2">Lembrete</SelectItem>
                    <SelectItem value="promotion" className="text-base sm:text-sm py-3 sm:py-2">Promoção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium">Título</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da notificação"
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium">Mensagem</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mensagem da notificação"
                  rows={4}
                  className="text-base sm:text-sm resize-none"
                />
              </div>
              
              <Button 
                onClick={handleSendNotification} 
                className="w-full h-11 sm:h-10 text-base sm:text-sm font-semibold"
                disabled={(!selectedCustomer && !sendToAll) || !title || !message || sendNotification.isPending}
              >
                <Send className="h-4 w-4 sm:h-4 sm:w-4 mr-2" />
                {sendNotification.isPending ? 'Enviando...' : sendToAll ? 'Enviar para Todos' : 'Enviar Notificação'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Templates de Notificações
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Crie e gerencie templates para envio rápido
                </CardDescription>
              </div>
              <Button onClick={handleCreateTemplate} size="sm" className="h-10 sm:h-9 text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {templates?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Nenhum template criado ainda
                </p>
                <Button onClick={handleCreateTemplate} variant="outline" className="h-10 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => (
                  <Card key={template.id} className="relative overflow-hidden hover-lift">
                    <CardHeader className="pb-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm sm:text-base mb-1 truncate">{template.title}</CardTitle>
                          {template.description && (
                            <CardDescription className="text-xs line-clamp-1">{template.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant={template.is_system ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {template.is_system ? 'Sistema' : 'Custom'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                        {template.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                          className="flex-1 h-9 text-xs sm:text-sm"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        {!template.is_system && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="h-9 w-9 p-0"
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

        <Collapsible open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
          <Card className="shadow-elegant">
            <CardHeader className="px-4 sm:px-6">
              <CollapsibleTrigger className="w-full">
                <CardTitle className="flex items-center justify-between w-full text-lg sm:text-xl">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Notificações WhatsApp
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isWhatsAppOpen ? 'rotate-180' : ''
                    }`}
                  />
                </CardTitle>
              </CollapsibleTrigger>
              <CardDescription className="text-left text-sm">
                Configure o recebimento de notificações via WhatsApp
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="px-4 sm:px-6 space-y-4">
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <p className="font-medium mb-1">📱 Como funciona:</p>
                  <p className="text-muted-foreground">Ao ativar, você receberá notificações importantes sobre seus agendamentos diretamente no WhatsApp.</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex-1">
                    <Label htmlFor="whatsapp-enabled" className="font-medium cursor-pointer">
                      Ativar Notificações WhatsApp
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba confirmações e lembretes no WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="whatsapp-enabled"
                    checked={notificationSettings?.whatsapp_enabled || false}
                    onCheckedChange={(checked) => {
                      updateSettings.mutate({ whatsapp_enabled: checked });
                    }}
                  />
                </div>

                {notificationSettings?.whatsapp_enabled && (
                  <>
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                      <p className="font-medium">Como configurar:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Acesse <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meta for Developers</a></li>
                        <li>Crie um aplicativo e adicione o produto WhatsApp Business</li>
                        <li>Configure um número de telefone de teste ou conecte seu número</li>
                        <li>Copie o Token de Acesso e o Phone Number ID</li>
                      </ol>
                    </div>

                    <div className="flex items-center gap-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">Configuração Rápida</span>
                      <Separator className="flex-1" />
                    </div>

                    <div className="flex justify-center">
                      <WhatsAppQRConnect
                        onCredentialsScanned={(token, phoneId) => {
                          setWhatsappToken(token);
                          setWhatsappPhoneId(phoneId);
                          toast.success('Credenciais carregadas via QR code!');
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">Ou configure manualmente</span>
                      <Separator className="flex-1" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-token">Token de Acesso</Label>
                      <Input
                        id="whatsapp-token"
                        type="password"
                        placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={whatsappToken}
                        onChange={(e) => setWhatsappToken(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
                      <Input
                        id="whatsapp-phone-id"
                        placeholder="123456789012345"
                        value={whatsappPhoneId}
                        onChange={(e) => setWhatsappPhoneId(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-phone">Seu Número do WhatsApp (opcional)</Label>
                      <Input
                        id="whatsapp-phone"
                        type="tel"
                        placeholder="+5562999999999"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Número associado à sua conta WhatsApp Business
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => {
                        if (whatsappToken && whatsappPhoneId) {
                          updateSettings.mutate({ 
                            whatsapp_token: whatsappToken,
                            whatsapp_phone_id: whatsappPhoneId,
                            whatsapp_phone: whatsappPhone || null
                          });
                        } else {
                          toast.error('Por favor, preencha o Token e o Phone Number ID');
                        }
                      }}
                      disabled={updateSettings.isPending}
                      className="w-full"
                    >
                      {updateSettings.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Configurações WhatsApp'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
