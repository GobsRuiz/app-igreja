# Etapa 13: Melhorias na Proteção de Rotas (Sem Race Condition)

**Data:** 05/12/2025 00:30
**Feature:** Refatoração do sistema de permissões para eliminar race condition e duplicação

---

## O que foi feito

Refatoração completa do sistema de proteção de rotas, movendo `role` para o `AuthContext` e eliminando todos os problemas identificados na Etapa 12.

---

## Problemas resolvidos

### **Problema 1: Duplicação de listeners (Performance)**

**Antes (Etapa 12):**
```typescript
// _layout.tsx
const { role } = useUserRole()  // ← Listener 1

// profile.tsx
const { role } = useUserRole()  // ← Listener 2
```

**Resultado:**
- 2 listeners Firestore para o mesmo documento
- 2x custo de leitura
- Duplicação desnecessária

**Depois (Etapa 13):**
```typescript
// AuthProvider (global)
const unsubscribeRole = firebaseFirestore
  .collection('users')
  .doc(user.uid)
  .onSnapshot(...)  // ← ÚNICO listener global

// _layout.tsx e profile.tsx
const { role } = useAuth()  // ← Sem listener extra
```

**Resultado:**
- ✅ 1 único listener global
- ✅ 50% menos leituras Firestore
- ✅ Performance melhorada

---

### **Problema 2: Race condition (Flash de conteúdo)**

**Antes (Etapa 12):**
```typescript
const { user, loading: authLoading } = useAuth()
const { role, loading: roleLoading } = useUserRole()

useEffect(() => {
  if (authLoading || roleLoading) return  // ← Se roleLoading = true, NÃO faz nada

  // Usuário pode entrar em admin enquanto role carrega
  if (inAdminGroup && role && !isAdmin(role)) {
    // bloqueia (mas role pode ser null)
  }
}, [user, authLoading, role, roleLoading, segments])
```

**Problema:**
- `authLoading = false` (Auth rápido)
- `roleLoading = true` (Firestore carregando)
- Condição `if (authLoading || roleLoading) return` → **return**
- **Não executa lógica de bloqueio**
- Usuário entra em admin brevemente
- Depois bloqueia (flash de conteúdo)

**Depois (Etapa 13):**
```typescript
const { user, role, loading } = useAuth()  // ← 1 único loading

useEffect(() => {
  if (loading) return  // ← Aguarda Auth + Role carregarem juntos

  // Quando loading = false, role SEMPRE existe (ou é null)
  if (inAdminGroup) {
    if (!role || !isAdmin(role)) {  // ← Verifica null explicitamente
      toast.error(...)
      router.replace('/(tabs)')
      return
    }
  }
}, [user, role, loading, segments])
```

**Resultado:**
- ✅ Auth e Role carregam **juntos**
- ✅ Quando `loading = false`, role **sempre** tem valor
- ✅ Bloqueia se `role = null` **OU** `role = 'user'`
- ✅ Sem flash de conteúdo
- ✅ Sem race condition

---

### **Problema 3: Layout shift no perfil**

**Antes (Etapa 12):**
```typescript
{role && isAdmin(role) && (
  <Button>Área Admin</Button>
)}
```

**Problema:**
- `role = null` → botão **não aparece**
- `role = 'admin'` → botão **aparece** (layout pula)

**Depois (Etapa 13):**
```typescript
{loading ? (
  <YStack height={48}>
    <Spinner size="small" color="$blue10" />
  </YStack>
) : (
  role && isAdmin(role) && (
    <Button>Área Admin</Button>
  )
)}
```

**Resultado:**
- ✅ Loading state explícito (spinner)
- ✅ Sem layout shift (altura fixa)
- ✅ UX profissional

---

## Arquitetura final

