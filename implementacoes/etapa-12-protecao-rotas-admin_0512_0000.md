# Etapa 12: Proteção de Rotas da Área Admin

**Data:** 05/12/2025 00:00
**Feature:** Proteção de acesso à área administrativa (Route Guards)

---

## O que foi feito

Implementação de proteção de rotas para bloquear acesso de usuários sem permissão à área administrativa, seguindo princípios de segurança em camadas.

---

## Problema resolvido

**Antes:**
- Qualquer usuário autenticado podia acessar `/(admin)` ❌
- Botão "Área Admin" visível para todos ❌
- Segurança apenas nas Firestore Rules (sem feedback UX) ❌

**Depois:**
- Apenas admin/superadmin acessa `/(admin)` ✅
- Usuário sem permissão é redirecionado com toast de erro ✅
- Botão "Área Admin" apenas para admin/superadmin ✅
- Segurança em múltiplas camadas (UX + navegação + Firestore Rules) ✅

---

## Arquitetura de Segurança (Camadas)

```
┌─────────────────────────────────────────────┐
│ CAMADA 1: UI (Botões condicionais)         │
│ → Mostra/esconde botão "Área Admin"        │
│ → Feedback visual ao usuário               │
│ ✅ UX melhor                                │
│ ⚠️ Não é segurança real (pode ser burlado) │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ CAMADA 2: Navegação (Route Guards)         │
│ → Verifica role antes de navegar           │
│ → Redireciona se não autorizado            │
│ → Toast de erro                             │
│ ✅ Previne acesso via deep links            │
│ ⚠️ Pode ser burlado (código no cliente)    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ CAMADA 3: Firestore Rules (Nuvem)          │
│ → Valida TODAS operações de leitura/escrita│
│ → Usa custom claims (JWT token)            │
│ ✅ SEGURANÇA REAL (impossível burlar)      │
└─────────────────────────────────────────────┘
```

**Filosofia:**
- Camadas 1 e 2: UX/feedback ao usuário
- Camada 3: Segurança real (única fonte de verdade)

---

## Estrutura criada

### 1. **`src/features/auth/hooks/use-user-role.ts`** (Novo)

**Hook personalizado para obter role do Firestore em tempo real**

```typescript
export function useUserRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setRole(null)
      setLoading(false)
      return
    }

    // Listener em tempo real do documento do usuário
    const unsubscribe = firebaseFirestore
      .collection('users')
      .doc(user.uid)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data()
          setRole((data?.role as Role) || 'user')
        } else {
          setRole('user') // Fallback seguro
        }
        setLoading(false)
      })

    return () => unsubscribe()
  }, [user?.uid])

  return { role, loading }
}
```

**Por que ler do Firestore e não Custom Claims?**
- Custom Claims levam tempo para propagar (~1h cache)
- Firestore é atualizado instantaneamente
- Melhor UX (mudança de role reflete imediatamente)
- Custom Claims ainda são usados nas Firestore Rules (segurança)

**Características:**
- Real-time listener (atualiza quando role muda)
- Fallback seguro: `'user'` se documento não existe
- Cleanup automático (unsubscribe)
- TypeScript strict

---

### 2. **`app/_layout.tsx`** (Modificado)

**Route Guard implementado no RootNavigator**

**Imports adicionados:**
```typescript
import { useUserRole } from '@features/auth'
import { isAdmin } from '@shared/constants/permissions'
import { toast } from 'sonner-native'
```

**Lógica de proteção:**
```typescript
function RootNavigator() {
  const { user, loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useUserRole() // ← Novo
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (authLoading || roleLoading) return // ← Espera ambos

    const inAuthGroup = segments[0] === 'auth'
    const inTabsGroup = segments[0] === '(tabs)'
    const inAdminGroup = segments[0] === '(admin)'

    if (user) {
      // Verificar acesso à área admin
      if (inAdminGroup && role && !isAdmin(role)) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissão para acessar a área administrativa.',
        })
        router.replace('/(tabs)')
        return // ← Importante: return para não executar lógica seguinte
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
  }, [user, authLoading, role, roleLoading, segments])

  return (...)
}
```

**Fluxo:**
1. Usuário tenta acessar `/(admin)`
2. Hook verifica se `inAdminGroup === true`
3. Verifica se `role` existe e se `isAdmin(role) === true`
4. Se NÃO for admin:
   - Mostra toast de erro
   - Redireciona para `/(tabs)`
   - Retorna (não executa lógica seguinte)
5. Se for admin: permite navegação

---

### 3. **`app/(tabs)/profile.tsx`** (Modificado)

**Botão "Área Admin" condicional**

**Imports adicionados:**
```typescript
import { useUserRole } from '@features/auth'
import { isAdmin } from '@shared/constants/permissions'
```

