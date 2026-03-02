# 📊 GUIA: Como Usar a Planilha de Importação

## 🎯 Visão Geral

A planilha de importação é o arquivo Excel (.xlsx) que você preenche com a lista de convidados para importar em lote no RSVP Manager.

---

## ✏️ PREENCHIMENTO CORRETO

### **Coluna A: Nome Principal** (OBRIGATÓRIO)
O nome do convidado/titular do convite.

```
✅ Correto:
- Roberto Silva
- Ana Souza
- João e Maria (casal)

❌ Incorreto:
- (vazio)
- [dados aleatórios]
```

### **Coluna B: Telefone** (OBRIGATÓRIO)
Telefone do convidado. É usado para identificar duplicatas.

```
✅ Correto:
- 11987654321
- (11) 98765-4321
- 21 99999-9999
- +55 11 98765-4321

❌ Incorreto:
- (vazio) → importação será rejeitada
- "não informado"
- "TBD"
```

**Por que é obrigatório?**
- Evita importar duas vezes a mesma pessoa
- Facilita rastreamento
- Padrão de segurança

### **Coluna C: Email** (OPCIONAL)
Email do convidado.

```
✅ Correto:
- roberto@email.com
- ana.souza@empresa.com.br
(vazio - é opcional)

❌ Incorreto:
- roberto@.com → será rejeitado
- ana@domínio (sem extensão)
- @email.com (sem nome)
```

### **Coluna D: Acompanhantes** (OPCIONAL)
Nomes de quem vem com o convidado principal.

```
✅ Correto:
- Maria Silva;João Silva (separado por ponto-e-vírgula)
- Maria Silva
João Silva (cada um em uma linha dentro da célula)
(vazio - nenhum acompanhante)

❌ Incorreto:
- Maria, João (vírgula não funciona)
- Maria | João (pipe não funciona)
```

**Dica:** Use `;` (ponto-e-vírgula) para separar múltiplos nomes na mesma célula.

### **Coluna E: Restrições Alimentares** (OPCIONAL)
Alergia, regime alimentar, etc.

```
✅ Correto:
- Vegetariano
- Sem glúten
- Alérgico a amendoim
- Sem lácteos
(vazio - nenhuma restrição)

❌ Incorreto:
- (sem limite de caracteres, seja descritivo)
```

### **Coluna F: Grupo** (OPCIONAL)
Referência de grupo/família. Apenas para sua organização.

```
✅ Correto:
- Família Silva
- Amigos da Faculdade
- Colegas do Trabalho
(vazio - nenhum grupo)

❌ Não há formato inválido
```

---

## 📋 EXEMPLO COMPLETO

| Nome Principal | Telefone | Email | Acompanhantes | Restrições Alimentares | Grupo |
|---|---|---|---|---|---|
| Roberto Silva | 11987654321 | roberto@email.com | Maria Silva;João Silva | - | Família Silva |
| Ana Souza | 11998765432 | ana@email.com | (vazio) | Vegetariana | Amigas |
| Carlos Santos | 21987654321 | (vazio) | Beatriz Santos | Sem glúten | Colegas |
| Fernanda Costa | 85988887777 | fern@email.com | (vazio) | (vazio) | Amigos |

---

## ⚠️ VALIDAÇÕES QUE ACONTECEM

### **Erros que BLOQUEIAM a importação:**
- ❌ Coluna "Nome Principal" vazia
- ❌ Coluna "Telefone" vazia
- ❌ Email preenchido com formato inválido (ex: `roberto@.com`)

### **Avisos que NÃO BLOQUEIAM:**
- ⚠️ Email vazio (é opcional)
- ⚠️ Acompanhantes vazios (é opcional)
- ⚠️ Restrições vazias (é opcional)
- ⚠️ Grupo vazio (é opcional)

### **Duplicatas:**
Se o sistema já tem um convidado com **mesmo nome + mesmo telefone**, esse convidado é ignorado na importação.

```
Exemplo:
- Seu banco já tem: Roberto Silva | 11987654321
- Você tenta importar: Roberto Silva | 11987654321
→ Sistema ignora (evita duplicata)
→ Aviso ao final: "1 duplicata ignorada"
```

---

## 🔄 FLUXO DE IMPORTAÇÃO

### **Passo 1: Download do Modelo**
Na página "Importar" → Botão "Baixar modelo de planilha"

Você recebe um arquivo `.xlsx` com:
- Colunas corretas já definidas
- 2 exemplos preenchidos
- 1 linha em branco para você começar

### **Passo 2: Preencha Seus Convidados**
- Mantenha as colunas na mesma ordem
- Não renomeie as colunas
- Adicione quantas linhas precisar

### **Passo 3: Salve o Arquivo**
- Salve como `.xlsx` (Excel)
- Ou `.csv` (Excel/Google Sheets)