```
┌────────────────────────────────────────────────┐
│ AuthProvider (Global)                          │
│ ├─ onAuthStateChanged (Firebase Auth)          │
│ └─ onSnapshot('users/{uid}') (Firestore)       │
│    → setState({ user, role, loading })         │
│    → 1 ÚNICO listener global ✅                │
└────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐     ┌─────────────────┐
│ _layout.tsx   │     │ profile.tsx     │
│ useAuth()     │     │ useAuth()       │
│ → { role }    │     │ → { role }      │
│ Sem listener  │     │ Sem listener    │
└───────────────┘     └─────────────────┘
```

**Princípio:** 1 único listener global, todos consomem do mesmo estado.

---

## Estrutura modificada

### 1. **`src/features/auth/types/auth.types.ts`** (Modificado)

**Adicionado `role` ao `AuthState`:**

```typescript
import type { Role } from '@shared/constants/permissions';

export interface AuthState {
  user: User | null;
  role: Role | null;  // ← Novo
  loading: boolean;
  error: string | null;
}
```

---

### 2. **`src/features/auth/providers/auth-provider.tsx`** (Modificado)

**Listener combinado (Auth + Firestore):**

```typescript
import { firebaseFirestore } from '@core/config/firebase.config';
import type { Role } from '@shared/constants/permissions';

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,  // ← Novo
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsubscribeRole: (() => void) | null = null;

    // Listener de autenticação
    const unsubscribeAuth = authService.onAuthStateChanged((user) => {
      // Limpar listener anterior SEMPRE (previne memory leak)
      if (unsubscribeRole) {
        unsubscribeRole();
        unsubscribeRole = null;
      }

      if (user) {
        // Usuário autenticado → escutar role do Firestore
        unsubscribeRole = firebaseFirestore
          .collection('users')
          .doc(user.uid)
          .onSnapshot(
            (doc) => {
              const role = doc.exists
                ? ((doc.data()?.role as Role) || 'user')
                : 'user';

              setState({
                user,
                role,  // ← Role atualizado
                loading: false,
                error: null,
              });
            },
            (error) => {
              console.error('Erro ao obter role do usuário:', error);
              // Fallback seguro
              setState({
                user,
                role: 'user',  // ← Fallback
                loading: false,
                error: null,
              });
            }
          );
      } else {
        // Não autenticado → limpar estado
        setState({
          user: null,
          role: null,
          loading: false,
          error: null,
        });
      }
    });

    // Cleanup
    return () => {
      unsubscribeAuth();
      if (unsubscribeRole) {
        unsubscribeRole();
      }
    };
  }, []);

  // ... resto do código
}
```

**Características:**
- ✅ 1 único listener global para role
- ✅ Cleanup correto (unsubscribe de ambos)
- ✅ **Previne memory leak:** Limpa listener anterior antes de criar novo
- ✅ Fallback seguro (`'user'` se documento não existe)
- ✅ Auth + Role carregam juntos

**Prevenção de memory leak:**
```typescript
// Limpar listener anterior SEMPRE (previne memory leak)
if (unsubscribeRole) {
  unsubscribeRole();
  unsubscribeRole = null;
}
```

**Por que isso é crítico:**
- Sem essa limpeza, múltiplos logins/logouts acumulam listeners
- Cada listener continua lendo do Firestore desnecessariamente
- Performance degrada com uso
- Custo Firestore aumenta

---

### 3. **`app/_layout.tsx`** (Modificado)

**Proteção de rotas simplificada:**