**Botão condicional:**
```typescript
{/* Botão Área Admin - Apenas para admin/superadmin */}
{role && isAdmin(role) && (
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
)}
```

**Comportamento:**
- **user:** Botão NÃO aparece
- **admin:** Botão aparece
- **superadmin:** Botão aparece

---

### 4. **`src/features/auth/index.ts`** (Modificado)

**Export do novo hook**

```typescript
// Hooks
export { useAuth } from './hooks/use-auth';
export { useUserRole } from './hooks/use-user-role'; // ← Novo
```

---

## Fluxo completo

### Usuário comum tenta acessar admin (cenário 1)

1. Usuário autenticado com `role: 'user'`
2. Tenta navegar para `/(admin)/dashboard`
3. **Route Guard dispara:**
   - Detecta `inAdminGroup === true`
   - Verifica `isAdmin('user')` → `false`
   - Toast: "Acesso negado"
   - Redireciona para `/(tabs)`
4. Usuário volta para área normal

### Usuário comum na tela de perfil (cenário 2)

1. Usuário autenticado com `role: 'user'`
2. Abre tela de perfil
3. **Botão "Área Admin" NÃO aparece**
4. Não há como tentar acessar

### Admin acessa área admin (cenário 3)

1. Usuário autenticado com `role: 'admin'`
2. Abre tela de perfil
3. **Botão "Área Admin" aparece**
4. Clica no botão
5. **Route Guard dispara:**
   - Detecta `inAdminGroup === true`
   - Verifica `isAdmin('admin')` → `true`
   - **Permite navegação** ✅
6. Acessa área admin normalmente

### Deep link / URL manipulation (cenário 4)

1. Usuário comum tenta deep link: `myapp://admin/users`
2. **Route Guard dispara:**
   - Detecta `inAdminGroup === true`
   - Verifica role
   - Bloqueia e redireciona
3. **Segurança mantida** ✅

---

## Segurança em múltiplas camadas

### Por que 3 camadas?

**Camada 1 (UI):**
- Melhor UX (não mostra opções inválidas)
- Reduz tentativas de acesso inválido
- Guia o usuário corretamente

**Camada 2 (Navegação):**
- Feedback imediato (toast)
- Previne deep links maliciosos
- Proteção contra manipulação de URL

**Camada 3 (Firestore Rules):**
- Única camada realmente segura
- Valida TODAS operações
- Impossível burlar (código na nuvem)

**Princípio:** Nunca confie no cliente. A navegação é um detalhe de UX, a segurança real está nas Firestore Rules.

---

## Teste

### 1. Criar usuário comum:
```bash
# Cadastrar novo usuário
# Verificar role: 'user' no Firestore
```

**Resultado esperado:**
- Login funciona ✅
- Botão "Área Admin" NÃO aparece ✅
- Se tentar acessar via deep link → Bloqueado com toast ✅

### 2. Promover usuário para admin:
```bash
# Firestore Console → users/{uid} → Editar role para 'admin'
```

**Resultado esperado:**
- Botão "Área Admin" aparece ✅
- Pode acessar área admin ✅
- Navegação funciona normalmente ✅

### 3. Tentar burlar (usuário comum):
```bash
# Editar código localmente
# Forçar navegação para /(admin)
```

**Resultado esperado:**
- Route Guard bloqueia navegação ✅
- Toast de erro aparece ✅
- Redireciona para /(tabs) ✅
- **Firestore Rules bloqueiam qualquer operação** ✅

---

## Observações

- ✅ Proteção em múltiplas camadas
- ✅ Feedback visual ao usuário (toast)
- ✅ Real-time (role atualiza instantaneamente)
- ✅ Previne deep links maliciosos
- ✅ Segurança real nas Firestore Rules
- ⚠️ Custom Claims levam tempo para propagar (~1h)
- ⚠️ Hook `useUserRole` lê do Firestore (UX), Firestore Rules usam Custom Claims (segurança)

---

## Próximos passos

1. **CRUD de usuários completo:**
   - Superadmin edita role de outros usuários
   - Criar admin manualmente

2. **Refresh token automático:**
   - Quando role muda, forçar refresh do token
   - `await user.getIdToken(true)`

3. **Auditoria:**
   - Log de tentativas de acesso negado
   - Histórico de mudanças de role

4. **Deploy:**
   - Deploy Cloud Functions (Custom Claims)
   - Deploy Firestore Rules
   - Testar em produção

---

## Arquivos alterados

- `src/features/auth/hooks/use-user-role.ts` — Criado (hook para role)
- `src/features/auth/index.ts` — Adicionado export
- `app/_layout.tsx` — Route Guard implementado
- `app/(tabs)/profile.tsx` — Botão condicional
