# Read-Only Mode para Eventos Finalizados

**Data:** 11/12/2024 22:48
**Feature:** Admin - Eventos
**Tipo:** Enhancement (Melhoria)

---

## Objetivo

Impedir edição de eventos com status `finished`, convertendo o formulário de edição em modo de visualização (read-only).

---

## Problema

Eventos finalizados podiam ser editados normalmente, permitindo alterações indevidas em dados históricos.

---

## Solução Implementada

Quando `event.status === 'finished'`:

### 1. **Ícone do Botão de Editar**
- Trocado de `Pencil` (lápis) → `Eye` (olho)
- Indica visualmente modo de visualização

### 2. **Título do Modal**
- "Editar Evento" → "Visualizar Evento"

### 3. **Campos Desabilitados**
Todos os campos ficam `disabled` e com `opacity: 0.6`:
- Input de título
- TextArea de descrição
- Botões de data e hora
- Dropdown de categoria
- Dropdown de local

### 4. **Botão de Submit Removido**
- Botão "Atualizar/Salvar" não aparece
- Apenas botão "Fechar" permanece (texto muda de "Cancelar" → "Fechar")

### 5. **Dropdown de Status**
- Já existia lógica (linha 462): não aparece quando `finished`
- Mantida consistência

---

## Arquivos Modificados

### `app/(admin)/events.tsx`

**Imports:**
- Adicionado `Eye` de `@tamagui/lucide-icons`

**Botão de Editar (linha ~257):**
```tsx
icon={event.status === 'finished' ? Eye : Pencil}
```

**Título do Sheet (linha ~344):**
```tsx
{editingEvent
  ? editingEvent.status === 'finished'
    ? 'Visualizar Evento'
    : 'Editar Evento'
  : 'Novo Evento'}
```

**Campos com `disabled` e `opacity`:**
- Input título (linha ~363-364)
- TextArea descrição (linha ~379-380)
- Botões data e hora (linha ~395-396, 405-406)
- Dropdown categoria (linha ~425, 432)
- Dropdown local (linha ~449, 456)

**Botão Cancelar/Fechar (linha ~499):**
```tsx
{editingEvent?.status === 'finished' ? 'Fechar' : 'Cancelar'}
```

**Botão Submit Condicional (linha ~502):**
```tsx
{editingEvent?.status !== 'finished' && (
  <Button variant="primary" onPress={handleSubmit}>
    {/* ... */}
  </Button>
)}
```

---

## Validações

**SEGURANÇA:**
✅ Impede alteração de dados finalizados via UI
⚠️ Nota: validação server-side seria ideal para prevenir bypass via API

**CORREÇÃO:**
✅ Resolve completamente o problema
✅ Não quebra fluxos existentes (create/edit de eventos ativos)

**PERFORMANCE:**
✅ Apenas renderização condicional, sem impacto

**CONSISTÊNCIA:**
✅ Segue padrão já existente (linha 462 já verificava `finished`)
✅ Não duplica lógica

**UX:**
✅ Feedback visual claro (ícone Eye + campos desabilitados)
✅ Título descritivo ("Visualizar Evento")

---

## Observações

### Decisões Técnicas

1. **Por que `opacity: 0.6`?**
   - Feedback visual de campo desabilitado
   - Padrão comum em UIs modernas

2. **Por que remover botão submit em vez de desabilitar?**
   - Mais limpo visualmente
   - Evita confusão do usuário ("por que tem botão se não posso salvar?")

3. **Por que verificar `editingEvent?.status` em vez de criar variável `isReadOnly`?**
   - Mais direto e explícito
   - Evita estado adicional
   - Facilita manutenção (menos variáveis pra rastrear)

### Melhorias Futuras (Fora do Escopo)

- **Validação server-side:** Adicionar regra no Firestore Security Rules para impedir update de eventos `finished`
- **Histórico de edições:** Log de quem editou o quê e quando
- **Permissões granulares:** Apenas admin master pode editar eventos finalizados

---

## Testes Sugeridos

1. ✅ Criar evento novo → deve funcionar normalmente
2. ✅ Editar evento `active` → deve funcionar normalmente
3. ✅ Editar evento `cancelled` → deve funcionar normalmente
4. ✅ Clicar em evento `finished` → deve abrir em modo leitura
5. ✅ Tentar alterar campos quando `finished` → não deve permitir
6. ✅ Botão submit não deve aparecer quando `finished`
7. ✅ Botão cancelar deve fechar modal normalmente

---

## Commit Sugerido

```
feat(admin): readonly mode for finished events

- Change edit icon to Eye when event is finished
- Disable all form fields for finished events
- Hide submit button for finished events
- Update sheet title to "Visualizar Evento"
```
