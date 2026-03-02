# 🎯 RASTREAMENTO COMPLETO - Implementação de Categoria (Adulto/Criança)

## 📋 Resumo da Mudança
Adicionar campo `category` do tipo `GuestCategory` a Guest e Companion em toda a aplicação.

**Tipo:**
```typescript
type GuestCategory = 'adult_paying' | 'child_paying' | 'child_not_paying'
```

---

## 📂 ARQUIVOS A ALTERAR (12 arquivos)

### 1️⃣ **TIPOS E INTERFACES** ✅

#### [src/lib/event-context.tsx](src/lib/event-context.tsx)
- [ ] Adicionar tipo `GuestCategory`
- [ ] Atualizar interface `Companion` com campo `category: GuestCategory`
- [ ] Atualizar interface `Guest` com campo `category: GuestCategory`
- [ ] Atualizar `INITIAL_GUESTS` com valor padrão `category: 'adult_paying'`
- [ ] Atualizar funções que criam/atualizam guests para incluir category

**Mudanças específicas:**
- Companion type: adicionar `category: GuestCategory`
- Guest type: adicionar `category: GuestCategory`
- ParsedGuest interface no parseSheets: adicionar `category: GuestCategory`

---

### 2️⃣ **PARSING E IMPORTAÇÃO** ✅

#### [src/lib/utils/parseSheets.ts](src/lib/utils/parseSheets.ts)
- [ ] Adicionar validação de categoria (aceitar: 'Adulto Pagante', 'Criança Pagante', 'Criança Não Pagante')
- [ ] Mapear coluna "Categoria" do Excel
- [ ] Atualizar `parseGuestsList()` para extrair categoria
- [ ] Atualizar `generateImportTemplate()` para incluir coluna "Categoria" com exemplos
- [ ] Adicionar função de mapeamento: `mapCategoryToType(label: string): GuestCategory`

**Validações:**
- Se coluna "Categoria" estiver vazia: padrão `'adult_paying'`
- Se valor inválido: erro de importação

---

### 3️⃣ **TELA DE DASHBOARD DO USUÁRIO** ✅

#### [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
- [ ] Exportação Excel: adicionar coluna "Categoria"
- [ ] Mapeamento de `GuestCategory` → label em português na exportação
- [ ] Modal de edição de convidado: adicionar SELECT para categoria
- [ ] Sincronizar category ao salvar convidado

**Mudanças:**
- Função de exportação Excel
- Modal de adicionar/editar convidado
- Estado de editGuest

---

### 4️⃣ **COMPONENTES DO DASHBOARD** ✅

#### [src/app/dashboard/guest-edit-modal.tsx](src/app/dashboard/guest-edit-modal.tsx)
- [ ] Adicionar SELECT com 3 opções de categoria
- [ ] Padronizar para `'adult_paying'` se não informado
- [ ] Exibir categoria do guest atual

---

#### [src/app/dashboard/guest-list.tsx](src/app/dashboard/guest-list.tsx)
- [ ] Exibir categoria como badge colorida na listagem
- [ ] Cores sugeridas:
  - Adulto Pagante: azul
  - Criança Pagante: verde
  - Criança Não Pagante: laranja/amarelo

---

### 5️⃣ **TELA DE ADMIN** ✅

#### [src/app/admin/dashboard/page.tsx](src/app/admin/dashboard/page.tsx)
- [ ] Adicionar filtros/contadores por categoria (opcional mas recomendado)
- [ ] Mostrar resumo: "X adultos pagantes, Y crianças pagantes, Z crianças não pagantes"

---

#### [src/app/admin/evento/[id]/page.tsx](src/app/admin/evento/[id]/page.tsx)
- [ ] Adicionar coluna "Categoria" na tabela de convidados
- [ ] Exibir categoria com cores/badges
- [ ] Adicionar coluna "Acompanhantes" com detalhes de categoria de cada um
- [ ] Exportação CSV/Excel incluir categoria
- [ ] Possível filtro por categoria

**Função de exportação:**
```
Nome | Confirmado | Categoria | Acompanhantes (com categorias)
João | Sim | Adulto Pagante | Maria (Criança Não Pagante), Junior (Adulto Pagante)
```

---

#### [src/app/admin/guests/[id]/page.tsx](src/app/admin/guests/[id]/page.tsx) ⭐ (JÁ ABERTO)
- [ ] Adicionar SELECT de categoria para guest principal
- [ ] Adicionar SELECT de categoria para cada acompanhante
- [ ] Mapear valores do banco para labels em português na UI
- [ ] Salvar corretamente ao atualizar

