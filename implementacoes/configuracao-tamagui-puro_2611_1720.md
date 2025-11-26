# Configuração Tamagui Puro (sem NativeWind)

**Data:** 26/11/2024 - 17:20
**Tipo:** Migração de Stack de UI
**Status:** ✅ Completo

---

## 📝 Resumo

Removido NativeWind e configurado Tamagui como biblioteca única de UI. Solução adotada após identificar conflito entre os plugins Babel do Tamagui e NativeWind.

---

## 🔍 Problema Identificado

**Conflito entre Tamagui e NativeWind:**
- Ambos tentam processar componentes JSX no Babel
- NativeWind: `jsxImportSource: 'nativewind'` no preset
- Tamagui: `@tamagui/babel-plugin` processa componentes
- **Resultado:** Erro ".plugins is not a valid Plugin property"

**Pesquisa realizada:**
- Tamagui e NativeWind são **alternativos**, não complementares
- Ferramentas como `create-expo-stack` oferecem um **OU** outro
- Documentação oficial não menciona uso conjunto
- Expo SDK 54 + Tamagui: suporte em andamento (issue aberta)

---

## ✅ Solução Implementada

### 1. Remoção do NativeWind

**Pacotes removidos:**
```bash
npm uninstall nativewind tailwindcss
```

**Arquivos deletados:**
- `global.css`
- `tailwind.config.js`
- `nativewind-env.d.ts`

### 2. Configuração do Tamagui

**babel.config.js:**
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],  // Sem jsxImportSource
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

**metro.config.js:**
```js
const { getDefaultConfig } = require('expo/metro-config')
const { withTamagui } = require('@tamagui/metro-plugin')

const config = getDefaultConfig(__dirname)

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui-web.css',
})
```

**app/_layout.tsx:**
```tsx
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

<TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
  {/* ... */}
</TamaguiProvider>
```

### 3. Página de Exemplo

**app/(tabs)/index.tsx:**
- Componentes Tamagui: `YStack`, `XStack`, `Card`, `Button`, `H1`, `Paragraph`
- Props de estilo: `padding="$6"`, `backgroundColor="$background"`
- Temas: `theme="blue"`, `theme="green"`, etc.
- Animações: `animation="bouncy"`, `pressStyle`, `hoverStyle`

---

## 📂 Arquivos Alterados

**Modificados:**
1. `babel.config.js` — Removido jsxImportSource, adicionado @tamagui/babel-plugin
2. `metro.config.js` — Configurado withTamagui
3. `app/_layout.tsx` — Adicionado TamaguiProvider, removido import global.css
4. `app/(tabs)/index.tsx` — Reescrito com componentes Tamagui
5. `package.json` — Removido nativewind e tailwindcss

**Removidos:**
1. `global.css`
2. `tailwind.config.js`
3. `nativewind-env.d.ts`

---

## 🧪 Verificações

✅ **TypeScript:** `npx tsc --noEmit` — 0 erros
✅ **Pacotes:** NativeWind e Tailwind removidos
✅ **Configuração:** Babel e Metro com Tamagui configurados
✅ **Provider:** TamaguiProvider no layout raiz
✅ **Exemplo:** Página com componentes Tamagui funcionais

---

## 🎨 Vantagens do Tamagui Puro

1. **Sem conflitos:** Apenas um sistema de processamento JSX
2. **Componentes prontos:** Card, Button, Input, etc. (não precisa criar)
3. **Temas built-in:** Dark/Light mode automático
4. **Tokens consistentes:** `$4`, `$blue10`, etc.
5. **Animações nativas:** Integração com Reanimated
6. **Type-safe:** TypeScript autocomplete completo
7. **Performance:** Otimizações do babel plugin

---

## 📚 Sistema de Estilização Tamagui

### Exemplo de Props
```tsx
<YStack
  padding="$4"           // Token de espaçamento
  backgroundColor="$blue10"  // Token de cor
  borderRadius="$4"      // Token de raio
  gap="$3"              // Espaçamento entre filhos
/>
```

### Exemplo de Styled API
```tsx
const Card = styled(YStack, {
  padding: '$4',
  backgroundColor: '$background',
  variants: {
    featured: {
      true: { borderColor: '$blue10' }
    }
  }
})
```

### Temas Disponíveis
- `theme="blue"` / `"green"` / `"red"` / `"orange"` / `"yellow"` / `"purple"`
- Cada tema tem variantes light/dark automáticas

---

## 🚀 Próximos Passos

1. Criar componentes reutilizáveis baseados em Tamagui
2. Configurar tokens personalizados no `tamagui.config.ts`
3. Implementar features do App Igreja usando Tamagui
4. Aproveitar componentes prontos: Input, Select, Dialog, Sheet, etc.

---

## 🔗 Referências

- [Tamagui Expo Guide](https://tamagui.dev/docs/guides/expo)
- [Tamagui Components](https://tamagui.dev/ui/intro)
- [Expo SDK 54 Support Issue](https://github.com/tamagui/tamagui/issues/3610)
