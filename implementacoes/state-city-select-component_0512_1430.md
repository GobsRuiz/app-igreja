# StateCitySelect Component

**Data:** 05/12/2024 - 14:30
**Tipo:** Feature - Componente Reutilizável

---

## Objetivo

Criar componente reutilizável de seleção de Estado/Cidade extraído do FilterModal, mantendo **EXATAMENTE** a mesma lógica e comportamento.

---

## Implementação

### 1. Componente Criado

**Arquivo:** `src/features/geo/components/state-city-select.tsx`

**Lógica replicada do FilterModal:**
- ✅ Listener de estados (monta uma única vez)
- ✅ Listener de cidades reativo a `stateValue` (cancela/recria quando muda)
- ✅ Auto-seleção de primeira cidade quando lista muda E cidade atual não existe
- ✅ Guard clause `if (!stateValue) return` no listener de cidades
- ✅ Cleanup dos listeners (`return unsubscribe`)
- ✅ Transformação de dados: Estado usa `s.code`, Cidade usa `c.name`
- ✅ Estilos consistentes com tema (useTheme)
- ✅ Props flexíveis (showStateLabel, showCityLabel, placeholders)

**Props:**
```typescript
interface StateCitySelectProps {
  stateValue: string
  cityValue: string
  onStateChange: (stateCode: string) => void
  onCityChange: (cityName: string) => void
  showStateLabel?: boolean
  showCityLabel?: boolean
  statePlaceholder?: string
  cityPlaceholder?: string
}
```

**UseEffects implementados:**
1. **Listener de estados** - `useEffect(() => { ... }, [])`
2. **Listener de cidades** - `useEffect(() => { ... }, [stateValue])`
3. **Auto-seleção** - `useEffect(() => { ... }, [cities, cityValue, onCityChange])`

---

### 2. Export no Geo Feature

**Arquivo:** `src/features/geo/index.ts`

Adicionado export do componente:
```typescript
// Components
export * from './components/state-city-select'
```

**Uso:**
```typescript
import { StateCitySelect } from '@features/geo'
```

---

### 3. Refatoração do FilterModal

**Arquivo:** `src/components/FilterModal.tsx`

**Removido:**
- ❌ Import `Dropdown` de react-native-element-dropdown
- ❌ Import `onStatesChange, onCitiesByStateChange, State, City`
- ❌ Estados `states` e `cities`
- ❌ Listener de estados (useEffect)
- ❌ Listener de cidades (useEffect)
- ❌ UseEffect de auto-seleção de cidade
- ❌ Mapeamento `stateItems` e `cityItems`
- ❌ Objeto `dropdownStyles`
- ❌ Dois componentes `<Dropdown>` (estado e cidade)

**Adicionado:**
- ✅ Import `StateCitySelect` de @features/geo
- ✅ Componente `<StateCitySelect>` único substituindo os dois dropdowns

**Antes:**
```typescript
<YStack gap="$1">
  <Text fontSize="$3" color="$color11">Estado</Text>
  <Dropdown ... />
</YStack>

<YStack gap="$1">
  <Text fontSize="$3" color="$color11">Cidade</Text>
  <Dropdown ... />
</YStack>
```

**Depois:**
```typescript
<StateCitySelect
  stateValue={localState}
  cityValue={localCity}
  onStateChange={setLocalState}
  onCityChange={setLocalCity}
/>
```

---

## Comportamento Mantido

### Fluxo Cascata (Estado → Cidade)

```
1. Usuário seleciona "RJ" no dropdown de Estado
   ↓
2. onStateChange('RJ') → setLocalState('RJ')
   ↓
3. useEffect([stateValue]) detecta mudança
   ↓
4. Cancela listener anterior (SP)
   ↓
5. onCitiesByStateChange('RJ', callback)
   ↓
6. Firestore retorna cidades filtradas do RJ
   ↓
7. setCities([...cidades do RJ...])
   ↓
8. useEffect([cities, cityValue]) detecta mudança
   ↓
9. Cidade atual não existe no RJ?
   ↓
10. setLocalCity(cities[0].name) → primeira cidade do RJ
```

### Valores Hardcoded Mantidos

- ✅ `localState` inicializa com `'SP'` (FilterModal linha 46)
- ✅ `handleClear` reseta para `'SP'` e `'Taquaritinga'`

---

## Benefícios

1. **Reutilizável** - Pode ser usado em qualquer lugar (formulários, modals, etc.)
2. **Encapsulamento** - Lógica de cascata isolada no componente
3. **Manutenibilidade** - Alterações na lógica de estado/cidade em um só lugar
4. **Consistência** - Comportamento idêntico em qualquer contexto
5. **Redução de código** - FilterModal ~60 linhas mais limpo

---

## Localização

**Feature:** `@features/geo`
**Componente:** `src/features/geo/components/state-city-select.tsx`
**Uso no projeto:**
- `FilterModal.tsx` - Modal de filtros de eventos
- `app/(admin)/locations.tsx` - Form de admin de locais

---

## Notas Técnicas

- Listeners Firestore são gerenciados internamente (cleanup automático)
- Auto-seleção ocorre apenas se cidade não existe na nova lista
- Estilos responsivos ao tema (light/dark mode)
- Props opcionais para customização de labels e placeholders
- Compatível com react-native-element-dropdown
