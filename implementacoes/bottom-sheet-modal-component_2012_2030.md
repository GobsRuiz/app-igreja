# Feature: BottomSheetModal Reusable Component

**Data:** 20/12/2024 20:30
**Tipo:** New Feature + Refactoring
**Componentes:** `@shared/ui/bottom-sheet-modal`, FilterModal

---

## Problema

Projeto apresentava **INCONSISTÊNCIAS CRÍTICAS** nos modais:

### 1. **Tecnologias Mistas** ❌
- `FilterModal` → usa `BottomSheet` (não-modal)
- `EventDetailModal` → usa `BottomSheetModal`
- `AddFavoriteCityModal` → usa `BottomSheet`
- `LocationModal` → usa `Modal` nativo (React Native)

**Impacto**: Nenhum padrão, dificulta manutenção.

### 2. **Código Duplicado** ❌
Todos os modais repetem:
```tsx
const bottomSheetRef = useRef<BottomSheet>(null)
const snapPoints = useMemo(() => ['90%'], [])

const renderBackdrop = useCallback((props) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
), [])

useEffect(() => {
  if (isOpen) {
    bottomSheetRef.current?.snapToIndex(0)
  } else {
    bottomSheetRef.current?.close()
  }
}, [isOpen])
```

### 3. **FilterModal Desatualizado** ❌
Segundo [fix-bottom-sheet-gestures_2711_2230.md](./fix-bottom-sheet-gestures_2711_2230.md), deveria usar `footerComponent`, mas código atual tinha footer **dentro do conteúdo**.

### 4. **Cores Hardcoded** ⚠️
```tsx
// AddFavoriteCityModal.tsx
backgroundStyle={{ backgroundColor: 'white' }}  // ❌

// FilterModal.tsx - Slider
minimumTrackTintColor="#333333"     // ❌
maximumTrackTintColor="#e5e5e5"     // ❌
thumbTintColor="#333333"            // ❌
```

### 5. **Falta de Reusabilidade** ❌
Não havia componente compartilhado → cada modal implementava do zero.

---

## Solução Implementada

### 1. **Novo Componente: `BottomSheetModal`**

Localização: [src/shared/ui/bottom-sheet-modal.tsx](../src/shared/ui/bottom-sheet-modal.tsx)

**Features:**
- ✅ Abstrai complexidade do `@gorhom/bottom-sheet`
- ✅ Header fixo + conteúdo scrollável + footer fixo
- ✅ Presets de tamanho: `small`, `medium`, `large`, `full`
- ✅ Snap points customizáveis
- ✅ TypeScript completo (props + ref)
- ✅ **100% tokens Tamagui** (zero hardcoded)
- ✅ Performance (callbacks memoizados)
- ✅ Best practices do @gorhom/bottom-sheet
- ✅ Ref API para controle programático

**API do Componente:**

```tsx
interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  size?: 'small' | 'medium' | 'large' | 'full'  // default: 'large'
  snapPoints?: string[]                         // custom (override size)
  initialSnapIndex?: number                     // default: 0
  header?: React.ReactNode                      // Fixed header
  children: React.ReactNode                     // Scrollable content
  footer?: React.ReactNode                      // Fixed footer
  enablePanDownToClose?: boolean                // default: true
  contentContainerProps?: YStackProps           // Content wrapper props
  testID?: string
}

interface BottomSheetModalRef {
  snapToIndex: (index: number) => void
  close: () => void
}
```

**Exemplo de uso:**

```tsx
import { BottomSheetModal } from '@shared/ui'

<BottomSheetModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  size="large"
  header={
    <Text fontSize="$6" fontWeight="700">Título</Text>
  }
  footer={
    <XStack gap="$3">
      <Button flex={1} variant="outlined" onPress={onCancel}>
        Cancelar
      </Button>
      <Button flex={1} variant="primary" onPress={onConfirm}>
        Confirmar
      </Button>
    </XStack>
  }
  contentContainerProps={{ padding: '$4', gap: '$5' }}
>
  <YStack gap="$3">
    {/* Conteúdo */}
  </YStack>
</BottomSheetModal>
```

**Presets de tamanho:**
- `small`: 40% - ações rápidas, confirmações
- `medium`: 60% - formulários, filtros
- `large`: 90% - conteúdo detalhado (default)
- `full`: 95% - conteúdo máximo

