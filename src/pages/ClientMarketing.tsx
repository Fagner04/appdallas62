import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoyaltyCard } from '@/components/LoyaltyCard';
import { Gift, TrendingUp, Star } from 'lucide-react';

export default function ClientMarketing() {
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl shadow-elegant bg-card border">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Marketing & Promoções</h1>
            </div>
            <p className="text-muted-foreground">
              Aproveite nosso programa de fidelidade e promoções exclusivas
            </p>
          </div>
        </div>

        {/* Programa de Fidelidade */}
        <LoyaltyCard />

        {/* Promoções Futuras - Placeholder */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-lift border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ofertas Especiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fique atento às nossas ofertas especiais e promoções sazonais!
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-accent" />
                Novidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Novos serviços e tratamentos exclusivos em breve!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
