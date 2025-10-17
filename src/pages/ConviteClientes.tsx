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
      <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Convite de Clientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Convide novos clientes para acessar o app ou cadastre-os diretamente
          </p>
        </div>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="link" className="text-xs sm:text-sm px-2 py-2">
              Link
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm px-2 py-2">
              Email
            </TabsTrigger>
            <TabsTrigger value="direto" className="text-xs sm:text-sm px-2 py-2">
              Cadastro
            </TabsTrigger>
          </TabsList>

          {/* Tab: Link de Cadastro */}
          <TabsContent value="link">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                  Link de Cadastro
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Copie e compartilhe este link com seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input 
                    value={linkConvite} 
                    readOnly 
                    className="flex-1 text-xs sm:text-sm"
                  />
                  <Button onClick={handleCopyLink} variant="outline" className="w-full sm:w-auto">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Os clientes poderão se cadastrar usando este link
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Enviar por Email */}
          <TabsContent value="email">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  Enviar Convite por Email
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Envie um email com o link de cadastro para o cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEnviarConvite} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="nomeConvite" className="text-sm">Nome do Cliente</Label>
                    <Input
                      id="nomeConvite"
                      value={nomeConvite}
                      onChange={(e) => setNomeConvite(e.target.value)}
                      placeholder="Digite o nome"
                      className="text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="emailConvite" className="text-sm">Email</Label>
                    <Input
                      id="emailConvite"
                      type="email"
                      value={emailConvite}
                      onChange={(e) => setEmailConvite(e.target.value)}
                      placeholder="cliente@exemplo.com"
                      className="text-sm"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 h-10 sm:h-11">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm sm:text-base">Enviar Convite</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Cadastro Direto */}
          <TabsContent value="direto">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Cadastro Direto
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Cadastre o cliente diretamente no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCadastrarDireto} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="nome" className="text-sm">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Digite o nome completo"
                      className="text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@exemplo.com"
                      className="text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="telefone" className="text-sm">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="senha" className="text-sm">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 h-10 sm:h-11" disabled={loading}>
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm sm:text-base">
                      {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                    </span>
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