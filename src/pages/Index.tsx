import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Calendar, Users, Clock, Store } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Agendamento Fácil",
      description: "Agende seus horários com apenas alguns cliques",
    },
    {
      icon: Scissors,
      title: "Profissionais Qualificados",
      description: "Equipe especializada em cortes modernos",
    },
    {
      icon: Clock,
      title: "Horários Flexíveis",
      description: "Atendimento nos melhores horários para você",
    },
    {
      icon: Users,
      title: "Atendimento Personalizado",
      description: "Cada cliente é único e especial",
    },
  ];

  return (
    <div className="min-h-screen gradient-soft">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full gradient-primary shadow-glow mb-4">
              <Scissors className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">Agendamentos Online</h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema completo de agendamento para barbearias. Gerencie seus horários, clientes e serviços de forma
              profissional.
            </p>
          </div>


          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 sm:pt-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-lg shadow-elegant hover-lift cursor-default"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-light mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botão Flutuante de Login */}
      <Button
        onClick={() => navigate("/login")}
        size="lg"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 group gradient-primary"
        title="Entrar no Sistema"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7 text-white group-hover:translate-x-1 transition-transform duration-300"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </Button>

      {/* Footer */}
      <footer className="py-6 border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">&copy; Dallas Barbearia 2025 ♡</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
