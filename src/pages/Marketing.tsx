import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Users, TrendingUp, Award, Calendar, CheckCircle2, XCircle, Plus, Minus, RotateCcw } from 'lucide-react';
import { useLoyaltyCoupons, useLoyaltyStats, useUpdateCustomerPoints } from '@/hooks/useLoyalty';
import { useCustomers } from '@/hooks/useCustomers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Marketing() {
  const { coupons, redeemCoupon } = useLoyaltyCoupons();
  const { stats } = useLoyaltyStats();
  const { data: customers } = useCustomers();
  const updatePoints = useUpdateCustomerPoints();

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [pointsDialog, setPointsDialog] = useState(false);
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsAction, setPointsAction] = useState<'add' | 'remove' | 'set'>('add');

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
      <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Marketing & Fidelidade</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie o programa de fidelidade e cupons dos clientes
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent className="px-3 sm:px-4">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stat.value}</div>
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
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg truncate">{customer.name}</CardTitle>
                              <CardDescription className="text-xs sm:text-sm mt-1">
                                <span className="font-semibold">{customer.loyalty_points || 0}</span> pontos
                              </CardDescription>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                              <Award className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => openPointsDialog(customer.id, 'add')}
                              size="sm"
                              variant="outline"
                              className="gap-1 flex-1"
                            >
                              <Plus className="h-3 w-3" />
                              <span className="text-xs sm:text-sm">Adicionar</span>
                            </Button>
                            <Button
                              onClick={() => openPointsDialog(customer.id, 'remove')}
                              size="sm"
                              variant="outline"
                              className="gap-1 flex-1"
                            >
                              <Minus className="h-3 w-3" />
                              <span className="text-xs sm:text-sm">Remover</span>
                            </Button>
                            <Button
                              onClick={() => openPointsDialog(customer.id, 'set')}
                              size="sm"
                              variant="outline"
                              className="gap-1 flex-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span className="text-xs sm:text-sm">Definir</span>
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
              <Label htmlFor="points" className="text-sm sm:text-base">Quantidade de Pontos</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                placeholder={pointsAction === 'set' ? 'Ex: 5' : 'Ex: 1'}
                className="h-11 sm:h-10 text-base sm:text-sm"
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
    </Layout>
  );
}
