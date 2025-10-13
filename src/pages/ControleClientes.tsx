import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Calendar, DollarSign, Ban, Eye, Clock, Trash2 } from 'lucide-react';
import { useClientFeatures } from '@/hooks/useClientFeatures';

interface ClientFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export default function ControleClientes() {
  const { isFeatureEnabled, toggleFeature } = useClientFeatures();

  const featuresList: ClientFeature[] = [
    {
      id: 'online_booking',
      title: 'Agendamentos Online',
      description: 'Permitir que clientes façam agendamentos pelo sistema',
      icon: Calendar,
    },
    {
      id: 'show_prices',
      title: 'Mostrar Preços',
      description: 'Exibir valores dos serviços para clientes',
      icon: DollarSign,
    },
    {
      id: 'cancel_appointments',
      title: 'Cancelamento de Agendamentos',
      description: 'Permitir que clientes cancelem seus próprios agendamentos',
      icon: Ban,
    },
    {
      id: 'view_history',
      title: 'Ver Histórico',
      description: 'Clientes podem ver histórico completo de serviços',
      icon: Clock,
    },
    {
      id: 'view_blocked_times',
      title: 'Ver Horários Bloqueados',
      description: 'Mostrar horários bloqueados no calendário do cliente',
      icon: Eye,
    },
    {
      id: 'delete_notifications',
      title: 'Apagar Notificações',
      description: 'Permitir que clientes apaguem suas próprias notificações',
      icon: Trash2,
    },
  ];

  const handleToggle = (featureId: string, featureTitle: string) => {
    toggleFeature(featureId, featureTitle);
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Controle de Funcionalidades
          </h1>
          <p className="text-muted-foreground">
            Gerencie quais funcionalidades estarão disponíveis para seus clientes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permissões de Clientes</CardTitle>
            <CardDescription>
              Ative ou desative funcionalidades específicas para a área do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {featuresList.map((feature, index) => (
              <div key={feature.id}>
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={feature.id}
                        className="text-base font-medium cursor-pointer"
                      >
                        {feature.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={feature.id}
                    checked={isFeatureEnabled(feature.id)}
                    onCheckedChange={() => handleToggle(feature.id, feature.title)}
                  />
                </div>
                {index < featuresList.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">ℹ️ Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • As alterações são aplicadas imediatamente para todos os clientes
            </p>
            <p>
              • Funcionalidades desabilitadas não aparecerão na área do cliente
            </p>
            <p>
              • Recomendamos manter "Agendamentos Online" sempre ativo
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
