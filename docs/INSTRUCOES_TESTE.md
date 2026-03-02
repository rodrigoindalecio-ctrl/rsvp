# 🚀 INSTRUÇÕES: BUILD & TESTE

## 📦 PRÉ-REQUISITOS

- Node.js 18+ instalado
- npm ou yarn
- Git (opcional, para versionamento)

---

## 🏗️ BUILD & SETUP

### **1. Instale dependências (se não fez ainda)**
```bash
npm install
```

Este comando instala a biblioteca `xlsx` que já estava no `package.json`.

### **2. Execute em modo desenvolvimento**
```bash
npm run dev
```

A aplicação estará rodando em `http://localhost:3000`

### **3. (Opcional) Build para produção**
```bash
npm run build
npm run start
```

---

## 🧪 TESTES MANUAIS

### **Teste 1: Baixar Modelo de Planilha**

**Steps:**
1. Abra o navegador em `http://localhost:3000/import`
2. Faça login (use as credenciais padrão do projeto)
3. Clique em "Baixar modelo de planilha"
4. Arquivo `modelo_importacao.xlsx` será baixado

**Validações:**
- ✅ Arquivo baixado com nome correto
- ✅ Arquivo é formato .xlsx válido
- ✅ Contém colunas: Nome Principal, Telefone, Email, Acompanhantes, Restrições, Grupo
- ✅ Tem 2 linhas de exemplo + 1 em branco

**Resultado Esperado:** 📥 Arquivo Excel pronto para preencher

---

### **Teste 2: Importação Válida (Arquivo Correto)**

**Preparação:**
1. Baixe o modelo (teste anterior)
2. Preencha com dados válidos:
```
Nome Principal  | Telefone      | Email            | Acompanhantes       | Restrições | Grupo
Roberto Silva   | 11987654321   | roberto@email... | Maria Silva;João    | -          | Família
Ana Souza       | 11998765432   | ana@email.com   | (vazio)             | Vegetariana| Amigos
```
3. Salve como `teste_valido.xlsx`

**Steps:**
1. Abra `/import`
2. Seção "Importar Excel" → Arraste o arquivo ou clique para selecionar
3. Aguarde processamento
4. Verifique tela de **REVIEW** com preview dos dados

**Validações:**
- ✅ Tela de review aparece
- ✅ Mostra 2 convidados + 1 acompanhante
- ✅ Tabela exibe: Nome, Telefone, Email, Acompanhantes
- ✅ Botões "Cancelar" e "Importar Tudo" aparecem

**Steps continuados:**
5. Clique "Importar Tudo"
6. Verifique tela de **SUCCESS**
7. Clique "Ver Lista" → Dashboard

**Validações finais:**
- ✅ Mensagem: "3 convidados foram adicionados"
- ✅ Dashboard mostra os 3 convidados
- ✅ Status de todos é "Pendente"
- ✅ Acompanhante aparece ligado ao titular

**Resultado Esperado:** ✅ Importação completa e correta

---

### **Teste 3: Validação - Campos Obrigatórios**

**Preparação:**
Crie arquivo `teste_erro.xlsx` com dados inválidos:
```
Nome Principal | Telefone | Email
Roberto Silva  | (vazio)  | roberto@email.com
(vazio)        | 11123456 | ana@email.com
```

**Steps:**
1. Abra `/import`
2. Selecione arquivo `teste_erro.xlsx`
3. Verifique tela de **ERROR**

**Validações:**
- ✅ Tela de erro aparece (não trava)
- ✅ Mostra seção "Erros de Validação"
- ✅ Linha 2: "Telefone é obrigatório"
- ✅ Linha 3: "Nome principal é obrigatório"
- ✅ Botão "Voltar" aparece
- ✅ Botão "Baixar Modelo Corrigido" aparece

**Steps continuados:**
4. Corrija o arquivo manualmente
5. Tente importar novamente
6. Desta vez deve ir para REVIEW

**Resultado Esperado:** ✅ Validação funciona, evita dados ruins

---

### **Teste 4: Validação - Email Inválido**

**Preparação:**
Arquivo com email mal formado:
```
Nome Principal | Telefone     | Email
Roberto        | 11987654321  | roberto@
```

**Steps:**
1. Selecione arquivo
2. Verifique tela de ERROR

**Validações:**
- ✅ Erro: "Email inválido: roberto@"
- ✅ Mensagem é clara

**Nota:** Email é opcional. Se deixar vazio, não há erro.

**Resultado Esperado:** ✅ Validação de email funciona

---

### **Teste 5: Detecção de Duplicidade**

**Preparação:**
Arquivo com linhas duplicadas:
```
Nome Principal | Telefone     | Email
Roberto Silva  | 11987654321  | roberto@email.com
Roberto Silva  | 11987654321  | outro@email.com
```

**Steps:**
1. Selecione arquivo
2. Verifique tela de ERROR

**Validações:**
- ✅ Seção "Duplicatas Detectadas"
- ✅ Mostra: "Roberto Silva (11987654321)"
- ✅ Mensagem clara

**Resultado Esperado:** ✅ Duplicatas dentro do arquivo são detectadas

---

### **Teste 6: Importação Manual**

**Steps:**
1. Abra `/import`
2. Seção "Adicionar Manualmente"
3. Preencha:
   - Nome: "Carlos Santos"
   - Acompanhantes: "Beatriz;Felipe"
4. Clique "Continuar"

**Validações:**
- ✅ Tela de REVIEW aparece
- ✅ Mostra: Carlos Santos + 2 acompanhantes = 3 pessoas

