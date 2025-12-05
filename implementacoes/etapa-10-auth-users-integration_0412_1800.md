# Etapa 10: Integração Auth + Users

**Data:** 04/12/2025 18:00
**Feature:** Criação automática de documento em `users/` ao cadastrar

---

## O que foi feito

Integração entre Firebase Auth e collection `users/` do Firestore, criando documento automaticamente quando usuário se cadastra.

---

## Problema resolvido

**Antes:**
- Cadastro criava conta no Firebase Auth ✅
- Mas NÃO criava documento em `users/` ❌
- Admin não via usuário na listagem ❌

**Depois:**
- Cadastro cria conta no Firebase Auth ✅
- **Cria documento em `users/{uid}` automaticamente** ✅
- Admin vê usuário na listagem imediatamente ✅

---

## Alterações

### `src/features/auth/services/auth.service.ts` (Modificado)

**Adicionado:** Criação de documento em `users/` após cadastro

**Mudanças:**

1. **Import:**
   - Adicionado `firebaseFirestore` do `@core/config`

2. **Função `signUp()`:**
   - Após criar usuário no Firebase Auth
   - Cria documento em `users/{uid}` com:
     ```typescript
     {
       email: user.email,
       role: 'member',
       createdAt: serverTimestamp()
     }
     ```

**Código adicionado:**
```typescript
// Criar documento do usuário na collection users/
if (user) {
  await firebaseFirestore.collection('users').doc(user.uid).set({
    email: user.email,
    role: 'member', // Todos começam como membros
    createdAt: firebaseFirestore.FieldValue.serverTimestamp(),
  });
}
```

---

## Fluxo completo de cadastro

1. Usuário preenche formulário (email, senha, confirmação)
2. Validações client-side (email válido, senha >= 6 chars, senhas iguais)
3. `signUp()` chamado
4. **Firebase Auth:** Cria conta com `createUserWithEmailAndPassword()`
5. **Firestore:** Cria documento em `users/{uid}`
   - email: do Firebase Auth
   - role: 'member' (padrão)
   - createdAt: timestamp do servidor
6. `onAuthStateChanged` dispara → usuário autenticado
7. Redirect para área de usuário
8. **Admin pode ver usuário na listagem** ✅

---

## Estrutura Firestore

**Collection:** `users/`

**Documento criado no signup:**
```
users/
  {userId}/  # UID do Firebase Auth
    email: "user@example.com"
    role: "member"
    createdAt: Timestamp
```

**Campos opcionais (para futuro):**
- `displayName` - Nome do usuário
- `photoUrl` - URL da foto de perfil
- `phone` - Telefone

---

## Segurança

✅ UID do Firebase Auth usado como ID do documento (consistência)
✅ Role padrão: 'member' (seguro, não pode criar admin via cadastro)
✅ Email vem do Firebase Auth (validado)
✅ Timestamp do servidor (não manipulável pelo cliente)

⚠️ **Importante:** Admin só pode ser criado manualmente (edição de role no admin)

---

## Benefícios

1. **Consistência:** Auth e Users sincronizados
2. **Automático:** Não precisa criar usuário manualmente
3. **Listagem funciona:** Admin vê todos usuários cadastrados
4. **Single source of truth:** UID do Auth = ID do documento

---

## Teste

1. **Criar novo usuário:**
   - Abrir app → Tela de cadastro
   - Preencher email/senha
   - Cadastrar
   - ✅ Verificar login automático

2. **Verificar documento criado:**
   - Ir para área admin → Tab "Usuários"
   - ✅ Ver novo usuário na lista
   - ✅ Verificar role: "Membro"
   - ✅ Verificar email correto
   - ✅ Verificar data de cadastro

3. **Firestore Console:**
   - Abrir Firebase Console → Firestore
   - Collection `users/`
   - ✅ Documento com UID do usuário
   - ✅ Campos: email, role, createdAt

---

## Próximos passos

1. **CRUD de usuários na área admin:**
   - Editar role (member ↔ admin)
   - Editar displayName
   - Editar phone
   - Upload de photoUrl

2. **Edição de perfil pelo próprio usuário:**
   - Tela de perfil permite editar displayName, phone, foto

3. **Validação de role:**
   - Apenas admins podem acessar área admin
   - Verificação em `_layout.tsx` ou middleware

4. **Criação manual de admin:**
   - Botão "Criar Admin" na área admin
   - Form específico para criar usuário admin

---

## Observações

- Usuários criados ANTES dessa implementação **não terão** documento em `users/`
- Solução: Criar script de migração ou criar documento no primeiro login
- Por enquanto, apenas novos cadastros criarão documento automaticamente
