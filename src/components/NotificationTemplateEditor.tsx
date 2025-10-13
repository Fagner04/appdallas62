import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface NotificationTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    type: string;
    title: string;
    description: string;
  };
}

export const NotificationTemplateEditor = ({
  isOpen,
  onClose,
  template,
}: NotificationTemplateEditorProps) => {
  const [title, setTitle] = useState(template.title);
  const [message, setMessage] = useState(getDefaultMessage(template.type));

  const handleSave = () => {
    // Por enquanto apenas mostra toast - futuramente salvar em tabela de templates
    toast.success('Template atualizado com sucesso!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Template - {template.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Notificação</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Confirmação de Agendamento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem da notificação..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{nome_cliente}'}, {'{nome_barbeiro}'}, {'{servico}'}, {'{data}'}, {'{horario}'}
            </p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold">Preview</h4>
            <div className="space-y-1">
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getDefaultMessage(type: string): string {
  const messages: Record<string, string> = {
    confirmation: 'Olá {nome_cliente}! Seu agendamento com {nome_barbeiro} para {servico} foi confirmado para o dia {data} às {horario}. Te esperamos!',
    reminder: 'Olá {nome_cliente}! Lembrando que seu agendamento com {nome_barbeiro} para {servico} é em 1 hora ({horario}). Te esperamos!',
    thanks: 'Olá {nome_cliente}! Obrigado pela visita! Esperamos ter proporcionado uma excelente experiência. Até a próxima!',
    promotion: 'Olá {nome_cliente}! Confira nossas promoções especiais! Entre em contato para mais informações.',
  };
  return messages[type] || '';
}