**Campos a adicionar:**
- Após "Status": SELECT "Categoria"
- Em cada acompanhante: SELECT "Categoria"

---

### 6️⃣ **EMAIL DE CONFIRMAÇÃO** ✅

#### [src/app/api/send-confirmation-email/route.ts](src/app/api/send-confirmation-email/route.ts)
- [ ] Incluir categoria na lista de convidados do email
- [ ] Exibir "Adulto Pagante", "Criança Pagante", "Criança Não Pagante" no email
- [ ] Formato sugerido no email:
  ```
  João Silva (Adulto Pagante)
  - Maria Silva (Criança Não Pagante)
  - Junior Silva (Adulto Pagante)
  ```

---

### 7️⃣ **PÁGINA PÚBLICA DO EVENTO** ✅

#### [src/app/evento/[slug]/content.tsx](src/app/evento/[slug]/content.tsx)
- [ ] Modal de confirmação: ao selecionar convidado, mostrar campo de categoria (SELECT)
- [ ] Padrão: `'adult_paying'`
- [ ] Cada acompanhante tem seu próprio SELECT de categoria
- [ ] Enviar categoria no email de confirmação

---

### 8️⃣ **ADMIN CONTEXT** (Opcional)

#### [src/lib/admin-context.tsx](src/lib/admin-context.tsx)
- [ ] Adicionar função de contagem por categoria (para relatórios)
- [ ] Exemplo: `getMetricsByCategory()` → `{ adult_paying: 10, child_paying: 5, child_not_paying: 8 }`

---

## 🗂️ ESTRUTURA DE DADOS FINAL

```typescript
type GuestCategory = 'adult_paying' | 'child_paying' | 'child_not_paying'

interface Companion {
  name: string
  isConfirmed: boolean
  category: GuestCategory  // NOVO
}

interface Guest {
  id: string
  name: string
  email?: string
  telefone?: string
  grupo?: string
  companions: number
  companionsList: Companion[]
  status: GuestStatus
  category: GuestCategory  // NOVO
  updatedAt: Date
  confirmedAt?: Date
}
```

---

## 🎨 LABELS E CORES SUGERIDAS

| Tipo | Label | Cor | Abreviação |
|------|-------|-----|-----------|
| adult_paying | Adulto Pagante | 🔵 Azul | AP |
| child_paying | Criança Pagante | 🟢 Verde | CP |
| child_not_paying | Criança Não Pagante | 🟠 Laranja | CNP |

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após implementar:
- [ ] Importar modelo Excel com categoria funciona
- [ ] Adicionar novo convidado com categoria funciona
- [ ] Editar categoria de convidado funciona
- [ ] Editar categoria de acompanhante funciona
- [ ] Exportar Excel inclui coluna "Categoria"
- [ ] Email de confirmação mostra categoria
- [ ] Dashboard mostra resumo por categoria
- [ ] Página pública permite selecionar categoria
- [ ] Build local passa sem erros: `npm run build` ✅

---

## 📊 EXEMPLO DE FLUXO COMPLETO

```
1. Admin cria evento → define "Limite de idade: 12 anos" (opcional, para referência)
2. Usuário importa modelo Excel → coluna "Categoria" tem exemplos
3. Usuário preenche "João Silva | Categoria: Adulto Pagante | Acompanhantes: 2"
4. Usuário adiciona acompanhantes:
   - "Maria Silva | Criança Não Pagante"
   - "Junior Silva | Criança Pagante"
5. Email é enviado com categoria de cada um
6. Admin vê dashboard com contadores:
   - Adultos Pagantes: 1
   - Crianças Pagas: 1
   - Crianças Não Pagantes: 1
7. Admin exporta relatório para buffet com categorias
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Revisar este rastreamento
2. ✅ Confirmar que todos os arquivos foram listados
3. ⏳ Implementar em ordem:
   1. Tipos (event-context.tsx)
   2. Parseamento (parseSheets.ts)
   3. Admin guests (admin/guests/[id])
   4. Dashboard (dashboard/page.tsx)
   5. Admin evento (admin/evento/[id])
   6. Email (route.ts)
   7. Página pública (evento/[slug]/content.tsx)
4. ⏳ Testar tudo
5. ⏳ Build final

---

**Status**: ⏳ AGUARDANDO APROVAÇÃO PARA IMPLEMENTAÇÃO
