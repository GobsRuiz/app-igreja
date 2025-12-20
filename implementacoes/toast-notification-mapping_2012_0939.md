# Mapeamento: Sistema de Notificações/Toast

**Data:** 20/12/2024 09:39
**Tipo:** Mapeamento Técnico
**Objetivo:** Documentar implementação atual do sistema de toasts para criar componente customizado

---

## 📦 Stack Atual

### Biblioteca: `sonner-native` (v0.21.1)

**Escolha técnica:**
- Performance otimizada (usa Reanimated 3 - thread nativa)
- API moderna e limpa
- Animações fluidas 60 FPS
- TypeScript nativo
- Bundle size menor que alternativas

**Dependências relacionadas:**
- `react-native-reanimated` (v4.1.1)
- `react-native-gesture-handler` (v2.28.0)
- `react-native-safe-area-context` (v5.6.0)
- `react-native-svg` (v15.12.1)

---

## 🏗️ Arquitetura Atual

### 1. Configuração Global

**Arquivo:** [app/_layout.tsx](../app/_layout.tsx)

```typescript
import { Toaster } from 'sonner-native'

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <PortalProvider shouldAddRootHost>
              <BottomSheetModalProvider>
                <RootNavigator />
                <StatusBar style="auto" />
                <Toaster visibleToasts={1} style={{ zIndex: 10000 }} />
                {/* ↑ Configuração atual */}
              </BottomSheetModalProvider>
            </PortalProvider>
          </TamaguiProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AuthProvider>
  )
}
```

**Props importantes:**
- `visibleToasts={1}` - Mostra apenas 1 toast por vez (evita poluição visual)
- `style={{ zIndex: 10000 }}` - **CRÍTICO**: Sobrepõe tudo, incluindo modais (conforme requisito)

**Hierarquia de renderização:**
```
RootLayout
  └─ AuthProvider
      └─ SafeAreaProvider
          └─ GestureHandlerRootView
              └─ TamaguiProvider
                  └─ PortalProvider
                      └─ BottomSheetModalProvider
                          ├─ RootNavigator (conteúdo)
                          ├─ StatusBar
                          └─ Toaster ← renderiza no topo de TUDO
```

---

### 2. Serviço de Abstração (Opcional)

**Arquivo:** [src/shared/services/toast-service.ts](../src/shared/services/toast-service.ts)

Classe estática que encapsula a API do sonner-native:

```typescript
export class ToastService {
  static success(message: string, description?: string)
  static error(message: string, description?: string)
  static info(message: string, description?: string)
  static warning(message: string, description?: string)
  static loading(message: string, description?: string)
  static dismiss(toastId?: string | number)
  static promise<T>(promise, messages)
  static show(type, message, description?)
}
```

**Observação:** O projeto usa AMBAS as formas:
- Importação direta: `import { toast } from 'sonner-native'` (mais comum)
- Serviço: `import { ToastService } from '@shared/services'` (pouquíssimo usado)

---

## 🎨 Comportamento Visual

### Posicionamento
- **Topo da tela** (padrão do sonner-native)
- **Centralizado horizontalmente**
- **Sobrepõe tudo** (z-index: 10000) - incluindo:
  - Modais (BottomSheet)
  - Navegação
  - StatusBar
  - Qualquer conteúdo

### Animações
- **Entrada:** Slide from top + fade in
- **Saída:** Slide to top + fade out
- **Performance:** 60 FPS (thread nativa via Reanimated)

### Limite de exibição
- **visibleToasts={1}** - Apenas 1 toast visível por vez
- Toasts novos empurram os antigos para fora

---

## 📝 Padrões de Uso no Projeto

### Uso Direto (Padrão mais comum)

```typescript
import { toast } from 'sonner-native'

// Simples
toast.success('Login realizado!')
toast.error('Erro ao carregar categorias')

// Com descrição
toast.error('Acesso negado', {
  description: 'Você não tem permissão para acessar a área administrativa.'
})

toast.warning('Aguarde...', {
  description: 'Processando sua solicitação'
})
```

### Exemplos Reais do Projeto

**1. Auth (sucesso/erro simples):**
```typescript
// app/auth.tsx:51
toast.success('Login realizado!')

// app/auth.tsx:46
toast.error(error) // erro dinâmico
```

**2. Proteção de rotas (com descrição):**
```typescript
// app/_layout.tsx:41-43
toast.error('Acesso negado', {
  description: 'Você não tem permissão para acessar a área administrativa.',
})
```

**3. CRUD Admin (feedback de ações):**
```typescript
// app/(admin)/categories.tsx
toast.success('Categoria criada!')
toast.success('Categoria atualizada!')
toast.success('Categoria deletada!')
toast.error('Erro ao carregar categorias')
```

**4. Validação (warning):**
```typescript
// src/components/AddFavoriteCityModal.tsx:25
toast.warning('Selecione um estado e uma cidade')

// src/components/AddFavoriteCityModal.tsx:30
toast.info('Essa cidade já está nos favoritos')
```

**5. Ações em progresso:**
```typescript
// app/(admin)/events.tsx:126
toast.warning('Aguarde...', {
  description: 'Processando...'
})
```

---

## 🎯 Tipos de Toast Utilizados

### 1. **Success** (verde)
- Ação concluída com sucesso
- Exemplos: "Login realizado!", "Evento criado!", "Salvo com sucesso"

### 2. **Error** (vermelho)
- Erro ao executar ação
- Exemplos: "Erro ao carregar", "Falha na operação"
- Aceita `description` para detalhes técnicos

