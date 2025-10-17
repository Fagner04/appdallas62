import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Planos() {
  const plans = [
    {
      name: 'Plano Mensal',
      price: 'R$ 55',
      period: '/mês',
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
      name: 'Plano Anual',
      price: 'R$ 555',
      period: '/ano',
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl sm:text-4xl font-bold">Planos e Assinaturas</h1>
              <Badge variant="secondary" className="text-xs">
                Em Desenvolvimento
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie seu plano e assinatura
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Funcionalidade em Desenvolvimento</AlertTitle>
          <AlertDescription>
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
            Em caso de dúvidas sobre planos, entre em contato com nosso suporte.
          </AlertDescription>
        </Alert>

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
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled
                >
                  Em breve
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
