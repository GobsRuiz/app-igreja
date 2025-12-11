# Implementação: Sistema de Status de Eventos - Parte 2

**Data:** 11/12/2025
**Fase:** Frontend + Admin + Migration

---

## Objetivo

Implementar o frontend completo para suportar o campo `status` nos eventos, incluindo:
- Helpers de lógica de negócio
- Tipos e schemas atualizados
- Filtros na Home/Search
- Formulário admin com select de status
- Firestore Security Rules
- Script de migração para eventos existentes

---

## Arquivos Criados

### 1. **src/shared/utils/event-helpers.ts** - Helpers de Evento

Funções auxiliares para lógica de eventos:

```typescript
export type EventStatus = 'active' | 'finished' | 'cancelled'

// Calcula minutos até o evento
export function getMinutesUntilEvent(event: Event): number

// Verifica se evento já passou
export function isEventPast(event: Event): boolean

// Determina se evento deve aparecer na Home (apenas 'active')
export function shouldShowInHome(event: Event & { status?: EventStatus }): boolean

// Verifica se evento está fechando (<= 10 min)
export function isEventClosing(event: Event): boolean
```

**Lógica de `shouldShowInHome()`:**
- Retorna `true` APENAS se:
  - `status === 'active'` E
  - Evento está a mais de 10 minutos de começar
- Cloud Function marca como 'finished' a cada 5 min
- Este filtro adiciona segurança client-side

---

### 2. **scripts/migrate-events-status.ts** - Script de Migração Local

Script Node.js para rodar localmente via `ts-node`:

```bash
npx ts-node scripts/migrate-events-status.ts
```

**Características:**
- Adiciona `status: 'active'` a eventos existentes
- Usa batch operations (500 eventos por batch)
- Idempotente (pode rodar múltiplas vezes)
- Logs detalhados

---

### 3. **functions/src/migration-add-status.ts** - Cloud Function de Migração

Cloud Function callable para rodar via Firebase Console:

```bash
# Deploy
firebase deploy --only functions:migrateEventsStatus

# Executar via CLI
firebase functions:call migrateEventsStatus

# Ou via HTTP
curl -X POST https://southamerica-east1-PROJECT_ID.cloudfunctions.net/migrateEventsStatus
```

**Segurança:**
- Apenas admins podem executar (verifica `role` no token)
- Retorna contagem de eventos atualizados

---

## Arquivos Modificados

### 1. **src/features/events/types/event.types.ts**

**Adicionado:**
- `export type EventStatus = 'active' | 'finished' | 'cancelled'`
- Campo `status: EventStatus` na interface `Event`
- Campo `finishedAt?: Date` (timestamp quando marcado como finished)
- Campo `status` em `CreateEventData` e `UpdateEventData`

**Removido:**
- `imageUrl` de todas as interfaces

**Atualizado:**
- `mapFirestoreEvent()` agora mapeia `status` e `finishedAt`

---

### 2. **src/shared/types/event.ts** (UI Schema)

**Adicionado:**
```typescript
status: z.enum(['active', 'finished', 'cancelled']).default('active')
```

---

### 3. **src/shared/store/use-event-store.ts**

**Adicionado:**
- Import de `shouldShowInHome` helper
- Campo `status` em `adaptFirebaseEventToUI()`

**Modificado:**
```typescript
applyFilters: () => {
  // ...

  // Filtro por status: apenas eventos 'active' (Home/Search)
  filtered = filtered.filter((event) => shouldShowInHome(event))

  // ... outros filtros
}
```

**Resultado:**
- Home/Search mostra APENAS eventos 'active' com > 10 min
- Favoritos mostram TODOS os eventos (sem filtro de status)

---

### 4. **src/features/events/services/event.service.ts**

**Modificado:**

**createEvent():**
```typescript
await firebaseFirestore.collection('events').add({
  // ...
  status: data.status || 'active',  // Default: 'active'
  // imageUrl removido
})
```