---

### 2. **Refatoração do FilterModal**

**Antes (313 linhas):**
```tsx
<BottomSheet
  ref={bottomSheetRef}
  snapPoints={snapPoints}
  index={isOpen ? 0 : -1}
  enablePanDownToClose
  onClose={onClose}
  backdropComponent={(props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
  )}
>
  <YStack flex={1}>
    {/* Header */}
    <YStack padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
      <Text fontSize="$6" fontWeight="700" color="$color12">
        Filtros
      </Text>
    </YStack>

    {/* Content */}
    <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
      <YStack padding="$4" gap="$5">
        {/* ... conteúdo ... */}
      </YStack>
    </BottomSheetScrollView>

    {/* Footer - ❌ DENTRO DO YSTACK! */}
    <YStack padding="$4" borderTopWidth={1} borderTopColor="$borderColor">
      <XStack gap="$3">
        <Button flex={1} variant="outlined" onPress={handleClear}>Limpar</Button>
        <Button flex={1} variant="primary" onPress={handleApply}>Aplicar</Button>
      </XStack>
    </YStack>
  </YStack>
</BottomSheet>

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
})
```

**Depois (299 linhas - 14 linhas removidas):**
```tsx
<BottomSheetModal
  isOpen={isOpen}
  onClose={onClose}
  size="large"
  header={
    <Text fontSize="$6" fontWeight="700" color="$color12">
      Filtros
    </Text>
  }
  footer={
    <XStack gap="$3">
      <Button flex={1} variant="outlined" onPress={handleClear}>
        Limpar
      </Button>
      <Button flex={1} variant="primary" onPress={handleApply}>
        Aplicar
      </Button>
    </XStack>
  }
  contentContainerProps={{ padding: '$4', gap: '$5' }}
>
  {/* Conteúdo direto - sem wrappers */}
  <YStack gap="$3">...</YStack>
  <YStack gap="$3">...</YStack>
  <YStack gap="$3">...</YStack>
</BottomSheetModal>
```

**Melhorias:**
- ✅ Removido `useRef`, `useMemo`, `useEffect` de sincronização
- ✅ Removido `renderBackdrop` manual
- ✅ Removido `StyleSheet` desnecessário
- ✅ Footer agora usa `footerComponent` (best practice)
- ✅ Código 14 linhas menor
- ✅ Mais legível e declarativo

---

### 3. **Correção de Cores Hardcoded no Slider**

**Antes:**
```tsx
<Slider
  minimumTrackTintColor="#333333"     // ❌ Hardcoded
  maximumTrackTintColor="#e5e5e5"     // ❌ Hardcoded
  thumbTintColor="#333333"            // ❌ Hardcoded
/>
```

**Depois:**
```tsx
const theme = useTheme()

<Slider
  minimumTrackTintColor={theme.color12?.val || '#333333'}
  maximumTrackTintColor={theme.borderColor?.val || '#e5e5e5'}
  thumbTintColor={theme.color12?.val || '#333333'}
/>
```

**Justificativa do fallback:**
- Slider é componente nativo, não aceita tokens Tamagui
- `.val` extrai valor real do token
- Fallback para compatibilidade (se token não existir)

---

## Decisões Técnicas

### 1. **Por que `BottomSheet` ao invés de `BottomSheetModal`?**

O componente usa `BottomSheet` do `@gorhom/bottom-sheet` porque:
- ✅ Mais simples (sem gestão de portal)
- ✅ Controlado via `index` prop (mais declarativo)
- ✅ Sincronização automática com `isOpen` via `useEffect`
- ✅ Compatível com todos os casos de uso do projeto

`BottomSheetModal` seria necessário apenas se precisássemos:
- Abrir/fechar via métodos imperativos (`present()/dismiss()`)
- Múltiplos modais empilhados
- Controle fora da árvore de componentes

**Nosso caso:** Modal controlado por estado (`isOpen`) → `BottomSheet` é suficiente.

### 2. **Por que `footerComponent` ao invés de footer inline?**

