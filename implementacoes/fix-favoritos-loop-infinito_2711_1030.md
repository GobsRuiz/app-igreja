# Fix: Loop Infinito na Página de Favoritos

**Data:** 27/11/2024 - 10:30
**Tipo:** Bug Fix
**Prioridade:** Alta

---

## Problema Identificado

Ao clicar na tab "Favoritos", a aplicação apresentava o erro:
```
Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
React limits the number of nested updates to prevent infinite loops.
```

### Causa Raiz

O selector `selectFavoriteEvents` estava criando um **novo array a cada render**:

```typescript
// ❌ ANTES - Criava novo array toda vez
export const selectFavoriteEvents = (state: EventState) =>
  state.allEvents.filter(event => event.isFavorite)
```

**Por que causava o erro:**
1. Zustand usa comparação de referência (shallow equality)
2. `filter()` cria novo array → nova referência → componente re-renderiza
3. Re-render → selector executa → novo array → loop infinito
4. FlashList detecta mudança constante → `useLayoutEffect` dispara → setState interno → loop

---

## Solução Implementada

Adicionamos `favoriteEvents` como propriedade computada do state, seguindo o padrão já estabelecido com `filteredEvents`.

### Mudanças Realizadas

#### 1. **State do Store** ([use-event-store.ts](src/shared/store/use-event-store.ts))

**Adicionado ao state:**
```typescript
interface EventState {
  allEvents: Event[]
  filteredEvents: Event[]
  favoriteEvents: Event[] // ✅ NOVO
  // ... resto do state
}
```

**State inicial:**
```typescript
export const useEventStore = create<EventState>((set, get) => ({
  allEvents: mockEvents,
  filteredEvents: mockEvents,
  favoriteEvents: mockEvents.filter(event => event.isFavorite), // ✅ Inicializado
  // ...
}))
```

#### 2. **Método para Atualizar Favoritos**

```typescript
updateFavorites: () => {
  const { allEvents } = get()
  const favorites = allEvents.filter((event) => event.isFavorite)
  set({ favoriteEvents: favorites })
},
```

#### 3. **Integração com Actions**

```typescript
toggleFavorite: (eventId) => {
  // ... validação e update do allEvents

  // ✅ Atualiza favoritos primeiro, depois filtros
  get().updateFavorites()
  get().applyFilters()
},

applyFilters: () => {
  // ... lógica de filtros

  set({ filteredEvents: filtered })
  get().updateFavorites() // ✅ Mantém favoritos sincronizados
},
```

#### 4. **Selector Otimizado**

```typescript
// ✅ DEPOIS - Retorna referência estável
export const selectFavoriteEvents = (state: EventState) => state.favoriteEvents
```

#### 5. **Melhorias Adicionais (Prevenção)**

Adicionado `keyExtractor` ao FlashList para evitar problemas de reconciliação:

**favorites.tsx e index.tsx:**
```typescript
<FlashList
  data={favoriteEvents}
  keyExtractor={(item) => item.id} // ✅ NOVO
  estimatedItemSize={200}
  // ...
/>
```

---

## Benefícios

1. **Correção:** Elimina o loop infinito de re-renders
2. **Performance:** Array computado apenas quando necessário (não a cada render)
3. **Consistência:** Segue o padrão já estabelecido com `filteredEvents`
4. **Manutenibilidade:** Código mais previsível e fácil de debugar

---

## Arquivos Alterados

- `src/shared/store/use-event-store.ts` - State, actions e selector
- `app/(tabs)/favorites.tsx` - Adicionado keyExtractor
- `app/(tabs)/index.tsx` - Adicionado keyExtractor (consistência)

---

## Testes Realizados

✅ Navegação para tab Favoritos funciona sem erros
✅ Toggle de favorito atualiza a lista corretamente
✅ Filtros na Home não afetam a lista de Favoritos
✅ Performance: sem re-renders desnecessários

---

## Notas Técnicas

- A ordem de chamada `updateFavorites()` → `applyFilters()` é importante
- `favoriteEvents` é independente de `filteredEvents` (diferentes propósitos)
- O padrão usado é consistente com a arquitetura existente do store
