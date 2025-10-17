import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, ArrowLeft, Copy, Check } from "lucide-react";
import { useCreateBarbershop } from "@/hooks/useBarbershops";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

export default function CadastroBarbearia() {
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();
  const createBarbershop = useCreateBarbershop();
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const shopSchema = z.object({
    name: z.string().trim().min(2, { message: 'Nome da barbearia é obrigatório' }).max(100),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug inválido. Use apenas minúsculas, números e traços' }),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    email: z.union([z.string().trim().email({ message: 'Email da barbearia inválido' }).max(255), z.literal('')]).optional(),
    address: z.string().trim().max(255).optional().or(z.literal('')),
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Você precisa fazer login primeiro');
      navigate(`/login?next=${encodeURIComponent('/cadastro-barbearia')}`);
      return;
    }

    const shopInput = {
      name: name.trim(),
      slug: slug.trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
      address: (address || '').trim(),
    };

    const shopResult = shopSchema.safeParse(shopInput);
    if (!shopResult.success) {
      toast.error(shopResult.error.errors[0]?.message || 'Dados da barbearia inválidos');
      return;
    }

    try {
      await createBarbershop.mutateAsync({
        name: shopResult.data.name,
        slug: shopResult.data.slug,
        phone: shopResult.data.phone || undefined,
        email: shopResult.data.email || undefined,
        address: shopResult.data.address || undefined,
      });

      // Atualiza os dados do usuário para identificá-lo como admin
      await refreshUser();

      const link = `${window.location.origin}/cadastro/${shopResult.data.slug}`;
      setGeneratedLink(link);
      toast.success('Barbearia criada! Compartilhe o link com seus clientes.');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar barbearia. Tente novamente.');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
        <Card className="w-full max-w-2xl shadow-elegant">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <Scissors className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl">🎉 Barbearia Criada!</CardTitle>
              <CardDescription className="text-base mt-2">
                Compartilhe este link com seus clientes para eles se cadastrarem
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-2">Link de Cadastro:</p>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="font-mono text-sm" />
                <Button onClick={copyLink} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Como funciona:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Compartilhe este link no WhatsApp, Instagram ou redes sociais</li>
                <li>Clientes acessam o link e se cadastram automaticamente na sua barbearia</li>
                <li>Todos os dados ficam separados e privados para sua barbearia</li>
                <li>Você gerencia tudo pelo painel administrativo</li>
              </ul>
            </div>

            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <div className="p-4 pb-0">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Scissors className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl">Cadastrar Barbearia</CardTitle>
            <CardDescription className="text-base mt-2">
              Crie sua barbearia e comece a gerenciar agendamentos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Barbearia *</Label>
              <Input
                id="name"
                placeholder="Dallas Barbearia"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Link Personalizado *
                <span className="text-xs text-muted-foreground ml-2">
                  (será usado no cadastro de clientes)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/cadastro/</span>
                <Input
                  id="slug"
                  placeholder="dallas-barbearia"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 98888-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@barbearia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua Example, 123"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full shadow-elegant hover-lift text-lg py-6" 
              disabled={createBarbershop.isPending}
              size="lg"
            >
              {createBarbershop.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Criando sua Barbearia...
                </>
              ) : (
                <>
                  <Scissors className="mr-2 h-5 w-5" />
                  Criar Barbearia
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
