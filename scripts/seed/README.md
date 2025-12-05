# Firestore Seed Script

Script para popular o Firestore Database com estados e cidades brasileiras.

## 📋 O que faz

1. **Deleta** as collections antigas: `states` e `cities`
2. **Insere** dados novos:
   - **27 estados** brasileiros (26 estados + DF)
   - **141 cidades** (5 por estado, exceto SP com 11 cidades)

## 🚀 Como usar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar credenciais Firebase Admin

Escolha uma das opções:

**Opção A: gcloud CLI (recomendado para desenvolvimento local)**
```bash
gcloud auth application-default login
```

**Opção B: Service Account JSON**
1. Acesse Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Salve como `firebase-service-account.json` na raiz do projeto
4. ⚠️ Adicione ao `.gitignore`!

**Opção C: Variável de ambiente**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### 3. Rodar o script

```bash
npm run seed
```

## ⚠️ ATENÇÃO

**Este script vai DELETAR todos os dados existentes nas collections `states` e `cities`!**

Use apenas se tiver certeza que quer substituir os dados.

## 📊 Estrutura dos dados

### States

```typescript
{
  id: "AC",
  code: "AC",
  name: "Acre"
}
```

### Cities

```typescript
{
  id: "1100023",
  name: "Ariquemes",
  state: "RO",
  stateId: "RO"
}
```

## 📁 Arquivos

- `firestore-seed.ts` - Script principal
- `data/states.ts` - Dados dos 27 estados
- `data/cities.ts` - Dados das 135 cidades (5 por estado)
- `tsconfig.json` - Configuração TypeScript

## 🔧 Troubleshooting

### Erro: "Cannot find module 'firebase-admin'"

```bash
npm install
```

### Erro: "Credential implementation provided to initializeApp() is invalid"

Você precisa configurar as credenciais do Firebase Admin. Escolha uma opção:

1. **gcloud CLI:** `gcloud auth application-default login`
2. **Service Account:** Baixe o JSON do Firebase Console e salve como `firebase-service-account.json` na raiz
3. **Variável de ambiente:** `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"`

### Erro de permissões no Firestore

Verifique se a conta de serviço tem permissões de leitura/escrita no Firestore.
