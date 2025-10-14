import React, { useState } from 'react';
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(true);

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
          <Collapsible open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  Configurações de Notificações
                </CardTitle>
                <ChevronDown 
                  className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${isNotificationsOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <CardDescription className="mt-2">
                Gerencie como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CollapsibleContent className="animate-accordion-down">
              <CardContent className="space-y-6 pt-6">
                {settingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Lembretes de Agendamento */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="reminder" className="text-base font-semibold cursor-pointer">
                            Lembretes de Agendamento
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receba lembretes antes dos seus agendamentos
                          </p>
                        </div>
                        <Switch
                          id="reminder"
                          checked={settings?.appointment_reminder_enabled ?? true}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('appointment_reminder_enabled', checked)
                          }
                        />
                      </div>

                      {settings?.appointment_reminder_enabled && (
                        <div className="ml-6 space-y-3 p-4 rounded-lg bg-muted/30 border">
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
                    </div>

                    <Separator />

                    {/* Confirmações de Agendamento */}
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="confirmation" className="text-base font-semibold cursor-pointer">
                          Confirmações de Agendamento
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Notificação quando um agendamento for criado
                        </p>
                      </div>
                      <Switch
                        id="confirmation"
                        checked={settings?.appointment_confirmation_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('appointment_confirmation_enabled', checked)
                        }
                      />
                    </div>

                    <Separator />

                    {/* Cancelamentos */}
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="cancelled" className="text-base font-semibold cursor-pointer">
                          Cancelamentos
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Notificação quando um agendamento for cancelado
                        </p>
                      </div>
                      <Switch
                        id="cancelled"
                        checked={settings?.appointment_cancelled_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('appointment_cancelled_enabled', checked)
                        }
                      />
                    </div>

                    <Separator />

                    {/* Reagendamentos */}
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="rescheduled" className="text-base font-semibold cursor-pointer">
                          Reagendamentos
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Notificação quando um agendamento for reagendado
                        </p>
                      </div>
                      <Switch
                        id="rescheduled"
                        checked={settings?.appointment_rescheduled_enabled ?? true}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('appointment_rescheduled_enabled', checked)
                        }
                      />
                    </div>

                    <Separator />

                    {/* Marketing */}
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-card to-muted/5 hover:shadow-md transition-smooth">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="marketing" className="text-base font-semibold cursor-pointer">
                          Notificações de Marketing
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receba promoções e novidades
                        </p>
                      </div>
                      <Switch
                        id="marketing"
                        checked={settings?.marketing_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('marketing_enabled', checked)
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </Layout>
  );
}