5. Clique "Confirmar"
6. Tela SUCCESS
7. Clique "Ver Lista"

**Resultado Esperado:** ✅ Adição manual continua funcionando

---

### **Teste 7: Exportação com Status**

**Preparação:**
1. Vá ao Dashboard (`/dashboard`)
2. Verifique se existem convidados (importados nos testes anteriores)

**Steps:**
1. Clique em alguns convidados para marcar "Confirmado"
2. Clique botão "Exportar" (ou similar)
3. Arquivo CSV será baixado

**Validações:**
- ✅ Arquivo é `lista_convidados.csv`
- ✅ Colunas incluem: Nome, Tipo, Grupo, **Status**, Email, **Telefone**
- ✅ Status traduzido: "Confirmado", "Pendente", "Recusado"
- ✅ Data em formato brasileiro (DD/MM/YYYY)
- ✅ Telefone está preenchido (se foi importado)

**Verificação adicional:**
Abra o CSV em Excel/Sheets e confirme formatação.

**Resultado Esperado:** ✅ Exportação inclui status e telefone

---

### **Teste 8: Convidado Duplicado (Sistema Existente)**

**Preparação:**
1. Importe dados do Teste 2 (2 convidados)
2. Crie novo arquivo com um convidado igual:
```
Nome Principal | Telefone     | Email
Roberto Silva  | 11987654321  | roberto.novo@email.com
```

**Steps:**
1. Tente importar o novo arquivo
2. Verifique tela de SUCCESS

**Validações:**
- ✅ Aviso: "⚠️ 1 duplicata ignorada"
- ✅ Count: "0 convidados adicionados"
- ✅ Dashboard não cria duplicata

**Resultado Esperado:** ✅ Sistema detecta e ignora duplicata com sistema existente

---

### **Teste 9: Acompanhantes com Separadores**

**Preparação:**
Arquivo com múltiplas separações:
```
Nome Principal | Telefone     | Email           | Acompanhantes
Casal Silva    | 11987654321  | casal@email.com | Maria;João;Ana
```

**Steps:**
1. Importe arquivo
2. Verifique preview
3. Confirme importação
4. Vá ao Dashboard

**Validações:**
- ✅ Preview mostra 3 acompanhantes
- ✅ Dashboard mostra "Casal Silva" com "+3 acompanhantes"
- ✅ Total de pessoas = 4 (1 titular + 3 acompanhantes)

**Resultado Esperado:** ✅ Acompanhantes separados por `;` funcionam

---

### **Teste 10: Compatibilidade com Dados Antigos**

**Steps:**
1. No console do navegador (F12 → Application → localStorage):
2. Procure por `rsvp_guests`
3. Verifique se dados antigos ainda existem e funcionam
4. Vá ao Dashboard
5. Filtre por status e busque

**Validações:**
- ✅ Dados antigos continuam acessíveis
- ✅ Filtros funcionam normalmente
- ✅ Edição de status continua funcionando
- ✅ Exclusão de convidados continua funcionando

**Resultado Esperado:** ✅ Compatibilidade total com dados existentes

---

## 🐛 TROUBLESHOOTING

### **"Erro ao processar arquivo: ..."**
- Verifique se é arquivo `.xlsx` ou `.csv`
- Arquivos `.xls` antigos não são suportados
- Tente reconverter em Excel moderno

### **"Coluna não encontrada"**
- Verifique nomes das colunas
- Não renomeie as colunas do template
- Use template baixado do sistema

### **"Erro na linha X"**
- Abra o arquivo no Excel
- Vá para linha X
- Verifique se campos obrigatórios estão preenchidos
- Corrija e tente novamente

### **"Email inválido"**
- Email deve ter formato: `nome@dominio.extensao`
- Se não sabe o email, deixe em branco (é opcional)

### **Arquivo não aparece como selecionado**
- Tente drag-and-drop (arraste e solte)
- Ou clique na área e selecione pelo file picker
- Tipos aceitos: `.xlsx`, `.csv`

---

## ✅ CHECKLIST PRÉ-PRODUÇÃO

Antes de fazer deploy, verifique:

- [ ] Teste 1: Download modelo OK
- [ ] Teste 2: Importação válida OK
- [ ] Teste 3: Validação de campos OK
- [ ] Teste 4: Validação de email OK
- [ ] Teste 5: Duplicatas no arquivo OK
- [ ] Teste 6: Importação manual OK
- [ ] Teste 7: Exportação com status OK
- [ ] Teste 8: Duplicatas com sistema OK
- [ ] Teste 9: Acompanhantes OK
- [ ] Teste 10: Compatibilidade OK
- [ ] Nenhum erro no console (F12)
- [ ] localStorage está funcionando
- [ ] Todas as páginas carregam rápido

---

## 📊 PERFORMANCE

Tempos esperados:

| Operação | Tempo |
|----------|-------|
| Download modelo | < 1s |
| Parse arquivo 100 convidados | 1-2s |
| Tela de review | < 0.5s |
| Importação 100 convidados | 1-2s |
| Export CSV 100 convidados | < 1s |

Se estiver mais lento:
- Verifique se localStorage está cheio
- Limpe cache do navegador
- Teste em aba anônima/privada

---

## 🎯 CONCLUSÃO

Se todos os 10 testes passarem, o sistema está pronto para produção! 🚀

**Reporte qualquer problema encontrado com:**
1. Número do teste
2. Steps exatos para reproduzir
3. Resultado esperado vs. obtido
4. Screenshot/console error

---

**Bom teste!** ✨
