import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, Plus, Loader2, Trash2, Pencil, User, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useAllBarbers, useCreateBarber, useUpdateBarber, useDeleteBarber, Barber } from '@/hooks/useBarbers';

export default function Barbeiros() {
  const { data: barbers = [], isLoading } = useAllBarbers();
  const createBarber = useCreateBarber();
  const updateBarber = useUpdateBarber();
  const deleteBarber = useDeleteBarber();
  
  const [open, setOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    commission_rate: '',
    rating: 5,
    is_active: true,
  });

  useEffect(() => {
    if (editingBarber) {
      setFormData({
        name: editingBarber.name,
        specialty: editingBarber.specialty || '',
        commission_rate: editingBarber.commission_rate?.toString() || '50',
        rating: editingBarber.rating || 5,
        is_active: editingBarber.is_active,
      });
    }
  }, [editingBarber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBarber) {
      await updateBarber.mutateAsync({
        id: editingBarber.id,
        data: {
          name: formData.name,
          specialty: formData.specialty || null,
          commission_rate: Number(formData.commission_rate),
          rating: formData.rating,
          is_active: formData.is_active,
        },
      });
    } else {
      await createBarber.mutateAsync({
        name: formData.name,
        specialty: formData.specialty || null,
        commission_rate: Number(formData.commission_rate),
        rating: formData.rating,
      });
    }
    
    setOpen(false);
    setEditingBarber(null);
    setFormData({ name: '', specialty: '', commission_rate: '50', rating: 5, is_active: true });
  };

  const handleEdit = (barber: Barber) => {
    setEditingBarber(barber);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (barberToDelete) {
      await deleteBarber.mutateAsync(barberToDelete);
      setDeleteDialogOpen(false);
      setBarberToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setBarberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingBarber(null);
      setFormData({ name: '', specialty: '', commission_rate: '50', rating: 5, is_active: true });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Barbeiros</h1>
            <p className="text-muted-foreground">Gerencie os profissionais da barbearia</p>
          </div>
          <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                Novo Barbeiro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBarber ? 'Editar Barbeiro' : 'Cadastrar Novo Barbeiro'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Barbeiro</Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    placeholder="Ex: Cortes Clássicos, Barba, etc."
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Taxa de Comissão (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avaliação (Estrelas)</Label>
                  <div className="flex gap-2 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="transition-colors"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= formData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{formData.rating}.0</span>
                  </div>
                </div>
                {editingBarber && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Barbeiro Ativo</Label>
                    <Switch
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full">
                  {editingBarber ? 'Atualizar Barbeiro' : 'Cadastrar Barbeiro'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {barbers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum barbeiro cadastrado ainda.
            </div>
          ) : (
            barbers.map((barber) => (
              <Card key={barber.id} className="hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg gradient-primary">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(barber)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDeleteDialog(barber.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-4 flex items-center gap-2">
                    {barber.name}
                    {!barber.is_active && (
                      <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full">
                        Inativo
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Especialidade</p>
                    <p className="font-medium">{barber.specialty || 'Não informada'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avaliação</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (barber.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium">{barber.rating || 0}.0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Comissão</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{barber.commission_rate}%</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este barbeiro? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
