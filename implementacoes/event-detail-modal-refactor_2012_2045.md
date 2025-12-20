# Refactor: EventDetailModal - Usar BottomSheetModal Reutilizável

**Data:** 20/12/2024 20:45
**Tipo:** Refactoring
**Componentes:** EventDetailModal, BottomSheetModal (prop adicionada)

---

## Objetivo

Refatorar `EventDetailModal` para usar o componente reutilizável `BottomSheetModal` criado em [bottom-sheet-modal-component_2012_2030.md](./bottom-sheet-modal-component_2012_2030.md).

---

## Problema

### **Código Duplicado** ❌

EventDetailModal repetia 30+ linhas de boilerplate:
```tsx
const bottomSheetRef = useRef<BottomSheetModal>(null)
const snapPoints = useMemo(() => ['50%', '90%', '95%'], [])

useEffect(() => {
  if (isOpen && event) {
    bottomSheetRef.current?.present()       // ❌ Imperativo
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(1)  // ❌ Hack com setTimeout(100ms)
    }, 100)
  } else {
    bottomSheetRef.current?.dismiss()
  }
}, [isOpen, event])

const renderBackdrop = useCallback((props) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
), [])
```

### **Controle Imperativo** ⚠️

- Usava `BottomSheetModal` da lib (requer `present()`, `dismiss()`)
- Hack com `setTimeout(100ms)` para abrir em snap point correto
- Não declarativo (controle via métodos ao invés de props)

### **`paddingBottom` customizado** ⚠️

Modal precisava de `paddingBottom: 40` no `contentContainerStyle` do `BottomSheetScrollView`, mas nosso `BottomSheetModal` não suportava.

---

## Solução Implementada

### **1. Atualização do `BottomSheetModal` (prop `scrollContentContainerStyle`)**

**Arquivo:** [src/shared/ui/bottom-sheet-modal.tsx](../src/shared/ui/bottom-sheet-modal.tsx)

**Mudança:**
```tsx
interface BottomSheetModalProps {
  // ... props existentes

  /**
   * Custom style for BottomSheetScrollView's contentContainerStyle
   * Use this for custom paddingBottom, etc.
   * @example { paddingBottom: 40 }
   */
  scrollContentContainerStyle?: StyleProp<ViewStyle>
}

// Implementação:
<BottomSheetScrollView
  contentContainerStyle={[
    styles.scrollContent,
    scrollContentContainerStyle,  // ✅ Merge customização
  ]}
>
```

**Por que essa solução?**
- ✅ **Genérica:** Não afeta FilterModal ou outros modais
- ✅ **Flexível:** Qualquer modal pode customizar o `contentContainerStyle`
- ✅ **Type-safe:** Usa `StyleProp<ViewStyle>` do React Native
- ✅ **Merge correto:** Array `[baseStyle, customStyle]` faz merge automático

---

### **2. Refatoração do `EventDetailModal`**

**ANTES (278 linhas):**
```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['50%', '90%', '95%'], [])

  useEffect(() => {
    if (isOpen && event) {
      bottomSheetRef.current?.present()
      setTimeout(() => bottomSheetRef.current?.snapToIndex(1), 100)
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isOpen, event])

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        <YStack padding="$4" gap="$4">
          {/* ... 200+ linhas de conteúdo ... */}
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  contentContainer: { paddingBottom: 40 },
})
```

**DEPOIS (259 linhas - economiza 19 linhas):**
```tsx
import { useState } from 'react'
import { BottomSheetModal, Button } from '@shared/ui'

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  // ✅ Remove: useRef, useMemo, useEffect, StyleSheet

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={['50%', '90%']}  // ✅ 2 snap points (decisão do usuário)
      initialSnapIndex={1}          // ✅ Abre em 90%
      contentContainerProps={{ padding: '$4', gap: '$4' }}
      scrollContentContainerStyle={{ paddingBottom: 40 }}  // ✅ Nova prop
    >
      {/* ... 200+ linhas de conteúdo (IGUAIS) ... */}
    </BottomSheetModal>
  )
}
```

---

## Decisões Técnicas

### **1. Snap points: `['50%', '90%']` ao invés de `['50%', '90%', '95%']`**

**Decisão do usuário:** Manter apenas 2 snap points.

**Razão:**
- Simplifica UX (usuário arrasta para 50% ou 90%)
- `95%` estava muito próximo de `90%` (diferença visual mínima)

### **2. Controle Declarativo vs Imperativo**

**ANTES (imperativo):**
```tsx
bottomSheetRef.current?.present()
setTimeout(() => bottomSheetRef.current?.snapToIndex(1), 100)
```

**DEPOIS (declarativo):**
```tsx
<BottomSheetModal
  isOpen={isOpen}
  snapPoints={['50%', '90%']}
  initialSnapIndex={1}
/>
```

**Vantagens:**
- ✅ Sem hack de `setTimeout`
- ✅ Mais React-like (controle via props)
- ✅ Sincronização automática (via `useEffect` interno do componente)

### **3. `scrollContentContainerStyle` ao invés de nova prop específica**

**Alternativa descartada:**
```tsx
interface BottomSheetModalProps {
  paddingBottom?: number  // ❌ Muito específico
}
```

**Solução escolhida:**
```tsx
interface BottomSheetModalProps {
  scrollContentContainerStyle?: StyleProp<ViewStyle>  // ✅ Genérico
}
```

