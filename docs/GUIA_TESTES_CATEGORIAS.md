# 🧪 GUIA DE TESTES - Sistema de Acompanhantes com Categorias

## Fluxo de Testes Completo

### 1️⃣ TESTE: Download Excel Template

**Objetivo**: Verificar se o arquivo baixado tem 16 colunas com validação

**Steps**:
1. Ir para Dashboard → Importar Convidados
2. Clicar em "Baixar Modelo Excel"
3. Arquivo baixa: `modelo_convidados.xlsx`
4. Abrir em Excel

**Validações**:
- [ ] Arquivo abre sem erros
- [ ] Primeira linha tem headers:
  ```
  Nome Principal | Telefone | Email | Categoria | 
  Acompanhante 1 | Categoria Acomp. 1 |
  Acompanhante 2 | Categoria Acomp. 2 |
  Acompanhante 3 | Categoria Acomp. 3 |
  Acompanhante 4 | Categoria Acomp. 4 |
  Acompanhante 5 | Categoria Acomp. 5 |
  Restrições Alimentares | Grupo
  ```
- [ ] Coluna D (Categoria) tem dropdown com 3 opções
- [ ] Colunas J, L, N, P, R também têm dropdown
- [ ] Header com background rosa (#D946A6)
- [ ] 500 linhas preparadas (linha 2-501 vazias)

**Resultado Esperado**: ✅ Arquivo pronto para ser preenchido

---

### 2️⃣ TESTE: Upload Excel Preenchido

**Objetivo**: Verificar se importação lê corretamente 10 colunas

**Preparação**:
1. Abrir arquivo baixado
2. Preencher assim:
   ```
   Nome Principal: João Silva
   Telefone: (11) 99999-9999
   Email: joao@example.com
   Categoria: Adulto Pagante
   Acompanhante 1: Maria Silva
   Categoria Acomp. 1: Criança Pagante
   Acompanhante 2: Pedro Silva
   Categoria Acomp. 2: Criança Não Pagante
   [Deixar 3, 4, 5 vazios]
   Restrições: Vegetariano
   Grupo: Família Silva
   ```
3. Salvar como `teste_import.xlsx`

**Steps de Teste**:
1. Dashboard → Importar → Upload
2. Selecionar `teste_import.xlsx`
3. Preview deve mostrar:

**Validações**:
- [ ] Nome: "João Silva" carregou
- [ ] Telefone: "(11) 99999-9999" carregou
- [ ] Email: "joao@example.com" carregou
- [ ] Categoria: "Adulto Pagante" (selecionada)
- [ ] **Acompanhantes listados:**
  ```
  ✓ Maria Silva (Criança Pagante)
  ✓ Pedro Silva (Criança Não Pagante)
  ```
  (NOT mostrando vazios 3, 4, 5)
- [ ] Restrições: "Vegetariano"
- [ ] Grupo: "Família Silva"

**Resultado Esperado**: ✅ Dados importados com categorias

---

### 3️⃣ TESTE: Entrada Manual de Acompanhantes

**Objetivo**: Testar 5 slots fixos de entrada manual

**Steps**:
1. Dashboard → Importar → Aba "Adicionar Manualmente"
2. Preencher convidado principal:
   ```
   Nome: Roberto Costa
   Email: roberto@example.com
   Telefone: (11) 98888-8888
   Grupo: Amigos
   ```
3. Scroll para "Acompanhantes (Máximo 5)"
4. Preencher:
   ```
   Slot 1: Ana Costa | Adulto Pagante
   Slot 2: Lucas Costa | Criança Pagante
   Slot 3: [deixar vazio]
   Slot 4: [deixar vazio]
   Slot 5: [deixar vazio]
   ```

**Validações**:
- [ ] 5 slots visíveis (mesmo que vazios)
- [ ] Cada slot tem: input de nome (2/3) + dropdown categoria (1/3)
- [ ] Dropdown tem 3 opções: Adulto, Criança Pag., Criança N.Pag.
- [ ] Seção "Revisão do Convidado" mostra:
  ```
  Acompanhantes (2)
  ┌─ Ana Costa    [Adulto Pagante]  ┐
  └─ Lucas Costa  [Criança Pagante] ┘
  ```
  (Não mostra slots vazios)

**Resultado Esperado**: ✅ Form renderiza 5 slots e preview correto

---

### 4️⃣ TESTE: Edição Admin (Page)

**Objetivo**: Verificar se admin page mostra 5 slots fixos

**Steps**:
1. Dashboard → Clique em um convidado (ícone edit)
2. Ir para /admin/guests/[id]
3. Scroll para seção "Acompanhantes (Máximo 5)"

**Validações**:
- [ ] Seção mostra exatamente 5 linhas
- [ ] Cada linha tem:
  - [ ] Label "Acompanhante 1", "Acompanhante 2", etc.
  - [ ] Input de texto para nome (2/3 largura)
  - [ ] Select de categoria (1/3 largura)
  - [ ] Checkbox "Confirmado"
  - [ ] Status visual (se preenchido)
- [ ] Pode editar nome de um acompanhante existente
- [ ] Dropdown funciona (trocar categoria)
- [ ] Checkbox toggle funciona
- [ ] **Salvar**: Filtra vazios (não salva acompanhantes vazios)

**Teste Específico**:
1. Limpar nome do "Acompanhante 1"
2. Deixar "Acompanhante 2" com nome
3. Clicar Salvar
4. Recarregar página
5. Verificar que só "Acompanhante 2" permanece (1 não aparece)

**Resultado Esperado**: ✅ 5 slots fixos, salva apenas preenchidos

---

### 5️⃣ TESTE: Modal de Edição Rápida

**Objetivo**: Testar modal com 5 slots compactos

**Steps**:
1. Dashboard → Tabela de convidados
2. Clicar ícone de edição (lápis) de um convidado
3. Modal "Editar Convidado" abre

**Validações**:
- [ ] Modal mostra seção "Acompanhantes (Máximo 5)"
- [ ] 5 slots visíveis com layout grid compacto:
  ```
  [Input Nome ....] [Select Categoria]
  [Checkbox] Confirmado
  ```
- [ ] Pode editar nome e categoria
- [ ] Salvar filtra vazios
- [ ] Modal fecha após salvar
- [ ] Dashboard reflete mudanças

**Resultado Esperado**: ✅ Modal funciona com 5 slots

---

### 6️⃣ TESTE: Confirmação Pública (RSVP)

**Objetivo**: Verificar seleção de categorias por pessoa

**Steps**:
1. Ir para `/evento/[slug]`
2. Buscar convidado que foi importado acima (ex: "João Silva")
3. Pular para "Quem vai comparecer?"

**Validações**:
- [ ] Card "João Silva - Convidado Principal" com:
  - [ ] Checkbox para confirmar
  - [ ] Select de categoria ao marcar ✓
- [ ] Cards de acompanhantes aparecem (Maria e Pedro)
- [ ] Cada acompanhante tem:
  - [ ] Checkbox para confirmar
  - [ ] Select de categoria ao marcar ✓
- [ ] Ao desmarcar um acompanhante, select fica oculto
- [ ] Clicar "Confirmar presença" → próximo step (Email)

**Teste de Categoria**:
1. Marcar João como ✓ → selecionar "Criança Não Pagante"
2. Marcar Maria como ✓ → selecionar "Criança Pagante"
3. Deixar Pedro desmarcado
4. Confirmar presença
5. Próximo step: Email

**Resultado Esperado**: ✅ Categories selecionáveis por pessoa

---

### 7️⃣ TESTE: Email de Confirmação

**Objetivo**: Verificar exibição de categorias no email

**Steps**:
1. Continuar do step anterior (Email input)
2. Inserir email real (ex: seu@email.com)
3. Clicar "Enviar Confirmação"
4. Esperar email chegar

**Validações de Email**:
- [ ] Email recebido em ~2-5 segundos
- [ ] Subject: "Obrigado pela confirmação..."
- [ ] No corpo, seção de confirmação mostra:
  ```
  Sua confirmação foi recebida com sucesso para 2 pessoas
  
  Confirmados:
  ✓ João Silva (Criança Não Pagante)
  ✓ Maria Silva (Criança Pagante)
  ```
- [ ] Categorias aparecem entre parênteses
- [ ] Labels em português completo:
  - "Adulto Pagante"
  - "Criança Pagante"
  - "Criança Não Pagante"
- [ ] Formatação HTML com cores
- [ ] Links (Waze, Gift lists) funcionam

**Teste Específico**:
- Verificar que Pedro NÃO aparece (não confirmado)
- Verificar que categorias são as que selecionou

**Resultado Esperado**: ✅ Email mostra "Nome (Categoria)"

---

### 8️⃣ TESTE: Exportação Excel

**Objetivo**: Verificar se export tem 17 colunas com categorias

**Steps**:
1. Dashboard → Botão "Exportar Convidados"
2. Arquivo baixa: `lista_convidados_[data].xlsx`
3. Abrir em Excel

**Validações**:
- [ ] Arquivo abre sem erros
- [ ] Headers (17 colunas):
  ```
  1. Nome Principal
  2. Categoria
  3. Grupo
  4. Email
  5. Telefone
  6. Status
  7. Confirmado Em
  8. Acompanhante 1
  9. Categoria Acomp. 1
  10. Acompanhante 2
  11. Categoria Acomp. 2
  12. Acompanhante 3
  13. Categoria Acomp. 3
  14. Acompanhante 4
  15. Categoria Acomp. 4
  16. Acompanhante 5
  17. Categoria Acomp. 5
  ```
- [ ] Dados do convidado importado (João Silva):
  ```
  Nome Principal: João Silva
  Categoria: Adulto Pagante
  Acompanhante 1: Maria Silva
  Categoria Acomp. 1: Criança Pagante
  Acompanhante 2: Pedro Silva
  Categoria Acomp. 2: Criança Não Pagante
  [restante vazio]
  ```
- [ ] Uma linha por guest principal (não flattened)
- [ ] Header com styling (rosa/azul)
- [ ] Colunas têm largura adequada

**Teste Re-import**:
1. Baixar esse arquivo exportado
2. Fazer upload novamente
3. Verificar se dados carregam corretamente

**Resultado Esperado**: ✅ Export tem 17 colunas com categorias

---

## 🔍 Testes de Edge Cases

### Edge Case 1: Todas as categorias diferentes
**Setup**: Importar guest com 5 acompanhantes, cada um com categoria diferente
**Esperado**: 
- [ ] Admin mostra todas as 5 linhas
- [ ] Cada uma com sua categoria preservada
- [ ] Export mostra corretamente

### Edge Case 2: Nenhum acompanhante
**Setup**: Importar guest sem acompanhantes (slots 1-5 vazios)
**Esperado**:
- [ ] Admin mostra 5 slots vazios (pronto para adicionar)
- [ ] Export mostra apenas nome principal
- [ ] RSVP só mostra guest principal

### Edge Case 3: Misturado (alguns vazios)
**Setup**: Importar com acompanhantes em posições 1, 3, 5 (2 e 4 vazios)
**Esperado**:
- [ ] Admin mostra todos os 5 slots
- [ ] Slots 2 e 4 vazios
- [ ] Editar e salvar preserva ordem
- [ ] Export mostra só 1, 3, 5

### Edge Case 4: Editar depois de confirmar
**Setup**: Confirmar guest, depois editar via admin
**Esperado**:
- [ ] Pode adicionar/remover acompanhantes
- [ ] Pode mudar categorias
- [ ] RSVP status não é resetado

### Edge Case 5: Upload com erros
**Setup**: Subir Excel com:
  - Coluna faltando
  - Header errado
  - Linhas extras
**Esperado**:
- [ ] Sistema ignora colunas não mapeadas
- [ ] Parse não falha
- [ ] Mostra preview com dados que conseguiu ler

---

## 📊 Checklist de Validação

### Compilação e Type Safety
- [ ] `npm run build` sem erros
- [ ] `npm run lint` limpo
- [ ] TypeScript strict mode: OK
- [ ] Nenhum `any` implícito

### Funcionalidade
- [ ] Download template: 16 cols ✓
- [ ] Import parse: 10 cols ✓
- [ ] Manual form: 5 slots ✓
- [ ] Admin edit: 5 slots ✓
- [ ] Modal edit: 5 slots ✓
- [ ] RSVP public: Categories ✓
- [ ] Email: Nome (Categoria) ✓
- [ ] Export: 17 cols ✓

### Performance
- [ ] Download <100ms ✓
- [ ] Upload parse <500ms ✓
- [ ] Export <2s ✓
- [ ] Email send <5s ✓

### Data Integrity
- [ ] Dados não duplicam ✓
- [ ] Vazios são filtrados ✓
- [ ] Categories persistem ✓
- [ ] Re-import funciona ✓

### UI/UX
- [ ] Mobile responsive ✓
- [ ] Keyboard navigation ✓
- [ ] Accessible labels ✓
- [ ] Consistent styling ✓
- [ ] Português completo ✓

---

## 🐛 Troubleshooting

| Problema | Debug | Solução |
|----------|-------|---------|
| Acomp. não aparece após save | Check browser console | Verificar se `name` não está vazio |
| Categoria não salva | Check DevTools Network | Verificar enum value: 'adult_paying' etc |
| Email não envia | Check server logs | Verificar SMTP config em .env |
| Export vazio | Check guests array | Verificar se há convidados na BD |
| Modal não abre | Check console errors | Verificar se guest object é válido |

---

## ✅ Conclusão dos Testes

Após todos os testes acima passarem:

1. [ ] Feature está pronta para produção
2. [ ] Sem breaking changes detectados
3. [ ] Compatível com dados antigos
4. [ ] Performance aceitável
5. [ ] UX validado em mobile/desktop

**Data de Conclusão**: _________
**Testador**: _________
**Status Final**: ✅ APROVADO / ❌ REPROVADO

