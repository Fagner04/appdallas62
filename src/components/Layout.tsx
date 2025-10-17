import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/NotificationBell';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  Scissors,
  Clock,
  ClipboardList,
  FileText,
  Bell,
  LucideIcon,
  UserCircle,
  BarChart3,
  UserCog,
  User,
  X,
  Gift,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const getMenuItems = (role?: string) => {
  // Menu for customers
  if (role === 'customer') {
    return [
      { icon: LayoutDashboard, label: 'Minha Área', path: '/cliente' },
      { icon: Calendar, label: 'Meus Agendamentos', path: '/agendamentos' },
      { icon: Gift, label: 'Marketing', path: '/cliente/marketing' },
      { icon: Clock, label: 'Histórico', path: '/historico' },
      { icon: User, label: 'Perfil', path: '/perfil' },
      { icon: HelpCircle, label: 'Ajuda', path: '/ajuda' },
    ];
  }

  // Menu for barbers
  if (role === 'barber') {
    return [
      { icon: Calendar, label: 'Minha Agenda', path: '/agenda-barbeiro' },
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
      { icon: Users, label: 'Clientes', path: '/clientes' },
      { icon: UserCog, label: 'Controle de Clientes', path: '/controle-clientes' },
      { icon: DollarSign, label: 'Caixa do Dia', path: '/caixa' },
      { icon: User, label: 'Perfil', path: '/configuracoes' },
    ];
  }

  // Menu for admin
  return [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
    { icon: Scissors, label: 'Serviços', path: '/servicos' },
    { icon: UserCog, label: 'Barbeiros', path: '/barbeiros' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: DollarSign, label: 'Caixa do Dia', path: '/caixa' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
    { icon: FileText, label: 'Marketing', path: '/marketing' },
    { icon: Bell, label: 'Notificações', path: '/notificacoes' },
  ];
};

const getSettingsMenuItems = () => {
  return [
    { icon: UserCircle, label: 'Convite de Clientes', path: '/convite-clientes' },
    { icon: Settings, label: 'Controle de Clientes', path: '/controle-clientes' },
    { icon: User, label: 'Perfil', path: '/configuracoes' },
  ];
};

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const menuItems = getMenuItems(user?.role);
  const settingsItems = user?.role === 'admin' ? getSettingsMenuItems() : [];

  useEffect(() => {
    console.log('Layout - User role:', user?.role);
    console.log('Layout - Should show notification bell:', user?.role === 'customer' || user?.role === 'barber');
    
    // Auto-open settings menu if on a settings page
    const settingsPaths = ['/convite-clientes', '/controle-clientes', '/configuracoes'];
    if (settingsPaths.includes(location.pathname)) {
      setSettingsOpen(true);
    }
  }, [user, location.pathname]);

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between">
          <div className={isCollapsed ? "hidden" : ""}>
            <h1 className="text-xl font-bold text-foreground">
              Dallas Barbearia
            </h1>
          </div>
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="lg:hidden -mt-1 -mr-2 bg-primary/10 hover:bg-primary/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
        
        {user?.role === 'admin' && settingsItems.length > 0 && (
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <button
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-primary-light transition-smooth"
                title={isCollapsed ? "Configurações" : undefined}
              >
                <Settings className="h-5 w-5" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">Configurações</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {settingsItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-2 ml-4 transition-smooth ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-elegant'
                        : 'text-foreground hover:bg-primary-light'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>
      
      <div className="p-4 border-t border-border hidden lg:block">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Menu className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-gradient-soft">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex lg:flex-col border-r border-border bg-card transition-all duration-300 ${
        collapsed ? 'lg:w-20' : 'lg:w-72'
      }`}>
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* Mobile Header + Sidebar */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-40 border-b border-border/50 bg-gradient-to-r from-card/95 via-card/98 to-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 shadow-sm">
          <div className="flex h-16 items-center justify-end px-6">
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold">{user.name}</span>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <NotificationBell />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 border-b border-border/50 bg-gradient-to-r from-card/95 via-card/98 to-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Olá,</span>
                <span className="text-sm font-bold text-foreground">{user?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && <NotificationBell />}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="hover:bg-primary/10 transition-smooth"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 [&>button]:hidden">
                  <SidebarContent isCollapsed={false} />
                </SheetContent>
              </Sheet>
            </div>
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
