import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Gift, Award, Calendar, Copy, CheckCircle } from 'lucide-react';
import { useCustomerLoyalty } from '@/hooks/useLoyalty';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'sonner';

export function LoyaltyCard() {
  const { user } = useAuth();
  const { data: loyalty, isLoading } = useCustomerLoyalty(user?.id || '');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const points = loyalty?.points || 0;
  const progress = (points / 10) * 100;
  const coupons = loyalty?.availableCoupons || [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card className="hover-lift relative overflow-hidden border-accent/20 shadow-elegant group">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-smooth">
              <Award className="h-5 w-5 text-accent" />
            </div>
            Programa Fidelidade
          </CardTitle>
          {coupons.length > 0 && (
            <Badge variant="default" className="bg-success animate-pulse">
              {coupons.length} {coupons.length === 1 ? 'Cupom' : 'Cupons'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {/* Progresso dos Pontos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Progresso para próximo cupom
            </span>
            <span className="text-xl font-bold text-accent">
              {points}/10
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {points < 10 
              ? `Faltam ${10 - points} ${10 - points === 1 ? 'corte' : 'cortes'} para ganhar um cupom grátis!` 
              : 'Parabéns! Você ganhou um cupom! 🎉'}
          </p>
        </div>

        {/* Cupons Disponíveis */}
        {coupons.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold">Seus Cupons</span>
            </div>
            <div className="space-y-2">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-success/20">
                        <Gift className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Corte Grátis</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {coupon.code}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedCode === coupon.code ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {coupon.expires_at && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Expira{' '}
                      {formatDistanceToNow(new Date(coupon.expires_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regras do Programa */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              Como Funciona?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Programa de Fidelidade
              </DialogTitle>
              <DialogDescription>
                Entenda como ganhar cortes grátis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Acumule Pontos</p>
                    <p className="text-sm text-muted-foreground">
                      A cada corte realizado, você ganha <strong>1 ponto</strong> de fidelidade
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="p-2 rounded-lg bg-success/10">
                    <span className="text-lg font-bold text-success">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Ganhe Cupons</p>
                    <p className="text-sm text-muted-foreground">
                      Ao atingir <strong>10 pontos</strong>, você ganha automaticamente um cupom de <strong>corte grátis</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <span className="text-lg font-bold text-accent">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Use seu Cupom</p>
                    <p className="text-sm text-muted-foreground">
                      Ao agendar, insira o código do cupom para ganhar o corte grátis. Cupons são válidos por <strong>90 dias</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  <strong>Importante:</strong> Após usar um cupom, seus pontos retornam a zero e você pode começar a acumular novamente!
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
