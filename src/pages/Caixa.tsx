import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Caixa() {
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'entrada', category: 'Corte', amount: 40, description: 'João Silva - Corte Simples', time: '09:00' },
    { id: 2, type: 'entrada', category: 'Corte + Barba', amount: 60, description: 'Pedro Santos', time: '10:00' },
    { id: 3, type: 'saida', category: 'Compras', amount: 150, description: 'Lâminas e produtos', time: '11:30' },
    { id: 4, type: 'entrada', category: 'Barba', amount: 30, description: 'Carlos Oliveira', time: '14:00' },
  ]);

  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'entrada' | 'saida'>('entrada');
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
  });

  const totalEntradas = transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaidas = transactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalEntradas - totalSaidas;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction = {
      id: transactions.length + 1,
      type: transactionType,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setTransactions([...transactions, newTransaction]);
    toast.success(`${transactionType === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
    setOpen(false);
    setFormData({ category: '', amount: '', description: '' });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Caixa do Dia</h1>
            <p className="text-muted-foreground">
              Controle financeiro - {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => setTransactionType('saida')}
                >
                  <Minus className="h-5 w-5" />
                  Nova Saída
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gap-2"
                  onClick={() => setTransactionType('entrada')}
                >
                  <Plus className="h-5 w-5" />
                  Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Registrar {transactionType === 'entrada' ? 'Entrada' : 'Saída'}
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
                        {transactionType === 'entrada' ? (
                          <>
                            <SelectItem value="Corte">Corte</SelectItem>
                            <SelectItem value="Barba">Barba</SelectItem>
                            <SelectItem value="Corte + Barba">Corte + Barba</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Compras">Compras</SelectItem>
                            <SelectItem value="Salários">Salários</SelectItem>
                            <SelectItem value="Aluguel">Aluguel</SelectItem>
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
                  <Button type="submit" className="w-full">
                    Registrar {transactionType === 'entrada' ? 'Entrada' : 'Saída'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entradas
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">R$ {totalEntradas.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {transactions.filter(t => t.type === 'entrada').length} transações
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Saídas
              </CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">R$ {totalSaidas.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {transactions.filter(t => t.type === 'saida').length} transações
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo do Dia
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary-light">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {saldo.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Saldo líquido do dia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'entrada' ? 'bg-success/10' : 'bg-destructive/10'
                    }`}>
                      {transaction.type === 'entrada' ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{transaction.category}</div>
                      <div className="text-sm text-muted-foreground">{transaction.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      transaction.type === 'entrada' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'entrada' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">{transaction.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
