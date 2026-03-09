# 🔐 ACESSO ADMIN - Guia de Utilização

## Credenciais de Admin

```
Email: rodrigoindalecio@gmail.com
Senha: [SENHA_REMOVIDA_POR_SEGURANCA]
```

## Como Acessar

1. **Vá para a página de login**
   - http://localhost:3000/login (desenvolvimento)
   - https://seu-dominio.com/login (produção)

2. **Faça login com as credenciais acima**
   - Digite o email e senha
   - Clique em "Entrar"

3. **Será redirecionado automaticamente para o Admin Dashboard**
   - http://localhost:3000/admin/dashboard

## Funcionalidades do Admin Dashboard

### 📊 Visão Geral
- **Total de Convidados**: Quantidade total de pessoas cadastradas
- **Confirmados**: Quantos confirmaram presença
- **Pendentes**: Quantos ainda não responderam
- **Recusados**: Quantos declinaram
- **Informações do Evento**: Todos os detalhes do evento atual
  - Nome do casal/debutante
  - Tipo de evento (Casamento ou Debutante)
  - Data e hora
  - Local
  - Prazo de confirmação

### 👥 Gerenciar Convidados
- **Visualizar todos os convidados** em uma tabela completa
- **Ver informações**: Nome, email, grupo, status, acompanhantes
- **Editar convidado**: Clique em "Editar" para acessar a página de edição
  - Alterar nome
  - Alterar email
  - Alterar telefone
  - Alterar grupo/família
  - Alterar status (Pendente/Confirmado/Recusado)
  - Adicionar/remover acompanhantes
  - Marcar acompanhantes como confirmados
  - **Excluir convidado** (com confirmação)

### 🔐 Gerenciar Usuários
- **Status**: Funcionalidade em desenvolvimento
- **Informações do usuário atual**: Mostrado o admin conectado
- Em breve será possível:
  - Adicionar novos usuários
  - Editar usuários existentes
  - Remover usuários
  - Alterar senhas

## Segurança

⚠️ **IMPORTANTE**: 
- As credenciais estão hardcoded por enquanto (desenvolvimento)
- Em produção, implementar:
  - Validação de credenciais no backend
  - Hash de senhas
  - JWT ou similar para sessões
  - Rate limiting de login
  - Log de atividades de admin

## Mudanças Implementadas

✅ **auth-context.tsx**
- Adicionado suporte a `role` (user/admin)
- Validação de credenciais admin
- Retorno de `isAdmin` no contexto

✅ **Novo diretório: `/app/admin/`**
- `dashboard/page.tsx` - Dashboard principal com KPIs e abas
- `guests/[id]/page.tsx` - Página para editar convidado específico

## Estrutura de Navegação

```
/login
  └─> Se admin → /admin/dashboard
  └─> Se user → /dashboard

/admin/dashboard
  ├─ Aba: Visão Geral
  ├─ Aba: Convidados
  │   └─ Clique em "Editar" → /admin/guests/[id]
  └─ Aba: Usuários
```

## Próximas Melhorias

- [ ] Autenticação via backend com JWT
- [ ] Página de gerenciamento de usuários completa
- [ ] Mudança de senha
- [ ] Adicionar novos convidados via admin
- [ ] Importação de convidados via CSV/Sheet
- [ ] Relatórios e estatísticas avançadas
- [ ] Auditoria de ações de admin
- [ ] Temas/customização por evento
