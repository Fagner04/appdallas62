import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, Clock, Lock, Loader2, ChevronDown, LogOut, CreditCard, Store, Copy, Check, Shield, Calendar as CalendarIcon, DollarSign, Ban, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkingHours, useUpdateWorkingHours } from '@/hooks/useWorkingHours';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { useMyBarbershop } from '@/hooks/useBarbershops';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientFeatures } from '@/hooks/useClientFeatures';

const DAYS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export default function Configuracoes() {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();
  const { data: barbershop, isLoading: isLoadingBarbershop } = useMyBarbershop();
  const { data: workingHours = [], isLoading } = useWorkingHours();
  const updateWorkingHours = useUpdateWorkingHours();
  const { changePassword, isLoading: isChangingPassword } = usePasswordChange();
  const { isFeatureEnabled, toggleFeature } = useClientFeatures();

  const [copiedId, setCopiedId] = useState(false);

  const [hours, setHours] = useState<Record<number, { isOpen: boolean; start: string; end: string }>>({
    1: { isOpen: true, start: '09:00', end: '18:00' },
    2: { isOpen: true, start: '09:00', end: '18:00' },
    3: { isOpen: true, start: '09:00', end: '18:00' },
    4: { isOpen: true, start: '09:00', end: '18:00' },
    5: { isOpen: true, start: '09:00', end: '18:00' },
    6: { isOpen: true, start: '09:00', end: '18:00' },
    0: { isOpen: false, start: '09:00', end: '18:00' },
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  useEffect(() => {
    if (workingHours.length > 0) {
      const hoursMap: Record<number, { isOpen: boolean; start: string; end: string }> = {};
      workingHours.forEach(wh => {
        hoursMap[wh.day_of_week] = {
          isOpen: wh.is_open,
          start: wh.start_time,
          end: wh.end_time,
        };
      });
      setHours(hoursMap);
    }
  }, [workingHours]);

  const handleSaveWorkingHours = async () => {
    const data = Object.entries(hours).map(([day, config]) => ({
      day_of_week: parseInt(day),
      is_open: config.isOpen,
      start_time: config.start,
      end_time: config.end,
    }));

    await updateWorkingHours.mutateAsync(data);
  };

  const updateDay = (day: number, field: 'isOpen' | 'start' | 'end', value: boolean | string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await changePassword(passwords);
    
    if (result.success) {
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const copyBarbershopId = () => {
    if (barbershop?.id) {
      navigator.clipboard.writeText(barbershop.id);
      setCopiedId(true);
      toast.success('ID copiado!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const clientFeatures = [
    {
      id: 'online_booking',
      title: 'Agendamentos Online',
      description: 'Permitir que clientes façam agendamentos pelo sistema',
      icon: CalendarIcon,
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

  const handleFeatureToggle = (featureId: string, featureTitle: string) => {
    toggleFeature(featureId, featureTitle);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil, clientes e funcionalidades</p>
        </div>

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="controle" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Controle
            </TabsTrigger>
          </TabsList>

          {/* ABA PERFIL */}
          <TabsContent value="perfil" className="space-y-6">
            {/* Profile Settings */}
            <Collapsible open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <Card>
                <CardHeader>
                  <CollapsibleTrigger className="w-full">
                    <CardTitle className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Perfil da Barbearia
                      </div>
                      <ChevronDown 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          isProfileOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </CardTitle>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {isLoadingBarbershop ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : barbershop ? (
                      <>
                        <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-primary" />
                              ID da Barbearia
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={copyBarbershopId}
                            >
                              {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <Input 
                            value={barbershop.id} 
                            readOnly 
                            className="font-mono text-sm bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            Este ID identifica sua barbearia no sistema multi-tenant
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome da Barbearia</Label>
                            <Input id="name" value={barbershop.name} readOnly />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="slug">Link Personalizado</Label>
                            <Input id="slug" value={barbershop.slug} readOnly />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" value={barbershop.phone || 'Não informado'} readOnly />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={barbershop.email || 'Não informado'} readOnly />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Endereço</Label>
                            <Input id="address" value={barbershop.address || 'Não informado'} readOnly />
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-900">
                          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">ℹ️ Link de Cadastro de Clientes</p>
                          <code className="text-blue-800 dark:text-blue-200 break-all">
                            {window.location.origin}/cadastro/{barbershop.slug}
                          </code>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma barbearia cadastrada. 
                        <Button 
                          variant="link" 
                          onClick={() => navigate('/cadastro-barbearia')}
                          className="ml-1"
                        >
                          Cadastre agora
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Working Hours */}
            <Collapsible open={isWorkingHoursOpen} onOpenChange={setIsWorkingHoursOpen}>
              <Card>
                <CardHeader>
                  <CollapsibleTrigger className="w-full">
                    <CardTitle className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Horário de Funcionamento
                      </div>
                      <ChevronDown 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          isWorkingHoursOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </CardTitle>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                          <p className="font-medium mb-1">⚠️ Importante:</p>
                          <p>Dias desligados (switch OFF) bloqueiam automaticamente os agendamentos dos clientes nesse dia.</p>
                        </div>
                        <div className="grid gap-4">
                          {DAYS.map((day) => (
                            <div key={day.value} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-border">
                              <div className="flex items-center justify-between sm:w-auto">
                                <span className="font-medium">{day.label}</span>
                                <Switch 
                                  checked={hours[day.value]?.isOpen || false}
                                  onCheckedChange={(checked) => updateDay(day.value, 'isOpen', checked)}
                                  className="sm:hidden"
                                />
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-between sm:justify-end">
                                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                  <Input 
                                    type="time" 
                                    value={hours[day.value]?.start || '09:00'} 
                                    onChange={(e) => updateDay(day.value, 'start', e.target.value)}
                                    disabled={!hours[day.value]?.isOpen}
                                    className="w-full sm:w-32 text-sm" 
                                  />
                                  <span className="text-muted-foreground text-sm">até</span>
                                  <Input 
                                    type="time" 
                                    value={hours[day.value]?.end || '18:00'} 
                                    onChange={(e) => updateDay(day.value, 'end', e.target.value)}
                                    disabled={!hours[day.value]?.isOpen}
                                    className="w-full sm:w-32 text-sm" 
                                  />
                                </div>
                                <Switch 
                                  checked={hours[day.value]?.isOpen || false}
                                  onCheckedChange={(checked) => updateDay(day.value, 'isOpen', checked)}
                                  className="hidden sm:inline-flex"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={handleSaveWorkingHours}
                          disabled={updateWorkingHours.isPending}
                        >
                          {updateWorkingHours.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Salvar Horários'
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Security */}
            <Collapsible open={isSecurityOpen} onOpenChange={setIsSecurityOpen}>
              <Card>
                <CardHeader>
                  <CollapsibleTrigger className="w-full">
                    <CardTitle className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Segurança
                      </div>
                      <ChevronDown 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          isSecurityOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </CardTitle>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Senha Atual</Label>
                        <Input 
                          id="current-password" 
                          type="password"
                          value={passwords.currentPassword}
                          onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Digite sua senha atual"
                          required
                          autoComplete="current-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <Input 
                          id="new-password" 
                          type="password"
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Mínimo 6 caracteres"
                          required
                          minLength={6}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                        <Input 
                          id="confirm-password" 
                          type="password"
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Digite a nova senha novamente"
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Alterando...
                          </>
                        ) : (
                          'Alterar Senha'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>


            {/* Planos e Assinaturas */}
            <Card 
              className="border-primary/20 cursor-pointer transition-all hover:shadow-lg hover:border-primary/40"
              onClick={() => navigate('/planos')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Planos e Assinaturas</p>
                    <p className="text-xs text-muted-foreground">Gerencie seu plano e pagamentos</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-smooth"
                  onClick={() => navigate('/planos')}
                >
                  Ver Planos
                </Button>
              </CardContent>
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
          </TabsContent>

          {/* ABA CONTROLE */}
          <TabsContent value="controle" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Controle de Funcionalidades
                </CardTitle>
                <CardDescription>
                  Gerencie quais funcionalidades estarão disponíveis para seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {clientFeatures.map((feature, index) => (
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
                        onCheckedChange={() => handleFeatureToggle(feature.id, feature.title)}
                      />
                    </div>
                    {index < clientFeatures.length - 1 && (
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
                <p>• As alterações são aplicadas imediatamente para todos os clientes</p>
                <p>• Funcionalidades desabilitadas não aparecerão na área do cliente</p>
                <p>• Recomendamos manter "Agendamentos Online" sempre ativo</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
