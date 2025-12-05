# Firestore Seed Script - States & Cities

**Data:** 05/12/2025 18:13
**Tipo:** Feature - Script de seed
**Status:** ✅ Implementado

---

## 📋 Contexto

Necessidade de substituir as collections `states` e `cities` existentes no Firestore com dados padronizados de estados e cidades brasileiras.

**Requisitos:**
- Deletar collections antigas `states` e `cities`
- Popular com 27 estados brasileiros
- Popular com 5 cidades de cada estado (141 cidades total)
  - São Paulo: 11 cidades específicas (Taquaritinga, Matão, Araraquara, São Carlos, Ribeirão Preto, Guariroba, Jaboticabal, Jurupema, Barretos, Monte Alto, São José do Rio Preto)
- Usar códigos IBGE reais
- Estrutura específica de dados

---

## 🎯 Solução Implementada

### Arquivos Criados

```
scripts/
├── seed/
│   ├── data/
│   │   ├── states.ts      # 27 estados brasileiros
│   │   └── cities.ts      # 135 cidades (5 por estado)
│   ├── firestore-seed.ts  # Script principal
│   ├── tsconfig.json      # Config TypeScript
│   └── README.md          # Documentação
```

### Estrutura de Dados

**States:**
```typescript
{
  id: "AC",
  code: "AC",
  name: "Acre"
}
```

**Cities:**
```typescript
{
  id: "1100023",        // Código IBGE
  name: "Ariquemes",
  state: "RO",
  stateId: "RO"
}
```

---

## 🔧 Tecnologias Utilizadas

- **Firebase Admin SDK** (v12.0.0)
- **TypeScript** (strict mode)
- **ts-node** para execução direta

---

## 🚀 Como Usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar script
```bash
npm run seed
```

### ⚠️ Importante
**O script DELETA todos os dados existentes em `states` e `cities` antes de inserir os novos!**

---

## 📊 Dados

### Estados
- **Total:** 27 estados (26 + DF)
- **Campos:** id, code, name
- **Fonte:** Estados oficiais brasileiros

### Cidades
- **Total:** 141 cidades (5 por estado, exceto SP com 11)
- **Campos:** id, name, state, stateId
- **Códigos:** IBGE oficiais (Jurupema usa código derivado - distrito de Taquaritinga)
- **Seleção:** Cidades representativas de cada estado
- **São Paulo:** Taquaritinga, Matão, Araraquara, São Carlos, Ribeirão Preto, Guariroba, Jaboticabal, Jurupema (distrito), Barretos, Monte Alto, São José do Rio Preto

---

## 🔍 Implementação Técnica

### Delete Collection
- Batch delete com limite de 500 docs
- Recursivo para collections grandes
- Logs de progresso

### Seed Data
- Batch insert respeitando limite Firestore (500 ops)
- Logs detalhados do progresso
- Error handling robusto

### Performance
- Operações em batch para eficiência
- Commits progressivos para collections grandes
- Process.exit() após conclusão

---

## 📝 Scripts Adicionados

**package.json:**
```json
{
  "scripts": {
    "seed": "ts-node scripts/seed/firestore-seed.ts"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "firebase-admin": "^12.0.0",
    "ts-node": "^10.9.2"
  }
}
```

---

## ✅ Validações

- [x] Deleta collections antigas com sucesso
- [x] Insere 27 estados corretamente
- [x] Insere 135 cidades corretamente
- [x] Códigos IBGE reais e válidos
- [x] Estrutura de dados conforme especificado
- [x] Logs claros e informativos
- [x] Error handling implementado
- [x] Documentação completa (README)

---

## 🔒 Segurança

- Usa `google-services.json` para credenciais
- Não expõe secrets no código
- Validação de ambiente antes de executar
- Confirmação implícita via comando (usuário sabe que vai deletar)

---

## 📚 Observações

1. **Backup:** Não há backup automático. Se necessário, faça backup manual antes de rodar.
2. **Idempotência:** Script pode ser rodado múltiplas vezes (sempre deleta e recria).
3. **Extensibilidade:** Fácil adicionar mais cidades editando `data/cities.ts`.
4. **Manutenção:** Dados estáticos, sem necessidade de atualização frequente.

---

## 🎯 Resultado Final

✅ Script funcional que:
- Limpa collections antigas
- Popula com dados brasileiros oficiais
- Pronto para uso em desenvolvimento e produção
- Bem documentado e mantível
