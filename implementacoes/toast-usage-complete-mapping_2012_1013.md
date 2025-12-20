# Mapeamento Completo: Uso de Toast/Notificações no Projeto

**Data:** 20/12/2024 10:13
**Tipo:** Mapeamento Técnico Completo
**Objetivo:** Mapear TODOS os lugares que usam toast para migração para componente customizado

---

## 📊 Resumo Executivo

### Total de Arquivos com Toast
- **19 arquivos** usam toast/notificações
- **3 formas de uso diferentes:**
  1. `import { toast } from 'sonner-native'` - **MAIS COMUM** (direto)
  2. `import { toast } from '@shared/ui'` - **JÁ MIGRADO** (novo padrão)
  3. `import { ToastService } from '@shared/services'` - **ANTIGO** (classe wrapper)

### Distribuição por Tipo
- **toast.success**: 24 ocorrências
- **toast.error**: 19 ocorrências
- **toast.warning**: 5 ocorrências
- **toast.info**: 1 ocorrência
- **ToastService**: 7 ocorrências

---

## 🗺️ Mapeamento Completo por Arquivo

### ✅ JÁ MIGRADOS (usando `@shared/ui`)

#### 1. `src/components/AddFavoriteCityModal.tsx`
```typescript
import { BottomSheetModal, Button, toast } from '@shared/ui'
```
**Usos:**
- Linha 24: `toast.warning('Selecione um estado e uma cidade')`
- Linha 29: `toast.info('Essa cidade já está nos favoritos')`
- Linha 34: `toast.success('${selectedCity} adicionada aos favoritos')`

**Status:** ✅ Migrado

---

#### 2. `src/components/FavoriteCitiesList.tsx`
```typescript
import { EmptyState, Button, Card, toast } from '@shared/ui'
```
**Usos:**
- Linha 24: `toast.success('${parsed.cityName} removida dos favoritos')`
- Linha 37: `toast.success('Filtrando eventos em ${parsed.cityName}')`

**Status:** ✅ Migrado

---

### 🔄 PENDENTES DE MIGRAÇÃO (usando `sonner-native`)

#### 3. `app/_layout.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 41-43: `toast.error('Acesso negado', { description: 'Você não tem permissão...' })`

**Contexto:** Proteção de rotas admin
**Importância:** 🔴 CRÍTICO - erro de segurança
**Duração esperada:** 60s (erro)

---

#### 4. `app/auth.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 46: `toast.error(error)` - erro de login
- Linha 55: `toast.error(error)` - erro de cadastro

**Contexto:** Autenticação
**Importância:** 🔴 CRÍTICO - erros de auth
**Duração esperada:** 60s (erros)
**Nota:** Sucessos já removidos conforme solicitado

---

#### 5. `app/(tabs)/profile.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 19: `toast.error(error)` - erro ao fazer logout
- Linha 24: `toast.success('Logout realizado!')`

**Contexto:** Perfil do usuário
**Importância:** 🟡 MÉDIO
**Duração esperada:** 60s (erro), 4s (sucesso)

---

#### 6. `app/(tabs)/index.tsx` (Home/Events)
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 45: `toast.warning('Endereço não disponível para este evento')`
- Linha 52: `toast.error('Não foi possível abrir o mapa')`

**Contexto:** Abrir mapa de evento
**Importância:** 🟢 BAIXO - warning/erro de UX
**Duração esperada:** 4s (warning), 60s (erro)

---

#### 7. `app/(tabs)/favorites.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 40: `toast.warning('Endereço não disponível para este evento')`
- Linha 47: `toast.error('Não foi possível abrir o mapa')`

**Contexto:** Abrir mapa de evento favorito
**Importância:** 🟢 BAIXO - warning/erro de UX
**Duração esperada:** 4s (warning), 60s (erro)

---

#### 8. `app/(admin)/dashboard.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 23: `toast.error(error)` - erro ao carregar stats

**Contexto:** Dashboard admin
**Importância:** 🟡 MÉDIO - erro de carregamento
**Duração esperada:** 60s (erro)

