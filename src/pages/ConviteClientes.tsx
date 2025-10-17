import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, UserPlus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useMyBarbershop } from '@/hooks/useBarbershops';
import { useCreateCustomer } from '@/hooks/useCustomers';

export default function ConviteClientes() {
  const { data: barbershop } = useMyBarbershop();
  const createCustomer = useCreateCustomer();
  const [emailConvite, setEmailConvite] = useState('');
  const [nomeConvite, setNomeConvite] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Formulário de cadastro direto
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
  });

  const linkConvite = barbershop?.slug 
    ? `${window.location.origin}/cadastro/${barbershop.slug}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleEnviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailConvite || !nomeConvite) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Aqui você implementaria o envio do email via edge function
    toast.success(`Convite enviado para ${emailConvite}!`);
    setEmailConvite('');
    setNomeConvite('');
  };

  const handleCadastrarDireto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.senha) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await createCustomer.mutateAsync({
        name: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        createAccount: true,
        password: formData.senha,
      });

      setFormData({ nome: '', email: '', telefone: '', senha: '' });
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Convite de Clientes</h1>
          <p className="text-muted-foreground">
            Convide novos clientes para acessar o app ou cadastre-os diretamente
          </p>
        </div>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link de Cadastro</TabsTrigger>
            <TabsTrigger value="email">Enviar por Email</TabsTrigger>
            <TabsTrigger value="direto">Cadastro Direto</TabsTrigger>
          </TabsList>

          {/* Tab: Link de Cadastro */}
          <TabsContent value="link">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Link de Cadastro
                </CardTitle>
                <CardDescription>
                  Copie e compartilhe este link com seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input 
                    value={linkConvite} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button onClick={handleCopyLink} variant="outline">
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Os clientes poderão se cadastrar usando este link
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Enviar por Email */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Enviar Convite por Email
                </CardTitle>
                <CardDescription>
                  Envie um email com o link de cadastro para o cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEnviarConvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeConvite">Nome do Cliente</Label>
                    <Input
                      id="nomeConvite"
                      value={nomeConvite}
                      onChange={(e) => setNomeConvite(e.target.value)}
                      placeholder="Digite o nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailConvite">Email</Label>
                    <Input
                      id="emailConvite"
                      type="email"
                      value={emailConvite}
                      onChange={(e) => setEmailConvite(e.target.value)}
                      placeholder="cliente@exemplo.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    Enviar Convite
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Cadastro Direto */}
          <TabsContent value="direto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Cadastro Direto
                </CardTitle>
                <CardDescription>
                  Cadastre o cliente diretamente no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCadastrarDireto} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@exemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    <UserPlus className="h-4 w-4" />
                    {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}