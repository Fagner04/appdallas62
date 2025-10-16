import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, ArrowLeft } from "lucide-react";
import { useBarbershopBySlug } from "@/hooks/useBarbershops";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CadastroCliente() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: barbershop, isLoading } = useBarbershopBySlug(slug);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barbershop) {
      toast.error('Barbearia não encontrada');
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
          },
          emailRedirectTo: `${window.location.origin}/cliente`,
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Create customer record linked to barbershop
        const { error: customerError } = await supabase
          .from('customers')
          .insert([
            {
              user_id: authData.user.id,
              barbershop_id: barbershop.id,
              name,
              email,
              phone,
            },
          ]);

        if (customerError) throw customerError;

        toast.success('Cadastro realizado! Verifique seu email para confirmar.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      toast.error(error.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Barbearia não encontrada</CardTitle>
            <CardDescription>
              O link que você acessou não é válido ou a barbearia está inativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para Home
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Scissors className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl">{barbershop.name}</CardTitle>
            <CardDescription className="text-base mt-2">
              Cadastre-se para agendar seus horários
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 98888-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:underline font-medium"
            >
              Fazer login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