---

#### 9. `app/(admin)/categories.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 90: `toast.error('Erro ao carregar categorias')`
- Linha 128: `toast.error(error)` - erro ao atualizar
- Linha 133: `toast.success('Categoria atualizada!')`
- Linha 139: `toast.error(error)` - erro ao criar
- Linha 144: `toast.success('Categoria criada!')`
- Linha 165: `toast.error(checkError)` - erro de validação ao deletar
- Linha 197: `toast.error(error)` - erro ao deletar
- Linha 203: `toast.success('Categoria deletada!')`

**Contexto:** CRUD de categorias (admin)
**Importância:** 🔴 ALTO - operações críticas
**Duração esperada:** 60s (erros), 4s (sucessos)

---

#### 10. `app/(admin)/users.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 56: `toast.error('Erro ao carregar usuários')`
- Linha 106: `toast.error(error)` - erro ao atualizar
- Linha 111: `toast.success('Usuário atualizado!')`
- Linha 117: `toast.error(error)` - erro ao criar
- Linha 122: `toast.success('Usuário criado!')`
- Linha 162: `toast.error(error)` - erro ao deletar
- Linha 168: `toast.success('Usuário deletado!')`

**Contexto:** CRUD de usuários (admin)
**Importância:** 🔴 CRÍTICO - gerenciamento de usuários
**Duração esperada:** 60s (erros), 4s (sucessos)

---

#### 11. `app/(admin)/events.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 69: `toast.error('Erro ao carregar eventos')`
- Linha 126: `toast.warning('Aguarde...', { description: 'Processando...' })`
- Linha 140: `toast.error('Erro ao atualizar evento', { description: error })`
- Linha 145: `toast.success('Evento atualizado!')`
- Linha 151: `toast.error('Erro ao criar evento', { description: error })`
- Linha 156: `toast.success('Evento criado!')`
- Linha 186: `toast.error(error)` - erro ao deletar
- Linha 192: `toast.success('Evento deletado!')`

**Contexto:** CRUD de eventos (admin)
**Importância:** 🔴 CRÍTICO - core da aplicação
**Duração esperada:** 60s (erros), 4s (sucessos/warnings)

---

#### 12. `app/(admin)/locations.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 63: `toast.error('Erro ao carregar locais')`
- Linha 103: `toast.error(error)` - erro ao atualizar
- Linha 108: `toast.success('Local atualizado!')`
- Linha 114: `toast.error(error)` - erro ao criar
- Linha 119: `toast.success('Local criado!')`
- Linha 140: `toast.error(checkError)` - erro de validação ao deletar
- Linha 172: `toast.error(error)` - erro ao deletar
- Linha 178: `toast.success('Local deletado!')`

**Contexto:** CRUD de locais (admin)
**Importância:** 🔴 ALTO - gerenciamento de locais
**Duração esperada:** 60s (erros), 4s (sucessos)

---

#### 13. `src/features/geo/components/state-city-select.tsx`
```typescript
import { toast } from 'sonner-native'
```
**Usos:**
- Linha 103: `toast.warning('Selecione uma cidade válida para favoritar')`
- Linha 111: `toast.success('Cidade removida dos favoritos')`
- Linha 113: `toast.success('Cidade adicionada aos favoritos')`

**Contexto:** Componente de seleção estado/cidade com favoritos
**Importância:** 🟡 MÉDIO - feature de favoritos
**Duração esperada:** 4s (warning/sucessos)

---

### 🔧 USANDO `ToastService` (classe wrapper antiga)

#### 14. `src/components/EventDetailModal.tsx`
```typescript
import { ToastService } from '@shared/services/toast-service'
```
**Usos:**
- Linha 40: `ToastService.warning('Endereço não disponível')`
- Linha 51: `ToastService.error('Não foi possível abrir o mapa')`
- Linha 58: `ToastService.success(wasFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')`
- Linha 69: `ToastService.success('Notificação desativada')`
- Linha 77: `ToastService.error('Evento muito próximo. Não é possível ativar notificações.')`
- Linha 84-86: `ToastService.error('Limite de notificações atingido', 'Você pode receber notificações de até X eventos...')`
- Linha 94: `ToastService.success('Notificação ativada')`

