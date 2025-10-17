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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold">Planos e Assinaturas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie seu plano e assinatura
            </p>
          </div>
        </div>

        {/* Status da Assinatura */}
        {!isLoadingStatus && subscriptionStatus && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status da Sua Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionStatus.isInTrial ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Período de Teste Ativo
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Você está no período gratuito de avaliação
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {subscriptionStatus.daysLeftInTrial}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {subscriptionStatus.daysLeftInTrial === 1 ? 'dia restante' : 'dias restantes'}
                      </p>
                    </div>
                  </div>
                  {subscriptionStatus.daysLeftInTrial <= 3 && (
                    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        Seu período de teste está acabando! Assine um plano para continuar usando todas as funcionalidades.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : subscriptionStatus.hasActiveSubscription ? (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Assinatura Ativa
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Você tem acesso completo a todas as funcionalidades
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">Ativo</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        Período de Teste Encerrado
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Assine um plano para continuar usando
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm sm:text-base">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
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
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm sm:text-base">Formas de Pagamento</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Aceitamos cartão de crédito, débito e PIX. Pagamento 100% seguro.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm sm:text-base">Período de Teste</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Todos os planos incluem 7 dias de teste gratuito, sem compromisso.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm sm:text-base">Cancelamento</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cancele a qualquer momento, sem multa ou taxas adicionais.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm sm:text-base">Suporte</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nossa equipe está disponível para ajudar no que precisar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
