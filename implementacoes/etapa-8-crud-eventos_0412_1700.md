# Etapa 8: CRUD Eventos

**Data:** 04/12/2025 17:00
**Feature:** Eventos - Create, Read, Update, Delete (usando Categorias + Locais)

---

## O que foi feito

Implementação completa do CRUD de eventos com Firestore em tempo real, integrando categorias e locais.

---

## Estrutura criada

```
src/features/events/
  ├── index.ts
  ├── types/
  │   └── event.types.ts      → Interfaces e mappers
  └── services/
      └── event.service.ts    → Wrapper Firestore CRUD
```

---

## Alterações

### `src/features/events/types/event.types.ts` (Criado)

**Descrição:** Types para evento

**Interfaces:**
- `Event` - Entidade completa
- `EventWithDetails` - Event com categoria e local populados
- `CreateEventData` - Dados para criar
- `UpdateEventData` - Dados para atualizar (parcial)
- `mapFirestoreEvent()` - Converte documento Firestore

**Estrutura Event:**
```typescript
{
  id: string
  title: string
  description: string
  date: Date
  categoryId: string   // Referência à categoria
  locationId: string   // Referência ao local
  imageUrl?: string    // Opcional
  createdAt: Date
  createdBy: string
}
```

### `src/features/events/services/event.service.ts` (Criado)

**Descrição:** Service com operações Firestore

**Funções:**
1. **createEvent(data):**
   - Validações: título, descrição, data, categoria, local obrigatórios
   - Converte Date para Timestamp
   - Verifica autenticação
   - Cria no Firestore

2. **listEvents():**
   - Lista todos eventos ordenados por data (desc)

3. **updateEvent(id, data):**
   - Atualiza campos específicos
   - Validações

4. **deleteEvent(id):**
   - Remove evento do Firestore

5. **onEventsChange(callback):**
   - Listener em tempo real ordenado por data
   - Auto-atualiza lista
   - Cleanup automático

### `app/(admin)/events.tsx` (Modificado)

**Descrição:** Tela completa de CRUD de eventos

**Funcionalidades:**

1. **3 Listeners em tempo real:**
   - Eventos (`onEventsChange`)
   - Categorias (`onCategoriesChange`) - para dropdowns
   - Locais (`onLocationsChange`) - para dropdowns

2. **Validação de dependências:**
   - Alerta amarelo se não houver categorias ou locais
   - Botão "Novo" desabilitado se faltar categoria/local
   - Mensagem específica de qual dependência falta

3. **Lista de eventos:**
   - Cards com título e descrição
   - Data formatada (dd/MM/yyyy às HH:mm)
   - Badge colorido com nome da categoria (cor vem da categoria)
   - Nome do local com ícone MapPin
   - Botões editar/deletar

4. **Criar evento:**
   - Dialog/Modal com form
   - Campos:
     - Título (Input)
     - Descrição (TextArea)
     - Data (DateTimePicker - botão mostra formato BR)
     - Hora (DateTimePicker - botão mostra HH:mm)
     - Categoria (Dropdown com categorias cadastradas)
     - Local (Dropdown com locais cadastrados)
   - Toast de sucesso

5. **Editar evento:**
   - Modal pré-preenchido
   - Data/hora carregam corretamente
   - Dropdowns selecionam valores corretos
   - Toast de sucesso

6. **Deletar evento:**
   - Alert de confirmação
   - Toast de sucesso

7. **Date/Time Pickers:**
   - DateTimePicker nativo (@react-native-community/datetimepicker)
   - Modo date e mode time separados
   - Botões mostram valores formatados (date-fns com locale pt-BR)
   - Plataforma adaptativa (iOS spinner, Android default)

**Design:**
- Cards com título bold, descrição, ícones e badges
- Badge de categoria colorido (usa cor da categoria)
- Dropdowns com react-native-element-dropdown
- Dialog scrollável (maxHeight 600px)
- Botões roxo ($purple10)
- Validações visuais (botão disabled se campos vazios)

**Helpers:**
- `getCategoryName(id)` - Nome da categoria ou "N/A"
- `getCategoryColor(id)` - Cor da categoria ou $gray10
- `getLocationName(id)` - Nome do local ou "N/A"

### `app/(admin)/_layout.tsx` (Modificado)

**Habilitada tab Eventos:**
- Removido `href: null`
- Tab agora visível no menu admin

### `src/features/events/index.ts` (Criado)

**Exports:**
- Types
- Services

---

## Firestore Structure

```
events/
  {eventId}/
    title: "Culto de Domingo"
    description: "Culto de celebração..."
    date: Timestamp
    categoryId: "category123"
    locationId: "location456"
    imageUrl: "" (opcional)
    createdAt: Timestamp
    createdBy: "userId"
```

---

## Dependências

- `@react-native-community/datetimepicker` - Date/Time picker nativo
- `react-native-element-dropdown` - Dropdown para categoria/local
- `date-fns` + `date-fns/locale` - Formatação de datas em PT-BR

---

## Validações

**Obrigatórios:**
- Título
- Descrição
- Data/Hora
- Categoria (deve existir)
- Local (deve existir)

**Validação de dependências:**
- Não permite criar evento sem categorias cadastradas
- Não permite criar evento sem locais cadastrados
- Alerta visual quando faltam dependências

---

## Segurança

✅ Validações de campos obrigatórios
✅ Verificação de autenticação em create
✅ User ID registrado (createdBy)
✅ Confirmação antes de deletar
✅ Tratamento de erros com toast
✅ Validação de dependências (categoria/local existem)

---

## Performance

✅ 3 Listeners em tempo real (auto-atualizam)
✅ Cleanup automático dos listeners
✅ ScrollView otimizado (dialog e lista)
✅ Validações client-side

---

## UX/UI

- ✅ Loading state
- ✅ Empty state
- ✅ Alerta de dependências (amarelo)
- ✅ Toast de feedback
- ✅ Dialog animado com ScrollView
- ✅ Date/Time pickers nativos
- ✅ Dropdowns para categoria/local
- ✅ Badge colorido de categoria
- ✅ Data formatada em PT-BR
- ✅ Botão roxo ($purple10)
- ✅ Confirmação de deleção

---

## Teste

1. **Pré-requisito:** Cadastrar pelo menos 1 categoria e 1 local
2. Área Admin → Tab "Eventos"
3. Verificar alerta se não houver categorias/locais
4. Clicar "Novo"
5. Preencher título, descrição
6. Selecionar data (botão esquerdo) e hora (botão direito)
7. Selecionar categoria no dropdown
8. Selecionar local no dropdown
9. Criar → Verificar toast e card aparece
10. Verificar badge colorido da categoria
11. Verificar data/hora formatados corretamente
12. Editar evento → Alterar dados → Salvar
13. Deletar evento → Confirmar → Verificar remoção
14. Verificar atualização em tempo real

---

## Integração

**Eventos usam:**
- Categorias (categoryId) - para classificação e cor do badge
- Locais (locationId) - para informação de onde será o evento

**Dados relacionados:**
- Ao exibir evento, busca categoria para nome/cor
- Ao exibir evento, busca local para nome
- Listeners garantem dados sempre atualizados

---

## Próximos passos

1. Contador de eventos no dashboard
2. Validação: impedir deletar categoria/local em uso
3. Tela de usuário: visualizar eventos (app/(tabs)/index.tsx)
4. Filtros por categoria
5. Busca de eventos
6. Upload de imagem do evento
7. Notificações push para novos eventos
