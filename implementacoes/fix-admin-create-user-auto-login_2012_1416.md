# Fix: Admin Auto-Login ao Criar Usuário

**Data:** 20/12/2025 14:16
**Tipo:** Bug Fix (Segurança)
**Prioridade:** CRÍTICA

---

## PROBLEMA IDENTIFICADO

### Comportamento Incorreto
Quando admin criava um novo usuário na área administrativa ([app/(admin)/users.tsx](../../app/(admin)/users.tsx)), o sistema **automaticamente deslogava o admin e logava na conta recém-criada**.

### Causa Raiz
O método `createUserWithEmailAndPassword()` do Firebase Auth tem comportamento padrão de **autenticar automaticamente** com a conta criada.

**Código problemático ([user.service.ts:52-55](../../src/features/users/services/user.service.ts)):**
```typescript
// Criar no Firebase Auth
const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
  data.email.trim(),
  data.password
)
// ❌ Isso altera a sessão global do Firebase Auth
```

### Fluxo Incorreto
```
Admin logado → Cria novo usuário → createUserWithEmailAndPassword()
                                    ↓
                    Firebase Auth automaticamente loga na nova conta
                                    ↓
                    onAuthStateChanged dispara (detecta mudança)
                                    ↓
                    AuthProvider atualiza state.user
                                    ↓
                    Admin é deslogado ❌
```

### Impacto
- **SEGURANÇA:** Admin perde sessão ao criar usuário
- **UX:** Usuário precisa fazer login novamente
- **FUNCIONALIDADE:** Fluxo de criação de usuários quebrado

---

## SOLUÇÃO IMPLEMENTADA

### Abordagem: Firebase Admin SDK via Cloud Functions ✅

