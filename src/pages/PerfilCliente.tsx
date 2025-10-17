import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Shield,
  LogOut,
  Store,
  ArrowRight,
  Edit2,
  X,
  Save
} from 'lucide-react';
import { useCustomerProfile, useUpdateCustomerProfile } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AvatarUpload } from '@/components/AvatarUpload';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from 'zod';

// Validação dos dados pessoais
const profileSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z.string()
    .trim()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números e caracteres válidos'),
});

export default function PerfilCliente() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Segurança: Apenas clientes podem acessar esta página
  if (!user || user.role !== 'customer') {
    return <Navigate to="/dashboard" replace />;
  }
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const { settings, isLoading: settingsLoading, updateSettings } = useNotificationSettings(user?.id);
  const { changePassword, isLoading: passwordLoading } = usePasswordChange();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para edição de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Atualizar campos de edição quando o perfil carregar
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
    }
  }, [profile]);

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSecurityOpen(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validar dados
      const validatedData = profileSchema.parse({
        name: editName,
        phone: editPhone,
      });

      setProfileErrors({});
      await updateProfile.mutateAsync({
        name: validatedData.name,
        phone: validatedData.phone,
      });
      setIsEditingProfile(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0].toString()] = err.message;
        });
        setProfileErrors(errors);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setProfileErrors({});
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
        {/* Cadastrar Barbearia */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Cadastrar Barbearia</p>
                <p className="text-xs text-muted-foreground">Configure seu negócio</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/cadastro-barbearia')}
              size="sm"
              className="transition-smooth"
            >
              Cadastrar
            </Button>
          </CardContent>
        </Card>

        {/* Dados do Cliente */}
        <Card className="shadow-elegant border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : profile ? (
              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nome
                  </Label>
                  {isEditingProfile ? (
                    <div className="space-y-1">
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Seu nome completo"
                        className={profileErrors.name ? 'border-destructive' : ''}
                      />
                      {profileErrors.name && (
                        <p className="text-xs text-destructive">{profileErrors.name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium pl-6">{profile.name}</p>
                  )}
                </div>

                {/* Email (não editável) */}
                {profile.email && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </Label>
                    <p className="font-medium pl-6 text-muted-foreground">{profile.email}</p>
                  </div>
                )}

                {/* Telefone */}
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Telefone
                  </Label>
                  {isEditingProfile ? (
                    <div className="space-y-1">
                      <Input
                        id="phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className={profileErrors.phone ? 'border-destructive' : ''}
                      />
                      {profileErrors.phone && (
                        <p className="text-xs text-destructive">{profileErrors.phone}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium pl-6">{profile.phone || 'Não informado'}</p>
                  )}
                </div>

                {/* Botões de ação (apenas no modo de edição) */}
                {isEditingProfile && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1 gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfile.isPending}
                      className="flex-1 gap-2"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Nenhum dado encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Segurança - Trocar Senha */}
        <Card className="shadow-elegant border-primary/10">
          <Collapsible open={isSecurityOpen} onOpenChange={setIsSecurityOpen}>
            <CardHeader className="bg-gradient-to-r from-destructive/5 to-transparent">
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-smooth">
                    <Shield className="h-5 w-5 text-destructive" />
                  </div>
                  Segurança
                </CardTitle>
                <ChevronDown 
                  className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${isSecurityOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <CardDescription className="mt-2">
                Altere sua senha e gerencie a segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CollapsibleContent className="animate-accordion-down">
              <CardContent className="pt-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-sm font-medium">
                      Senha Atual
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">
                      Nova Senha
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                      required
                      minLength={6}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setIsSecurityOpen(false);
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="flex-1 bg-destructive hover:bg-destructive/90"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        'Alterar Senha'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Sair da Conta */}
        <Card className="border-destructive/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Sair da Conta</p>
                <p className="text-xs text-muted-foreground">Encerre sua sessão</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="destructive"
              size="sm"
              className="transition-smooth"
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}