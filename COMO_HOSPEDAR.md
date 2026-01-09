# Como Hospedar na Cloudflare Pages

Este projeto está configurado para ser hospedado no **Cloudflare Pages**, a maneira mais rápida e segura de publicar aplicações web modernas.

## Passo a Passo para Hospedagem

### 1. Preparar o Repositório
Certifique-se de que seu código está em um repositório no **GitHub** ou **GitLab**.

### 2. Configurar no Cloudflare
1. Acesse o painel da [Cloudflare](https://dash.cloudflare.com/).
2. Vá em **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Selecione seu repositório.

### 3. Configurações de Build (Importante)
Ao configurar o projeto, use exatamente estas opções:
- **Project Name:** `dashboard-horas` (ou o que desejar)
- **Framework Preset:** `Vite`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/`

### 4. Deploy!
Clique em **Save and Deploy**. A Cloudflare criará um link `.pages.dev` para você e o site estará no ar em menos de 1 minuto.

## Por que Cloudflare?
- **Grátis**: Hospedagem gratuita com largura de banda ilimitada.
- **Seguro**: Proteção contra ataques DDoS e SSL automático.
- **Rápido**: Entrega o dashboard através de centenas de centros de dados ao redor do mundo.
- **Automatizado**: Sempre que você salvar algo no seu GitHub, a Cloudflare atualiza o site automaticamente.

---
*Configurações de otimização (`_headers` e `_redirects`) já incluídas na pasta `/public`.*
