import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ClientArea from "./pages/ClientArea";
import CadastroBarbearia from "./pages/CadastroBarbearia";
import CadastroCliente from "./pages/CadastroCliente";
import ClientMarketing from "./pages/ClientMarketing";
import PerfilCliente from "./pages/PerfilCliente";
import Agendamentos from "./pages/Agendamentos";
import Servicos from "./pages/Servicos";
import Barbeiros from "./pages/Barbeiros";
import Clientes from "./pages/Clientes";
import Caixa from "./pages/Caixa";
import Relatorios from "./pages/Relatorios";
import Notificacoes from "./pages/Notificacoes";
import Configuracoes from "./pages/Configuracoes";
import AgendaBarbeiro from "./pages/AgendaBarbeiro";
import ControleClientes from "./pages/ControleClientes";
import HistoricoCliente from "./pages/HistoricoCliente";
import Marketing from "./pages/Marketing";
import Planos from "./pages/Planos";
import Ajuda from "./pages/Ajuda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) return <>{children}</>;
  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/login?next=${next}`} replace />;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const next = params.get('next') || undefined;

  // Redirect based on user role
  const getDefaultRoute = () => {
    if (!user) return '/login';
    return user.role === 'customer' ? '/cliente' : '/dashboard';
  };
  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Index />} 
      />
      <Route path="/login" element={isAuthenticated ? <Navigate to={next ?? getDefaultRoute()} replace /> : <Login />} />
      <Route path="/cadastro-barbearia" element={<CadastroBarbearia />} />
      <Route path="/cadastro/:slug" element={<CadastroCliente />} />
      <Route
        path="/cliente"
        element={
          <ProtectedRoute>
            {user?.role === 'customer' ? <ClientArea /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente/marketing"
        element={
          <ProtectedRoute>
            {user?.role === 'customer' ? <ClientMarketing /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            {user?.role === 'customer' ? <PerfilCliente /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Dashboard />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agendamentos"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Agendamentos />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicos"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Servicos />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/barbeiros"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Barbeiros />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Clientes />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/caixa"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Caixa />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Relatorios />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notificacoes"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Notificacoes />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Configuracoes />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agenda-barbeiro"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <AgendaBarbeiro />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/controle-clientes"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <ControleClientes />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/historico"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <HistoricoCliente />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing"
        element={
          <ProtectedRoute>
            <SubscriptionGuard>
              <Marketing />
            </SubscriptionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/planos"
        element={
          <ProtectedRoute>
            <Planos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ajuda"
        element={
          <ProtectedRoute>
            {user?.role === 'customer' ? <Ajuda /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
