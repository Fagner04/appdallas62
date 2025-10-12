# Deploy no Vercel - Dallas Barbearia

## Configuração Automática

Este projeto já está configurado para deploy no Vercel com o arquivo `vercel.json`.

## Passos para Deploy

### 1. Via Vercel Dashboard (Recomendado)

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Clique em "Deploy"

### 2. Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

## Variáveis de Ambiente

Certifique-se de adicionar estas variáveis no painel do Vercel:

```env
VITE_SUPABASE_URL=https://qeevcauhornyqrfeevwc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=seu_publishable_key_aqui
VITE_SUPABASE_PROJECT_ID=qeevcauhornyqrfeevwc
```

## Build Settings

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Framework Preset**: Vite

## Configuração de SPA

O arquivo `vercel.json` já está configurado para:
- Redirecionar todas as rotas para `index.html` (necessário para React Router)
- Adicionar headers de segurança
- Configurar cache para assets estáticos

## Domínio Personalizado

Após o deploy, você pode adicionar um domínio personalizado:
1. Vá para Settings > Domains no painel do Vercel
2. Adicione seu domínio
3. Configure os DNS conforme instruções

## Troubleshooting

### Erro 404 nas rotas
Se você receber erro 404 ao navegar para rotas diferentes da home, verifique se o `vercel.json` está na raiz do projeto.

### Variáveis de ambiente não funcionam
Certifique-se de que todas as variáveis começam com `VITE_` e foram adicionadas no painel do Vercel.

### Build falha
Verifique se todas as dependências estão no `package.json` e se não há erros no código TypeScript.
