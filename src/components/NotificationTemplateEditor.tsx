import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface NotificationTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  template?: {
    id?: string;
    type: string;
    title: string;
    description: string;
    message?: string;
    icon?: string;
    is_system?: boolean;
  };
  isNew?: boolean;
}

export const NotificationTemplateEditor = ({
  isOpen,
  onClose,
  template,
  isNew = false,
}: NotificationTemplateEditorProps) => {
  const { createTemplate, updateTemplate, deleteTemplate } = useNotificationTemplates();
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [message, setMessage] = useState(template?.message || '');
  const [type, setType] = useState(template?.type || 'custom');
  const [icon, setIcon] = useState(template?.icon || 'Bell');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setMessage(template.message || getDefaultMessage(template.type));
      setType(template.type);
      setIcon(template.icon || 'Bell');
    }
  }, [template]);

  const handleSave = async () => {
    if (!title || !message) {
      return;
    }

    const templateData = {
      type,
      title,
      description,
      message,
      icon,
    };

    if (isNew) {
      await createTemplate.mutateAsync(templateData);
    } else if (template?.id) {
      await updateTemplate.mutateAsync({ id: template.id, ...templateData });
    }
    
    onClose();
  };

  const handleDelete = async () => {
    if (template?.id && !template?.is_system) {
      await deleteTemplate.mutateAsync(template.id);
      setShowDeleteDialog(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNew ? 'Novo Template' : `Editar Template - ${template?.title}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={setType} disabled={template?.is_system}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmation">Confirmação</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                  <SelectItem value="thanks">Agradecimento</SelectItem>
                  <SelectItem value="promotion">Promoção</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Enviada imediatamente após o agendamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bell">Sino</SelectItem>
                  <SelectItem value="Calendar">Calendário</SelectItem>
                  <SelectItem value="CheckCircle2">Check</SelectItem>
                  <SelectItem value="Sparkles">Estrela</SelectItem>
                  <SelectItem value="Gift">Presente</SelectItem>
                  <SelectItem value="MessageSquare">Mensagem</SelectItem>
                </SelectContent>
              </Select>
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
                Variáveis disponíveis: {'{customer_name}'}, {'{barber_name}'}, {'{service_name}'}, {'{appointment_date}'}, {'{appointment_time}'}, {'{hours_text}'}
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="text-sm font-semibold">Preview</h4>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                {!isNew && !template?.is_system && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!title || !message}>
                  Salvar Template
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
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
    </>
  );
};

function getDefaultMessage(type: string): string {
  const messages: Record<string, string> = {
    confirmation: 'Olá {customer_name}! Seu agendamento com {barber_name} para {service_name} foi confirmado para o dia {appointment_date} às {appointment_time}. Te esperamos!',
    reminder: 'Olá {customer_name}! Lembrando que seu agendamento com {barber_name} para {service_name} é {hours_text} ({appointment_time}). Te esperamos!',
    thanks: 'Olá {customer_name}! Obrigado pela visita! Esperamos ter proporcionado uma excelente experiência. Até a próxima!',
    promotion: 'Olá {customer_name}! Confira nossas promoções especiais! Entre em contato para mais informações.',
    update: 'Olá {customer_name}! Seu agendamento com {barber_name} para {service_name} foi reagendado para {appointment_date} às {appointment_time}. Te esperamos!',
    cancellation: 'Olá {customer_name}! Seu agendamento com {barber_name} para {service_name} do dia {appointment_date} às {appointment_time} foi cancelado.',
  };
  return messages[type] || '';
}
