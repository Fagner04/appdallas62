import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Clock, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracoes() {
  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
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
