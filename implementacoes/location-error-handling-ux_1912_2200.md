# Location Error Handling & UX - Implementação

**Data:** 19/12/2024 22:00
**Objetivo:** Tratar erro de GPS desligado, melhorar UX e permitir app funcionar sem localização

---

## PROBLEMA RESOLVIDO

### Erro Original
```
ERROR: Location request failed due to unsatisfied device settings
```

**Causas:**
- GPS desligado no dispositivo
- Modo "Economia de bateria" (apenas Wi-Fi/Network)
- Serviços de localização desabilitados

**Problemas de UX:**
1. Mensagem genérica "Loc não encontrada"
2. Usuário não sabia que precisava ativar GPS
3. App dependia obrigatoriamente de GPS
4. Sem fallback manual

---

## SOLUÇÃO IMPLEMENTADA

### 1. Store (`use-location-store.ts`)

**Novos tipos:**
```typescript
export type PermissionStatus = 'granted' | 'denied' | 'undetermined'

export type LocationErrorType =
  | 'permissionDenied'
  | 'gpsDisabled'
  | 'timeout'
  | 'networkError'
  | 'notFound'
  | 'offline'
  | null
```

**Estado atualizado:**
- `permissionStatus: PermissionStatus` - rastreia status de permissão
- `errorType: LocationErrorType` - tipo específico de erro

**Novos selectors:**
- `selectErrorType` - tipo de erro
- `selectPermissionStatus` - status de permissão
- `selectHasLocation` - boolean se tem localização

---

### 2. Hook (`use-user-location.ts`)

**Estratégia de fallback accuracy:**
```typescript
const ACCURACY_LEVELS = [
  Location.Accuracy.Highest,  // GPS required
  Location.Accuracy.High,     // GPS preferred
  Location.Accuracy.Balanced, // Network + GPS
  Location.Accuracy.Low,      // Network only
]
```

**Helpers criados:**
- `isSettingsError()` - detecta erro de GPS desligado
- `isPermissionError()` - detecta erro de permissão
- `openLocationSettings()` - abre configurações (Android)
- `getCurrentPositionWithFallback()` - tenta múltiplos níveis de accuracy

**Tratamento específico de erros:**

| Erro | Mensagem | Tipo | Ação |
|------|----------|------|------|
| GPS desligado | "GPS desligado" | `gpsDisabled` | Alert → Abrir Configurações |
| Permissão negada | "Permissão negada" | `permissionDenied` | Haptic Error |
| Timeout | "Tempo esgotado" | `timeout` | Haptic Error |
| Offline | "Offline" | `offline` | Haptic Warning |
| Não encontrada | "Loc não encontrada" | `notFound` | Haptic Error |
| Rede | "Erro ao detectar" | `networkError` | Haptic Error |

**Alert para GPS desligado:**
```typescript
Alert.alert(
  'GPS Desligado',
  'Ative o GPS nas configurações para detectar sua localização.',
  [
    { text: 'Agora não', style: 'cancel' },
    { text: 'Abrir Configurações', onPress: openLocationSettings }
  ]
)
```

---

### 3. Componente `CitySelector.tsx` (NOVO)

**Responsabilidade:**
- Seleção manual de estado e cidade
- Fallback quando GPS falha

**Funcionamento:**
- Usa `StateCitySelect` (já existente em `@features/geo`)
- Reset cidade ao mudar estado
- Callback `onSelect(city, state)` apenas quando ambos selecionados

---

### 4. Componente `LocationModal.tsx` (NOVO)

**2 modos:**

#### Modo "choose" (padrão):
- Botão "Detectar Automaticamente" → chama GPS
- Separator "ou"
- Botão "Escolher Manualmente" → modo manual

#### Modo "manual":
- `CitySelector` para escolha Estado/Cidade
- Botão "Voltar" para modo choose

**Props:**
```typescript
interface LocationModalProps {
  visible: boolean
  onClose: () => void
  onAutoDetect: () => void
  onManualSelect: (city: string, state: string) => void
  isDetecting: boolean
}
```

**UX:**
- Modal bottom sheet
- KeyboardAvoidingView (iOS)
- Disabled durante detecção
- Texto explicativo: "A localização ajuda a mostrar eventos próximos"

---

### 5. Componente `LocationBadge.tsx` (MODIFICADO)

**Mudanças:**

#### Estado inicial:
- Default: `"Selecione cidade"` (ao invés de "Taquaritinga")
- Auto-detect **silencioso** UMA VEZ ao montar

#### Comportamento de click:
```typescript
const handleClick = () => {
  // Se já tem localização → re-tenta GPS
  if (city) {
    detectLocation(true) // force new
    return
  }

  // Se não tem → abre modal
  setShowModal(true)
}
```

#### Modal integrado:
- Auto-detect: chama `detectLocation(true)`
- Manual: chama `setLocation(city, state)` + fecha modal
- Sincroniza estado `isLoading` para disabl buttons

---

## FLUXO COMPLETO

### Primeira abertura do app:
```
App abre
  ↓
Badge: "Selecione cidade"
  ↓
Carrega cache (vazio)
  ↓
Auto-detect silencioso (1x)
  ↓
  ├─ ✅ Sucesso → Badge: "Cidade - UF"
  ├─ ❌ GPS desligado → Badge: "GPS desligado" + Alert
  ├─ ❌ Permissão negada → Badge: "Permissão negada"
  └─ ❌ Timeout → Badge: "Tempo esgotado"
```

