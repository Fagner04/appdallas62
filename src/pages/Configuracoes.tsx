import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, Clock, Lock, Loader2, ChevronDown, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkingHours, useUpdateWorkingHours } from '@/hooks/useWorkingHours';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

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
  const { logout } = useAuth();
  const { data: workingHours = [], isLoading } = useWorkingHours();
  const updateWorkingHours = useUpdateWorkingHours();
  const { changePassword, isLoading: isChangingPassword } = usePasswordChange();

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

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

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
      // Limpar os campos após sucesso
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
        </div>

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