```typescript
import { AuthProvider, useAuth } from '@features/auth'  // ← Removido useUserRole

function RootNavigator() {
  const { user, role, loading } = useAuth()  // ← 1 único hook
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return  // ← 1 único loading

    const inAuthGroup = segments[0] === 'auth'
    const inTabsGroup = segments[0] === '(tabs)'
    const inAdminGroup = segments[0] === '(admin)'

    if (user) {
      // Autenticado

      // Verificar acesso à área admin
      if (inAdminGroup) {
        // Bloqueia se role não existe OU não é admin
        if (!role || !isAdmin(role)) {  // ← Verifica null explicitamente
          toast.error('Acesso negado', {
            description: 'Você não tem permissão para acessar a área administrativa.',
          })
          router.replace('/(tabs)')
          return
        }
      }

      // Garantir que está em (tabs) ou (admin)
      if (!inTabsGroup && !inAdminGroup) {
        router.replace('/(tabs)')
      }
    } else {
      // Não autenticado → garantir que está em auth
      if (!inAuthGroup) {
        router.replace('/auth')
      }
    }
  }, [user, role, loading, segments])

  return (...)
}
```

**Melhorias:**
- ✅ 1 único `loading` (Auth + Role juntos)
- ✅ Verifica `!role` explicitamente (bloqueia se null)
- ✅ Sem race condition
- ✅ Sem flash de conteúdo

---

### 4. **`app/(tabs)/profile.tsx`** (Modificado)

**Loading state no botão:**

```typescript
import { useAuth } from '@features/auth'  // ← Removido useUserRole
import { Spinner } from 'tamagui'  // ← Novo

export default function ProfilePage() {
  const { user, role, signOut, loading } = useAuth()  // ← 1 único hook
  const router = useRouter()

  // ...

  return (
    <YStack>
      {/* Botão Área Admin - Apenas para admin/superadmin */}
      {loading ? (
        <YStack height={48} alignItems="center" justifyContent="center">
          <Spinner size="small" color="$blue10" />
        </YStack>
      ) : (
        role &&
        isAdmin(role) && (
          <Button
            size="$5"
            backgroundColor="$blue10"
            color="white"
            fontWeight="600"
            icon={LayoutDashboard}
            onPress={handleGoToAdmin}
          >
            Área Admin
          </Button>
        )
      )}
    </YStack>
  )
}
```

**Melhorias:**
- ✅ Loading state explícito (spinner)
- ✅ Altura fixa (48px) → sem layout shift
- ✅ UX profissional

---

### 5. **`src/features/auth/index.ts`** (Modificado)

**Removido export de `useUserRole`:**

```typescript
// Hooks
export { useAuth } from './hooks/use-auth';
// export { useUserRole } from './hooks/use-user-role';  ← REMOVIDO
```

---

### 6. **`src/features/auth/hooks/use-user-role.ts`** (DELETADO)

Hook não é mais necessário. Role agora está no `AuthContext`.

---

## Fluxo completo

### **Abertura do app (loading):**

1. App abre
2. `AuthProvider` inicia: `loading = true`
3. **Listener Auth dispara:**
   - Se autenticado: `user = { uid, email, ... }`
   - **Listener Firestore dispara:** busca `users/{uid}`
4. **Firestore responde:** `role = 'admin'`
5. **setState:** `{ user, role: 'admin', loading: false }`
6. **Route Guard executa:** Permite acesso

**Tempo total:** ~100-300ms (Auth + Firestore)

**UX:**
- Loading screen (se implementado)
- OU aguarda antes de navegar
- **Nunca** mostra conteúdo não autorizado

---

### **Usuário comum tenta acessar admin:**

1. Usuário autenticado: `role = 'user'`
2. Tenta navegar para `/(admin)/dashboard`
3. **Route Guard verifica:**
   ```typescript
   if (inAdminGroup) {
     if (!role || !isAdmin(role)) {  // ← 'user' não é admin
       toast.error(...)
       router.replace('/(tabs)')
       return
     }
   }
   ```
4. **Bloqueado imediatamente** ✅
5. Toast: "Acesso negado"
6. Redireciona para `/(tabs)`

**Tempo:** Instantâneo (role já está carregado)

---

### **Admin acessa área admin:**

1. Usuário autenticado: `role = 'admin'`
2. Abre perfil → **Botão "Área Admin" visível**
3. Clica no botão
4. **Route Guard verifica:**
   ```typescript
   if (inAdminGroup) {
     if (!role || !isAdmin(role)) {  // ← 'admin' é admin ✅
       // NÃO executa (admin permitido)
     }
   }
   ```
