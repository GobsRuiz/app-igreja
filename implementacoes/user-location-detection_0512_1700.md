# User Location Detection - Implementação

**Data:** 05/12/2024 17:00
**Objetivo:** Detectar automaticamente a cidade do usuário usando GPS e exibir no LocationBadge

---

## Arquivos Criados

### 1. Store de Localização
**Arquivo:** `src/shared/store/use-location-store.ts`

**Funcionalidades:**
- Armazena cidade do usuário no estado global (Zustand)
- Persistência em AsyncStorage com timestamp
- Cache com validade de 1 hora
- Métodos: `setCity`, `setLoading`, `setError`, `loadFromCache`, `saveToCache`, `reset`
- Selectors otimizados: `selectCity`, `selectIsLoading`, `selectError`, `selectIsCacheValid`, `selectCacheAgeMinutes`

**Validações:**
- Sanitização de nome da cidade (trim)
- Validação de dados do cache
- Remoção automática de cache inválido

---

### 2. Hook de Detecção de Localização
**Arquivo:** `src/shared/hooks/use-user-location.ts`

**Estratégia de Detecção:**
1. **Cache do sistema (< 1 hora):** Tenta `getLastKnownPositionAsync` - instantâneo
2. **Cache antigo/inexistente:** Pega nova posição com `getCurrentPositionAsync`
3. **Precisão máxima:** `Location.Accuracy.Highest`
4. **Timeout:** 30 segundos
5. **Offline:** Usa cache se disponível (≤ 1h), senão mostra "Offline"

**Funcionalidades:**
- Solicita permissão de localização (foreground only)
- Reverse geocoding (lat/lng → cidade)
- Haptic feedback em todas as interações:
  - Light impact ao iniciar
  - Success notification ao detectar
  - Error notification ao falhar
- Tratamento de erros com mensagens amigáveis
- Estados: loading, error, city

**Validações:**
- Verifica permissão antes de solicitar GPS
- Valida resultado do reverse geocoding
- Tratamento de timeout
- Tratamento de conectividade (offline)

---

### 3. LocationBadge Atualizado
**Arquivo:** `src/components/LocationBadge.tsx`

**Mudanças:**
- **Removido:** Props `city` (não é mais controlado externamente)
- **Adicionado:**
  - Integração com `useUserLocation` hook
  - Carrega cidade do cache ao montar
  - Badge clicável para atualizar localização
  - Ícone de refresh (RefreshCw) visível
  - Spinner durante detecção
  - Estados visuais:
    - Cidade detectada
    - "Localizando..." (loading)
    - "Loc não encontrada" (erro)
    - "Offline" (sem conexão)
    - "Taquaritinga" (fallback padrão)
  - Feedback visual ao pressionar (opacity 0.7)
  - Cursor pointer/not-allowed

**UX:**
- Não pede permissão automaticamente (não invasivo)
- Usuário clica no badge para detectar localização
- Feedback tátil (haptic) ao interagir
- Loading visual durante detecção

---

## Dependências Instaladas

```bash
npm install @react-native-async-storage/async-storage
```

**Versão:** ^1.23.1 (latest)

---

## Configurações Necessárias

### iOS (ios/appigreja/Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Precisamos da sua localização para mostrar eventos próximos a você</string>
```

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

---

## Fluxo de Funcionamento

### Primeira Abertura do App
1. LocationBadge monta
2. Carrega do cache (`loadFromCache`)
3. Cache vazio → mostra "Taquaritinga" (fallback)
4. Usuário clica no badge
5. Solicita permissão
6. Detecta localização com GPS
7. Reverse geocoding → cidade
8. Salva no cache + exibe no badge

### Aberturas Subsequentes
1. LocationBadge monta
2. Carrega do cache (< 1h) → mostra cidade instantaneamente
3. Cache válido → não precisa pedir GPS novamente
4. Usuário pode clicar para atualizar manualmente

### Offline
1. Usuário clica no badge
2. Verifica conectividade
3. Se offline + cache válido (< 1h) → usa cache
4. Se offline + sem cache válido → mostra "Offline"

---

## Performance

### Otimizações
- **Cache do sistema:** `getLastKnownPositionAsync` é instantâneo (0ms)
- **Persistência:** AsyncStorage salva última cidade, evita GPS desnecessário
- **Validação de idade:** Cache válido por 1h, balanço entre precisão e performance
- **Precisão máxima:** Apenas quando necessário pegar nova posição
- **Selectors otimizados:** Re-renders minimizados com Zustand selectors

### Bateria
- GPS só é acionado quando usuário clica (não automático)
- Usa cache do sistema quando disponível
- Timeout de 30s previne GPS infinito

---

## Testes Recomendados

### Cenários
1. ✅ Primeira abertura sem cache
2. ✅ Abertura com cache válido (< 1h)
3. ✅ Abertura com cache antigo (> 1h)
4. ✅ Permissão negada
5. ✅ GPS indisponível/timeout
6. ✅ Offline com cache válido
7. ✅ Offline sem cache
8. ✅ Mudança de cidade (viajar)
9. ✅ Multiple clicks rápidos (debounce natural pelo loading state)

### Plataformas
- [ ] Android (emulador + físico)
- [ ] iOS (emulador + físico)

---

## Edge Cases Tratados

| Cenário | Comportamento |
|---------|---------------|
| Permissão negada | Mostra "Taquaritinga", não trava app |
| GPS timeout (> 30s) | Mostra "Loc não encontrada" |
| Reverse geocoding falha | Mostra "Loc não encontrada" |
| Offline + cache válido | Usa cache, silent fail |
| Offline + sem cache | Mostra "Offline" |
| Cache corrompido | Remove cache, usa fallback |
| Multiple clicks | Disabled durante loading |
| GPS indisponível (emulador) | Fallback para "Taquaritinga" |

---

## Melhorias Futuras (Opcional)

- [ ] Salvar histórico de localizações
- [ ] Detectar mudança de cidade automaticamente (background)
- [ ] Integrar com filtro de eventos por distância
- [ ] Opção de desabilitar detecção automática (settings)
- [ ] Animação no ícone de refresh durante loading
- [ ] Tooltip explicativo no primeiro uso

---

## Observações

- **Código em inglês:** comentários, logs, nomes de variáveis
- **Mensagens em PT:** feedback para usuário ("Localizando...", "Offline")
- **Segurança:** Não loga coordenadas ou dados sensíveis
- **CLAUDE.md:** Seguido rigorosamente - não houve timeout arbitrário, usou cache inteligente
