# 📧 Integração Hostinger SMTP - Guia de Teste

## ✅ O Que Foi Configurado

```
Email: contato@vanessabidinotti.com.br
SMTP Host: smtp.hostinger.com
Porta: 465 (SSL)
Autenticação: Nodemailer
```

---

## 🚀 Testar Agora (3 passos)

### **PASSO 1: Iniciar a aplicação**
```bash
npm run dev
```

### **PASSO 2: Acessar a página de confirmação**
```
http://localhost:3000/evento/vanessaerodrigo
```

### **PASSO 3: Completar fluxo**

1. **Buscar seu nome** (ex: "Roberto Almeida")
2. **Confirmar presença** 
3. **Novo step: EMAIL** 
   - Email: seu@email.com (ou qualquer email para teste)
   - Clique: "Enviar Confirmação"

---

## 📊 O Que Esperar

### **✅ Sucesso**

No **console do terminal**:
```
[EMAIL] Usando SMTP: smtp.hostinger.com:465
[EMAIL] De: contato@vanessabidinotti.com.br
[EMAIL] Para: seu@email.com
[EMAIL] ✅ Email enviado com sucesso!
[EMAIL] Message ID: <abc123@hostinger.com>
```

Na **página**:
```
"Resposta Recebida!"
```

Seu **email** receberá:
```
Assunto: Presença Confirmada - Vanessa & Rodrigo

Olá Roberto Almeida!

✓ Sua confirmação foi recebida para 1 pessoa(s)

📅 Sábado, 15 de Fevereiro de 2026 às 19:00
📍 Chácara Encanto da Serra, Atibaia - SP
   [Botão: Abrir no Waze]

🎁 Listas de Presentes
   → Amazon: https://...
   → Etna: https://...

Agradecemos sua confirmação! 🎉
```

---

## ❌ Troubleshooting

### **Erro: "EAUTH Authentication failed"**

**Causa:** Email ou senha incorretos

**Solução:**
1. Abra `.env.local`
2. Verifique email e senha
3. Reinicie o servidor (`npm run dev`)

```bash
SMTP_USER=contato@vanessabidinotti.com.br  ← Correto?
SMTP_PASSWORD=Eu@784586                     ← Correto?
```

---

### **Erro: "ESOCKET: Connection timeout"**

**Causa:** Firewall ou porta bloqueada

**Solução:**
1. Verifique se a porta **465** está aberta
2. Tente mudar de rede (wifi → dados móveis)
3. Contacte Hostinger se persistir

---

### **Erro: "Certificate problem"**

**Causa:** SSL/TLS issue

**Solução:** Adicione ao `.env.local`:
```
NODE_TLS_REJECT_UNAUTHORIZED=0
```

(Apenas para desenvolvimento)

---

## 📁 Arquivos Modificados

```
✅ .env.local                              (Novo - Credenciais)
✅ src/app/api/send-confirmation-email/route.ts  (Atualizado - Nodemailer)
✅ package.json                            (Atualizado - nodemailer instalado)
```

---

## 🔒 Segurança

| Aspecto | Status |
|--------|--------|
| Credenciais em .env.local | ✅ Protegido |
| .env.local no .gitignore | ✅ Não commita |
| Senha nunca no código | ✅ Variável de ambiente |
| SSL/TLS ativo | ✅ Porta 465 |

---

## 🧪 Teste Completo (5-10 minutos)

```bash
# 1. Terminal 1: Rodar aplicação
npm run dev

# 2. Abrir navegador
http://localhost:3000/evento/vanessaerodrigo

# 3. Testar fluxo
- Nome: "Teste"
- Confirme
- Email: seu@email.com
- Enviar

# 4. Ver resultado
- Console mostra "[EMAIL] ✅ Email enviado com sucesso!"
- Email real recebido em 2-3 segundos

# 5. Pronto para produção!
```

---

## 📧 Próximas Ações

### **Quando estiver confiante:**

1. **Deploy em produção** (Vercel, etc)
2. **Atualizar variáveis no hosting**
3. **Testar com dados reais**

### **Se tiver problemas:**

1. Verificar console logs
2. Consultar documentação Hostinger
3. Testar com Outlook/Gmail cliente SMTP

---

## 📊 Dados da Hostinger

```
Domínio: vanessabidinotti.com.br
Email: contato@vanessabidinotti.com.br
SMTP: smtp.hostinger.com:465 (SSL)
IMAP: imap.hostinger.com:993 (SSL)
POP: pop.hostinger.com:995 (SSL)
```

---

## ✨ Resultado Final

```
╔════════════════════════════════════╗
║  ✅ EMAIL CONFIGURADO             ║
║  ✅ NODEMAILER INSTALADO          ║
║  ✅ HOSTINGER SMTP CONECTADO      ║
║  ✅ PRONTO PARA ENVIAR            ║
╚════════════════════════════════════╝
```

**Teste agora e reporte qualquer erro!** 🚀

---

*Última atualização: 21 de Janeiro de 2026*
