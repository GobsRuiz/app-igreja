# Etapa 11: Sistema de Permissões Profissional (RBAC + Custom Claims)

**Data:** 04/12/2025 19:00
**Feature:** Role-Based Access Control com Custom Claims

---

## O que foi feito

Implementação completa de sistema de permissões profissional usado por empresas como GitHub, Stripe e Slack:
- Custom Claims (Firebase Auth)
- RBAC (Role-Based Access Control)
- Firestore Rules profissionais
- Cloud Functions para sincronizar roles

---

## Arquitetura (Padrão da Indústria)

```
┌────────────────────────────────────────────────┐
│ 1. CUSTOM CLAIMS (Token JWT)                  │
│    { role: 'admin' }                           │
│    ✅ No token (nuvem, seguro)                 │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│ 2. PERMISSÕES (Código hardcoded)              │
│    ROLE_PERMISSIONS[role]                     │
│    → ['write:events', ...]                    │
│    ✅ UI/UX (mostrar/esconder botões)         │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│ 3. FIRESTORE RULES (Nuvem)                    │
│    allow write: if token.role == 'admin'      │
│    ✅ SEGURANÇA REAL (impossível burlar)      │
└────────────────────────────────────────────────┘
```

---

## Roles implementados

### **user** (padrão)
- ✅ Ver eventos
- ✅ Ver categorias
- ✅ Ver locais
- ❌ Não pode criar/editar/deletar

### **admin**
- ✅ Tudo que 'user' faz
- ✅ CRUD eventos/categorias/locais
- ✅ **VER** usuários (não editar)
- ❌ Não pode alterar roles
- ❌ Não pode criar usuários manualmente

### **superadmin**
- ✅ Tudo que 'admin' faz
- ✅ Editar roles de usuários
- ✅ Criar/deletar usuários (futuro)

---

## Estrutura criada

### 1. **`src/shared/constants/permissions.ts`** (Novo)

**Sistema de permissões hardcoded**

```typescript
export type Role = 'user' | 'admin' | 'superadmin'

export type Permission =
  | 'read:events'
  | 'write:events'
  | 'delete:events'
  | 'read:categories'
  | 'write:categories'
  // ... etc
  | '*'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: ['read:events', 'read:categories', 'read:locations'],
  admin: [
    'read:events', 'write:events', 'delete:events',
    'read:categories', 'write:categories', 'delete:categories',
    'read:locations', 'write:locations', 'delete:locations',
    'read:users'  // Apenas visualizar
  ],
  superadmin: ['*']
}
```

**Helpers:**
- `hasPermission(role, permission)` - Verifica se tem permissão
- `getRolePermissions(role)` - Retorna todas permissões
- `isAdmin(role)` - Verifica se é admin ou superadmin
- `isSuperAdmin(role)` - Verifica se é superadmin

### 2. **`firestore.rules`** (Novo)

**Firestore Rules profissionais**

```javascript
function getRole() {
  return request.auth.token.role;  // Lê do custom claim
}

function isAdmin() {
  return getRole() in ['admin', 'superadmin'];
}

match /events/{eventId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();  // ✅ Segurança na nuvem
}
```

**Regras implementadas:**
- **users:** Todos leem, próprio usuário edita (exceto role), superadmin edita role
- **events/categories/locations:** Todos leem, apenas admin escreve
- **Fallback:** Bloqueia tudo não explicitamente permitido

### 3. **`functions/src/index.ts`** (Novo)

**Cloud Functions para Custom Claims**

**Function 1: syncUserRole**
- Trigger: Quando role muda no Firestore
- Ação: Atualiza custom claim no token

**Function 2: setDefaultUserRole**
- Trigger: Quando usuário é criado
- Ação: Define custom claim inicial (role: 'user')

### 4. **Atualizações em arquivos existentes**

**`src/features/users/types/user.types.ts`:**
- Role type: `Role` (importado de permissions)
- Role padrão: `'user'` (ao invés de 'member')

**`src/features/auth/services/auth.service.ts`:**
- Signup cria com `role: 'user'`

**`app/(admin)/users.tsx`:**
- Badge colorido:
  - 🔵 user → Azul
  - 🟠 admin → Laranja
  - 🔴 superadmin → Vermelho

