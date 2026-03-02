# 🔗 Guia de Integração: Resend (Email Service)

## Por que Resend?

✅ **Fácil de usar** - API simples  
✅ **Gratuito até 100 emails** - Perfeito para MVP  
✅ **Next.js nativo** - Suporte oficial  
✅ **Autenticação verificada** - Sem spam  
✅ **Dashboard completo** - Analytics de envios  
✅ **Suporte em PT-BR** - Comunidade ativa  

---

## 📦 Instalação

### 1. Instalar Resend
```bash
npm install resend
```

### 2. Criar conta em Resend
- Acesse: https://resend.com
- Clique "Get Started"
- Faça login com GitHub/Email
- Copie sua API Key

### 3. Adicionar variável de ambiente

**`.env.local`** (criar se não existir):
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

⚠️ **NÃO COMPARTILHE** esta chave no GitHub!

---

## 🔧 Implementação

### Arquivo: `src/app/api/send-confirmation-email/route.ts`

**Localizar esta seção:**
```tsx
// Se você quer implementar com um serviço real, descomente abaixo
// Exemplo com Resend (necessário instalar: npm install resend)
/*
import { Resend } from 'resend'
...
*/
```

**Substituir por:**
```tsx
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
```

**Substituir a seção de envio:**

**ANTES (desenvolvimento):**
```tsx
// Por enquanto, vamos apenas registrar e retornar sucesso
console.log(`[EMAIL] Enviando para: ${email}`)
console.log(`[EMAIL] Destinatário: ${guestName}`)
```

**DEPOIS (Resend):**
```tsx
try {
    await resend.emails.send({
        from: 'noreply@rsvpmanager.com',
        to: email,
        subject: `Presença Confirmada - ${eventSettings.coupleNames}`,
        html: emailHTML,
        replyTo: 'contato@seudominio.com' // Opcional
    })
    
    console.log(`[RESEND] Email enviado para: ${email}`)
} catch (emailError) {
    console.error('[RESEND] Erro ao enviar:', emailError)
    throw new Error('Falha ao enviar email')
}
```

---

## 🎛️ Configuração do Domínio

### Para Production:

1. **Verificar domínio no Resend**
   - Dashboard Resend → Domains
   - Clique "Add Domain"
   - Insira seu domínio: `seudominio.com`
   - Resend gera registros DNS
   - Copie os registros DNS

2. **Adicionar DNS ao seu provedor** (GoDaddy, Hostgator, etc)
   - Acesse controle DNS
   - Adicione os registros CNAME/MX fornecidos
   - Aguarde propagação (pode levar até 48h)

3. **Verificar no Resend**
   - Resend detecta automaticamente
   - Ou clique "Verify"
   - Status muda para ✅ Verified

4. **Usar domínio no email**
   - De: `noreply@seudominio.com`
   - Funciona apenas com domínio verificado

### Para Desenvolvimento:

- Use: `onboarding@resend.dev` temporariamente
- Funciona apenas para endereços Resend
- Teste com contas de teste

---

## 📧 Configurações Recomendadas

### 1. Usar domínio genérico (emails@)
```tsx
from: 'emails@seudominio.com'
```

### 2. Com nome personalizado
```tsx
from: 'RSVP Manager <noreply@seudominio.com>'
```

### 3. Com reply-to
```tsx
replyTo: 'contato@seudominio.com'
```

### 4. Com CC/BCC (opcional)
```tsx
cc: 'organizador@seudominio.com',
bcc: 'arquivos@seudominio.com'
```

---

## 🧪 Teste de Funcionamento

### 1. Com conta de teste Resend
```tsx
from: 'onboarding@resend.dev',
to: 'seu@email.com' // Seu email real
```

### 2. Iniciar servidor
```bash
npm run dev
```

### 3. Testar fluxo
- Acesse `/evento/vanessaerodrigo`
- Confirme presença com email de teste
- Verifique inbox do email fornecido

### 4. Verificar Dashboard Resend
- Acesse https://resend.com/dashboard
- Seção "Emails"
- Você verá o email listado com status ✅ Sent

---

## 🎯 Exemplos de Uso

### Envio simples
```tsx
await resend.emails.send({
    from: 'noreply@rsvpmanager.com',
    to: email,
    subject: 'Sua confirmação',
    html: '<h1>Olá!</h1>'
})
```

