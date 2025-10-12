import { Layout } from '@/components/Layout';
import { BarberScheduleView } from '@/components/BarberScheduleView';

export default function AgendaBarbeiro() {
  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Minha Agenda</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus agendamentos diários
          </p>
        </div>

        <BarberScheduleView />
      </div>
    </Layout>
  );
}
