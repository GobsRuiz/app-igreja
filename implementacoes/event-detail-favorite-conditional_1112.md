# Implementação: Lógica Condicional nos Botões de Favoritar e Ir

**Data:** 11/12/2025
**Arquivos:**
- `src/components/EventDetailModal.tsx`
- `src/components/EventCard.tsx`

---

## Objetivo

Aplicar lógica condicional nos botões de favoritar e "Ir", semelhante à lógica do botão de notificar: esconder os botões se o evento estiver a ≤ 3 horas para começar.

---

## Mudanças Implementadas

### 1. Adicionada variável `showFavoriteButton`

**Linha 52:**
```typescript
const showFavoriteButton = canEnableNotification(displayEvent) || displayEvent.isFavorite
```

**Lógica:**
- Mostra botão se evento > 3h no futuro (`canEnableNotification()` retorna `true`), **OU**
- Mostra botão se evento já está favoritado (`isFavorite === true`)

**Resultado:**
- Esconde botão se evento ≤ 3h **E** não está favoritado
- Permite desfavoritar eventos próximos/passados que já foram favoritados

---

### 2. Botão de Favoritar Envolvido em Condicional

**Linhas 163-172:**
```typescript
{showFavoriteButton && (
  <Button
    flex={1}
    variant={displayEvent.isFavorite ? 'primary' : 'outlined'}
    icon={<Star size={16} color={displayEvent.isFavorite ? '$color1' : '$color11'} fill={displayEvent.isFavorite ? '$color1' : 'transparent'} />}
    onPress={handleFavoritePress}
  >
    {displayEvent.isFavorite ? 'Favoritado' : 'Favoritar'}
  </Button>
)}
```

---

### 3. EventCard - Adicionada variável `showGoButton`

**Arquivo:** `src/components/EventCard.tsx`

**Linha 16:**
```typescript
const showGoButton = canEnableNotification(event)
```

**Lógica:**
- Mostra botão "Ir" se evento > 3h no futuro (`canEnableNotification()` retorna `true`)
- Esconde botão "Ir" se evento ≤ 3h

**Diferença do favoritar:** Não tem OR porque "Ir" não tem estado persistente (não é como favorito/notificação que fica ativo).

---

### 4. Botão "Ir" Envolvido em Condicional

**Linhas 75-84:**
```typescript
{showGoButton && (
  <Button
    flex={1}
    variant="primary"
    iconAfter={<Navigation size={16} color="$color1" />}
    onPress={onGoPress}
  >
    Ir
  </Button>
)}
```

---

## Comportamento

### Botão Favoritar (EventDetailModal)

| Situação | Botão Favoritar Aparece? |
|----------|--------------------------|
| Evento daqui 5h, não favoritado | ✅ SIM (> 3h) |
| Evento daqui 2h, não favoritado | ❌ NÃO (≤ 3h) |
| Evento daqui 1h, **JÁ favoritado** | ✅ SIM (permite desfavoritar) |
| Evento passou, não favoritado | ❌ NÃO |
| Evento passou, **JÁ favoritado** | ✅ SIM (permite desfavoritar) |

### Botão "Ir" (EventCard)

| Situação | Botão "Ir" Aparece? |
|----------|---------------------|
| Evento daqui 5h | ✅ SIM (> 3h) |
| Evento daqui 2h | ❌ NÃO (≤ 3h) |
| Evento passou | ❌ NÃO |

**Diferença:** Botão "Ir" SEMPRE esconde se ≤ 3h (sem exceção), pois não faz sentido "Ir" para evento muito próximo ou passado.

---

## Consistência

A lógica segue o mesmo padrão do botão de notificar:
- `showNotificationButton = canEnableNotification(displayEvent) || displayEvent.isNotifying`
- `showFavoriteButton = canEnableNotification(displayEvent) || displayEvent.isFavorite`
- `showGoButton = canEnableNotification(event)`

**Padrão consistente:**
- Todos usam `canEnableNotification()` (evento > 3h no futuro)
- Botões com estado persistente (notificar, favoritar) incluem OR para permitir desativar
- Botão sem estado persistente ("Ir") apenas verifica tempo

---

## Segurança, Performance e Qualidade

✅ **Segurança:** N/A
✅ **Correção:** Resolve os requisitos
  - Esconde favoritar se ≤ 3h (exceto se já favoritado)
  - Esconde "Ir" se ≤ 3h
✅ **Performance:** Reutiliza função existente (`canEnableNotification`), sem overhead
✅ **Consistência:** Padrão idêntico ao botão de notificar
✅ **Organização:** Código limpo, responsabilidade única, fácil de entender

## Resumo Visual

```
EventCard (Lista de Eventos)
┌─────────────────────────────┐
│ [Categoria]                 │
│ Título do Evento            │
│ 📅 Data e hora              │
│ 📍 Local                    │
│                             │
│ ┌─────────┐  ┌───────────┐ │
│ │Detalhes │  │    Ir   → │ │ ← Condicional (≤ 3h = esconde)
│ └─────────┘  └───────────┘ │
└─────────────────────────────┘

EventDetailModal (Detalhes)
┌─────────────────────────────┐
│ Descrição completa...       │
│                             │
│ ┌───────┐ ┌──────┐ ┌──────┐│
│ │ Mapa  │ │ ⭐   │ │ 🔔   ││
│ └───────┘ └──────┘ └──────┘│
│           ↑         ↑       │
│      Condicional Condicional│
│      (≤3h e não   (≤3h e não│
│      favoritado   notificando│
│      = esconde)   = esconde) │
└─────────────────────────────┘
```
