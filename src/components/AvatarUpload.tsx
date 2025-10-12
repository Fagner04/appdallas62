import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Trash2, User } from 'lucide-react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AvatarUploadProps {
  avatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({ avatarUrl, userName, size = 'lg' }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, deleteAvatar, uploading } = useAvatarUpload();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-28 w-28'
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    await deleteAvatar();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-1 gradient-primary rounded-full blur opacity-75 group-hover:opacity-100 transition-smooth" />
        <Avatar className={`relative ${sizeClasses[size]} border-4 border-white/20 shadow-elegant`}>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={userName || 'Avatar'} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-white/10 backdrop-blur-sm text-white">
              <User className={iconSizes[size]} />
            </AvatarFallback>
          )}
        </Avatar>
        
        {/* Upload button */}
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0 shadow-elegant"
          title="Alterar foto"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>

        {/* Delete button - only show if there's an avatar */}
        {avatarUrl && !uploading && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="absolute top-0 right-0 rounded-full h-8 w-8 p-0 shadow-elegant opacity-0 group-hover:opacity-100 transition-smooth"
            title="Remover foto"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover foto de perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover sua foto de perfil? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAvatar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
