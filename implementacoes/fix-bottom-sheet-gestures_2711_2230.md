# Fix: Bottom Sheet - Gestures e Scroll

**Data:** 27/11/2024 22:30
**Atualização:** 28/11/2024 (Solução corrigida)
**Tipo:** Bugfix
**Componentes:** EventDetailModal, FilterModal

---

## Problema

Os modais (BottomSheet) apresentavam 2 problemas críticos de UX:

### 1. Gesto de arrastar capturado em qualquer parte do modal
- **Sintoma:** Ao tentar scrollar o conteúdo tocando no meio/baixo do modal, o modal se movia ao invés de scrollar
- **Esperado:** Apenas o handle (tracinho) no topo deveria mover o modal

### 2. Scroll interno não funcionava adequadamente
- **Sintoma:** No FilterModal, não conseguia ver todo o conteúdo - parecia que não tinha scroll
- **Esperado:** Poder scrollar todo o conteúdo interno do modal

---

## Causa Raiz (Investigação)

Após pesquisa profunda na documentação oficial e GitHub Issues:

1. **`enableContentPanningGesture={false}` QUEBRA O SCROLL** (bug conhecido)
   - Issues: #765, #1450, #1806
   - Scroll só funciona após soltar o dedo ("lag/rubber band effect")
   - Especialmente problemático no iOS

2. **Estrutura incorreta para header/footer fixos**
   - `BottomSheetView` + múltiplos wrappers com `flex: 1` causam conflito de layout
   - Footer dentro do conteúdo compete com scroll

---

## Solução Implementada (CORRIGIDA)

### EventDetailModal
**Mudança:** Removida prop `enableContentPanningGesture={false}`

```tsx
// ANTES (com bug)
<BottomSheetModal
  enableContentPanningGesture={false}  // ❌ Quebrava o scroll
>

// DEPOIS (corrigido)
<BottomSheetModal
  enablePanDownToClose
  // ✅ enableContentPanningGesture removido (usa default: true)
>
  <BottomSheetScrollView>
    {/* Conteúdo scrollável */}
  </BottomSheetScrollView>
</BottomSheetModal>
```

### FilterModal
**Mudanças:**
1. Removida prop `enableContentPanningGesture={false}`
2. Footer extraído para `footerComponent` (prop oficial)
3. Estrutura simplificada: removidos wrappers `BottomSheetView` e `YStack flex={1}`

```tsx
// Novo callback para footer
const renderFooter = useCallback(
  (props: any) => (
    <BottomSheetFooter {...props} bottomInset={0}>
      <YStack padding="$4" borderTopWidth={1} borderColor="$border" backgroundColor="$background">
        <XStack gap="$2">
          <Button flex={1} size="$4" variant="outlined" onPress={handleClear}>
            Limpar
          </Button>
          <Button flex={1} size="$4" theme="active" onPress={handleApply}>
            Aplicar
          </Button>
        </XStack>
      </YStack>
    </BottomSheetFooter>
  ),
  [handleClear, handleApply]
)

// Estrutura simplificada
<BottomSheetModal
  footerComponent={renderFooter}  // ✅ Footer gerenciado pela lib
>
  <BottomSheetScrollView>
    <YStack>Header</YStack>
    <YStack>Conteúdo scrollável</YStack>
  </BottomSheetScrollView>
</BottomSheetModal>
```

---

## Como Funciona Agora

### Comportamento após correção:

| Ação | Resultado |
|------|-----------|
| Arrastar o handle (tracinho topo) | ✅ Move o modal entre snap points |
| Arrastar conteúdo | ✅ Scrolla naturalmente |
| Footer | ✅ Fixo no bottom, gerenciado pela lib |
| Ver todo conteúdo do FilterModal | ✅ Scroll funciona completamente |

---

## Impacto

✅ **Scroll funcional:** Removido bug que impedia scroll
✅ **Footer fixo:** Usando `footerComponent` oficial
✅ **Estrutura limpa:** Sem wrappers desnecessários
✅ **Best practices:** Seguindo padrão oficial da lib

---

## Referências Técnicas

**Documentação oficial:**
- [Custom Footer](https://gorhom.dev/react-native-bottom-sheet/custom-footer)
- [Troubleshooting](https://gorhom.dev/react-native-bottom-sheet/troubleshooting)

**GitHub Issues:**
- [#765 - enableContentPanningGesture breaks scroll](https://github.com/gorhom/react-native-bottom-sheet/issues/765)
- [#1450 - Scroll lags when prop is false](https://github.com/gorhom/react-native-bottom-sheet/issues/1450)
- [#1806 - Can't scroll on iOS](https://github.com/gorhom/react-native-bottom-sheet/issues/1806)
- [#1283 - Fixed header with scrollable content](https://github.com/gorhom/react-native-bottom-sheet/issues/1283)

---

## Arquivos Modificados

- `src/components/EventDetailModal.tsx` — Removido enableContentPanningGesture
- `src/components/FilterModal.tsx` — Removido enableContentPanningGesture, adicionado footerComponent, simplificada estrutura
