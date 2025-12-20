# Location Fixes - Correções Críticas

**Data:** 19/12/2024 23:00
**Objetivo:** Corrigir problemas críticos identificados na implementação de localização

---

## PROBLEMAS CORRIGIDOS

### 1. ✅ Dependências faltando no useEffect (LocationBadge)

**Problema:**
```typescript
useEffect(() => {
  // ... usa detectLocation mas não lista nas deps
}, [loadFromCache]) // ❌ FALTA detectLocation
```

**Correção:**
```typescript
useEffect(() => {
  // ...
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // Roda apenas uma vez - ref previne re-runs
```

**Justificativa:**
- Auto-detect deve rodar **UMA VEZ** ao montar
- `hasAttemptedAutoDetect.current` previne re-execução
- Listar `detectLocation` causaria loop infinito

---

### 2. ✅ Violação de Arquitetura (Badge → Store)

**Problema:**
```typescript
// LocationBadge chamando store diretamente
const setLocation = useLocationStore((s) => s.setLocation)

const handleManualSelect = (city, state) => {
  setLocation(city, state) // ❌ Badge não deveria saber da store
}
```

**Correção:**
```typescript
// Hook expõe setManualLocation
const { setManualLocation } = useUserLocation()

const handleManualSelect = (city, state) => {
  setManualLocation(city, state) // ✅ Via hook
}
```

**Mudanças:**
- `use-user-location.ts`: Novo método `setManualLocation` exposto
- `LocationBadge.tsx`: Usa hook ao invés de store direto

**Benefícios:**
- Badge não depende mais da store
- Hook é única interface (separação de responsabilidades)
- Testável isoladamente

---

### 3. ✅ Race Condition (Múltiplas detecções simultâneas)

**Problema:**
```typescript
const handleClick = () => {
  if (city) {
    detectLocation(true) // ❌ Pode clicar durante auto-detect
  }
}
```

**Correção:**
```typescript
const handleClick = () => {
  // Guard: não fazer nada se já estiver detectando
  if (isLoading) return // ✅ Previne race condition

  if (city) {
    detectLocation(true)
  }
}
```

**Proteção em 2 pontos:**
- `handleClick()` - click no badge
- `handleAutoDetect()` - botão no modal

---

### 4. ✅ Timeout Progressivo (UX)

**Problema:**
```typescript
const LOCATION_TIMEOUT = 30000 // 30s

// 30s × 4 níveis = 120s = 2 minutos ❌
```

**Correção:**
```typescript
const TIMEOUT_BY_ACCURACY: Record<number, number> = {
  [Location.Accuracy.Highest]: 30000,  // 30s - GPS puro
  [Location.Accuracy.High]: 20000,     // 20s
  [Location.Accuracy.Balanced]: 15000, // 15s
  [Location.Accuracy.Low]: 10000,      // 10s
}
// Total max: 75s ✅
```

**Benefícios:**
- **37% mais rápido** (75s vs 120s)
- Network-only tenta apenas 10s (adequado)
- GPS puro mantém 30s (necessário)

---

### 5. ✅ Helper isSettingsError Muito Genérico

**Problema:**
```typescript
return message.includes('settings') // ❌ MUITO AMPLO
// "Check your network settings" → detectado como GPS desligado!
```

**Correção:**
```typescript
return (
  message.includes('unsatisfied device settings') ||
  message.includes('location settings') || // ✅ Mais específico
  message.includes('location services disabled') ||
  message.includes('location is not enabled')
)
```

**Benefícios:**
- Evita false positives
- Detecta apenas erros de GPS/Location
- Mais robusto

---

### 6. ✅ Import Não Usado (CitySelector)

**Problema:**
```typescript
import { useLocationStore } from '@shared/store/use-location-store'
// ❌ Nunca usado no código
```

**Correção:**
```typescript
// ✅ Removido
```

---

## ARQUIVOS MODIFICADOS

1. **`src/shared/hooks/use-user-location.ts`**
   - Timeout progressivo por accuracy
   - Helper `isSettingsError` mais específico
   - Novo método `setManualLocation` exposto

2. **`src/components/LocationBadge.tsx`**
   - useEffect: dependências corretas (vazio com eslint-disable)
   - Guards race condition em `handleClick` e `handleAutoDetect`
   - Usa `setManualLocation` do hook ao invés de store

3. **`src/components/CitySelector.tsx`**
   - Removido import não usado

---

## ANTES vs DEPOIS

| Problema | Antes | Depois |
|----------|-------|--------|
| useEffect deps | Warning + stale closure | ✅ Correto |
| Badge → Store | Violação arquitetura | ✅ Via hook |
| Race condition | 2 detecções simultâneas | ✅ Guard previne |
| Timeout total | 120s (2min) | ✅ 75s (1min15s) |
| isSettingsError | False positives | ✅ Específico |
| Import não usado | Código morto | ✅ Limpo |

---

## IMPACTO

✅ **Correção:** Sem warnings React
✅ **Arquitetura:** Separação de responsabilidades mantida
✅ **UX:** 37% mais rápido (timeout)
✅ **Robustez:** Sem race conditions
✅ **Precisão:** Detecta erros corretos

---

## TESTES RECOMENDADOS

- [ ] Auto-detect ao abrir app (1x apenas)
- [ ] Click rápido no badge durante loading (não duplica)
- [ ] Timeout em accuracy Low (10s, não 30s)
- [ ] GPS desligado detectado corretamente
- [ ] Seleção manual funciona via hook

---

## OBSERVAÇÕES

**Por que não corrigimos acessibilidade/i18n?**
- Não são críticos para funcionamento
- Podem ser melhorados posteriormente
- Foco em bugs e arquitetura primeiro
