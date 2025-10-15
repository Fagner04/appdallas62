import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoyaltyCard } from '@/components/LoyaltyCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Star, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { useCustomerLoyalty } from '@/hooks/useLoyalty';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientMarketing() {
  const { user } = useAuth();
  const { data: loyaltyData, refetch } = useCustomerLoyalty(user?.id || '');
  const [generatingCoupon, setGeneratingCoupon] = useState(false);

  const points = loyaltyData?.points || 0;
  const availableCoupons = loyaltyData?.availableCoupons || [];
  const canGenerateCoupon = points >= 10;

  const handleGenerateCoupon = async () => {
    if (!user?.id || points < 10) return;
    
    setGeneratingCoupon(true);
    try {
      // Buscar customer_id
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customerData) {
        toast.error('Erro ao identificar cliente');
        return;
      }

      // Gerar código único
      const couponCode = 'CUPOM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Criar o cupom
      const { error: couponError } = await supabase
        .from('loyalty_coupons')
        .insert({
          customer_id: customerData.id,
          code: couponCode,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (couponError) throw couponError;

      // Resetar pontos para 0
      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: 0 })
        .eq('id', customerData.id);

      if (updateError) throw updateError;

      // Registrar no histórico
      await supabase
        .from('loyalty_history')
        .insert({
          customer_id: customerData.id,
          points_change: -10,
          points_balance: 0,
          action: 'coupon_generated',
          description: `Cupom de fidelidade gerado: ${couponCode}`
        });

      toast.success(`Cupom gerado com sucesso! Código: ${couponCode} 🎉`);
      refetch();
    } catch (error) {
      console.error('Erro ao gerar cupom:', error);
      toast.error('Erro ao gerar cupom');
    } finally {
      setGeneratingCoupon(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl shadow-elegant bg-card border">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Marketing & Promoções</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Aproveite nosso programa de fidelidade e promoções exclusivas
            </p>
          </div>
        </div>

        {/* Pontos e Resgate de Cupons */}
        <Card className="border-primary/20 shadow-elegant">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Seus Pontos de Fidelidade
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  A cada 10 pontos, você ganha um cupom de corte grátis!
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg sm:text-2xl px-3 sm:px-4 py-1.5 sm:py-2 font-bold">
                  {points} pontos
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 sm:pt-6">
            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>Progresso para próximo cupom</span>
                <span className="font-semibold">{points}/10</span>
              </div>
              <div className="h-3 sm:h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                  style={{ width: `${Math.min((points / 10) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Botão de Resgate */}
            {canGenerateCoupon && (
              <Button
                onClick={handleGenerateCoupon}
                disabled={generatingCoupon}
                className="w-full"
                size="lg"
              >
                {generatingCoupon ? (
                  <>
                    <Gift className="mr-2 h-5 w-5 animate-spin" />
                    Gerando cupom...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-5 w-5" />
                    Resgatar Cupom de Corte Grátis
                  </>
                )}
              </Button>
            )}

            {!canGenerateCoupon && points > 0 && (
              <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Faltam <span className="font-bold text-foreground">{10 - points} pontos</span> para gerar um cupom!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cupons Disponíveis */}
        {availableCoupons.length > 0 && (
          <Card className="border-success/20 shadow-elegant">
            <CardHeader className="bg-gradient-to-r from-success/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Gift className="h-5 w-5 text-success" />
                Seus Cupons Disponíveis
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use seus cupons ao agendar um novo serviço
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6">
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                {availableCoupons.map((coupon: any) => (
                  <Card key={coupon.id} className="border-success/30 bg-gradient-to-br from-success/5 to-transparent">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="bg-success">
                          Disponível
                        </Badge>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 rounded-lg bg-background border-2 border-dashed border-success/30">
                        <p className="text-xs text-muted-foreground mb-1">Código do Cupom</p>
                        <p className="font-mono text-base sm:text-lg font-bold text-success">
                          {coupon.code}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                          <span className="text-muted-foreground">Corte Grátis</span>
                        </div>
                        {coupon.expires_at && (
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Expira {formatDistanceToNow(new Date(coupon.expires_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Use este código ao agendar seu próximo serviço para ganhar um corte grátis!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Programa de Fidelidade */}
        <LoyaltyCard />

        {/* Promoções Futuras - Placeholder */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-lift border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ofertas Especiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fique atento às nossas ofertas especiais e promoções sazonais!
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-accent" />
                Novidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Novos serviços e tratamentos exclusivos em breve!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
