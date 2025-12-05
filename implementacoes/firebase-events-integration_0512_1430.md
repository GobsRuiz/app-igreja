# Integração Firebase Firestore - Lista de Eventos

**Data:** 05/12/2024 14:30
**Tipo:** Feature - Integração Backend
**Status:** ✅ Implementado

---

## **Objetivo**

Integrar a página home (lista de eventos) com o Firebase Firestore, substituindo mock data por dados reais com sincronização em tempo real.

---

## **Problema Identificado**

1. **Store usando mock data** - `use-event-store.ts` estava usando `mockEvents` estático
2. **CRUD Firebase pronto mas não conectado** - `event.service.ts` tinha todas as funções mas não eram usadas
3. **Incompatibilidade de tipos** - 2 tipos diferentes de `Event`:
   - **Firebase Event** (`@features/events/types/event.types.ts`): estrutura do Firestore (date: Date, categoryId, locationId, etc.)
   - **UI Event** (`@shared/types/event.ts`): estrutura antiga do mock (date: string, time: string, church, address, city, etc.)

---

## **Solução Implementada**

### **1. Event Store** - `src/shared/store/use-event-store.ts`

**Mudanças:**
- ✅ Importado `listEvents` e `onEventsChange` do event.service
- ✅ Criado adapter `adaptFirebaseEventToUI()` para converter tipos
- ✅ Adicionado método `initializeFirestoreListener()` que retorna função unsubscribe
- ✅ Implementado `refreshEvents()` usando `listEvents()` do Firebase
- ✅ Estado inicial: arrays vazios + `isLoading: true`

**Adapter Firebase → UI:**
```typescript
function adaptFirebaseEventToUI(firebaseEvent: FirebaseEvent): Event {
  return {
    id: firebaseEvent.id,
    title: firebaseEvent.title,
    description: firebaseEvent.description,
    date: format(firebaseEvent.date, 'yyyy-MM-dd'),
    time: format(firebaseEvent.date, 'HH:mm'),
    church: '', // TODO: buscar do locationId
    address: '', // TODO: buscar do locationId
    city: 'Taquaritinga', // TODO: buscar do locationId
    conductor: '', // TODO: adicionar campo no Firebase
    categoryId: firebaseEvent.categoryId,
    isFavorite: false,
    isNotifying: false,
  }
}
```

**Real-time Listener:**
```typescript
initializeFirestoreListener: () => {
  const unsubscribe = onEventsChange(
    (events) => {
      const adaptedEvents = events.map(adaptFirebaseEventToUI)
      set({ allEvents: adaptedEvents, isLoading: false })
      get().applyFilters()
    },
    (error) => {
      set({ error: 'Erro ao sincronizar eventos', isLoading: false })
    }
  )
  return unsubscribe
}
```

---

### **2. Home Page** - `app/(tabs)/index.tsx`

**Mudanças:**
- ✅ Importado `useEffect` e `Spinner`
- ✅ Adicionado `isLoading` e `initializeFirestoreListener` do store
- ✅ Implementado `useEffect` que inicia listener no mount
- ✅ Cleanup do listener no unmount
- ✅ UI de loading (Spinner + texto "Carregando eventos...")

**useEffect:**
```typescript
useEffect(() => {
  const unsubscribe = initializeFirestoreListener()

  return () => {
    console.log('[HomePage] Cleaning up Firestore listener')
    unsubscribe()
  }
}, [initializeFirestoreListener])
```

**Loading State:**
```typescript
{isLoading ? (
  <YStack flex={1} justifyContent="center" alignItems="center">
    <Spinner size="large" color="$color11" />
    <Text fontSize="$4" color="$color11">Carregando eventos...</Text>
  </YStack>
) : filteredEvents.length === 0 ? (
  // Empty state
) : (
  // FlashList
)}
```

---

## **Fluxo de Dados**

```
Firebase Firestore (collection: events)
    ↓ onSnapshot (real-time)
Event Service (onEventsChange)
    ↓ callback(events: FirebaseEvent[])
Event Store (initializeFirestoreListener)
    ↓ adaptFirebaseEventToUI() → allEvents
    ↓ applyFilters() → filteredEvents
Home Page (useEventStore)
    ↓ FlashList render
EventCard components
```

---

## **Benefícios**

✅ **Sincronização Real-time** - Qualquer mudança no Firestore atualiza UI automaticamente
✅ **Performance** - `onSnapshot` envia apenas deltas, não todos os dados
✅ **Offline Support** - Cache de 100MB do Firestore já configurado
✅ **Type Safety** - Adapter garante compatibilidade entre tipos
✅ **Cleanup Automático** - Listener é desconectado ao sair da página
✅ **UX Melhorada** - Loading state enquanto carrega dados

---

## **TODOs Futuros**

⚠️ **Adapter incompleto** - Campos com valores temporários:
1. `church`, `address`, `city` - Buscar do `locationId` (join com collection `locations`)
2. `conductor` - Adicionar campo no Firestore ou buscar de outro lugar
3. `latitude`, `longitude` - Adicionar no Firestore ou buscar da location
4. `categoryName` - Buscar do `categoryId` (join com collection `categories`)

**Solução futura:**
- Criar hook `useEnrichedEvents()` que faz joins com locations e categories
- Ou adicionar cloud function no Firebase para denormalizar dados

---

## **Como Testar**

1. **Ver eventos do Firestore**:
   - Abrir app → Home page
   - Deve carregar eventos do Firestore automaticamente

2. **Testar real-time**:
   - Abrir página admin → Criar/editar evento
   - Voltar para home → Deve atualizar automaticamente sem refresh

3. **Testar offline**:
   - Carregar app com internet
   - Desconectar internet
   - Eventos devem aparecer do cache

---

## **Observações Importantes**

⚠️ **Dois tipos de Event coexistem**:
- Mantive ambos para não quebrar código existente
- Adapter faz a ponte entre Firebase e UI
- Futuramente unificar em um único tipo

⚠️ **Admin page não foi modificada**:
- Admin continua com listener próprio (diferente da store)
- Funciona independentemente
- Ambos os listeners podem coexistir sem problemas

⚠️ **Mock data removido**:
- Store não usa mais `mockEvents`
- Arquivo `mock-events.ts` ainda existe mas não é importado na store
- Pode ser usado para testes/desenvolvimento se necessário

---

## **Arquivos Modificados**

1. `src/shared/store/use-event-store.ts` - Adapter + Firebase listener
2. `app/(tabs)/index.tsx` - useEffect + loading UI

**Nenhum arquivo criado ou deletado.**
