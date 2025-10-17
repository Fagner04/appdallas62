import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Planos() {
  const [loading, setLoading] = useState<string | null>(null);
  const { data: subscriptionStatus, isLoading: isLoadingStatus } = useSubscriptionStatus();

  const handleSubscribe = async (planId: string, planName: string, price: number, interval: string) => {
    try {
      setLoading(planId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para assinar um plano");
        return;
      }

      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { 
          planId,
          planName,
          price,
          interval,
        }
      });

      if (error) throw error;

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Plano Mensal',
      price: 'R$ 55',
      priceValue: 55,
      period: '/mês',
      interval: 'monthly',
      description: 'Todas as funcionalidades',
      features: [
        'Barbeiros ilimitados',
        'Agendamentos ilimitados',
        'Gestão completa de clientes',
        'Relatórios avançados',
        'Sistema de fidelidade',
        'Notificações automáticas',
        'Marketing integrado',
        'Suporte prioritário',
        'Customização avançada',
      ],
      popular: true,
    },
    {
      id: 'yearly',
      name: 'Plano Anual',
      price: 'R$ 555',
      priceValue: 555,
      period: '/ano',
      interval: 'yearly',
      description: 'Todas as funcionalidades',
      features: [
        'Barbeiros ilimitados',
        'Agendamentos ilimitados',
        'Gestão completa de clientes',
        'Relatórios avançados',
        'Sistema de fidelidade',
        'Notificações automáticas',
        'Marketing integrado',
        'Suporte prioritário',
        'Customização avançada',
        'Economize 16% no valor anual',
      ],
    },
  ];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold">Planos e Assinaturas</h1>
            <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
              Gerencie seu plano e assinatura
            </p>
          </div>
        </div>

        {/* Status da Assinatura */}
        {!isLoadingStatus && subscriptionStatus && (
          <Card className="border-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {subscriptionStatus.isInTrial ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100">
                        Período de Teste Ativo
                      </p>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                        Período gratuito de avaliação
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:text-right">
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {subscriptionStatus.daysLeftInTrial}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                        {subscriptionStatus.daysLeftInTrial === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                  </div>
                  {subscriptionStatus.daysLeftInTrial <= 3 && (
                    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 p-3">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                        Teste acabando! Assine para continuar.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : subscriptionStatus.hasActiveSubscription ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base text-green-900 dark:text-green-100">
                        {subscriptionStatus.planName || 'Assinatura Ativa'}
                      </p>
                      <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-0.5">
                        Acesso completo ativo
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                          {subscriptionStatus.daysLeftInSubscription}
                        </p>
                        <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                          {subscriptionStatus.daysLeftInSubscription === 1 ? 'dia' : 'dias'}
                        </p>
                      </div>
                      <Check className="h-5 w-5 text-green-700 dark:text-green-300 ml-2" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base text-red-900 dark:text-red-100">
                      Teste Encerrado
                    </p>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-0.5">
                      Assine para continuar
                    </p>
                  </div>
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="space-y-1.5 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
                <div className="mt-3 sm:mt-4">
                  <span className="text-2xl sm:text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <ul className="space-y-1.5 sm:space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-4 sm:p-6">
                <Button 
                  className="w-full text-sm sm:text-base" 
                  size="sm"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id, plan.name, plan.priceValue, plan.interval)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? 'Processando...' : 'Assinar Agora'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Informações</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-xs sm:text-sm">Formas de Pagamento</h3>
                <p className="text-xs text-muted-foreground">
                  Cartão, débito e PIX. 100% seguro.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-xs sm:text-sm">Período de Teste</h3>
                <p className="text-xs text-muted-foreground">
                  7 dias grátis, sem compromisso.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-xs sm:text-sm">Cancelamento</h3>
                <p className="text-xs text-muted-foreground">
                  Cancele quando quiser, sem multas.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-xs sm:text-sm">Suporte</h3>
                <p className="text-xs text-muted-foreground">
                  Estamos aqui para ajudar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
