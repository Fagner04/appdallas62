import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Planos() {
  const plans = [
    {
      name: 'Básico',
      price: 'R$ 99',
      period: '/mês',
      description: 'Ideal para barbearias pequenas',
      features: [
        'Até 2 barbeiros',
        'Agendamentos ilimitados',
        'Gestão de clientes',
        'Relatórios básicos',
        'Suporte por email',
      ],
    },
    {
      name: 'Profissional',
      price: 'R$ 199',
      period: '/mês',
      description: 'Para barbearias em crescimento',
      features: [
        'Até 5 barbeiros',
        'Agendamentos ilimitados',
        'Gestão completa de clientes',
        'Relatórios avançados',
        'Sistema de fidelidade',
        'Notificações automáticas',
        'Suporte prioritário',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      price: 'R$ 299',
      period: '/mês',
      description: 'Para grandes barbearias',
      features: [
        'Barbeiros ilimitados',
        'Agendamentos ilimitados',
        'Gestão completa de clientes',
        'Relatórios personalizados',
        'Sistema de fidelidade premium',
        'Notificações automáticas',
        'Marketing integrado',
        'Suporte 24/7',
        'Customização avançada',
      ],
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold">Planos e Assinaturas</h1>
              <Badge variant="secondary" className="text-xs">
                Em Desenvolvimento
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
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

        <div className="grid gap-6 md:grid-cols-3">
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
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
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
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">Formas de Pagamento</h3>
                <p className="text-sm text-muted-foreground">
                  Aceitamos cartão de crédito, débito e PIX. Pagamento 100% seguro.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Período de Teste</h3>
                <p className="text-sm text-muted-foreground">
                  Todos os planos incluem 7 dias de teste gratuito, sem compromisso.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Cancelamento</h3>
                <p className="text-sm text-muted-foreground">
                  Cancele a qualquer momento, sem multa ou taxas adicionais.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Suporte</h3>
                <p className="text-sm text-muted-foreground">
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
