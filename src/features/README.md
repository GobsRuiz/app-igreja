# Features

Esta pasta contém as features isoladas do aplicativo seguindo a arquitetura Feature-Based.

## Estrutura de uma Feature

Cada feature deve seguir esta estrutura:

```
src/features/nome-da-feature/
├── components/        # Componentes específicos da feature
├── hooks/            # Hooks específicos da feature
├── services/         # Lógica de API/negócio da feature
├── stores/           # Estado local da feature (Zustand/Context)
├── types/            # Tipos TypeScript específicos
├── utils/            # Utilitários específicos
└── index.ts          # Exports públicos da feature
```

## Princípios

1. **Isolamento**: Features devem ser independentes entre si
2. **Exports controlados**: Exporte apenas o necessário via `index.ts`
3. **Compartilhamento**: Código compartilhado vai para `@shared/`, não entre features
4. **Rotas**: Rotas ficam em `app/`, não dentro da feature

## Exemplo: Feature de Eventos

```typescript
// src/features/events/index.ts
export { EventCard } from './components/event-card';
export { useEvents } from './hooks/use-events';
export { eventService } from './services/event-service';
export type { Event, EventFilter } from './types';
```

```typescript
// src/features/events/components/event-card.tsx
import { Card } from '@shared/ui/card';
import { useThemeColor } from '@shared/hooks/use-theme-color';
import type { Event } from '../types';

export function EventCard({ event }: { event: Event }) {
  // Implementação
}
```

```typescript
// src/features/events/hooks/use-events.ts
import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/event-service';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAll
  });
}
```

## Comunicação entre Features

❌ **ERRADO** - Import direto entre features:
```typescript
import { useAuth } from '@features/auth/hooks/use-auth';
```

✅ **CORRETO** - Usar shared ou props:
```typescript
// Se necessário compartilhar, mova para @shared ou passe via props
import { useAuth } from '@shared/hooks/use-auth';
```

## Quando criar uma Feature?

Crie uma nova feature quando:
- Tem um domínio/contexto claro (ex: eventos, autenticação, notificações)
- Tem 3+ componentes relacionados
- Tem lógica de negócio específica

Não crie feature para:
- Componentes UI genéricos (use `@shared/ui`)
- Utilitários gerais (use `@shared/lib`)
- Single-use components (crie diretamente na rota)
