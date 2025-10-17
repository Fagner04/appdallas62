import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: subscriptionStatus, isLoading } = useSubscriptionStatus();

  // Admins bypass subscription check
  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  // Customers need subscription after trial
  if (user?.role === 'customer') {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Show trial warning if in trial with less than 3 days left
    if (subscriptionStatus?.isInTrial && subscriptionStatus.daysLeftInTrial <= 3 && subscriptionStatus.daysLeftInTrial > 0) {
      return (
        <div className="min-h-screen p-4">
          <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Seu período de teste termina em {subscriptionStatus.daysLeftInTrial} dia(s). 
              <Button
                variant="link"
                className="ml-2 h-auto p-0 text-yellow-900 dark:text-yellow-100 underline"
                onClick={() => navigate('/planos')}
              >
                Assine agora para continuar usando
              </Button>
            </AlertDescription>
          </Alert>
          {children}
        </div>
      );
    }

    // Block access if needs subscription
    if (subscriptionStatus?.needsSubscription) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <Lock className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Período de Teste Encerrado</h1>
              <p className="text-muted-foreground">
                Seu período de teste de 7 dias terminou. Assine um plano para continuar usando todas as funcionalidades.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/planos')}
                className="w-full"
                size="lg"
              >
                Ver Planos
              </Button>
              <Button
                onClick={() => navigate('/cliente')}
                variant="outline"
                className="w-full"
              >
                Voltar para Área do Cliente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  return <>{children}</>;
};
