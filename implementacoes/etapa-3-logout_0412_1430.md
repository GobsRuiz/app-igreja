# Etapa 3: Logout

**Data:** 04/12/2025 14:30
**Feature:** Autenticação - Logout

---

## O que foi feito

Implementação da funcionalidade de logout na página de perfil do usuário + correção de proteção de rotas global.

---

## Alterações

### `app/(tabs)/profile.tsx`

**Modificado:** Interface de usuário para exibir informações e permitir logout

**Mudanças:**
1. **Imports adicionados:**
   - `useAuth` do `@features/auth`
   - `toast` do `sonner-native`
   - Componentes Tamagui: `Card`, `XStack`, `Button`, `Separator`
   - Ícones Lucide: `LogOut`, `Mail`

2. **Estado e hooks:**
   - Consumo de `user`, `signOut` e `loading` via `useAuth()`

3. **UI implementada:**
   - **Card de Informações:** Exibe ícone de usuário e email
   - **Botão de Logout:** Vermelho outlined (`$red10`), com ícone LogOut
   - Estados visuais: loading, disabled, opacity

4. **Função `handleLogout`:**
   - Chama `signOut()` do context
   - Exibe toast de erro se houver falha
   - Exibe toast de sucesso ao sair
   - Redirect automático gerenciado por `_layout.tsx`

### `app/_layout.tsx`

**Modificado:** Proteção de rotas movida para root layout (sempre montado)

**Mudanças:**
1. **Novo componente `RootNavigator`:**
   - Consome `useAuth()` para monitorar estado de autenticação
   - `useEffect` que monitora `user`, `loading`, `segments`
   - Redireciona globalmente baseado em autenticação

2. **Lógica de redirect:**
   - Se `user` existe → garante que está em `(tabs)`
   - Se `user` é `null` → garante que está em `auth`
   - Funciona em QUALQUER tela (não só no index)

3. **Correção de bug:**
   - Antes: redirect só funcionava quando estava no `index.tsx`
   - Agora: redirect global, funciona de qualquer tela (profile, events, etc.)

### `app/index.tsx`

**Simplificado:** Removida lógica duplicada de redirect

**Mudanças:**
- Removido `useEffect` de redirect (agora gerenciado por `_layout.tsx`)
- Apenas tela de loading inicial
- Comentário documentando que redirect é gerenciado por `_layout.tsx`

---

## Segurança

✅ Logout usa Firebase signOut (nativo)
✅ Estado de autenticação gerenciado pelo `onAuthStateChanged`
✅ Redirect automático ao deslogar (via `index.tsx`)
✅ Botão desabilitado durante loading para evitar múltiplos cliques

---

## UX/UI

- Design consistente com Tamagui (Card elevado, bordered)
- Botão vermelho para ação destrutiva (logout)
- Feedback visual: toast de sucesso
- Estado de loading: "Saindo..." com opacidade reduzida
- Exibe email do usuário autenticado

---

## Fluxo

1. Usuário clica em "Sair"
2. Botão desabilita e mostra "Saindo..."
3. `signOut()` é chamado → Firebase Auth desautentica
4. `onAuthStateChanged` dispara com `user = null`
5. Toast de sucesso exibido
6. `_layout.tsx` detecta `user = null` → redireciona para `/auth` (global)

---

## Bug corrigido

**Problema:** Logout desautenticava mas não redirecionava para `/auth`

**Causa:** Lógica de redirect estava em `index.tsx`, que só é montado quando você está na rota `/`. Quando o usuário estava em `(tabs)/profile` e fazia logout, o `index.tsx` não estava montado, então o `useEffect` não disparava.

**Solução:** Mover lógica de proteção de rotas para `_layout.tsx` dentro de um componente `RootNavigator` que:
- Está SEMPRE montado (independente da rota)
- Monitora mudanças de autenticação globalmente
- Redireciona de qualquer tela

---

## Teste

1. Fazer login com usuário válido
2. Navegar para aba "Perfil"
3. Verificar se email está exibido
4. Clicar em "Sair"
5. Verificar toast de sucesso
6. ✅ Verificar redirect IMEDIATO para tela de auth (bug corrigido)
