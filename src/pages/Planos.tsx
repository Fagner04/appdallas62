import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Construction } from 'lucide-react';

export default function Planos() {
  const plans = [
    {
      name: 'Básico',
      price: 'R$ 49,90',
      period: '/mês',
      features: [
        'Até 100 agendamentos/mês',
        'Sistema de notificações',
        'Relatórios básicos',
        'Suporte por email',
      ],
    },
    {
      name: 'Profissional',
      price: 'R$ 99,90',
      period: '/mês',
      popular: true,
      features: [
        'Agendamentos ilimitados',
        'Sistema de notificações avançado',
        'Relatórios completos',
        'Programa de fidelidade',
        'Suporte prioritário',
      ],
    },
    {
      name: 'Premium',
      price: 'R$ 149,90',
      period: '/mês',
      features: [
        'Tudo do Profissional',
        'Multi-estabelecimentos',
        'API de integração',
        'Dashboard personalizado',
        'Suporte 24/7',
      ],
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-bold">Planos e Assinaturas</h1>
            <Badge variant="outline" className="gap-1">
              <Construction className="h-3 w-3" />
              Em Desenvolvimento
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Escolha o plano ideal para seu negócio
          </p>
        </div>

        {/* Alert de desenvolvimento */}
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Construction className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Funcionalidade em Desenvolvimento</h3>
                <p className="text-sm text-muted-foreground">
                  O sistema de planos e assinaturas está sendo desenvolvido e estará disponível em breve. 
                  Os planos abaixo são apenas demonstrativos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planos */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative ${
                plan.popular 
                  ? 'border-primary shadow-lg shadow-primary/20' 
                  : 'opacity-60 pointer-events-none'
              }`}
            >
              {plan.popular && (
                <Badge 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary"
                >
                  Mais Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-full ${
                    plan.popular ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <CreditCard className={`h-8 w-8 ${
                      plan.popular ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Informações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Importantes</CardTitle>
            <CardDescription>
              Detalhes sobre planos e assinaturas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm">Todos os planos incluem atualizações gratuitas</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm">Cancele a qualquer momento, sem multas</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm">Suporte técnico incluído em todos os planos</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm">Migração de dados gratuita</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