---

## Fluxo completo

### Cadastro de usuário:
1. Usuário preenche formulário
2. `signUp()` cria conta no Firebase Auth
3. Cria documento em `users/{uid}` com `role: 'user'`
4. **Cloud Function dispara** → Define custom claim `{ role: 'user' }`
5. Usuário pode fazer login

### Mudança de role (futuro):
1. Superadmin edita role no admin
2. Firestore atualiza `users/{uid}/role`
3. **Cloud Function dispara** → Atualiza custom claim
4. Usuário faz refresh do token: `await user.getIdToken(true)`
5. Permissões atualizadas

### Validação de permissões:
1. **Cliente:** Verifica `hasPermission('write:events')` → Mostra/esconde botão
2. **Usuário tenta escrever:** Cliente chama Firestore
3. **Firestore Rules:** Valida `token.role == 'admin'`
4. **Se não for admin:** Bloqueia ❌
5. **Segurança garantida na nuvem** ✅

---

## Setup Cloud Functions

### Pré-requisitos:
1. **Firebase CLI** instalado: `npm install -g firebase-tools`
2. **Firebase Blaze Plan** (pago, mas free tier generoso)
3. **Node.js 18+**

### Passos:

```bash
# 1. Login no Firebase
firebase login

# 2. Ir para pasta functions
cd functions

# 3. Instalar dependências
npm install

# 4. Build
npm run build

# 5. Deploy
npm run deploy
```

### Testar localmente (opcional):
```bash
npm run serve  # Emulador local
```

---

## Firestore Rules - Deploy

```bash
# Deploy das regras
firebase deploy --only firestore:rules
```

**⚠️ IMPORTANTE:** Deploy das regras ANTES de usar em produção!

---

## Segurança em camadas

### Camada 1: Cliente (Permissões)
- Hardcoded no código
- UI/UX (mostrar/esconder)
- ⚠️ Não confiável (pode ser burlado)

### Camada 2: Firestore Rules (Nuvem)
- Valida TODAS as operações
- Usa custom claims do token
- ✅ SEGURO (impossível burlar)

### Camada 3: Cloud Functions (Backend)
- Lógica de negócio
- Operações sensíveis
- ✅ SEGURO

---

## Como usar no cliente

```typescript
import { hasPermission } from '@shared/constants/permissions'
import { useAuth } from '@features/auth'

function MyComponent() {
  const { user } = useAuth()  // user tem role

  // Verificar permissão
  const canWrite = hasPermission(user.role, 'write:events')

  return (
    <>
      {canWrite && (
        <Button onPress={createEvent}>Criar Evento</Button>
      )}
    </>
  )
}
```

---

## Próximos passos

1. **CRUD de usuários completo:**
   - Editar role (apenas superadmin)
   - Criar admin manualmente

2. **Refresh token após mudança de role:**
   - Helper para forçar refresh: `await user.getIdToken(true)`

3. **Proteção de rotas:**
   - Bloquear acesso à área admin se não for admin

4. **Auditoria:**
   - Logs de mudanças de role
   - Histórico de permissões

---

## Teste

### 1. Criar usuário:
- Cadastrar novo usuário
- Verificar role: 'user'
- Verificar custom claim (Firebase Console → Authentication → User → Custom Claims)

### 2. Firestore Rules:
- Usuário 'user' tenta criar evento
- Deve ser BLOQUEADO ❌
- Admin tenta criar evento
- Deve FUNCIONAR ✅

### 3. Cloud Functions:
- Firebase Console → Functions
- Verificar logs: `firebase functions:log`

---

## Observações

- ✅ Sistema profissional (padrão da indústria)
- ✅ Seguro (Firestore Rules validam tudo)
- ✅ Performance (permissões no código)
- ✅ Escalável (usado por empresas grandes)
- ⚠️ Requer Blaze Plan para Cloud Functions

---

## Custos (Firebase Blaze)

**Free tier (gratuito):**
- 2 milhões de invocações/mês
- 400.000 GB-s de tempo de computação

**Suficiente para a maioria dos apps!**
Custo só se exceder: ~$0.40 por milhão de invocações extras.