### 3. **Warning** (amarelo/laranja)
- Avisos/alertas não críticos
- Exemplos: "Aguarde...", "Processando..."

### 4. **Info** (azul)
- Informações neutras
- Exemplos: "Essa cidade já está nos favoritos"

### 5. **Loading** (com spinner)
- **Não usado atualmente no projeto**
- API disponível: `toast.loading('Carregando...')`

---

## 🔧 API Completa do Sonner-Native

```typescript
// Básicos
toast(message: string, options?: ToastOptions)
toast.success(message: string, options?: ToastOptions)
toast.error(message: string, options?: ToastOptions)
toast.warning(message: string, options?: ToastOptions)
toast.info(message: string, options?: ToastOptions)
toast.loading(message: string, options?: ToastOptions)

// Controle
toast.dismiss(toastId?: string | number) // Remove toast específico ou todos

// Promise (auto loading → success/error)
toast.promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
)
```

### ToastOptions Interface

```typescript
interface ToastOptions {
  description?: string        // Texto secundário
  duration?: number          // Duração em ms (padrão: 4000)
  action?: {                 // Botão de ação
    label: string
    onClick: () => void
  }
  onDismiss?: () => void    // Callback ao fechar
  onAutoClose?: () => void  // Callback ao fechar automaticamente
  icon?: React.ReactNode    // Ícone customizado
  unstyled?: boolean        // Remove estilos padrão
}
```

---

## 📊 Análise de Uso no Projeto

### Distribuição de Tipos

```
SUCCESS:  ~40% dos usos (feedback positivo de ações)
ERROR:    ~45% dos usos (tratamento de erros)
WARNING:  ~10% dos usos (avisos, processamento)
INFO:     ~5% dos usos (informações neutras)
LOADING:  0% (não usado)
```

### Padrões Identificados

1. **Mensagens curtas e diretas** (1-4 palavras)
   - ✅ "Login realizado!"
   - ✅ "Categoria criada!"
   - ❌ Textos longos raramente usados

2. **Descrição para contexto adicional**
   - Usado em ~15% dos toasts
   - Principalmente em erros e avisos

3. **Duração padrão** (4 segundos)
   - Nenhum uso de `duration` customizado
   - Padrão funciona bem para todas as situações

---

## 🎨 Referências Visuais (Seus Prints)

### Print 1: Success Toast
```
┌────────────────────────────────────┐
│  ✓  Login realizado!               │
└────────────────────────────────────┘
```
- Fundo verde claro
- Ícone de check (✓)
- Texto em verde escuro
- Animação suave de entrada/saída

### Print 2: Info/Success Toast sobre Modal
```
┌────────────────────────────────────┐
│  ✓  Removido dos favoritos         │
└────────────────────────────────────┘
        ↓ (sobrepõe)
┌────────────────────────────────────┐
│  ─────  (modal handle)             │
│                                    │
│  Batismo                           │
│  Adasd asdsa                       │
```
- Toast SOBRE o modal (z-index: 10000)
- Modal continua visível embaixo
- Não bloqueia interação com modal

---

## 🚀 Requisitos para Componente Customizado

Com base no mapeamento, o componente customizado deve:

### Funcionalidades
1. ✅ Manter API familiar (`toast.success()`, `toast.error()`, etc.)
2. ✅ Suportar `description` opcional
3. ✅ Sobrepor TUDO (z-index alto)
4. ✅ Limitar a 1 toast visível por vez
5. ✅ Animações fluidas (Reanimated)
6. ✅ Feedback visual claro por tipo (cores, ícones)

### Visual
- Design consistente com Tamagui (tema do projeto)
- Cores para cada tipo (success, error, warning, info)
- Ícones apropriados para cada tipo
- Suporte a modo claro/escuro (se houver)

### Performance
- Usar Reanimated 3 (já no projeto)
- Thread nativa para animações
- Não travar UI em qualquer cenário

### Compatibilidade
- Manter compatibilidade com código existente
- Fácil migração (mesma API ou similar)
- TypeScript strict mode

---

## 📁 Estrutura Proposta para Componente

```
src/shared/ui/
  ├── toast/
  │   ── toast-container.tsx    # Componente que renderiza toasts
  │   ── toast-item.tsx          # Componente de toast individual
  │   ── toast-service.ts        # API imperativa (toast.success, etc)
  │   ── toast-types.ts          # Types e interfaces
  │   └── index.ts               # Exports
  └── index.ts                   # Re-export
```

---

## 🔗 Referências Técnicas

- [Sonner Native Docs](https://gunnartorfis.github.io/sonner-native/)
- [Tamagui Toast](https://tamagui.dev/ui/toast) - Componente nativo do Tamagui
- [Reanimated 3](https://docs.swmansion.com/react-native-reanimated/)

---

## ✅ Checklist de Compatibilidade

Ao criar componente customizado, garantir:

- [ ] Mesma API do sonner-native (ou compatível)
- [ ] z-index alto (sobrepõe modais)
- [ ] visibleToasts configurável (padrão: 1)
- [ ] Animações performáticas (Reanimated)
- [ ] Suporte a todos os tipos (success, error, warning, info, loading)
- [ ] Opção de `description`
- [ ] Duração configurável (padrão: 4s)
- [ ] TypeScript strict
- [ ] Tema Tamagui

---

**Status:** ✅ Mapeamento completo
**Próximo passo:** Criar componente customizado baseado neste mapeamento