**Razão:**
- Genérica: Suporta qualquer customização do ScrollView
- Flexível: Outros modais podem usar para outros casos
- Type-safe: Usa tipos do React Native

### **4. Não afeta FilterModal**

**Validação:**
```tsx
// FilterModal NÃO usa scrollContentContainerStyle
<BottomSheetModal
  isOpen={isOpen}
  onClose={onClose}
  size="large"
  header={...}
  footer={...}
  contentContainerProps={{ padding: '$4', gap: '$5' }}
  // ✅ Sem scrollContentContainerStyle - funciona normalmente
>
```

**Garantia:** Prop é opcional (`scrollContentContainerStyle?`), não quebra código existente.

---

## Impacto

### **Código Removido** ✅
- ❌ `useRef<BottomSheetModal>(null)`
- ❌ `useMemo(() => [...], [])`
- ❌ `useEffect(() => { present/dismiss }, [isOpen])`
- ❌ `setTimeout(..., 100)` (hack)
- ❌ `renderBackdrop` manual
- ❌ `StyleSheet.create({ contentContainer: ... })`
- ❌ Import de `BottomSheetModal`, `BottomSheetBackdrop`, `BottomSheetScrollView`
- ❌ Import de `StyleSheet` do React Native

**Total:** ~30 linhas removidas

### **Código Adicionado** ✅
- ✅ Props declarativas no `BottomSheetModal`

**Total:** ~5 linhas adicionadas

**Economia líquida:** **-19 linhas** (278 → 259)

---

### **Qualidade** ✅

**ANTES:**
- ⚠️ Controle imperativo (`present()`, `dismiss()`)
- ⚠️ Hack com `setTimeout` (frágil, não confiável)
- ❌ Código duplicado (30 linhas repetidas)

**DEPOIS:**
- ✅ Controle declarativo (React best practice)
- ✅ Sem hacks de timing
- ✅ Componente reutilizável
- ✅ Consistente com FilterModal

---

### **Performance** ✅
- Nenhuma mudança de performance
- Callbacks continuam memoizados (dentro do `BottomSheetModal`)

---

### **Funcionalidade** ✅
- ✅ Modal abre/fecha corretamente
- ✅ Múltiplos snap points funcionam (50% e 90%)
- ✅ Abre em 90% por padrão (`initialSnapIndex={1}`)
- ✅ Usuário pode arrastar entre snap points
- ✅ `paddingBottom: 40` aplicado corretamente
- ✅ Scroll funciona perfeitamente
- ✅ Toda lógica de negócio mantida (favorito, notificação, mapa)

---

## Validação Crítica

### **✅ Correta e profissional?**
- Remove código duplicado
- Segue padrão estabelecido
- Consistente com projeto

### **✅ Funcional e confiável?**
- Remove hack de `setTimeout` (mais confiável)
- Controle declarativo (mais previsível)
- Mantém funcionalidade 100%

### **✅ Segura?**
- Nenhuma mudança de segurança
- Validações de notificação intocadas

### **✅ Segue boas práticas?**
- Controle declarativo > imperativo
- Componente reutilizável
- Props type-safe

### **❌ NÃO viola arquitetura**
- `BottomSheetModal` em `@shared/ui` (correto)
- Lógica de negócio no componente (correto)
- Separação de concerns mantida

### **✅ Resolve definitivamente?**
- Elimina código duplicado
- Unifica padrão de modais
- Extensível (via `scrollContentContainerStyle`)

### **❌ NÃO cria outros problemas**
- FilterModal não afetado (validado)
- Prop opcional (backward compatible)
- Type-safe (TypeScript valida)

---

## Checklist de Testes

- [x] Modal abre em 90% (`initialSnapIndex={1}`)
- [x] Usuário pode arrastar para 50%
- [x] Scroll funciona em todo conteúdo
- [x] `paddingBottom` aplicado (espaço no final)
- [x] Botões de ação (Mapa, Favoritar, Notificar) funcionam
- [x] Validações de notificação funcionam
- [x] Toast messages aparecem corretamente
- [x] Backdrop fecha modal ao clicar
- [x] Pan down to close funciona
- [x] FilterModal não afetado

---

## Arquivos Modificados

**Componente atualizado:**
- `src/shared/ui/bottom-sheet-modal.tsx` — Adicionada prop `scrollContentContainerStyle`
- `src/components/EventDetailModal.tsx` — Refatorado para usar BottomSheetModal

**Removidos:**
- Imports de `@gorhom/bottom-sheet` (BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView)
- Import de `StyleSheet` do React Native
- `useRef`, `useMemo`, `useEffect` de sincronização
- `renderBackdrop` callback
- `styles` StyleSheet

**Adicionados:**
- Import de `BottomSheetModal` do `@shared/ui`
- Props declarativas no componente

---

## Próximos Passos (Sugestão)

- [ ] Refatorar `AddFavoriteCityModal` para usar `BottomSheetModal` (economiza ~60 linhas)
- [ ] Considerar migrar `LocationModal` (usa `Modal` nativo) para `BottomSheetModal`

---

## Referências

**Implementação anterior:**
- [bottom-sheet-modal-component_2012_2030.md](./bottom-sheet-modal-component_2012_2030.md) — Criação do componente reutilizável

**Documentação oficial:**
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)
