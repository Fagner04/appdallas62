import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Scissors, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
export default function Login() {
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Sign up dialog state
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  // SEO: set page title
  useEffect(() => {
    document.title = "Login | BarberClick";
  }, []);

  if (isAuthenticated) {
    const redirectPath = user?.role === "customer" ? "/cliente" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
    } finally {
      setResetLoading(false);
    }
  };

  // Cadastro (sign up) com validação simples
  const signUpSchema = z.object({
    name: z.string().min(2, "Digite seu nome"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirm: z.string(),
    phone: z.string().optional(),
  }).refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpLoading(true);
    try {
      const parsed = signUpSchema.parse({
        name,
        email: signUpEmail,
        password: signUpPassword,
        confirm: signUpConfirm,
        phone,
      });

      await register(parsed.name, parsed.email, parsed.password, parsed.phone);

      // Se houver ?next=, o fluxo de login já respeita; após criar conta, o usuário pode logar
      setSignUpDialogOpen(false);
      setName(""); setPhone(""); setSignUpEmail(""); setSignUpPassword(""); setSignUpConfirm("");
    } catch (err: any) {
      const msg = err?.issues?.[0]?.message || err?.message || "Erro ao criar conta";
      toast.error(msg);
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <div className="p-4 pb-0">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Scissors className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl">BarberClick </CardTitle>
            <CardDescription className="text-base mt-2">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setResetDialogOpen(true)}
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link to="/cadastro-barbearia" className="text-primary hover:underline font-medium">
              Cadastrar Barbearia
            </Link>
          </div>
          <div className="mt-2 text-center text-sm">
            Não tem conta?
            <button
              type="button"
              onClick={() => setSignUpDialogOpen(true)}
              className="ml-1 text-primary hover:underline font-medium"
            >
              Criar conta
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Recuperação de Senha */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>Digite seu email para receber um link de recuperação de senha</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={resetLoading} className="flex-1">
                {resetLoading ? "Enviando..." : "Enviar Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cadastro */}
      <Dialog open={signUpDialogOpen} onOpenChange={setSignUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar conta</DialogTitle>
            <DialogDescription>Preencha seus dados para acessar e cadastrar sua barbearia</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha</Label>
              <Input id="signup-password" type="password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Confirmar senha</Label>
              <Input id="signup-confirm" type="password" value={signUpConfirm} onChange={(e) => setSignUpConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setSignUpDialogOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={signUpLoading} className="flex-1">{signUpLoading ? "Criando..." : "Criar conta"}</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: Para testar sem confirmação de email, desative “Confirm email” no Supabase (Auth &gt; Providers).
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
