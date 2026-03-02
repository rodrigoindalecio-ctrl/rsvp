# Análise e Padronização do Fluxo de Importação/Gestão de Convidados

## 📊 RESUMO EXECUTIVO

O projeto é um **SaaS RSVP Manager** em Next.js que gerencia confirmação de presença para eventos (casamentos, debutantes, etc.). Atualmente, o fluxo de importação de convidados é **mockado** e não processa arquivos reais. Há inconsistências entre as colunas de importação e exportação, e faltam validações robustas.

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **Fluxo de Importação Quebrado**
- **Arquivo**: `src/app/import/page.tsx` (linhas 103-130)
- O `processFile()` apenas simula importação com dados mockados
- Não realiza parsing real de Excel/CSV
- Bibliotecas necessárias (`xlsx`) estão no `package.json` mas não são utilizadas

### 2. **Inconsistência de Colunas**
| Contexto | Colunas |
|----------|---------|
| **Modelo Download** | "Nome do Convidado Principal,Nomes dos Acompanhantes (separados por vírgula)" |
| **CSV Exportação** | ['Nome', 'Tipo', 'Grupo', 'Status', 'Atualizado Em'] |
| **Status na Importação** | Hardcoded como 'pending' ✓ (correto, mas sem validação) |
| **Status na Exportação** | Inclui status ✓ (correto) |

### 3. **Sem Validação de Duplicidade**
- Não há proteção contra importação duplicada
- Critério para detecção não está definido
- Importações podem criar duplicatas de nomes

### 4. **Sem Validação de Campos Obrigatórios**
- CSV pode ter colunas vazias ou malformadas
- Sem tratamento de erros durante parsing
- Sem feedback ao usuário sobre problemas

### 5. **Modelo de Dados Inconsistente**
- `event-context.tsx`: estrutura `Guest` com `companions` (número) e `companionsList` (array)
- `model.ts`: define `Invite` e `Person` mas código não usa
- Há retrocompatibilidade, mas cria confusão

### 6. **Sem Tela de Review para Arquivo**
- Upload de arquivo pula direto para "sucesso" (mockado)
- Usuário não vê o que será importado
- Impossível detectar erros antes da confirmação

---

## ✅ DECISÕES TÉCNICAS PROPOSTAS

### **1. Estrutura Padronizada de Planilhas**

#### **Planilha de Importação (modelo.xlsx)**
Colunas (SEM status):
```
A. Nome Principal (obrigatório)
B. Telefone (obrigatório - para detecção de duplicidade)
C. Email (opcional)
D. Acompanhantes - Nomes (opcional, separados por ; ou quebra de linha)
E. Restrições Alimentares (opcional)
F. Grupo/Família (opcional, para referência)
```

**Exemplos:**
```
Nome Principal | Telefone      | Email              | Acompanhantes           | Restrições | Grupo
Roberto Silva  | 11987654321   | roberto@email.com  | Maria Silva;João Silva  | -          | Família Silva
Ana Souza      | 11998765432   | ana@email.com      |                         | Vegetariana| Ana + esposo
```

#### **Planilha de Exportação (lista_convidados.xlsx)**
Colunas (COM status e extras):
```
A. Nome
B. Telefone
C. Email
D. Acompanhantes (contador)
E. Status Geral (Pendente / Confirmado / Recusado)
F. Grupo
G. Última Atualização
H. Detalhes Acompanhantes (JSON coluna opcional para visualização)
```

### **2. Lógica de Duplicidade**

**Critério**: `Nome + Telefone`

**Comportamento**:
- ✅ Detecta duplicatas antes de inserir
- ✅ Retorna erro claro indicando linha duplicada
- ✅ Não sobrescreve nem insere duplicata
- ✅ Permite usuário revisar e corrigir antes de importar

**Alternativa** (se telefone não estiver disponível):
- Usar `Nome + Email` ou apenas `Nome` com aviso

### **3. Status de Convidados**

| Estado | Quando Ocorre |
|--------|---------------|
| **PENDING** | Ao importar ou adicionar manualmente |
| **CONFIRMED** | Quando convidado confirma na página pública ou admin confirma |
| **DECLINED** | Quando convidado recusa ou admin marca como recusado |

**Regra**: Importação SEMPRE inicializa com `PENDING` (nunca com outro status)

### **4. Regra de Acompanhantes**

Mantém compatibilidade:
- Cada Guest tem `companionsList: Companion[]`
- Cada Companion tem `{ name: string, isConfirmed: boolean }`
- Ao importar, acompanhantes começam com `isConfirmed: false`
- Convidado pode confirmar/rejeitar acompanhantes na página pública

---

## 🛠️ IMPLEMENTAÇÃO

### **Fase 1: Criar Utilitários de Validação**

**Arquivo novo**: `src/lib/utils/parseSheets.ts`
- `parseGuestsList(file: File)` - Parse real de Excel/CSV
- `validateGuestRow(row: any)` - Valida campos obrigatórios
- `detectDuplicates(guests: Guest[], newGuests: Guest[])` - Detecta duplicatas
- `formatSheetTemplate()` - Gera planilha modelo completa

### **Fase 2: Atualizar Event Context**

**Arquivo**: `src/lib/event-context.tsx`
- Adicionar validação de duplicidade antes de `addGuest()`
- Adicionar método `addGuestsBatch()` para importação em lote
- Melhorar estrutura Guest para suportar campos novos (telefone, grupo)

### **Fase 3: Implementar Tela de Review**

**Arquivo**: `src/app/import/page.tsx`
- Integrar parseamento real de arquivo
- Exibir preview das linhas antes de confirmar
- Mostrar erros específicos (duplicatas, campos obrigatórios faltando)
- Permitir ignorar/corrigir antes de finalizar

### **Fase 4: Atualizar Download de Listagem**

**Arquivo**: `src/app/dashboard/page.tsx`
- Incluir status na exportação CSV
- Oferecer opção de formato (CSV simples vs. XLSX completo)
- Adicionar colunas de telefone e grupo (se preenchidos)

---

## 📈 BENEFÍCIOS

✅ **Consistência**: Mesmas colunas base em importação e exportação  
✅ **Segurança**: Validação rigorosa evita dados inválidos  
✅ **UX**: Review antes de confirmar reduz erros  
✅ **Clareza**: Critério de duplicidade bem definido  
✅ **Flexibilidade**: Download com ou sem status conforme necessidade  
✅ **Compatibilidade**: Não quebra dados existentes  

---

## 📝 PRÓXIMOS PASSOS

1. **Criar `parseSheets.ts`** com funções de validação
2. **Atualizar Guest interface** para incluir `telefone` e `grupo`
3. **Implementar tela de review** no import
4. **Testar** com arquivo real (xlsx/csv)
5. **Validar** duplicidade e erros de campo