### Usuário clica no badge (sem localização):
```
Click
  ↓
Abre modal
  ↓
Usuário escolhe:
  ├─ "Detectar Automaticamente" → GPS → Sucesso/Falha
  └─ "Escolher Manualmente" → Dropdown → Seleciona → Salva
```

### Usuário clica no badge (com localização):
```
Click
  ↓
Force new GPS
  ↓
Atualiza localização
```

---

## EDGE CASES TRATADOS

| Cenário | Comportamento |
|---------|---------------|
| GPS desligado | Alert → Abrir Config OU Escolher Manual |
| Permissão negada 1ª vez | Modal aparece → Re-tenta OU Manual |
| Permissão negada sempre | Badge: "Permissão negada" → Modal manual |
| Offline + cache válido | Usa cache silenciosamente |
| Offline + sem cache | Badge: "Offline" → Modal manual |
| Timeout GPS | Badge: "Tempo esgotado" → Modal manual |
| Accuracy Highest falha | Fallback: High → Balanced → Low |
| GPS funciona em Low | Sucesso com Network-based location |
| Usuário não quer GPS | Escolha manual sempre disponível |
| App sem GPS | 100% funcional com seleção manual |

---

## SEGURANÇA

✅ **Mantido:**
- Não expõe coordenadas
- Permissões validadas antes de tudo
- Dados sensíveis em cache criptografado (AsyncStorage)

✅ **Melhorado:**
- Permissão rastreada (`permissionStatus`)
- Erros específicos (não expõe detalhes internos)

---

## PERFORMANCE

✅ **Otimizações:**
- Cache de sistema testado primeiro (0ms)
- Fallback accuracy evita timeouts desnecessários
- Auto-detect apenas **UMA VEZ** (não repetitivo)
- Modal lazy (só renderiza quando visível)

**Impacto de bateria:**
- GPS só acionado quando necessário
- Fallback para Network-based (menos consumo)
- Timeout de 30s previne GPS infinito

---

## UX/UI

### Antes:
- "Taquaritinga" (fake default)
- "Loc não encontrada" (vago)
- Sem ação corretiva
- Obriga GPS

### Depois:
- "Selecione cidade" (honesto)
- Mensagens claras ("GPS desligado", "Permissão negada")
- Alert com botão "Abrir Configurações"
- Modal com escolha Manual/Auto
- App funciona sem GPS

---

## ARQUIVOS MODIFICADOS

1. **`src/shared/store/use-location-store.ts`**
   - Tipos: `PermissionStatus`, `LocationErrorType`
   - Estado: `permissionStatus`, `errorType`
   - Actions: `setPermissionStatus`, `setError` atualizado
   - Selectors: `selectErrorType`, `selectPermissionStatus`, `selectHasLocation`

2. **`src/shared/hooks/use-user-location.ts`**
   - Import: `Platform`, `Linking`, `Alert`, `LocationErrorType`
   - Helpers: `isSettingsError`, `isPermissionError`, `openLocationSettings`, `getCurrentPositionWithFallback`
   - Accuracy fallback strategy
   - Tratamento específico de 6 tipos de erro
   - Alert para GPS desligado

3. **`src/components/CitySelector.tsx`** (NOVO)
   - Wrapper de `StateCitySelect`
   - Callback `onSelect(city, state)`

4. **`src/components/LocationModal.tsx`** (NOVO)
   - 2 modos: choose, manual
   - Botões: Auto-detect, Manual
   - Integra `CitySelector`

5. **`src/components/LocationBadge.tsx`**
   - Default: "Selecione cidade"
   - Auto-detect UMA VEZ
   - Click: Modal OU Re-tenta
   - Integra `LocationModal`

---

## TESTES RECOMENDADOS

### Cenários obrigatórios:
- [ ] GPS desligado → Alert funciona → Abre configurações
- [ ] Permissão negada → Modal manual funciona
- [ ] Offline + cache → Usa cache
- [ ] Offline + sem cache → Modal manual funciona
- [ ] Timeout → Fallback para Low accuracy
- [ ] Escolha manual → Salva e exibe corretamente
- [ ] Re-click com localização → Atualiza GPS
- [ ] Auto-detect no modal → Sucesso/Falha

### Plataformas:
- [ ] Android (GPS desligado é específico Android)
- [ ] iOS (fallback accuracy)

---

## MELHORIAS FUTURAS (OPCIONAL)

- [ ] Loading skeleton no modal
- [ ] Animação de transição choose → manual
- [ ] Histórico de localizações recentes
- [ ] Geolocalização em background (eventos próximos)
- [ ] Filtro de eventos por distância
- [ ] Tooltip: "Ative GPS para melhor precisão"

---

## OBSERVAÇÕES

**Decisões técnicas:**
- Fallback accuracy: balanceia precisão vs sucesso
- Alert nativo (não custom): mais confiável para abrir Settings
- Modal bottom sheet: padrão mobile UX
- Auto-detect silencioso: não invasivo, tenta uma vez

**Compatibilidade:**
- Mantém comportamento antigo se GPS funciona
- Adiciona fallbacks sem quebrar fluxo existente
- Cache continua funcionando igual

**Código limpo:**
- Separação de responsabilidades (Modal, Selector, Badge)
- Tipos específicos evitam strings mágicas
- Helpers reutilizáveis (isSettingsError, etc)