**Contexto:** Modal de detalhes do evento (favoritos + notificações + mapa)
**Importância:** 🟡 MÉDIO - features secundárias
**Duração esperada:** 60s (erros), 4s (sucessos/warnings)

---

#### 15. `src/shared/services/error-handler.ts`
```typescript
import { ToastService } from './toast-service'
```
**Usos:**
- Linha 59-62: `ToastService.error(context || 'Erro', sanitizedMessage || '...')`
- Linha 88: `ToastService.error(message, description)` - erro de rede
- Linha 103-106: `ToastService.warning('Dados inválidos', sanitizedMessage || '...')` - validação
- Linha 166: `ToastService.error(message, this.sanitizeMessage(description))` - erro de API

**Contexto:** Serviço centralizado de tratamento de erros
**Importância:** 🔴 CRÍTICO - usado em todo o app
**Duração esperada:** 60s (erros), 4s (warnings)
**Nota:** Este arquivo usa `ToastService` que internamente usa `sonner-native`

---

#### 16. `src/shared/services/toast-service.ts`
```typescript
import { toast } from 'sonner-native'
```
**Contexto:** Classe wrapper antiga do sonner-native
**Status:** ⚠️ DEPRECATED - substituído por `@shared/ui/toast`
**Ação:** Atualizar para usar novo componente ao invés de sonner-native direto

---

## 📋 Análise por Categoria

### Por Seção do App

#### 🔐 Autenticação (3 arquivos)
- `app/_layout.tsx` - proteção de rotas (1 erro)
- `app/auth.tsx` - login/cadastro (2 erros)
- `app/(tabs)/profile.tsx` - logout (1 erro, 1 sucesso)
**Total:** 4 erros, 1 sucesso

#### 👤 Área do Usuário (4 arquivos)
- `app/(tabs)/index.tsx` - home/eventos (1 warning, 1 erro)
- `app/(tabs)/favorites.tsx` - favoritos (1 warning, 1 erro)
- `src/components/EventDetailModal.tsx` - detalhes evento (4 sucessos, 2 warnings, 3 erros)
- `src/features/geo/components/state-city-select.tsx` - seletor cidade (1 warning, 2 sucessos)
**Total:** 6 sucessos, 4 warnings, 5 erros

#### 🔧 Admin (5 arquivos)
- `app/(admin)/dashboard.tsx` - dashboard (1 erro)
- `app/(admin)/categories.tsx` - CRUD categorias (3 sucessos, 5 erros)
- `app/(admin)/users.tsx` - CRUD usuários (3 sucessos, 4 erros)
- `app/(admin)/events.tsx` - CRUD eventos (3 sucessos, 1 warning, 4 erros)
- `app/(admin)/locations.tsx` - CRUD locais (3 sucessos, 5 erros)
**Total:** 12 sucessos, 1 warning, 19 erros

#### ❤️ Favoritos (3 arquivos) - JÁ MIGRADOS ✅
- `src/components/AddFavoriteCityModal.tsx`
- `src/components/FavoriteCitiesList.tsx`
- (parte de `state-city-select.tsx`)

#### 🛠️ Serviços (2 arquivos)
- `src/shared/services/error-handler.ts` - usa ToastService
- `src/shared/services/toast-service.ts` - wrapper antigo

---

## 🎯 Plano de Migração

### Fase 1: Atualizar `ToastService` (INFRAESTRUTURA)
**Arquivo:** `src/shared/services/toast-service.ts`

**Mudança:**
```typescript
// ANTES
import { toast } from 'sonner-native'

// DEPOIS
import { toast } from '@shared/ui'
```

**Impacto:** Automático em:
- `src/components/EventDetailModal.tsx`
- `src/shared/services/error-handler.ts`

**Prioridade:** 🔴 ALTA (afeta múltiplos arquivos)

---

