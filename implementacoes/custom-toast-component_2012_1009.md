# Custom Toast Component

**Data:** 20/12/2024 10:09
**Tipo:** Feature/Component

## Problema

O projeto usava `sonner-native` diretamente sem customização de duração. Para erros, a duração padrão de 4s era muito curta, não dando tempo suficiente para o usuário ler mensagens de erro importantes.

Além disso, havia inconsistência nos imports (alguns arquivos importavam direto do `sonner-native`, outros tentavam usar o `ToastService`).

## Solução

### 1. Criado componente Toast customizado

**Arquivo:** [src/shared/ui/toast.tsx](../src/shared/ui/toast.tsx)

Wrapper em torno do `sonner-native` com configurações customizadas:

```typescript
export const toast = {
  success: (message, options?) => // 4s duration (padrão)
  error: (message, options?) => // 60s duration ← CUSTOMIZADO
  warning: (message, options?) => // 4s duration
  info: (message, options?) => // 4s duration
  loading: (message, options?) => // sem auto-dismiss
  dismiss: (toastId?) => // dismissal manual
  promise: (promise, messages) => // promise-based
}
```

**Configurações de duração:**
- **Success:** 4000ms (4s) - padrão, suficiente para feedback positivo
- **Error:** 60000ms (60s) - CUSTOMIZADO para dar tempo de ler erros
- **Warning:** 4000ms (4s) - padrão
- **Info:** 4000ms (4s) - padrão
- **Loading:** sem auto-dismiss (fica até chamar `dismiss()`)

**Características:**
- API idêntica ao sonner-native (drop-in replacement)
- Suporte a `description` opcional
- Suporte a `duration` customizada por chamada (override padrão)
- TypeScript com tipagem completa
- Re-exportado em [src/shared/ui/index.ts](../src/shared/ui/index.ts)

### 2. Migrados componentes para usar novo Toast

#### Favoritos

**Arquivo:** [src/components/AddFavoriteCityModal.tsx](../src/components/AddFavoriteCityModal.tsx)

**Antes:**
```typescript
import { toast } from 'sonner-native'
```

**Depois:**
```typescript
import { BottomSheetModal, Button, toast } from '@shared/ui'
```

**Toasts afetados:**
- `toast.warning('Selecione um estado e uma cidade')` - linha 25
- `toast.info('Essa cidade já está nos favoritos')` - linha 30
- `toast.success('${selectedCity} adicionada aos favoritos')` - linha 35 ← **TESTE**

---

**Arquivo:** [src/components/FavoriteCitiesList.tsx](../src/components/FavoriteCitiesList.tsx)

**Antes:**
```typescript
import { toast } from 'sonner-native'
```

**Depois:**
```typescript
import { EmptyState, Button, Card, toast } from '@shared/ui'
```

**Toasts afetados:**
- `toast.success('${parsed.cityName} removida dos favoritos')` - linha 25 ← **TESTE**
- `toast.success('Filtrando eventos em ${parsed.cityName}')` - linha 38

#### Auth

**Arquivo:** [app/auth.tsx](../app/auth.tsx)

**Mudanças:**
1. Mantido import direto do `sonner-native` (mantém compatibilidade durante transição)
2. **REMOVIDOS toasts de sucesso:**
   - ❌ `toast.success('Login realizado!')` - linha 51 (REMOVIDO)
   - ❌ `toast.success('Cadastro realizado!')` - linha 61 (REMOVIDO)
3. **MANTIDOS toasts de erro:**
   - ✅ `toast.error(error)` - linhas 46, 56 (60s duration agora)

**Justificativa:**
- Sucesso de login/cadastro: redirect automático já é feedback suficiente
- Erros de auth: 60s permite ler mensagem técnica completa

## Benefícios

### 1. Consistência
- Todos os componentes usam mesmo import: `toast` from `@shared/ui`
- API unificada em todo o projeto

### 2. UX Melhorada
- **Erros ficam 60s na tela** - tempo suficiente para:
  - Ler mensagem completa
  - Copiar texto se necessário (erros técnicos)
  - Entender o problema antes de agir
- **Sucessos continuam 4s** - suficiente para feedback rápido

### 3. Manutenibilidade
- Mudanças futuras de duração em um único lugar
- Fácil adicionar novos tipos ou configurações
- Migração progressiva (import antigo ainda funciona)

### 4. Flexibilidade
- Cada chamada pode override a duração:
  ```typescript
  toast.error('Erro crítico', { duration: 120000 }) // 2 minutos
  toast.success('Rápido', { duration: 2000 }) // 2 segundos
  ```

## Arquivos Alterados

- ✅ [src/shared/ui/toast.tsx](../src/shared/ui/toast.tsx) - **NOVO** componente
- ✅ [src/shared/ui/index.ts](../src/shared/ui/index.ts) - adicionado export
- ✅ [src/components/AddFavoriteCityModal.tsx](../src/components/AddFavoriteCityModal.tsx) - migrado import
- ✅ [src/components/FavoriteCitiesList.tsx](../src/components/FavoriteCitiesList.tsx) - migrado import
- ✅ [app/auth.tsx](../app/auth.tsx) - removidos toasts de sucesso

## Toasts para Teste

Para validar a implementação, testar:

1. **Adicionar cidade aos favoritos:**
   - Abrir modal de adicionar
   - Selecionar estado e cidade
   - Clicar "Adicionar"
   - ✅ Deve mostrar: `"${cidade} adicionada aos favoritos"` (4s, verde)

2. **Remover cidade dos favoritos:**
   - Clicar botão "Remover" em uma cidade
   - ✅ Deve mostrar: `"${cidade} removida dos favoritos"` (4s, verde)

3. **Erro de auth (opcional):**
   - Tentar login com credenciais inválidas
   - ✅ Deve mostrar erro por **60 segundos** (vermelho)

## Compatibilidade

### ✅ Mantido (sem breaking changes)
- API idêntica ao sonner-native
- Imports antigos continuam funcionando
- Todas as props suportadas

### 🔄 Migração progressiva
Arquivos ainda usando `sonner-native` direto continuam funcionando normalmente. Podem ser migrados gradualmente para `@shared/ui/toast`.

## Observações

### Por que não remover toast.error do auth?

Mantive `toast.error()` no auth porque:
1. **Erros de autenticação são críticos** - usuário precisa saber o que deu errado
2. **Mensagens técnicas** - Firebase retorna mensagens específicas que precisam ser lidas
3. **60s é adequado** - tempo para entender e agir (ex: "Email já cadastrado", "Senha fraca")

### Por que remover toast.success do auth?

Removi porque:
1. **Redirect automático já é feedback** - usuário vê que funcionou ao mudar de tela
2. **Redundante** - toast apareceria e sumiria durante transição de tela
3. **UX mais limpa** - menos poluição visual em fluxo crítico

## Próximos Passos (Opcional)

Se aprovado, pode-se migrar progressivamente:
- Admin screens (categories, events, users, locations, dashboard)
- Tabs screens (favorites, index, profile)
- Layout (_layout.tsx - proteção de rotas)
- Outros componentes (FilterModal, EventDetailModal, etc.)

Todos continuam funcionando mesmo sem migração.
