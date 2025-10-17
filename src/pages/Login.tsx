import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // Campos de registro
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const registerSchema = z.object({
    name: z.string().trim().min(2, { message: 'Nome deve ter no mínimo 2 caracteres' }).max(100),
    email: z.string().trim().email({ message: 'Email inválido' }).max(255),
    password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }).max(72),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

  // Schema de login
  const loginSchema = z.object({
    email: z.string().trim().email({ message: 'Email inválido' }).max(255),
    password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }).max(72),
  });

  // SEO: set page title
  useEffect(() => {
    document.title = "Login | BarberClick";
  }, []);

  // Redirect authenticated users, respecting the 'next' parameter
  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      
      if (next) {
        navigate(next, { replace: true });
      } else {
        const redirectPath = user?.role === "customer" ? "/cliente" : "/dashboard";
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Dados inválidos');
      setLoading(false);
      return;
    }
    try {
      await login(result.data.email.trim().toLowerCase(), result.data.password);
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);

    const registerData = {
      name: registerName.trim(),
      email: registerEmail.trim(),
      password: registerPassword,
      confirmPassword: registerConfirmPassword,
    };

    const result = registerSchema.safeParse(registerData);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Dados inválidos');
      setRegisterLoading(false);
      return;
    }

    try {
      await register(result.data.name, result.data.email, result.data.password);
      // O AuthContext já redireciona após o registro
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar conta');
    } finally {
      setRegisterLoading(false);
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
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
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registerName">Nome Completo *</Label>
                  <Input
                    id="registerName"
                    placeholder="João Silva"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email *</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Senha *</Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerConfirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="registerConfirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? "Criando Conta..." : "Criar Conta"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Após criar sua conta, você poderá cadastrar sua barbearia
                </p>
              </form>
            </TabsContent>
          </Tabs>
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

    </div>
  );
}
