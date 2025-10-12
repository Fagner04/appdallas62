import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Calendar, DollarSign, Ban, Bell, Eye, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ClientFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
}

export default function ControleClientes() {
  const [features, setFeatures] = useState<ClientFeature[]>([
    {
      id: 'online_booking',
      title: 'Agendamentos Online',
      description: 'Permitir que clientes façam agendamentos pelo sistema',
      icon: Calendar,
      enabled: true,
    },
    {
      id: 'show_prices',
      title: 'Mostrar Preços',
      description: 'Exibir valores dos serviços para clientes',
      icon: DollarSign,
      enabled: true,
    },
    {
      id: 'cancel_appointments',
      title: 'Cancelamento de Agendamentos',
      description: 'Permitir que clientes cancelem seus próprios agendamentos',
      icon: Ban,
      enabled: false,
    },
    {
      id: 'view_history',
      title: 'Ver Histórico',
      description: 'Clientes podem ver histórico completo de serviços',
      icon: Clock,
      enabled: true,
    },
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Enviar notificações de lembrete aos clientes',
      icon: Bell,
      enabled: true,
    },
    {
      id: 'view_blocked_times',
      title: 'Ver Horários Bloqueados',
      description: 'Mostrar horários bloqueados no calendário do cliente',
      icon: Eye,
      enabled: true,
    },
  ]);

  const handleToggle = (featureId: string) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
    
    const feature = features.find((f) => f.id === featureId);
    const newState = !feature?.enabled;
    
    toast.success(
      `${feature?.title} ${newState ? 'habilitada' : 'desabilitada'} para clientes`
    );
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
            {features.map((feature, index) => (
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
                    checked={feature.enabled}
                    onCheckedChange={() => handleToggle(feature.id)}
                  />
                </div>
                {index < features.length - 1 && (
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
