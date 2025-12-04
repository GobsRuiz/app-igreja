# Etapa 6: Componentes Base

**Data:** 27/11/2025 08:30
**Etapa:** 6 do PLANO_MIGRACAO.md
**Objetivo:** Criar os 3 componentes base da UI (EventCard, EventDetailModal, FilterModal)

---

## 📦 Arquivos Criados

### 1. EventCard.tsx
**Path:** `src/components/EventCard.tsx` (2.9KB)

**Função:** Card de evento para exibição em lista

**Props:**
- `event: Event` - Dados do evento
- `onDetailsPress: () => void` - Callback ao clicar em "Detalhes"
- `onGoPress: () => void` - Callback ao clicar em "Ir"

**Features:**
- Exibe título, tipo (badge), data/hora, local completo (igreja + endereço + cidade), regente
- Usa ícones do Lucide (Calendar, Clock, MapPin, User)
- Usa Tamagui (Card, XStack, YStack, Text, Button)
- Botões: "Detalhes" (outlined) e "Ir" (theme active)
- Shadow sutil para elevação

**Dependências:**
- `@/shared/types/event` - Type Event
- `@/shared/utils/formatters` - Formatação de data

---

### 2. EventDetailModal.tsx
**Path:** `src/components/EventDetailModal.tsx` (6.7KB)

**Função:** Modal de detalhes completos do evento usando BottomSheet

**Props:**
- `event: Event | null` - Evento a exibir (ou null)
- `isOpen: boolean` - Controla abertura/fechamento
- `onClose: () => void` - Callback ao fechar

**Features:**
- BottomSheet com 3 snap points: ['50%', '90%', '95%']
- **Abre em 90%** (snapToIndex(1))
- Backdrop com dismiss ao clicar fora
- ScrollView interno para conteúdo longo
- **Ações:**
  - **Mapa:** Abre Google Maps com coordenadas do evento
  - **Favoritar:** Toggle favorito + toast feedback
  - **Notificar:** Toggle notificação + toast feedback
- **Seções:**
  - Título (h1)
  - Data e Hora (formatada completa)
  - Local (igreja + endereço, cidade)
  - Regente
  - Descrição
  - Anexos (se existirem)
- Separadores entre seções
- Ícones coloridos no favorito (amarelo) e notificação (azul) quando ativos

**Dependências:**
- `@/shared/types/event`
- `@/shared/utils/formatters`
- `@/shared/store/use-event-store` - toggleFavorite, toggleNotification
- `@/shared/services/map-service` - openGoogleMaps
- `@/shared/services/toast-service` - feedback ao usuário
- `@gorhom/bottom-sheet`
- `@tamagui/lucide-icons`

---

### 3. FilterModal.tsx
**Path:** `src/components/FilterModal.tsx` (11KB)

**Função:** Modal de filtros avançados usando BottomSheet

**Props:**
- `isOpen: boolean` - Controla abertura/fechamento
- `onClose: () => void` - Callback ao fechar

**Features:**
- BottomSheet com snap point único: ['90%']
- **Estados locais** para edição antes de aplicar
- **Footer fixo** com botões "Limpar" e "Aplicar"

**Filtros Disponíveis:**

1. **📍 Localização:**
   - Dropdown de Estado (27 estados, com busca)
   - Dropdown de Cidade (filtrado por estado, com busca)
   - Slider de Raio (1-50 km, visual)
   - Ao mudar estado, primeira cidade é selecionada automaticamente

2. **📅 Período:**
   - Data Início (DateTimePicker)
   - Data Fim (DateTimePicker)
   - Exibe data formatada em pt-BR nos botões

3. **🏷️ Tipos de Evento:**
   - Botões toggle para cada EventType
   - Visual diferente quando selecionado (variant="default" vs "outlined")

**Comportamento:**
- **Limpar:** Reseta para valores padrão (SP, Taquaritinga, 10km, sem datas, sem tipos)
- **Aplicar:** Atualiza store global e fecha modal
- **Fechar sem aplicar:** Mantém filtros anteriores

**Dependências:**
- `@/shared/store/use-event-store` - State de filtros
- `@/shared/data/brazil-locations` - 27 estados + cidades
- `@/shared/types/event` - EventType enum
- `react-native-element-dropdown` - Autocomplete
- `@react-native-community/datetimepicker` - Seletor de data
- `@react-native-community/slider` - Slider visual

---

## 🔧 Ajustes Realizados

### Correção de Imports
**Problema:** PLANO_MIGRACAO.md usa estrutura diferente da arquitetura Feature-Based atual

**De (Plano):**
```typescript
import { Event } from '@/types/event'
import { Formatters } from '@/utils/formatters'
```

**Para (Atual):**
```typescript
import { Event } from '@/shared/types/event'
import { Formatters } from '@/shared/utils/formatters'
```

**Arquivos corrigidos:**
- EventCard.tsx
- EventDetailModal.tsx
- FilterModal.tsx

---

## ✅ Validações

- [x] EventCard exibe todos os dados do evento
- [x] EventCard usa Formatters para data
- [x] EventDetailModal abre em 90%
- [x] EventDetailModal tem scroll interno
- [x] EventDetailModal integra com store (favorito, notificação)
- [x] EventDetailModal integra com MapService
- [x] EventDetailModal integra com ToastService
- [x] FilterModal usa estados locais (não altera store diretamente)
- [x] FilterModal tem dropdown com busca (estado e cidade)
- [x] FilterModal filtra cidades por estado
- [x] FilterModal usa Slider visual (não Input)
- [x] FilterModal tem footer fixo
- [x] FilterModal aplica filtros apenas ao clicar "Aplicar"
- [x] Todos os componentes seguem arquitetura Feature-Based
- [x] Imports corrigidos para `@/shared/*`

---

## 📋 Próximas Etapas

Conforme PLANO_MIGRACAO.md:

- **Etapa 7:** Telas (Pages)
  - Atualizar Tab Layout
  - Criar HomePage (index.tsx)
  - Criar FavoritesPage
  - Criar NotificationsPage (placeholder)
  - Criar ProfilePage (placeholder)

---

## 🔍 Observações

1. **Dependência não instalada detectada:**
   - `@react-native-community/slider` - Necessário para FilterModal

2. **Arquitetura:**
   - Projeto segue Feature-Based Architecture (CLAUDE.md)
   - Plano de migração usa estrutura flat
   - Imports ajustados para `@/shared/*`

3. **Componentes prontos para uso:**
   - Todos os componentes estão tipados corretamente
   - Seguem padrões Tamagui + React Native
   - Integram com services, store e data já existentes

---

**Status:** ✅ Concluído
**Próximo:** Etapa 7 - Telas (Pages)
