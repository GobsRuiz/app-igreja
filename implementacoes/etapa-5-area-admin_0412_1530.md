# Etapa 5: Área Admin/Dashboard

**Data:** 04/12/2025 15:30
**Feature:** Área Admin - Estrutura inicial

---

## O que foi feito

Criação da área administrativa com navegação separada (tabs próprias) e botão de acesso no perfil.

---

## Estrutura criada

```
app/(admin)/
  ├── _layout.tsx          → Tabs do admin
  ├── dashboard.tsx        → Dashboard principal (ativo)
  ├── categories.tsx       → Placeholder (futuro)
  ├── locations.tsx        → Placeholder (futuro)
  └── events.tsx           → Placeholder (futuro)
```

---

## Alterações

### `app/(admin)/_layout.tsx` (Criado)

**Descrição:** Layout de tabs para área admin

**Funcionalidades:**
- 4 tabs: Dashboard, Categorias, Locais, Eventos
- Apenas Dashboard visível por enquanto (`href: null` nas outras)
- Ícones: LayoutDashboard, Tag, MapPin, CalendarDays

### `app/(admin)/dashboard.tsx` (Criado)

**Descrição:** Tela principal do dashboard

**Funcionalidades:**
1. **Header:** Logo + título + botão "Voltar"
2. **Botão "Voltar":** `router.replace('/(tabs)/events')` - retorna para área de usuário
3. **Cards de estatísticas:**
   - Categorias (0)
   - Locais (0)
   - Eventos Cadastrados (0)
4. **Design:** Cards coloridos (blue, green, purple) com Tamagui

### `app/(tabs)/profile.tsx` (Modificado)

**Adicionado:** Botão "Área Admin"

**Mudanças:**
- Importado `LayoutDashboard` do Lucide e `useRouter`
- Criado `handleGoToAdmin()` → `router.push('/(admin)/dashboard')`
- Botão azul ($blue10) com ícone Dashboard
- Posicionado entre Card de info e botão Logout

### `app/_layout.tsx` (Modificado)

**Adicionado:** Suporte à rota `(admin)`

**Mudanças:**
1. **RootNavigator - useEffect:**
   - Adicionado `inAdminGroup = segments[0] === '(admin)'`
   - Proteção: autenticado pode estar em `(tabs)` OU `(admin)`
   - Não autenticado sempre vai para `auth`

2. **Stack:**
   - Adicionado `<Stack.Screen name="(admin)" />`

### Placeholders criados:
- `app/(admin)/categories.tsx`
- `app/(admin)/locations.tsx`
- `app/(admin)/events.tsx`

---

## Navegação

**Usuário comum → Admin:**
1. Usuário autenticado na tela Profile
2. Clica no botão "Área Admin"
3. Navega para `/(admin)/dashboard`
4. Menu muda (tabs do admin)

**Admin → Usuário comum:**
1. No dashboard, clica "Voltar"
2. Navega para `/(tabs)/events`
3. Menu volta (tabs do usuário)

---

## Segurança

⚠️ **Sem verificação de role por enquanto**
- Qualquer usuário autenticado pode acessar área admin
- Implementação futura: campo `role` no Firestore
- Lógica sugerida: `if (user.role !== 'admin')` ocultar botão / bloquear rota

---

## Design

**Dashboard:**
- Header com ícone e botão "Voltar" (outlined)
- Card de boas-vindas
- Cards de estatísticas coloridos (0 por enquanto)
- Seguindo padrão Tamagui

**Profile:**
- Botão "Área Admin" azul preenchido ($blue10)
- Ícone LayoutDashboard
- Entre info do usuário e logout

---

## Próximos passos

1. **CRUD Categorias** (próxima etapa)
2. **CRUD Locais/Igrejas**
3. **CRUD Eventos**
4. Implementar verificação de role (admin)
5. Estatísticas reais no dashboard (contadores do Firestore)

---

## Teste

1. Fazer login
2. Ir para aba "Perfil"
3. Clicar no botão "Área Admin" (azul)
4. Verificar navegação para Dashboard
5. Verificar menu mudou (apenas Dashboard visível)
6. Clicar em "Voltar"
7. Verificar retorno para área de eventos
8. Verificar menu voltou (Eventos, Perfil)
