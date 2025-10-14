import React from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User,
  Mail, 
  Phone,
  Bell,
  Loader2,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { useCustomerProfile } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AvatarUpload } from '@/components/AvatarUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PerfilCliente() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const { settings, isLoading: settingsLoading, updateSettings } = useNotificationSettings(user?.id);
  const [isReminderOpen, setIsReminderOpen] = React.useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);
  const [isCancelledOpen, setIsCancelledOpen] = React.useState(false);
  const [isRescheduledOpen, setIsRescheduledOpen] = React.useState(false);
  const [isMarketingOpen, setIsMarketingOpen] = React.useState(false);

  const handleNotificationToggle = async (key: string, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
    }
  };

  const handleReminderHoursChange = async (hours: number) => {
    if (hours >= 1 && hours <= 72) {
      try {
        await updateSettings.mutateAsync({ appointment_reminder_hours: hours });
        toast.success('Antecedência atualizada');
      } catch (error) {
        console.error('Erro ao atualizar horas:', error);
      }
    }
  };

  const handleReminderHoursSelect = async (value: string) => {
    const hours = parseInt(value);
    await handleReminderHoursChange(hours);
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header do Perfil */}
        <div className="relative overflow-hidden rounded-xl shadow-elegant bg-card border">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              Meu Perfil
            </h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
          </div>
        </div>

        {/* Configurações de Notificações */}
        <Card className="shadow-elegant border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              Configurações de Notificações
            </CardTitle>
            <CardDescription>
              Gerencie como e quando você deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Lembretes de Agendamento */}
                <Collapsible open={isReminderOpen} onOpenChange={setIsReminderOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth cursor-pointer group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="space-y-1 flex-1">
                          <Label className="text-base font-semibold cursor-pointer group-hover:text-primary transition-smooth">
                            Lembretes de Agendamento
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receba lembretes antes dos seus agendamentos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="reminder"
                          checked={settings?.appointment_reminder_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('appointment_reminder_enabled', checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isReminderOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-accordion-down">
                    {settings?.appointment_reminder_enabled && (
                      <div className="mt-2 ml-6 space-y-3 p-4 rounded-lg bg-muted/30 border">
                        <Label htmlFor="reminder-hours" className="font-medium">
                          Antecedência do lembrete
                        </Label>
                        <Select 
                          value={settings?.appointment_reminder_hours?.toString() || "24"}
                          onValueChange={handleReminderHoursSelect}
                        >
                          <SelectTrigger className="w-full sm:w-[280px] bg-background">
                            <SelectValue placeholder="Selecione a antecedência" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-[100]">
                            <SelectItem value="1">1 hora antes</SelectItem>
                            <SelectItem value="2">2 horas antes</SelectItem>
                            <SelectItem value="3">3 horas antes</SelectItem>
                            <SelectItem value="6">6 horas antes</SelectItem>
                            <SelectItem value="12">12 horas antes</SelectItem>
                            <SelectItem value="24">24 horas antes (1 dia)</SelectItem>
                            <SelectItem value="48">48 horas antes (2 dias)</SelectItem>
                            <SelectItem value="72">72 horas antes (3 dias)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Você receberá uma notificação {settings?.appointment_reminder_hours || 24} hora(s) antes do seu agendamento
                        </p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Confirmações de Agendamento */}
                <Collapsible open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth cursor-pointer group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="space-y-1 flex-1">
                          <Label className="text-base font-semibold cursor-pointer group-hover:text-primary transition-smooth">
                            Confirmações de Agendamento
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Notificação quando um agendamento for criado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="confirmation"
                          checked={settings?.appointment_confirmation_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('appointment_confirmation_enabled', checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isConfirmationOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-accordion-down">
                    <div className="mt-2 ml-6 p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm text-muted-foreground">
                        Você receberá uma notificação sempre que criar um novo agendamento.
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Cancelamentos */}
                <Collapsible open={isCancelledOpen} onOpenChange={setIsCancelledOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth cursor-pointer group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="space-y-1 flex-1">
                          <Label className="text-base font-semibold cursor-pointer group-hover:text-primary transition-smooth">
                            Cancelamentos
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Notificação quando um agendamento for cancelado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="cancelled"
                          checked={settings?.appointment_cancelled_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('appointment_cancelled_enabled', checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isCancelledOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-accordion-down">
                    <div className="mt-2 ml-6 p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm text-muted-foreground">
                        Você será notificado imediatamente caso um agendamento seja cancelado.
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Reagendamentos */}
                <Collapsible open={isRescheduledOpen} onOpenChange={setIsRescheduledOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth cursor-pointer group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="space-y-1 flex-1">
                          <Label className="text-base font-semibold cursor-pointer group-hover:text-primary transition-smooth">
                            Reagendamentos
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Notificação quando um agendamento for reagendado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="rescheduled"
                          checked={settings?.appointment_rescheduled_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('appointment_rescheduled_enabled', checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isRescheduledOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-accordion-down">
                    <div className="mt-2 ml-6 p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm text-muted-foreground">
                        Receba notificações quando um agendamento for alterado para uma nova data ou horário.
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Marketing */}
                <Collapsible open={isMarketingOpen} onOpenChange={setIsMarketingOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth cursor-pointer group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="space-y-1 flex-1">
                          <Label className="text-base font-semibold cursor-pointer group-hover:text-primary transition-smooth">
                            Notificações de Marketing
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receba promoções e novidades
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="marketing"
                          checked={settings?.marketing_enabled ?? false}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('marketing_enabled', checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isMarketingOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-accordion-down">
                    <div className="mt-2 ml-6 p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm text-muted-foreground">
                        Fique por dentro de promoções especiais, novos serviços e novidades da barbearia.
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}