**Documentação oficial:** [Manage Users - Firebase Admin SDK](https://firebase.google.com/docs/auth/admin/manage-users)

> "The admin user management API gives you the ability to programmatically retrieve, create, update, and delete users **without requiring a user's existing credentials** and without worrying about client-side rate limiting."

### Por que Cloud Functions?
1. ✅ **Não afeta sessão atual** - Admin continua logado
2. ✅ **Segurança** - Criação server-side com validações
3. ✅ **Sem rate limiting** - API administrativa
4. ✅ **Solução oficial** - Padrão recomendado pelo Firebase
5. ✅ **Escalável** - Estrutura pronta para outras operações admin

---

## ARQUIVOS ALTERADOS

### 1. **`functions/src/index.ts`** (Cloud Function - Nova)

**Adicionado:** Cloud Function `createUser`

**Funcionalidade:**
- Valida autenticação e permissões (admin/superadmin)
- Valida dados (email, senha, nome)
- Cria usuário no Firebase Auth usando `admin.auth().createUser()` (NÃO afeta sessão)
- Cria documento no Firestore
- Define custom claim inicial

**Código:**
```typescript
export const createUser = functions
  .region('southamerica-east1')
  .https
  .onCall(async (data, context) => {
    // 1. Validar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    // 2. Validar permissões (admin/superadmin)
    const userRole = context.auth.token.role
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      throw new functions.https.HttpsError('permission-denied', 'Apenas administradores')
    }

    // 3. Validações de dados (email, senha, nome)
    // ...

    // 4. Criar usuário com Admin SDK (NÃO afeta sessão do client)
    const userRecord = await admin.auth().createUser({
      email: email.trim(),
      password: password,
      displayName: displayName.trim(),
      emailVerified: false,
    })

    // 5. Criar documento no Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email.trim(),
      displayName: displayName.trim(),
      role: userRoleToSet,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // 6. Definir custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: userRoleToSet })

    return { success: true, uid: userRecord.uid }
  })
```

**Validações:**
- ✅ Usuário autenticado
- ✅ Permissão admin/superadmin
- ✅ Email válido (regex)
- ✅ Senha >= 6 caracteres
- ✅ Nome obrigatório
- ✅ Role válido (user/admin/superadmin)

**Tratamento de erros:**
- `already-exists` - Email já cadastrado
- `invalid-argument` - Dados inválidos
- `permission-denied` - Sem permissão
- `unauthenticated` - Não autenticado

---

### 2. **`src/features/users/services/user.service.ts`** (Modificado)

**Antes:**
```typescript
// ❌ Usava createUserWithEmailAndPassword (afetava sessão)
const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
  data.email.trim(),
  data.password
)
```

**Depois:**
```typescript
// ✅ Chama Cloud Function (NÃO afeta sessão)
const createUserFunction = firebaseFunctions.httpsCallable('createUser')

const result = await createUserFunction({
  email: data.email.trim(),
  password: data.password,
  displayName: data.displayName.trim(),
  role: data.role || 'user',
})

const userId = result.data.uid
```

**Mudanças:**
1. **Import:** Trocado `firebaseAuth` por `firebaseFunctions`
2. **Chamada:** Cloud Function ao invés de Auth direto
3. **Tratamento de erros:** Códigos da Cloud Function
4. **Comentário:** Documentado que usa Cloud Function

---

## FLUXO CORRIGIDO

```
Admin logado → Preenche formulário → createUser() (client)
                                       ↓
                        Chama Cloud Function (server)
                                       ↓
                        admin.auth().createUser() (NÃO afeta sessão)
                                       ↓
                        Cria documento no Firestore
                                       ↓
                        Define custom claim
                                       ↓
                        Retorna { uid }
                                       ↓
                        Client busca documento criado
                                       ↓
                        Admin CONTINUA LOGADO ✅
                                       ↓
                        Usuário criado com sucesso ✅
```

---

## DEPLOY

**Build:**
```bash
cd functions && npm run build
```
✅ Compilado sem erros

**Deploy:**
```bash
cd functions && npm run deploy
```
✅ Deploy concluído com sucesso

**Cloud Function criada:**
- Nome: `createUser`
- Região: `southamerica-east1`
- Runtime: Node.js 22
- Tipo: HTTP Callable

---

## SEGURANÇA

### Validações Client-Side (Defense in Depth)
```typescript
// user.service.ts
if (!isValidEmail(data.email)) {
  return { user: null, error: 'E-mail inválido' }
}

if (!isValidPassword(data.password)) {
  return { user: null, error: 'A senha deve ter no mínimo 6 caracteres' }
}
```

### Validações Server-Side (Cloud Function)
```typescript
// Cloud Function
if (!emailRegex.test(email.trim())) {
  throw new functions.https.HttpsError('invalid-argument', 'E-mail inválido')
}

if (password.length < 6) {
  throw new functions.https.HttpsError('invalid-argument', 'Senha >= 6 caracteres')
}
```

### Controle de Acesso
```typescript
// Apenas admin/superadmin podem chamar a function
if (userRole !== 'admin' && userRole !== 'superadmin') {
  throw new functions.https.HttpsError('permission-denied', 'Apenas administradores')
}
```

**Firebase Security Rules:** Firestore rules já validam que apenas admins podem escrever em `users/`

---

## TESTES

### Teste 1: Criar usuário como admin
1. ✅ Admin loga
2. ✅ Acessa /admin/users
3. ✅ Clica em "Novo"
4. ✅ Preenche dados
5. ✅ Clica em "Criar"
6. ✅ Usuário criado com sucesso
7. ✅ **Admin continua logado** (FIX PRINCIPAL)
8. ✅ Novo usuário aparece na lista

### Teste 2: Validações
1. ✅ Email inválido → Erro "E-mail inválido"
2. ✅ Senha < 6 chars → Erro "A senha deve ter no mínimo 6 caracteres"
3. ✅ Email duplicado → Erro "Este e-mail já está cadastrado"
4. ✅ Campos vazios → Erros apropriados

### Teste 3: Permissões
1. ✅ Usuário não-admin → Não acessa /admin
2. ✅ Usuário não autenticado → Redirect para /auth

---

## BENEFÍCIOS

1. **✅ Bug Crítico Resolvido:** Admin não é mais deslogado
2. **✅ Segurança:** Criação server-side com validações duplas
3. **✅ Escalabilidade:** Estrutura pronta para outras operações admin
4. **✅ Padrão Oficial:** Solução recomendada pelo Firebase
5. **✅ Performance:** Sem rate limiting (API administrativa)
6. **✅ Manutenibilidade:** Lógica centralizada no backend

---

## DOCUMENTAÇÃO OFICIAL CONSULTADA

### Firebase Admin SDK
- [Manage Users | Firebase Authentication](https://firebase.google.com/docs/auth/admin/manage-users)
- [Introduction to the Admin Auth API](https://firebase.google.com/docs/auth/admin)

### React Native Firebase
- [Cloud Functions | React Native Firebase](https://rnfirebase.io/functions/usage)
- [HttpsCallable Reference](https://rnfirebase.io/reference/functions/httpscallable)

### Firebase Authentication
- [Authentication | React Native Firebase](https://rnfirebase.io/auth/usage)
- [Call functions from your app | Cloud Functions](https://firebase.google.com/docs/functions/callable)

---

## OBSERVAÇÕES

### Por que não usar instância secundária de Auth?
❌ React Native Firebase usa módulos nativos - não suporta múltiplas instâncias facilmente
❌ Solução hacky e não recomendada
❌ Pode ter comportamentos inesperados

### Por que Cloud Functions é melhor?
✅ Solução oficial do Firebase
✅ Server-side = mais seguro
✅ Sem afetar estado do client
✅ Estrutura já existente no projeto
✅ Escalável para futuras operações admin

---

## PRÓXIMOS PASSOS (Opcional)

1. **Email de verificação:** Enviar email ao usuário criado
2. **Logs de auditoria:** Registrar quem criou qual usuário
3. **Edição de senha:** Cloud Function para admin resetar senha
4. **Bulk operations:** Criar múltiplos usuários de uma vez

---

## CHECKLIST DE SEGURANÇA ✅

- ✅ Validações client-side
- ✅ Validações server-side
- ✅ Controle de acesso (admin only)
- ✅ Email regex validation
- ✅ Password length validation
- ✅ Firestore Security Rules
- ✅ Custom claims definidos
- ✅ Tratamento de erros completo
- ✅ Logs de operação (Cloud Function)
- ✅ Sessão do admin preservada

---

**Status:** ✅ IMPLEMENTADO E DEPLOYADO
**Prioridade:** CRÍTICA (Segurança)
**Resultado:** Admin continua logado ao criar usuários ✅