Segundo [documentação oficial](https://gorhom.dev/react-native-bottom-sheet/custom-footer) e issue [#1283](https://github.com/gorhom/react-native-bottom-sheet/issues/1283):

❌ **Inline footer (errado):**
```tsx
<BottomSheet>
  <YStack flex={1}>
    <BottomSheetScrollView>{content}</BottomSheetScrollView>
    <YStack>{footer}</YStack>  {/* ❌ Compete com scroll */}
  </YStack>
</BottomSheet>
```

✅ **footerComponent (correto):**
```tsx
<BottomSheet
  footerComponent={(props) => (
    <BottomSheetFooter {...props}>{footer}</BottomSheetFooter>
  )}
>
  <BottomSheetScrollView>{content}</BottomSheetScrollView>
</BottomSheet>
```

**Vantagens:**
- Footer gerenciado pela lib (não compete com scroll)
- Posicionamento correto em todos os snap points
- Melhor performance

### 3. **Por que não criar variantes de tamanho com múltiplos snap points?**

**Decisão:** Cada preset tem **UM único snap point**.

**Razão:**
- Simplicidade: 99% dos casos usam 1 snap point
- Se precisar múltiplos, pode usar `snapPoints` customizado
- Evita confusão (qual index inicial? Como anima entre snaps?)

**Exemplo de customização:**
```tsx
<BottomSheetModal
  snapPoints={['40%', '90%']}  // Custom
  initialSnapIndex={1}         // Abre em 90%
>
```

### 4. **Por que `forwardRef` com `useImperativeHandle`?**

Permite controle programático:
```tsx
const ref = useRef<BottomSheetModalRef>(null)

// Abrir modal em snap point específico
ref.current?.snapToIndex(1)

// Fechar modal programaticamente
ref.current?.close()
```

**Uso:** Casos avançados (animações, deep links, navegação).

---

## Impacto

### **Positivo** ✅
1. **Reusabilidade**: Componente único para todos os modais
2. **Consistência**: Padrão unificado em todo o projeto
3. **Manutenibilidade**: Mudanças em 1 lugar afetam todos os modais
4. **Performance**: Callbacks memoizados, estrutura otimizada
5. **TypeScript**: Tipagem completa, autocomplete, type-safety
6. **Best Practices**: Segue documentação oficial do @gorhom/bottom-sheet
7. **Código Limpo**: FilterModal 14 linhas menor, mais declarativo
8. **Tokens Tamagui**: Tema consistente, zero hardcoded (exceto slider)

### **Próximos Passos** (Sugestão)
- [ ] Refatorar `EventDetailModal` para usar `BottomSheetModal`
- [ ] Refatorar `AddFavoriteCityModal` para usar `BottomSheetModal`
- [ ] Considerar migrar `LocationModal` para `BottomSheetModal` (se aplicável)

---

## Checklist de Validação

✅ **Segurança**: Nenhum dado exposto, nenhuma vulnerabilidade
✅ **Correção**: Modal abre/fecha corretamente, scroll funciona, footer fixo
✅ **Performance**: Callbacks memoizados, sem re-renders desnecessários
✅ **Consistência**: Segue padrão Tamagui, tokens ao invés de hardcoded
✅ **Organização**: Componente em `@shared/ui`, exportado em `index.ts`
✅ **TypeScript**: Tipagem completa, sem `any`, interfaces exportadas
✅ **Documentação**: JSDoc completo, exemplos de uso
✅ **Best Practices**: Segue padrão oficial do @gorhom/bottom-sheet

---

## Arquivos Modificados

**Novos arquivos:**
- `src/shared/ui/bottom-sheet-modal.tsx` — Componente reutilizável

**Arquivos modificados:**
- `src/shared/ui/index.ts` — Export do novo componente
- `src/components/FilterModal.tsx` — Refatorado para usar BottomSheetModal + correção de cores do slider

---

## Referências Técnicas

**Documentação oficial:**
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)
- [Custom Footer](https://gorhom.dev/react-native-bottom-sheet/custom-footer)
- [Troubleshooting](https://gorhom.dev/react-native-bottom-sheet/troubleshooting)

**Issues relevantes:**
- [#1283 - Fixed header with scrollable content](https://github.com/gorhom/react-native-bottom-sheet/issues/1283)
- [#765 - enableContentPanningGesture breaks scroll](https://github.com/gorhom/react-native-bottom-sheet/issues/765)

**Implementações anteriores:**
- [fix-bottom-sheet-gestures_2711_2230.md](./fix-bottom-sheet-gestures_2711_2230.md)
