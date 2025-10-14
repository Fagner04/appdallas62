import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Users, TrendingUp, Award, Calendar, CheckCircle2, XCircle, Plus, Minus, RotateCcw, Bell, Send, Clock, Sparkles, MessageSquare } from 'lucide-react';
import { useLoyaltyCoupons, useLoyaltyStats, useUpdateCustomerPoints } from '@/hooks/useLoyalty';
import { useCustomers } from '@/hooks/useCustomers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useNotifications, useNotificationStats } from '@/hooks/useNotifications';
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates';
import { NotificationTemplateEditor } from '@/components/NotificationTemplateEditor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Marketing() {
  const { user } = useAuth();
  const { coupons, redeemCoupon } = useLoyaltyCoupons();
  const { stats } = useLoyaltyStats();
  const { data: customers } = useCustomers();
  const updatePoints = useUpdateCustomerPoints();
  const { notifications, sendNotification } = useNotifications(user?.id);
  const { data: notificationStats } = useNotificationStats();
  const { templates } = useNotificationTemplates();

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [pointsDialog, setPointsDialog] = useState(false);
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsAction, setPointsAction] = useState<'add' | 'remove' | 'set'>('add');
  
  // Notification states
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [selectedNotificationCustomer, setSelectedNotificationCustomer] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'confirmation' | 'reminder' | 'promotion' | 'system'>('system');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const handleRedeem = async (couponId: string) => {
    await redeemCoupon.mutateAsync(couponId);
  };

  const handlePointsUpdate = async () => {
    if (!selectedCustomer || !pointsAmount) return;
    
    await updatePoints.mutateAsync({
      customerId: selectedCustomer,
      points: parseInt(pointsAmount),
      action: pointsAction,
    });
    
    setPointsDialog(false);
    setPointsAmount('');
    setSelectedCustomer(null);
  };

  const openPointsDialog = (customerId: string, action: 'add' | 'remove' | 'set') => {
    setSelectedCustomer(customerId);
    setPointsAction(action);
    setPointsDialog(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setNotificationTitle(template.title);
      setNotificationMessage(template.message);
      setNotificationType(template.type as any);
    }
  };

  const handleSendNotification = async () => {
    if ((!selectedNotificationCustomer && !sendToAll) || !notificationTitle || !notificationMessage) return;

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
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            related_id: null,
          });
          successCount++;
        } catch (error) {
          console.error('Erro ao enviar notificação para', customer.name, error);
        }
      }

      toast.success(`Notificação enviada para ${successCount} cliente(s)`);
    } else {
      const customer = customers?.find((c) => c.id === selectedNotificationCustomer);
      if (!customer?.user_id) return;

      sendNotification.mutate({
        user_id: customer.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        related_id: null,
      });
    }

    setIsNotificationDialogOpen(false);
    setSelectedNotificationCustomer('');
    setSendToAll(false);
    setSelectedTemplate('');
    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationType('system');
  };

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

  const activeCoupons = coupons?.filter(c => !c.is_redeemed) || [];
  const redeemedCoupons = coupons?.filter(c => c.is_redeemed) || [];

  const statsCards = [
    { 
      label: 'Total de Cupons Ativos', 
      value: activeCoupons.length, 
      icon: Gift, 
      color: 'text-primary' 
    },
    { 
      label: 'Cupons Resgatados', 
      value: redeemedCoupons.length, 
      icon: CheckCircle2, 
      color: 'text-success' 
    },
    { 
      label: 'Clientes Fidelizados', 
      value: stats?.loyalCustomers || 0, 
      icon: Users, 
      color: 'text-warning' 
    },
    { 
      label: 'Taxa de Conversão', 
      value: stats?.conversionRate ? `${stats.conversionRate}%` : '0%', 
      icon: TrendingUp, 
      color: 'text-info' 
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Marketing & Fidelidade</h1>
          <p className="text-muted-foreground">
            Gerencie o programa de fidelidade e cupons dos clientes
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
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

        {/* Programa de Fidelidade Info */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Programa de Fidelidade</CardTitle>
                <CardDescription className="mt-1">
                  A cada 10 cortes completados, o cliente ganha 1 corte grátis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Pontos por Corte</p>
                <p className="text-2xl font-bold">1 ponto</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Pontos para Cupom</p>
                <p className="text-2xl font-bold">10 pontos</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Validade do Cupom</p>
                <p className="text-2xl font-bold">90 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-primary/20 hover:border-primary/40"
          onClick={() => setIsNotificationDialogOpen(true)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Enviar Notificações</CardTitle>
                  <CardDescription className="mt-1">
                    Comunique-se com seus clientes através de notificações personalizadas
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {notificationStats?.sentToday || 0} hoje
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {notificationStats?.confirmations || 0} confirmadas
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Cupons e Pontos */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Programa de Fidelidade</CardTitle>
            <CardDescription>
              Visualize e gerencie cupons e pontos de fidelidade dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Cupons Ativos ({activeCoupons.length})
                </TabsTrigger>
                <TabsTrigger value="redeemed">
                  Cupons Resgatados ({redeemedCoupons.length})
                </TabsTrigger>
                <TabsTrigger value="points">
                  Pontos dos Clientes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4 mt-4">
                {activeCoupons.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum cupom ativo no momento
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeCoupons.map((coupon) => {
                      const customer = customers?.find(c => c.id === coupon.customer_id);
                      return (
                        <Card key={coupon.id} className="border-primary/20">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="default" className="bg-success">
                                Ativo
                              </Badge>
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-lg mt-2">
                              {customer?.name || 'Cliente'}
                            </CardTitle>
                            <CardDescription className="font-mono text-xs">
                              {coupon.code}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Criado</p>
                              <p className="text-sm">
                                {formatDistanceToNow(new Date(coupon.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                            {coupon.expires_at && (
                              <div>
                                <p className="text-xs text-muted-foreground">Expira em</p>
                                <p className="text-sm">
                                  {formatDistanceToNow(new Date(coupon.expires_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            )}
                            <Button
                              onClick={() => handleRedeem(coupon.id)}
                              disabled={redeemCoupon.isPending}
                              className="w-full"
                              size="sm"
                            >
                              Resgatar Cupom
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="redeemed" className="space-y-4 mt-4">
                {redeemedCoupons.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum cupom resgatado ainda
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {redeemedCoupons.map((coupon) => {
                      const customer = customers?.find(c => c.id === coupon.customer_id);
                      return (
                        <Card key={coupon.id} className="opacity-75">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">
                                Resgatado
                              </Badge>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            </div>
                            <CardTitle className="text-lg mt-2">
                              {customer?.name || 'Cliente'}
                            </CardTitle>
                            <CardDescription className="font-mono text-xs">
                              {coupon.code}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Resgatado em</p>
                              <p className="text-sm">
                                {coupon.redeemed_at &&
                                  formatDistanceToNow(new Date(coupon.redeemed_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Nova aba de Pontos */}
              <TabsContent value="points" className="space-y-4 mt-4">
                {!customers || customers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum cliente cadastrado
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customers.map((customer) => (
                      <Card key={customer.id} className="border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{customer.name}</CardTitle>
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Award className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <CardDescription>
                            {customer.loyalty_points || 0} pontos de fidelidade
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              onClick={() => openPointsDialog(customer.id, 'add')}
                              size="sm"
                              variant="outline"
                              className="gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Adicionar
                            </Button>
                            <Button
                              onClick={() => openPointsDialog(customer.id, 'remove')}
                              size="sm"
                              variant="outline"
                              className="gap-1"
                            >
                              <Minus className="h-3 w-3" />
                              Remover
                            </Button>
                            <Button
                              onClick={() => openPointsDialog(customer.id, 'set')}
                              size="sm"
                              variant="outline"
                              className="gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Definir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para gerenciar pontos */}
      <Dialog open={pointsDialog} onOpenChange={setPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pointsAction === 'add' && 'Adicionar Pontos'}
              {pointsAction === 'remove' && 'Remover Pontos'}
              {pointsAction === 'set' && 'Definir Pontos'}
            </DialogTitle>
            <DialogDescription>
              {pointsAction === 'add' && 'Adicione pontos de fidelidade ao cliente'}
              {pointsAction === 'remove' && 'Remova pontos de fidelidade do cliente'}
              {pointsAction === 'set' && 'Defina a quantidade exata de pontos do cliente'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="points">Quantidade de Pontos</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                placeholder={pointsAction === 'set' ? 'Ex: 5' : 'Ex: 1'}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPointsDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePointsUpdate}
                disabled={!pointsAmount || updatePoints.isPending}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para enviar notificações */}
      <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enviar Notificação
            </DialogTitle>
            <DialogDescription>
              Envie notificações personalizadas para seus clientes
            </DialogDescription>
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
                      setSelectedNotificationCustomer('');
                    }
                  }}
                />
              </div>
            </div>
            
            {!sendToAll && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select value={selectedNotificationCustomer} onValueChange={setSelectedNotificationCustomer}>
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
              <Select value={notificationType} onValueChange={(v: any) => setNotificationType(v)}>
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
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Título da notificação"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Mensagem da notificação"
                rows={4}
              />
            </div>
            <Button 
              onClick={handleSendNotification} 
              className="w-full"
              disabled={(!selectedNotificationCustomer && !sendToAll) || !notificationTitle || !notificationMessage || sendNotification.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendNotification.isPending ? 'Enviando...' : sendToAll ? 'Enviar para Todos' : 'Enviar Notificação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
