# Ajustes: Etapa 3 - State Management (Correções)

**Data:** 26/11/2025 20:46
**Tipo:** Correções e melhorias
**Status:** ✅ Concluído

---

## 📋 Contexto

Após análise crítica da implementação da Etapa 3, identificamos 3 problemas:

1. ❌ **Filtro de raio não implementado** (feature prometida mas não entregue)
2. ⚠️ **Redundância de selectors** (código duplicado)
3. 💡 **Validação de cidade fraca** (over-engineering se corrigir)

**Decisão:** Fazer apenas correções **seguras** que não criam novos problemas.

---

## ✅ O que foi corrigido

### 1. Removida redundância de selectors

**Problema identificado:**
```typescript
// ❌ Selector interno (redundante)
getFavoriteEvents: () => Event[]

// ✅ Selector externo (já existia)
export const selectFavoriteEvents = (state: EventState) => ...
```

**Correção aplicada:**
- ✅ Removido `getFavoriteEvents()` da interface `EventState`
- ✅ Removido implementação do selector interno
- ✅ Mantido apenas `selectFavoriteEvents` externo

**Impacto:**
- Código mais limpo (DRY - Don't Repeat Yourself)
- Padrão consistente (apenas selectors externos)
- Zero breaking changes (projeto em desenvolvimento)

**Uso correto agora:**
```typescript
// ✅ USAR (selector externo otimizado)
import { useEventStore, selectFavoriteEvents } from '@shared/store'
const favorites = useEventStore(selectFavoriteEvents)

// ❌ NÃO EXISTE MAIS (removido)
// const favorites = useEventStore(state => state.getFavoriteEvents())
```

---

### 2. Adicionados comentários TODO para radiusKm

**Problema identificado:**
- `radiusKm` existe no state
- `setRadiusKm()` existe e funciona
- Mas `applyFilters()` **não usa** esse valor (filtro não implementado)
- Causa: falta geolocation ou coordenadas de cidades

**Correção aplicada:**
- ✅ Adicionado comentário na interface:
  ```typescript
  radiusKm: number // TODO: implementar filtro com geolocation ou coordenadas de cidades
  ```
- ✅ Adicionado comentário no state inicial:
  ```typescript
  radiusKm: 10, // TODO: filtro de raio não implementado (requer geolocation ou coordenadas de cidades)
  ```

**Por que não implementamos agora:**
- Precisa de coordenadas de referência (cidade ou usuário)
- `brazilStates` não tem lat/lon das cidades
- Geolocation não está no escopo atual
- Implementar pela metade criaria mais problemas

**Próximos passos (futuro):**
1. Adicionar coordenadas em `brazilStates` (lat/lon de cada cidade)
2. OU implementar geolocation do usuário
3. OU remover `radiusKm` do state se não for usar

---

## ❌ O que NÃO foi corrigido (e por quê)

### Validação robusta de cidade

**Por que NÃO corrigimos:**
- Dados vêm de UI controlada (dropdown no FilterModal)
- Cidade nunca será inválida se vem de lista predefinida
- Validação adicional seria **over-engineering**
- Trim + validação de string vazia é suficiente

**Estado atual (correto):**
```typescript
setSelectedCity: (city) => {
  const sanitizedCity = city.trim()
  if (!sanitizedCity) {
    console.warn('[EventStore] Invalid city name')
    return
  }
  set({ selectedCity: sanitizedCity })
}
```

---

## 📊 Resumo das mudanças

### Arquivos modificados:
- `src/shared/store/use-event-store.ts` (3 edições)

### Mudanças:
1. ✅ Removida linha 63 da interface: `getFavoriteEvents: () => Event[]`
2. ✅ Removidas linhas 292-294 da implementação (método getFavoriteEvents)
3. ✅ Adicionado comentário TODO na linha 44 (interface)
4. ✅ Adicionado comentário TODO na linha 81 (state inicial)

### Estatísticas:
- **Linhas removidas:** 4
- **Comentários adicionados:** 2
- **Bugs corrigidos:** 1 (redundância)
- **Bugs documentados:** 1 (radiusKm com TODO)

---

## ✅ Verificações realizadas

### Compatibilidade
- ✅ Nenhum código existente usa `getFavoriteEvents()` interno (safe remove)
- ✅ `selectFavoriteEvents` externo continua funcionando
- ✅ Comentários TODO não quebram código (apenas documentação)

### Funcionalidade
- ✅ Filtros continuam funcionando (cidade, tipo, busca, data)
- ✅ `radiusKm` pode ser setado (mas não filtra - documentado com TODO)
- ✅ Selectors externos continuam otimizados

### Qualidade
- ✅ Código mais limpo (sem duplicação)
- ✅ Problemas conhecidos documentados (TODOs)
- ✅ Padrão consistente (apenas selectors externos)

---

## 🎯 Estado final

### ✅ Correto e funcional:
- Filtros de cidade, tipo, busca, data funcionam
- Favoritos e notificações funcionam
- Selectors otimizados funcionam
- Validação Zod funciona
- Conectividade funciona

### ⚠️ Limitações conhecidas (documentadas):
- Filtro de raio não implementado (TODO adicionado)
- Requer geolocation ou coordenadas de cidades

### 🚀 Próximas etapas:
- Etapa 5: Services (mapService, toastService)
- Etapa 6: Componentes (EventCard, FilterModal)
- Etapa 7: Telas (HomePage, FavoritesPage)

---

## 📝 Observações

### Decisão técnica correta:
Optamos por **não implementar** filtro de raio agora porque:
1. Falta infraestrutura (coordenadas ou geolocation)
2. Implementar pela metade causa confusão
3. Melhor documentar como TODO do que entregar quebrado

### Aprendizado:
- Nem todo problema precisa ser corrigido imediatamente
- Às vezes documentar é melhor que implementar mal
- Correções seguras > correções que criam mais problemas

---

**Ajustes concluídos com sucesso!** ✅
**Qualidade:** Código mais limpo, problemas documentados, zero breaking changes
