import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WhatsAppQRConnectProps {
  onCredentialsScanned: (token: string, phoneId: string) => void;
}

export function WhatsAppQRConnect({ onCredentialsScanned }: WhatsAppQRConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleScan = async (data: string | null) => {
    if (!data) return;

    try {
      const credentials = JSON.parse(data);
      
      if (credentials.token && credentials.phone_id) {
        onCredentialsScanned(credentials.token, credentials.phone_id);
        setSuccess(true);
        setError(null);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setScanning(false);
        }, 2000);
      } else {
        setError("QR code inválido. Certifique-se de escanear o QR code correto.");
      }
    } catch (err) {
      setError("Erro ao processar QR code. Verifique se o formato está correto.");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Dynamically import jsQR
          const jsQR = (await import('jsqr')).default;
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            handleScan(code.data);
          } else {
            setError("Nenhum QR code encontrado na imagem.");
          }
        } catch (err) {
          setError("Erro ao ler a imagem. Tente novamente.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <QrCode className="h-4 w-4" />
          Conectar via QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp Business</DialogTitle>
          <DialogDescription>
            Escaneie o QR code com as credenciais do WhatsApp Business API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Credenciais configuradas com sucesso!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <QrCode className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Faça upload de uma imagem do QR code
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="qr-upload"
                  />
                  <label htmlFor="qr-upload">
                    <Button variant="secondary" asChild>
                      <span>Selecionar Imagem</span>
                    </Button>
                  </label>
                </div>

                <div className="text-xs text-muted-foreground space-y-2">
                  <p className="font-medium">Como gerar o QR code:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Acesse Meta for Developers</li>
                    <li>Copie seu Token de Acesso e Phone Number ID</li>
                    <li>Gere um QR code com o formato JSON:</li>
                  </ol>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`{
  "token": "seu_token_aqui",
  "phone_id": "seu_phone_id_aqui"
}`}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
