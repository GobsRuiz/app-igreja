# Etapa 9: Usuários - Listagem

**Data:** 04/12/2025 17:30
**Feature:** Usuários - Listagem (Read only)

---

## O que foi feito

Implementação da página de listagem de usuários na área admin com listener em tempo real.

---

## Estrutura criada

```
src/features/users/
  ├── index.ts
  ├── types/
  │   └── user.types.ts      → Interfaces e mappers
  └── services/
      └── user.service.ts    → Service Firestore (listagem)
```

---

## Alterações

### `src/features/users/types/user.types.ts` (Criado)

**Descrição:** Types para usuário

**Interface User:**
```typescript
{
  id: string
  email: string
  displayName?: string  // Nome do usuário (opcional)
  photoUrl?: string     // URL da foto (opcional)
  phone?: string        // Telefone (opcional)
  role: 'admin' | 'member'
  createdAt: Date
}
```

**Funções:**
- `mapFirestoreUser()` - Converte documento Firestore para User

### `src/features/users/services/user.service.ts` (Criado)

**Descrição:** Service com operações de leitura

**Funções:**
1. **listUsers():**
   - Lista todos usuários ordenados por data de criação (desc)
   - Retorna array de usuários

2. **onUsersChange(callback):**
   - Listener em tempo real
   - Ordenado por createdAt (desc)
   - Auto-atualiza lista
   - Cleanup automático

3. **getUserById(userId):**
   - Busca usuário específico por ID
   - Retorna User ou null

### `app/(admin)/users.tsx` (Criado)

**Descrição:** Tela de listagem de usuários

**Funcionalidades:**

1. **Header:**
   - Título "Usuários"
   - Badge com contador (ex: "5 usuários")

2. **Lista em tempo real:**
   - Listener Firestore (`onUsersChange`)
   - Cards com informações do usuário

3. **Card de usuário:**
   - Avatar (ícone ou foto)
   - Nome (ou "Sem nome" se não houver)
   - Email com ícone Mail
   - Telefone (se houver) com ícone Phone
   - Badge de role:
     - Admin: laranja ($orange2/$orange10)
     - Membro: azul ($blue2/$blue10)
   - Data de cadastro formatada (dd/MM/yyyy)

4. **Estados:**
   - Loading: Spinner durante carregamento
   - Empty state: Mensagem quando não há usuários

**Design:**
- Cards elevados
- Avatar circular grande (56x56)
- Badges coloridos para roles
- Ícones para email, telefone, role, data
- Layout responsivo com YStack/XStack

### `app/(admin)/_layout.tsx` (Modificado)

**Adicionada tab Usuários:**
- Segunda tab (após Dashboard)
- Ícone Users do Lucide
- Título "Usuários"

### `src/features/users/index.ts` (Criado)

**Exports:**
- Types
- Services

---

## Firestore Structure

```
users/
  {userId}/  # ID vem do Firebase Auth
    email: "user@example.com"
    displayName: "João Silva" (opcional)
    photoUrl: "https://..." (opcional)
    phone: "+5511999999999" (opcional)
    role: "member" | "admin"
    createdAt: Timestamp
```

**Observação:**
- Collection `users` deve ser criada quando usuário se cadastra
- Por enquanto, essa collection pode não existir ainda (será criada futuramente no fluxo de cadastro)

---

## Funcionalidades

✅ Listagem em tempo real
✅ Contador de usuários
✅ Exibe email, nome, telefone
✅ Badge colorido de role (Admin/Membro)
✅ Data de cadastro formatada
✅ Avatar placeholder
✅ Loading state
✅ Empty state

❌ Criar usuário (não implementado)
❌ Editar usuário (não implementado)
❌ Deletar usuário (não implementado)
❌ Alterar role (não implementado)

---

## Segurança

✅ Apenas leitura (sem edição por enquanto)
✅ Listener em tempo real auto-atualiza
⚠️ Sem verificação de role (qualquer admin pode ver usuários)

---

## Performance

✅ Listener em tempo real
✅ Cleanup automático
✅ ScrollView otimizado

---

## UX/UI

- ✅ Loading state
- ✅ Empty state
- ✅ Badge contador no header
- ✅ Cards limpos e organizados
- ✅ Avatar circular
- ✅ Badges coloridos de role
- ✅ Ícones para cada info
- ✅ Data formatada em PT-BR

---

## Teste

1. **Pré-requisito:** Ter collection `users` no Firestore com pelo menos 1 usuário
   - Estrutura: { email, displayName?, photoUrl?, phone?, role, createdAt }

2. Área Admin → Tab "Usuários"
3. Verificar lista de usuários
4. Verificar badge de role (Admin/Membro)
5. Verificar contador no header
6. Verificar formatação de data

**Se não houver collection `users`:**
- Tela mostrará empty state
- A collection será criada futuramente quando implementar criação automática de usuário no cadastro

---

## Integração com Auth

**Atualmente:**
- Feature `users` é SEPARADA da feature `auth`
- `auth` gerencia autenticação (login/cadastro)
- `users` gerencia dados de perfil no Firestore

**Próxima implementação:**
- Ao criar conta (signUp), criar documento em `users/` automaticamente
- Sincronizar dados do Firebase Auth com collection `users`

---

## Próximos passos

1. **Criar documento em `users/` no signup** (automático)
2. CRUD completo de usuários (editar role, nome, telefone)
3. Upload de foto de perfil
4. Validação de role para ver página de usuários
5. Filtros (por role, busca por nome/email)
6. Paginação se houver muitos usuários