### Fase 2: Migrar Telas de Autenticação
**Arquivos:**
1. `app/_layout.tsx` - proteção rotas
2. `app/auth.tsx` - login/cadastro
3. `app/(tabs)/profile.tsx` - logout

**Mudança em cada:**
```typescript
// ANTES
import { toast } from 'sonner-native'

// DEPOIS
import { toast } from '@shared/ui'
```

**Prioridade:** 🔴 CRÍTICA (segurança e auth)

---

### Fase 3: Migrar Telas Admin
**Arquivos:**
1. `app/(admin)/dashboard.tsx`
2. `app/(admin)/categories.tsx`
3. `app/(admin)/users.tsx`
4. `app/(admin)/events.tsx`
5. `app/(admin)/locations.tsx`

**Mudança em cada:**
```typescript
// ANTES
import { toast } from 'sonner-native'

// DEPOIS
import { toast } from '@shared/ui'
```

**Prioridade:** 🔴 ALTA (operações críticas)

---

### Fase 4: Migrar Telas de Usuário
**Arquivos:**
1. `app/(tabs)/index.tsx`
2. `app/(tabs)/favorites.tsx`
3. `src/features/geo/components/state-city-select.tsx`

**Mudança em cada:**
```typescript
// ANTES
import { toast } from 'sonner-native'

// DEPOIS
import { toast } from '@shared/ui'
```

**Prioridade:** 🟡 MÉDIA (UX)

---

## 📊 Estatísticas Finais

### Total de Imports para Migrar
- **`sonner-native` direto:** 13 arquivos
- **`ToastService`:** 2 arquivos (migração automática via Fase 1)
- **JÁ `@shared/ui`:** 2 arquivos ✅

### Total de Chamadas de Toast
- **toast.success:** 24 chamadas
- **toast.error:** 19 chamadas
- **toast.warning:** 5 chamadas
- **toast.info:** 1 chamada
- **ToastService.*:** 7 chamadas
**TOTAL:** **56 chamadas de toast** em todo o projeto

### Impacto da Duração Customizada
- **Erros (60s):** 19 chamadas diretas + 4 via ToastService = **23 toasts de erro**
- **Sucessos (4s):** 24 chamadas
- **Warnings (4s):** 5 chamadas
- **Info (4s):** 1 chamada

---

## ✅ Checklist de Migração

### Fase 1: Infraestrutura
- [ ] Atualizar `src/shared/services/toast-service.ts`
- [ ] Testar `EventDetailModal.tsx` (automático)
- [ ] Testar `error-handler.ts` (automático)

### Fase 2: Auth
- [ ] Migrar `app/_layout.tsx`
- [ ] Migrar `app/auth.tsx`
- [ ] Migrar `app/(tabs)/profile.tsx`

### Fase 3: Admin
- [ ] Migrar `app/(admin)/dashboard.tsx`
- [ ] Migrar `app/(admin)/categories.tsx`
- [ ] Migrar `app/(admin)/users.tsx`
- [ ] Migrar `app/(admin)/events.tsx`
- [ ] Migrar `app/(admin)/locations.tsx`

### Fase 4: User
- [ ] Migrar `app/(tabs)/index.tsx`
- [ ] Migrar `app/(tabs)/favorites.tsx`
- [ ] Migrar `src/features/geo/components/state-city-select.tsx`

### Validação Final
- [ ] Testar toast de erro (60s)
- [ ] Testar toast de sucesso (4s)
- [ ] Testar toast com description
- [ ] Testar toast sobre modal (z-index)
- [ ] Validar que nenhum arquivo importa `sonner-native` direto
- [ ] Lint sem erros

---

## 🚨 Observações Importantes

1. **Mudança é simples:** Apenas trocar import em cada arquivo
2. **API idêntica:** Código existente funciona sem alteração
3. **Zero breaking changes:** Compatibilidade 100%
4. **Duração automática:** Erros ficam 60s, resto 4s
5. **Override possível:** Cada chamada pode customizar duration se necessário

---

**Status:** 📋 Mapeamento completo finalizado
**Próximo passo:** Migração em fases conforme checklist