**updateEvent():**
```typescript
if (data.status !== undefined) {
  updateData.status = data.status
}
// imageUrl handling removido
```

**Adicionado:**
```typescript
export async function markEventAsFinished(eventId: string)
export async function markEventAsCancelled(eventId: string)
```

---

### 5. **firestore.rules** - Security Rules

**Atualizado:**
```javascript
match /events/{eventId} {
  allow read: if isAuthenticated();
  allow create: if isAdmin();
  allow update: if isAdmin();  // Inclui status
  allow delete: if isAdmin();
}
```

**Documentação adicionada:**
- Campo `status` protegido (apenas admins)
- Cloud Function roda como admin (pode atualizar)
- Usuários regulares não podem modificar status

**IMPORTANTE:** Precisa fazer deploy das regras:
```bash
firebase deploy --only firestore:rules
```

---

### 6. **app/(admin)/events.tsx** - Admin Form

**Adicionado:**
- Import de `EventStatus`
- Campo `status` no `formData` state
- Dropdown de status no formulário:

```tsx
<Dropdown
  data={[
    { label: 'Ativo', value: 'active' },
    { label: 'Finalizado', value: 'finished' },
    { label: 'Cancelado', value: 'cancelled' },
  ]}
  value={formData.status}
  onChange={(item) => setFormData({ ...formData, status: item.value as EventStatus })}
/>
```

**Badge de status nos cards:**
```tsx
<YStack
  backgroundColor={
    event.status === 'active' ? '$green9' :
    event.status === 'finished' ? '$gray9' :
    '$red9'
  }
>
  <Text>
    {event.status === 'active' ? '● Ativo' :
     event.status === 'finished' ? '● Finalizado' :
     '● Cancelado'}
  </Text>
</YStack>
```

---

### 7. **functions/src/index.ts**

**Adicionado:**
```typescript
// Migration function (one-time use)
export { migrateEventsStatus } from './migration-add-status'
```

---

## Comportamento Implementado

### Home/Search (Tela Principal)

| Situação | Aparece na Home? | Motivo |
|----------|------------------|--------|
| Evento daqui 2h, status: 'active' | ✅ SIM | Active e > 10 min |
| Evento daqui 5 min, status: 'active' | ❌ NÃO | <= 10 min (será marcado finished pela Cloud Function) |
| Evento passou, status: 'finished' | ❌ NÃO | Status não é 'active' |
| Evento futuro, status: 'cancelled' | ❌ NÃO | Status não é 'active' |

### Favoritos

| Situação | Aparece em Favoritos? |
|----------|-----------------------|
| Qualquer evento favoritado | ✅ SIM (sem filtro de status) |

### Admin (Gerenciamento)

| Ação | Resultado |
|------|-----------|
| Criar novo evento | Status = 'active' (default) |
| Editar evento | Pode alterar status manualmente |
| Cloud Function roda | Marca 'active' → 'finished' automaticamente |

---

## Fluxo Completo do Sistema

```
1. Admin cria evento
   ↓
   status: 'active' (default)
   ↓
2. Evento aparece na Home/Search
   ↓
3. Cloud Function roda a cada 5 min
   ↓
   Se evento <= 10 min:
   status: 'active' → 'finished'
   ↓
4. Evento SOME da Home/Search
   (filtro client-side + Cloud Function)
   ↓
5. Evento continua em Favoritos
   (sem filtro de status)
```

---

## Deploy e Uso

### 1. Deploy do Cloud Function (Migração)

```bash
cd functions
npm run build
firebase deploy --only functions:migrateEventsStatus
```

### 2. Executar Migração (Escolha uma opção)

**Opção A - Via Firebase Console:**
1. Acesse Firebase Console → Functions
2. Encontre `migrateEventsStatus`
3. Clique em "Test function"
4. Autentique como admin
5. Execute

**Opção B - Via CLI:**
```bash
firebase functions:call migrateEventsStatus
```

**Opção C - Via Script Local:**
```bash
npx ts-node scripts/migrate-events-status.ts
```

