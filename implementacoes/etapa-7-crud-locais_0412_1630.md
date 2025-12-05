# Etapa 7: CRUD Locais/Igrejas

**Data:** 04/12/2025 16:30
**Feature:** Locais - Create, Read, Update, Delete

---

## O que foi feito

Implementação completa do CRUD de locais/igrejas com Firestore em tempo real.

---

## Estrutura criada

```
src/features/locations/
  ├── index.ts
  ├── types/
  │   └── location.types.ts      → Interfaces e mappers
  └── services/
      └── location.service.ts    → Wrapper Firestore CRUD
```

---

## Alterações

### `src/features/locations/types/location.types.ts` (Criado)

**Descrição:** Types para local/igreja

**Interfaces:**
- `Location` - Entidade completa
- `CreateLocationData` - Dados para criar
- `UpdateLocationData` - Dados para atualizar (parcial)
- `mapFirestoreLocation()` - Converte documento Firestore

**Estrutura Location:**
```typescript
{
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode?: string (opcional)
  createdAt: Date
  createdBy: string
}
```

### `src/features/locations/services/location.service.ts` (Criado)

**Descrição:** Service com operações Firestore

**Funções:**
1. **createLocation(data):**
   - Validações: nome, endereço, cidade, estado obrigatórios
   - CEP opcional
   - Verifica autenticação
   - Cria no Firestore com `serverTimestamp`

2. **listLocations():**
   - Lista todos locais ordenados por nome

3. **updateLocation(id, data):**
   - Atualiza campos específicos (parcial)
   - Validações

4. **deleteLocation(id):**
   - Remove local do Firestore

5. **onLocationsChange(callback):**
   - Listener em tempo real (snapshot)
   - Auto-atualiza lista
   - Cleanup automático

**Segurança:**
- Valida campos obrigatórios
- Verifica autenticação
- User ID registrado em createdBy

### `app/(admin)/locations.tsx` (Modificado)

**Descrição:** Tela completa de CRUD

**Funcionalidades:**
1. **Lista em tempo real:**
   - Listener Firestore (`onLocationsChange`)
   - Cards com ícone MapPin verde
   - Nome, endereço completo, cidade/estado/CEP
   - Botões editar/deletar

2. **Criar local:**
   - Botão "Novo" verde no header
   - Dialog/Modal com form
   - Campos: Nome, Endereço, Cidade, Estado (obrigatórios), CEP (opcional)
   - Estado limita 2 caracteres
   - CEP com teclado numérico
   - Toast de sucesso

3. **Editar local:**
   - Modal pré-preenchido
   - Salva alterações
   - Toast de sucesso

4. **Deletar local:**
   - Alert de confirmação
   - Toast de sucesso

5. **Estados:**
   - Loading: Spinner inicial
   - Empty state: Mensagem quando vazio
   - Submitting: Botão desabilitado durante save
   - Validação: Botão só ativo se todos campos obrigatórios preenchidos

**Design:**
- Cards elevados com ícone MapPin em fundo verde claro
- 3 linhas de info: nome (bold), endereço, cidade-estado-CEP
- Dialog com ScrollView (max 500px) para campos longos
- Botões verde ($green10)

### `app/(admin)/_layout.tsx` (Modificado)

**Habilitada tab Locais:**
- Removido `href: null`
- Tab agora visível no menu admin

### `src/features/locations/index.ts` (Criado)

**Exports:**
- Types
- Services

---

## Firestore Structure

```
locations/
  {locationId}/
    name: "Igreja Central"
    address: "Rua das Flores, 123, Centro"
    city: "São Paulo"
    state: "SP"
    zipCode: "01234-567" (opcional)
    createdAt: Timestamp
    createdBy: "userId"
```

---

## Validações

**Obrigatórios:**
- Nome do local
- Endereço completo
- Cidade
- Estado (max 2 caracteres)

**Opcionais:**
- CEP

---

## Segurança

✅ Validações de campos obrigatórios
✅ Verificação de autenticação em create
✅ User ID registrado (createdBy)
✅ Confirmação antes de deletar
✅ Tratamento de erros com toast

---

## Performance

✅ Listener em tempo real (auto-atualiza)
✅ Cleanup automático do listener
✅ ScrollView otimizado (dialog e lista)
✅ Validações client-side

---

## UX/UI

- ✅ Loading state
- ✅ Empty state
- ✅ Toast de feedback
- ✅ Dialog animado com ScrollView
- ✅ Confirmação de deleção
- ✅ Ícone MapPin em fundo verde
- ✅ Estado limita 2 chars
- ✅ CEP com teclado numérico
- ✅ Botão verde ($green10)

---

## Teste

1. Área Admin → Tab "Locais"
2. Clicar "Novo"
3. Preencher nome, endereço, cidade, estado
4. CEP opcional
5. Criar → Verificar toast e card aparece
6. Editar local → Alterar dados → Salvar
7. Deletar local → Confirmar → Verificar remoção
8. Verificar atualização em tempo real

---

## Próximos passos

1. **CRUD Eventos** (usa categorias + locais)
2. Contador de locais no dashboard
3. Validação: impedir deletar local em uso por evento
4. Integração com Google Maps (opcional)
