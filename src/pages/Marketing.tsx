import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Users, TrendingUp, Award, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useLoyaltyCoupons, useLoyaltyStats } from '@/hooks/useLoyalty';
import { useCustomers } from '@/hooks/useCustomers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Marketing() {
  const { coupons, redeemCoupon } = useLoyaltyCoupons();
  const { stats } = useLoyaltyStats();
  const { data: customers } = useCustomers();

  const handleRedeem = async (couponId: string) => {
    await redeemCoupon.mutateAsync(couponId);
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

        {/* Cupons */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Cupons</CardTitle>
            <CardDescription>
              Visualize e gerencie os cupons de fidelidade dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Ativos ({activeCoupons.length})
                </TabsTrigger>
                <TabsTrigger value="redeemed">
                  Resgatados ({redeemedCoupons.length})
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
