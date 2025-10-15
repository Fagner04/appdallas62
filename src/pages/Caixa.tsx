import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions, useTransactionStats, useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useServices } from '@/hooks/useServices';
import { getTodayBrasilia } from '@/lib/timezone';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Caixa() {
  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const today = getTodayBrasilia();
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions(today);
  const { data: stats, isLoading: loadingStats } = useTransactionStats(today);
  const { data: services = [] } = useServices();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransaction.mutate({
      type: transactionType,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
    });
    setOpen(false);
    setFormData({ category: '', amount: '', description: '' });
  };

  const handleDelete = () => {
    if (transactionToDelete) {
      deleteTransaction.mutate(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (loadingTransactions || loadingStats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Caixa do Dia</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Controle financeiro - {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="default"
              className="gap-2 flex-1 sm:flex-initial"
              onClick={() => {
                setTransactionType('expense');
                setOpen(true);
              }}
            >
              <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Nova Saída</span>
              <span className="sm:hidden">Saída</span>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="default"
                  className="gap-2 flex-1 sm:flex-initial"
                  onClick={() => setTransactionType('income')}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Nova Entrada</span>
                  <span className="sm:hidden">Entrada</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Registrar {transactionType === 'income' ? 'Entrada' : 'Saída'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionType === 'income' ? (
                          <>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.name}>
                                {service.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="Outros">Outros</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Compras">Compras</SelectItem>
                            <SelectItem value="Produtos">Produtos</SelectItem>
                            <SelectItem value="Salários">Salários</SelectItem>
                            <SelectItem value="Aluguel">Aluguel</SelectItem>
                            <SelectItem value="Água">Água</SelectItem>
                            <SelectItem value="Energia">Energia</SelectItem>
                            <SelectItem value="Internet">Internet</SelectItem>
                            <SelectItem value="Manutenção">Manutenção</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Registrando...
                      </>
                    ) : (
                      `Registrar ${transactionType === 'income' ? 'Entrada' : 'Saída'}`
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card className="hover-lift transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Entradas
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-success">R$ {stats?.income.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                {stats?.incomeCount} transações
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Saídas
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-destructive">R$ {stats?.expenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                {stats?.expenseCount} transações
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-smooth sm:col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Saldo do Dia
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary-light">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${(stats?.balance ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {stats?.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                Saldo líquido do dia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Movimentações de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                Nenhuma transação registrada hoje
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth group"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                        transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{transaction.category || 'Sem categoria'}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">{transaction.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-auto">
                      <div className="text-right">
                        <div className={`text-lg sm:text-xl font-bold ${
                          transaction.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toFixed(2)}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => openDeleteDialog(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
