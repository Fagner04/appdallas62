import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const getMenuItems = (role?: string) => {
  // Menu for customers
  if (role === 'customer') {
    return [
      { icon: LayoutDashboard, label: 'Minha Área', path: '/cliente' },
      { icon: Calendar, label: 'Meus Agendamentos', path: '/agendamentos' },
      { icon: Bell, label: 'Notificações', path: '/notificacoes' },
      { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    ];
  }

  // Menu for admin/barber
  return [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
    { icon: Scissors, label: 'Serviços', path: '/servicos' },
    { icon: UserCog, label: 'Barbeiros', path: '/barbeiros' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: DollarSign, label: 'Caixa do Dia', path: '/caixa' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
    { icon: Bell, label: 'Notificações', path: '/notificacoes' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];
};

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuItems = getMenuItems(user?.role);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-6">
        <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
          Dallas Barbearia
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 transition-smooth ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-elegant'
                  : 'text-foreground hover:bg-primary-light'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-gradient-soft">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header + Sidebar */}
      <div className="flex flex-1 flex-col">
        <header className="lg:hidden sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              Dallas Barbearia
            </h1>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