### 3. Deploy das Security Rules

```bash
firebase deploy --only firestore:rules
```

---

## Próximos Passos (Opcional)

1. ✅ **Verificar eventos migrados** - Abrir Firestore Console e verificar campo `status`
2. ✅ **Testar admin form** - Criar/editar evento com diferentes status
3. ✅ **Testar filtros** - Verificar que Home mostra apenas 'active'
4. ✅ **Testar Cloud Function** - Criar evento próximo e aguardar 5 min
5. ⚠️ **Monitorar logs** - Firebase Console → Functions → Logs

---

## Segurança, Performance e Qualidade

✅ **Segurança:**
- Status protegido por Security Rules (apenas admins)
- Migration function protegida (apenas admins)
- Cloud Function roda como admin (seguro)

✅ **Performance:**
- Filtro client-side (shouldShowInHome) é O(n) mas rápido
- Cloud Function usa batch updates (eficiente)
- Firestore query com índice em 'status' (rápido)

✅ **Correção:**
- Resolve requisitos: Home filtra por status
- Favoritos mostram todos os eventos
- Admin pode gerenciar status manualmente

✅ **Consistência:**
- Padrão seguido em todos os arquivos
- Tipos TypeScript garantem consistência
- Zod valida status na UI

✅ **Organização:**
- Helpers separados em arquivo próprio
- Migration isolada em função específica
- Admin form bem estruturado

---

## Observações Importantes

⚠️ **Eventos existentes sem status:**
- Não aparecerão na Home até rodar migração
- Rodar migração UMA VEZ após deploy
- Verificar no Firestore se todos têm `status: 'active'`

⚠️ **Cloud Function updateFinishedEvents:**
- Roda a cada 5 minutos automaticamente
- Não precisa chamar manualmente
- Logs em Firebase Console → Functions

⚠️ **Filtro de 10 minutos:**
- Cloud Function: marca como 'finished' quando <= 10 min
- Client-side: esconde se <= 10 min (segurança extra)
- Ambos trabalham juntos para garantir UX consistente

---

## Testes Sugeridos

1. **Criar evento novo**
   - Verificar que status = 'active' no Firestore
   - Verificar que aparece na Home
   - Verificar badge verde no admin

2. **Editar status para 'cancelled'**
   - No admin, mudar para 'cancelled'
   - Verificar que some da Home
   - Verificar badge vermelho no admin

3. **Criar evento próximo (< 10 min)**
   - Aguardar 5-10 minutos
   - Verificar logs da Cloud Function
   - Verificar que status mudou para 'finished'
   - Verificar que sumiu da Home

4. **Favoritar evento finished**
   - Marcar evento como favorito
   - Mudar status para 'finished'
   - Verificar que ainda aparece em Favoritos

---

## Resumo Visual

```
┌─────────────────────────────────────┐
│         ADMIN FORM                  │
├─────────────────────────────────────┤
│ Título: [_______________]           │
│ Descrição: [___________]            │
│ Data/Hora: [__________]             │
│ Categoria: [v Culto    ]            │
│ Local: [v Igreja Matriz]            │
│ Status: [v Ativo       ] ← NOVO     │
│           - Ativo                   │
│           - Finalizado              │
│           - Cancelado               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         HOME (Filtrado)             │
├─────────────────────────────────────┤
│ ✅ Evento A (active, +2h)           │
│ ✅ Evento B (active, +5h)           │
│ ❌ Evento C (finished) ← Escondido  │
│ ❌ Evento D (cancelled) ← Escondido │
│ ❌ Evento E (active, +5min) ← Cloud │
│    Function marcará como finished   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       FAVORITOS (Sem filtro)        │
├─────────────────────────────────────┤
│ ✅ Evento A (active, +2h)           │
│ ✅ Evento C (finished) ← Aparece    │
│ ✅ Evento D (cancelled) ← Aparece   │
└─────────────────────────────────────┘
```