### **Passo 4: Upload na Página**
Na página "Importar":
1. Selecione "Importar Excel"
2. Arraste o arquivo ou clique para selecionar
3. O sistema faz a validação

### **Passo 5: Review**
- ✅ Se OK → Você vê **preview** com todos os convidados
- ❌ Se erros → Você vê **detalhes dos erros** (linha, campo, mensagem)

### **Passo 6: Confirme ou Corrija**
- **Se preview está OK**: Clique "Importar Tudo"
- **Se há erros**: Clique "Voltar", corrija o arquivo, tente novamente

### **Passo 7: Conclusão**
- ✅ Convidados aparecem na lista com status **PENDENTE**
- ⚠️ Aviso se houver duplicatas ignoradas
- Botão "Ver Lista" para ir ao dashboard

---

## 🆘 TROUBLESHOOTING

### **"Coluna não encontrada"**
- Verifique se manteve os nomes das colunas iguais
- Não renomeie "Nome Principal" para "Nome"
- Não mude a ordem das colunas

### **"Erro na linha 5, campo telefone"**
- Acesse a linha 5 do seu arquivo
- Verifique se o telefone está preenchido
- Se está vazio → preencha antes de importar

### **"Email inválido: alberto@"**
- O email faltou a extensão (.com, .br, etc)
- Preencha corretamente ou deixe vazio

### **"Duplicata: Roberto Silva (11987654321)"**
- Esse convidado já está na sua lista
- O sistema não importou para evitar duplicata
- Se precisa importar mesmo assim → exclua o antigo primeiro

### **O arquivo não é aceito**
- Verifique se é `.xlsx` ou `.csv`
- Arquivos `.xls` antigos não são suportados
- Se estiver usando Google Sheets → Baixe como Excel

---

## 📱 DICAS IMPORTANTES

### **1. Uso de Telefone como Chave Única**
O sistema usa "Nome + Telefone" para detectar duplicatas. Isso significa:
- Se a pessoa muda de número → sistema vê como novo convidado
- Se tem mesmo nome mas telefone diferente → sistema vê como pessoas diferentes

### **2. Acompanhantes**
Os acompanhantes importados começam como **"não confirmados"**.
Quando o convidado responde na página pública, ele confirma/rejeita os acompanhantes.

### **3. Status Inicial**
Todos os convidados importados começam com status **PENDENTE**.
Nunca com status "Confirmado" ou "Recusado".

### **4. Vários Arquivos**
Você pode importar múltiplas vezes:
- Primeira vez: 50 convidados
- Segunda vez: 30 mais
- Terceira vez: Atualizações/correções

O sistema detecta duplicatas automaticamente.

### **5. Correção**
Se importou errado:
- ❌ Não reimporte o arquivo (cria duplicata)
- ✅ Vá ao Dashboard → Exclua os errados → Importe novamente

---

## 📊 COMPARAÇÃO: Importação vs Exportação

| Aspecto | Importação | Exportação |
|--------|-----------|-----------|
| **Formato** | .xlsx (você preenche) | .csv (sistema gera) |
| **Colunas** | Nome, Tel, Email, Acompanhantes | Nome, Status, Tipo, Data |
| **Status** | SEM status (sempre PENDING) | COM status (Confirmado/Pendente/Recusado) |
| **Uso** | Adicionar convidados | Relatório/Análise |
| **Duplic.** | Detecta e ignora | Mostra tudo que existe |

---

## ✨ BOAS PRÁTICAS

1. **Antes de importar, sempre download o modelo** (garante colunas corretas)
2. **Valide manualmente antes**: Nome e Telefone devem estar preenchidos
3. **Use ; para separar acompanhantes**, não vírgula
4. **Teste com 5-10 convidados primeiro** (mais fácil de corrigir)
5. **Mantenha emails atualizados** (facilita contato depois)
6. **Reutilize o mesmo telefone para duplicatas intencionais** (ex: casal com 1 número)

---

## 🎓 EXEMPLO REAL: Casamento

```
Nome Principal | Telefone | Email | Acompanhantes | Restrições | Grupo
Família Silva | 11987654321 | familia@silva.com | Maria;João;Ana | - | Família Noiva
Casal Souza | 21987654321 | casal@email.com | (nenhum) | Sem glúten (João) | Amigos Rio
Tio Zé | 85988887777 | (vazio) | Tia Maria | - | Família Rio
Melhor Amigo | 11991234567 | friend@email.com | Namorada | Vegetariano | Amigos Infância
```

**Resultado após importação:**
- 4 grupos de convidados
- 7 pessoas no total (4 principais + 3 acompanhantes)
- Todos com status PENDENTE aguardando confirmação

---

Dúvidas? Verifique o arquivo `IMPLEMENTACAO_DETALHES.md` para detalhes técnicos.
