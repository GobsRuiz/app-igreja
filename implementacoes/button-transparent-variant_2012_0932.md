# Button Transparent Variant

**Data:** 20/12/2024 09:32
**Tipo:** Feature/Enhancement

## Problema

Na tela de autenticação ([auth.tsx](../app/auth.tsx)), três botões estavam usando `unstyled` diretamente:

1. Botão do olho para mostrar/ocultar senha (campo senha) - linhas 186-197
2. Botão do olho para mostrar/ocultar senha (campo confirmar senha) - linhas 229-240
3. Botão de troca entre login/cadastro - linhas 264-272

Isso criava inconsistência, já que o componente [Button](../src/shared/ui/button.tsx) centraliza todos os estilos, mas não tinha uma variante adequada para botões transparentes/invisíveis.

As variantes existentes (`outlined`, `ghost`) possuem borda, o que não era ideal para ícones de ação e links textuais.

## Solução

### 1. Adicionada variante `transparent` no componente Button

**Arquivo:** [src/shared/ui/button.tsx](../src/shared/ui/button.tsx)

```typescript
export type ButtonVariant = 'primary' | 'outlined' | 'ghost' | 'danger' | 'info' | 'success' | 'transparent'
```

**Estilos da variante:**
```typescript
transparent: {
  backgroundColor: 'transparent',
  borderWidth: 0,
  color: '$color12',
  hoverStyle: {
    opacity: 0.7,
  },
  pressStyle: {
    opacity: 0.5,
  },
}
```

**Características:**
- Fundo totalmente transparente
- Sem borda
- Cor do texto padrão: `$color12`
- Feedback visual via opacity no hover (0.7) e press (0.5)
- Ideal para ícones de ação e links textuais

### 2. Atualizada tela de autenticação

**Arquivo:** [app/auth.tsx](../app/auth.tsx)

Substituídos 3 usos de `unstyled` por `variant="transparent"`:

**Antes:**
```tsx
<Button
  unstyled
  onPress={() => setShowPassword(!showPassword)}
  padding="$2"
  disabled={loading}
>
  {/* icon */}
</Button>
```

**Depois:**
```tsx
<Button
  variant="transparent"
  onPress={() => setShowPassword(!showPassword)}
  padding="$2"
  disabled={loading}
>
  {/* icon */}
</Button>
```

## Benefícios

### Consistência
- Todos os botões agora usam o componente Button com variantes
- Removida a necessidade de usar `unstyled` + props inline

### Reutilização
- Outros componentes podem usar a variante `transparent` para botões de ícone/link
- Padrão estabelecido para casos futuros

### Manutenibilidade
- Mudanças futuras no estilo de botões transparentes em um único lugar
- Código mais limpo e declarativo

## Impacto

- **Arquivos alterados:** 2
- **Breaking changes:** Nenhum
- **Compatibilidade:** 100% compatível com código existente
- **Performance:** Sem impacto (mesmo comportamento, apenas refatoração)

## Casos de uso da nova variante

A variante `transparent` é ideal para:
- Botões de ícone (revelar senha, toggle, etc.)
- Links textuais inline
- Ações secundárias que não precisam destaque visual
- Botões dentro de componentes já delimitados visualmente
