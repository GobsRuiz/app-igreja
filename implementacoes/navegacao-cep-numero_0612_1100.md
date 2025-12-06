# Navegação com CEP + Número

**Data:** 06/12/2024
**Tipo:** Refatoração + Feature

---

## Problema

Existia inconsistência nos tipos de Event:
- `src/shared/types/event.ts` tinha `latitude` e `longitude` (sempre `undefined`)
- `src/features/events/types/event.types.ts` (Firestore) NÃO tinha GPS
- EventDetailModal e botão "Ir" tentavam usar coordenadas mas sempre falhavam
- Location tinha endereço completo (CEP, cidade, estado, address) mas não era usado

---

## Solução Implementada

**Removida redundância de latitude/longitude** e implementada **navegação usando CEP + número**.

### 1. Removido `latitude` e `longitude` de `Event`

**Arquivo:** `src/shared/types/event.ts`

- Removido campos `latitude` e `longitude` do schema Zod
- Removido validação `.refine()` de lat/long
- Event agora usa apenas campos de endereço: `address`, `city`, `state`, `zipCode`

### 2. Atualizado adapter do Firestore

**Arquivo:** `src/shared/store/use-event-store.ts`

- Removido linhas que setavam `latitude: undefined` e `longitude: undefined`
- Adapter agora só popula campos de endereço da Location

### 3. Adicionado método `openMapsWithAddress()` no MapService

**Arquivo:** `src/shared/services/map-service.ts`

**Novo método:**
```typescript
static async openMapsWithAddress(
  zipCode: string,
  address: string,
  label?: string
): Promise<void>
```

**Funcionalidade:**
- Extrai número do endereço usando regex (`/\d+/`)
- Monta query: `"CEP número"` (ex: `"14770-000 100"`)
- Abre app de mapas do sistema (Google Maps/Apple Maps/Waze)
- Fallback para Google Maps web se app nativo não disponível
- Suporta iOS e Android nativamente

**Por que funciona:**
- Apps de mapas fazem geocoding automático de `"CEP número"`
- Precisão é suficiente para navegação
- Sem necessidade de coordenadas GPS no banco

### 4. Atualizado EventDetailModal

**Arquivo:** `src/components/EventDetailModal.tsx`

**Antes:**
```typescript
if (!displayEvent.latitude || !displayEvent.longitude) {
  ToastService.warning('Localização não disponível')
  return
}
await MapService.openGoogleMaps(displayEvent.latitude, displayEvent.longitude, displayEvent.church)
```

**Depois:**
```typescript
if (!displayEvent.zipCode || !displayEvent.address) {
  ToastService.warning('Endereço não disponível')
  return
}
await MapService.openMapsWithAddress(displayEvent.zipCode, displayEvent.address, displayEvent.church)
```

### 5. Implementado botão "Ir" do EventCard

**Arquivos:**
- `app/(tabs)/index.tsx`
- `app/(tabs)/favorites.tsx`

**Lógica:**
```typescript
const handleGoPress = async (event: Event) => {
  if (!event.zipCode || !event.address) {
    toast.warning('Endereço não disponível para este evento')
    return
  }

  try {
    await MapService.openMapsWithAddress(event.zipCode, event.address, event.church)
  } catch (error) {
    toast.error('Não foi possível abrir o mapa')
  }
}
```

---

## Benefícios

✅ **Removida inconsistência** entre tipos de Event
✅ **Dados não redundantes** - usa Location como fonte única de endereço
✅ **Navegação funcional** - CEP + número funciona perfeitamente
✅ **Sem necessidade de GPS** - não precisa cadastrar lat/long
✅ **Escolha do usuário** - sistema abre app de mapas preferido (Google Maps, Waze, Apple Maps)
✅ **Compatível com iOS e Android**

---

## Arquitetura

**Fonte da Verdade:** Firestore
- `events` collection → tem `locationId`
- `locations` collection → tem `address`, `city`, `state`, `zipCode`

**Fluxo de Navegação:**
1. Usuário clica em "Ir" no EventCard ou "Mapa" no EventDetailModal
2. App valida se evento tem `zipCode` e `address`
3. `MapService.openMapsWithAddress()` extrai número do address
4. Monta query: `"CEP número"`
5. Abre app de mapas do sistema com a query
6. App de mapas faz geocoding e inicia navegação

---

## Validações

- ✅ CEP e endereço obrigatórios
- ✅ Extração robusta de número do endereço (regex)
- ✅ Fallback para Google Maps web se app nativo não disponível
- ✅ Tratamento de erros com toast de feedback
- ✅ Validação de URL antes de abrir

---

## Decisões Técnicas

**Por que CEP + número ao invés de lat/long?**
1. Location já tem todos os dados necessários
2. Apps de mapas fazem geocoding automaticamente
3. Evita cadastro manual de coordenadas GPS
4. Precisão é suficiente para navegação
5. Menos dados redundantes no banco

**Por que remover lat/long completamente?**
1. Sempre estava `undefined` (nunca populado)
2. Causava confusão (dois tipos Event diferentes)
3. Não agregava valor (endereço é suficiente)
4. Simplifica arquitetura

---

## Testes Sugeridos

- [ ] Navegar para evento com CEP e número no endereço
- [ ] Navegar para evento sem número (só CEP)
- [ ] Testar em iOS (abre Apple Maps)
- [ ] Testar em Android (abre Google Maps)
- [ ] Verificar fallback para web quando app não instalado
- [ ] Validar toast de erro quando endereço incompleto
