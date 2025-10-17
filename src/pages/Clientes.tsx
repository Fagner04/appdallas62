import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, Plus, Mail, Phone, Calendar, Pencil, Trash2, Bell, BellOff, Search, Copy, Check, UserPlus, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, Customer } from '@/hooks/useCustomers';
import { useMyBarbershop } from '@/hooks/useBarbershops';
import { toast } from 'sonner';

export default function Clientes() {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    createAccount: false,
    password: '',
  });

  // Convite states
  const [inviteData, setInviteData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
  });

  const { data: customers, isLoading } = useCustomers();
  const { data: barbershop } = useMyBarbershop();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const linkConvite = barbershop?.slug 
    ? `${window.location.origin}/cadastro/${barbershop.slug}`
    : '';

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        name: editingCustomer.name,
        email: editingCustomer.email || '',
        phone: editingCustomer.phone,
        notes: editingCustomer.notes || '',
        createAccount: false,
        password: '',
      });
    }
  }, [editingCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se criação de conta foi solicitada
    if (formData.createAccount && !editingCustomer) {
      if (!formData.email) {
        toast.error('Email é obrigatório para criar conta');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error('Senha deve ter no mínimo 6 caracteres');
        return;
      }
    }

    if (editingCustomer) {
      await updateCustomer.mutateAsync({
        id: editingCustomer.id,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
        },
      });
    } else {
      await createCustomer.mutateAsync({
        ...formData,
        createAccount: formData.createAccount,
        password: formData.createAccount ? formData.password : undefined,
      });
    }

    handleDialogClose();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (customerToDelete) {
      await deleteCustomer.mutateAsync(customerToDelete);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: '',
      createAccount: false,
      password: '',
    });
  };

  const handleToggleNotifications = async (customerId: string, currentValue: boolean) => {
    await updateCustomer.mutateAsync({
      id: customerId,
      data: { notifications_enabled: !currentValue },
    });
    toast.success(`Notificações ${!currentValue ? 'ativadas' : 'desativadas'} para este cliente`);
  };

  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleCadastrarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteData.nome || !inviteData.email || !inviteData.senha) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (inviteData.senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setInviteLoading(true);

    try {
      await createCustomer.mutateAsync({
        name: inviteData.nome,
        email: inviteData.email,
        phone: inviteData.telefone,
        createAccount: true,
        password: inviteData.senha,
      });

      setInviteData({ nome: '', email: '', telefone: '', senha: '' });
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Clientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie sua base de clientes e convites</p>
        </div>

        <Tabs defaultValue="lista" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto mb-4">
            <TabsTrigger value="lista" className="gap-2 text-xs sm:text-sm py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Lista de</span> Clientes
            </TabsTrigger>
            <TabsTrigger value="convite" className="gap-2 text-xs sm:text-sm py-2">
              <Send className="h-4 w-4" />
              Convidar<span className="hidden sm:inline"> Cliente</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Lista de Clientes */}
          <TabsContent value="lista" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar cliente por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) handleDialogClose();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Novo Cliente</span>
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email {formData.createAccount && '*'}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required={formData.createAccount}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Adicione observações sobre o cliente"
                    />
                  </div>

                  {!editingCustomer && (
                    <>
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Switch
                          id="createAccount"
                          checked={formData.createAccount}
                          onCheckedChange={(checked) => setFormData({ ...formData, createAccount: checked })}
                        />
                        <Label htmlFor="createAccount" className="cursor-pointer">
                          Criar conta de acesso para o cliente
                        </Label>
                      </div>

                      {formData.createAccount && (
                        <div className="space-y-2 p-4 bg-muted rounded-lg">
                          <Label htmlFor="password">Senha de Acesso *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            required={formData.createAccount}
                          />
                          <p className="text-xs text-muted-foreground">
                            O cliente poderá fazer login e agendar horários pelo app
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={createCustomer.isPending || updateCustomer.isPending}>
                    {editingCustomer ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-sm">Carregando clientes...</div>
            ) : !customers || customers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground text-sm">
                    Nenhum cliente cadastrado ainda
                  </p>
                </CardContent>
              </Card>
            ) : !filteredCustomers || filteredCustomers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground text-sm">
                    Nenhum cliente encontrado com esse nome
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{customer.name}</CardTitle>
                      {customer.loyalty_points !== undefined && customer.loyalty_points > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {customer.loyalty_points} pontos de fidelidade
                        </div>
                      )}
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground">{customer.notes}</p>
                    </div>
                  )}
                  
                  {/* Controle de Notificações */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {customer.notifications_enabled !== false ? (
                          <Bell className="h-4 w-4 text-primary" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Label htmlFor={`notifications-${customer.id}`} className="text-sm cursor-pointer">
                          Receber notificações
                        </Label>
                      </div>
                      <Switch
                        id={`notifications-${customer.id}`}
                        checked={customer.notifications_enabled !== false}
                        onCheckedChange={() => handleToggleNotifications(customer.id, customer.notifications_enabled !== false)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Cadastrado em {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDeleteDialog(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          {/* Tab: Convidar Clientes */}
          <TabsContent value="convite" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Card: Link de Convite */}
              <Card className="shadow-elegant">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Link de Cadastro
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Compartilhe este link com seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                      value={linkConvite} 
                      readOnly 
                      className="flex-1 text-xs sm:text-sm bg-muted"
                    />
                    <Button onClick={handleCopyLink} variant="outline" className="w-full sm:w-auto gap-2">
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span className="text-sm">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="text-sm">Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Os clientes poderão se cadastrar usando este link
                  </p>
                </CardContent>
              </Card>

              {/* Card: Cadastro Direto */}
              <Card className="shadow-elegant">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Cadastro Direto
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Cadastre o cliente diretamente no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCadastrarConvite} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="invite-nome" className="text-sm">Nome Completo *</Label>
                      <Input
                        id="invite-nome"
                        value={inviteData.nome}
                        onChange={(e) => setInviteData({ ...inviteData, nome: e.target.value })}
                        placeholder="Digite o nome completo"
                        className="text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="invite-email" className="text-sm">Email *</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteData.email}
                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                        placeholder="cliente@exemplo.com"
                        className="text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="invite-telefone" className="text-sm">Telefone</Label>
                      <Input
                        id="invite-telefone"
                        value={inviteData.telefone}
                        onChange={(e) => setInviteData({ ...inviteData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="invite-senha" className="text-sm">Senha *</Label>
                      <Input
                        id="invite-senha"
                        type="password"
                        value={inviteData.senha}
                        onChange={(e) => setInviteData({ ...inviteData, senha: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="text-sm"
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2 h-10 sm:h-11" disabled={inviteLoading}>
                      <UserPlus className="h-4 w-4" />
                      <span className="text-sm sm:text-base">
                        {inviteLoading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                      </span>
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e todos os agendamentos relacionados podem ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