5. **Permite navegação** ✅
6. Acessa área admin normalmente

---

## Comparação: Antes vs Depois

| Aspecto | Etapa 12 (Antes) | Etapa 13 (Depois) |
|---------|------------------|-------------------|
| **Listeners** | 2 (duplicado) | 1 (global) |
| **Performance** | 2x leituras | 1x leituras |
| **Race condition** | ⚠️ SIM (flash) | ✅ NÃO |
| **Loading states** | 2 separados | 1 único |
| **Layout shift** | ⚠️ SIM | ✅ NÃO |
| **Segurança** | ✅ Firestore Rules | ✅ Firestore Rules |
| **UX** | ⚠️ Flash + shift | ✅ Limpa |
| **Código** | Complexo | Simples |

---

## Segurança mantida

**Nada mudou em relação à segurança:**

1. **Camada 1 (UI):** Botões condicionais (melhorado: loading state)
2. **Camada 2 (Navegação):** Route Guard (melhorado: sem race condition)
3. **Camada 3 (Firestore Rules):** Segurança real na nuvem (inalterado) ✅

**Firestore Rules continuam sendo a única fonte de verdade.**

---

## Teste

### 1. Criar usuário comum:
```bash
# Cadastrar novo usuário
# Verificar role: 'user' no Firestore
```

**Resultado esperado:**
- Login funciona ✅
- **Loading spinner** aparece no perfil ✅
- Botão "Área Admin" **NÃO** aparece ✅
- Se tentar acessar via deep link → Bloqueado imediatamente ✅

### 2. Promover usuário para admin:
```bash
# Firestore Console → users/{uid} → Editar role para 'admin'
```

**Resultado esperado:**
- **Atualiza instantaneamente** (listener real-time) ✅
- Botão "Área Admin" **aparece** ✅
- Pode acessar área admin ✅
- **Sem layout shift** (spinner → botão com mesma altura) ✅

### 3. Tentar burlar (deep link):
```bash
# Usuário comum: myapp://admin/users
```

**Resultado esperado:**
- Route Guard bloqueia **imediatamente** ✅
- Toast de erro aparece ✅
- Redireciona para /(tabs) ✅
- **Sem flash de conteúdo** ✅

---

## Observações

- ✅ Eliminados TODOS os problemas da Etapa 12
- ✅ Performance 50% melhor (1 listener ao invés de 2)
- ✅ UX profissional (sem flash, sem layout shift)
- ✅ Código mais simples e limpo
- ✅ Segurança mantida (Firestore Rules)
- ✅ Real-time (role atualiza instantaneamente)

---

## Próximos passos

1. **Deploy Firebase:**
   - Deploy Cloud Functions (Custom Claims)
   - Deploy Firestore Rules
   - Ver guia: [DEPLOY-FIREBASE.md](../DEPLOY-FIREBASE.md)

2. **CRUD de usuários completo:**
   - Superadmin edita role de outros usuários
   - Criar admin manualmente

3. **Token refresh:**
   - Implementar refresh automático quando role muda
   - `await user.getIdToken(true)`

4. **Auditoria:**
   - Log de tentativas de acesso negado
   - Histórico de mudanças de role

---

## Arquivos alterados

- `src/features/auth/types/auth.types.ts` — Adicionado `role` ao `AuthState`
- `src/features/auth/providers/auth-provider.tsx` — Listener combinado (Auth + Firestore)
- `src/features/auth/index.ts` — Removido export de `useUserRole`
- `src/features/auth/hooks/use-user-role.ts` — **DELETADO** (obsoleto)
- `app/_layout.tsx` — Simplificado (1 único hook, sem race condition)
- `app/(tabs)/profile.tsx` — Loading state (spinner, sem layout shift)