### Com template
```tsx
await resend.emails.send({
    from: 'noreply@rsvpmanager.com',
    to: email,
    subject: `Presença Confirmada - ${eventSettings.coupleNames}`,
    html: emailHTML // Usar template gerado
})
```

### Com lista de destinatários
```tsx
const emails = guests
    .filter(g => g.email)
    .map(g => g.email)

await resend.emails.send({
    from: 'noreply@rsvpmanager.com',
    to: emails, // Array funciona
    subject: 'Aviso importante'
    html: '<h1>Mudança no evento</h1>'
})
```

---

## 📊 Dashboard Resend

### O que você verá:

- **Emails enviados** - Total de emails
- **Taxa de entrega** - % que chegaram
- **Bounces** - Emails inválidos
- **Clicks** - Links clicados no email
- **Aberturas** - Quantas vezes abriram
- **Planejamento futuro** - Envios agendados

### Limites (Plano Gratuito):

- 100 emails/dia
- Domínio não verificado
- Sem integração avançada

### Upgrade:

- Plano Pro: $20/mês
- Unlimited emails
- Domínio verificado
- Suporte 24/7

---

## 🚨 Troubleshooting

### Erro: "API key not found"
**Solução:**
```bash
# Verificar variável de ambiente
echo $RESEND_API_KEY

# Reiniciar servidor
npm run dev
```

### Erro: "Invalid email address"
**Solução:**
- Valide email com regex antes
- Remova espaços extras
- Use email em development account (onboarding@resend.dev)

### Email não chegou
**Verificar:**
1. Status no Dashboard Resend
2. Pasta de Spam
3. Domínio precisa estar verificado (production)
4. Limite de 100 emails/dia no gratuito

### Domínio não verifica
**Soluções:**
1. Aguarde até 48h para propagação DNS
2. Verifique se registros foram adicionados corretamente
3. Veja registros sugeridos novamente em Resend

---

## 📈 Boas Práticas

### 1. Sempre validar email
```tsx
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
    throw new Error('Email inválido')
}
```

### 2. Usar try-catch
```tsx
try {
    await resend.emails.send({...})
} catch (error) {
    console.error('Erro ao enviar:', error)
    return NextResponse.json(
        { error: 'Falha ao enviar email' },
        { status: 500 }
    )
}
```

### 3. Registrar envios
```tsx
console.log(`[Email] Enviado para ${email}`)
console.log(`[Email] Destinatário: ${guestName}`)
console.log(`[Email] Confirmados: ${confirmedCompanions}`)
```

### 4. Limpar logs sensíveis
```tsx
// NÃO registre API keys
console.log(`API Key: ${process.env.RESEND_API_KEY}`) // ❌

// SIM registre apenas o resultado
console.log('Email enviado com sucesso') // ✅
```

---

## 🔒 Segurança

### Proteções incluídas:

✅ **Chave API em variável de ambiente**  
✅ **Não compartilhada no cliente**  
✅ **HTTPS obrigatório em production**  
✅ **Rate limiting recomendado**  
✅ **Validação de email**  

### Adicionar Rate Limiting (Next.js):

```tsx
// Usando Headers para rate limit simples
const clientIP = request.headers.get('x-forwarded-for')

if (/* email enviado recentemente por IP */) {
    return NextResponse.json(
        { error: 'Tente novamente mais tarde' },
        { status: 429 }
    )
}
```

---

## 📞 Suporte Resend

- **Docs:** https://resend.com/docs
- **Discord:** https://discord.gg/CmNRwEN6
- **Email:** support@resend.com
- **Status:** https://resend.statuspage.io

---

## ✅ Checklist de Integração

- [ ] Conta criada em Resend
- [ ] API Key copiada
- [ ] `.env.local` configurado
- [ ] `npm install resend` executado
- [ ] Código descomentado em `route.ts`
- [ ] Servidor reiniciado
- [ ] Teste realizado com email de teste
- [ ] Email recebido com sucesso
- [ ] Dashboard Resend mostra envio
- [ ] Domínio verificado (production)
- [ ] HTTPS configurado (production)

---

**Pronto para usar!** 🚀  
Qualquer dúvida, consulte a documentação oficial: https://resend.com/docs
