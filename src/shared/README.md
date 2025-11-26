# Shared

Esta pasta contém código compartilhado entre features do aplicativo.

## Estrutura

```
src/shared/
├── ui/               # Componentes UI reutilizáveis
├── hooks/            # Hooks reutilizáveis
├── lib/              # Utilitários e helpers
└── constants/        # Constantes globais (theme, config)
```

## 📦 Pastas

### `ui/`
Componentes UI genéricos e reutilizáveis.

**Quando usar:**
- Componente será usado por 2+ features
- Componente é genérico (Button, Card, Input)
- Componente não tem lógica de negócio

**Exemplo:**
```typescript
// src/shared/ui/button.tsx
import { TouchableOpacity, Text } from 'react-native';

export function Button({ children, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
}
```

### `hooks/`
Hooks genéricos reutilizáveis.

**Quando usar:**
- Hook será usado por múltiplas features
- Hook não tem dependência específica de feature
- Hook é utilitário (useDebounce, useAsync)

**Exemplo:**
```typescript
// src/shared/hooks/use-debounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### `lib/`
Utilitários, helpers e configurações.

**Subpastas comuns:**
- `api/` - Cliente HTTP, interceptors
- `storage/` - AsyncStorage wrapper
- `validators/` - Schemas de validação (Zod)
- `formatters/` - Date, currency, etc

**Exemplo:**
```typescript
// src/shared/lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});
```

### `constants/`
Constantes globais do app.

**Exemplo:**
```typescript
// src/shared/constants/theme.ts
export const Colors = {
  light: {
    primary: '#0a7ea4',
    background: '#fff',
  },
  dark: {
    primary: '#fff',
    background: '#151718',
  },
};
```

## ✅ Boas Práticas

1. **Exports centralizados:**
```typescript
// src/shared/ui/index.ts
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
```

2. **Tipagem forte:**
```typescript
// Sempre exporte tipos junto com implementação
export type ButtonProps = {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
};

export function Button(props: ButtonProps) {}
```

3. **Documentação inline:**
```typescript
/**
 * Debounce hook para otimizar inputs
 * @param value - Valor a ser debouncado
 * @param delay - Delay em ms (padrão: 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {}
```

## ❌ O que NÃO colocar aqui

- Lógica de negócio específica → `@features/`
- Componentes de rota específicos → `app/`
- State management de feature → `@features/[feature]/stores/`
- Tipos específicos de feature → `@features/[feature]/types/`
