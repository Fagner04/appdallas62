import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Clock, Lock, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Separator } from '@/components/ui/separator';

export default function Configuracoes() {
  const { user } = useAuth();
  const { settings, isLoading, updateSettings } = useNotificationSettings(user?.id);

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleNotificationToggle = async (field: string, value: boolean) => {
    await updateSettings.mutateAsync({ [field]: value });
  };

  const handleReminderHoursChange = async (hours: number) => {
    await updateSettings.mutateAsync({ appointment_reminder_hours: hours });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil da Barbearia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Barbearia</Label>
                <Input id="name" defaultValue="Dallas Barbearia" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" defaultValue="(11) 98765-4321" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="contato@dallasbarbearia.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" defaultValue="Rua das Flores, 123 - São Paulo" />
              </div>
            </div>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
                <div key={day} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium w-24">{day}</span>
                  <div className="flex items-center gap-4">
                    <Input type="time" defaultValue="09:00" className="w-32" />
                    <span className="text-muted-foreground">até</span>
                    <Input type="time" defaultValue="18:00" className="w-32" />
                    <Switch defaultChecked />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="font-medium w-24">Domingo</span>
                <div className="flex items-center gap-4">
                  <Input type="time" defaultValue="09:00" className="w-32" disabled />
                  <span className="text-muted-foreground">até</span>
                  <Input type="time" defaultValue="18:00" className="w-32" disabled />
                  <Switch />
                </div>
              </div>
            </div>
            <Button onClick={handleSave}>Salvar Horários</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configurações de Notificações
            </CardTitle>
            <CardDescription>
              Gerencie como e quando você deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="text-center py-4">Carregando configurações...</div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="reminder">Lembretes de Agendamento</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba lembretes antes dos agendamentos
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
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="reminder-hours">Antecedência do lembrete</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="reminder-hours"
                          type="number"
                          min="1"
                          max="72"
                          value={settings?.appointment_reminder_hours ?? 24}
                          onChange={(e) => handleReminderHoursChange(Number(e.target.value))}
                          onBlur={() => toast.success('Antecedência atualizada')}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">horas antes</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="confirmation">Confirmações de Agendamento</Label>
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

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="cancelled">Cancelamentos</Label>
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

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="rescheduled">Reagendamentos</Label>
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

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="marketing">Notificações de Marketing</Label>
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
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button onClick={handleSave}>Alterar Senha</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
