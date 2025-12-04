import { toast } from 'sonner-native'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

/**
 * Serviço centralizado para exibição de toasts
 * Utiliza sonner-native (Reanimated 3) para performance otimizada
 *
 * @example
 * ```typescript
 * import { ToastService } from '@shared/services'
 *
 * // Toast simples
 * ToastService.success('Operação realizada!')
 *
 * // Com descrição
 * ToastService.error('Erro ao salvar', 'Verifique sua conexão')
 *
 * // Loading
 * const id = ToastService.loading('Salvando...')
 * // ... operação
 * ToastService.dismiss(id)
 *
 * // Promise
 * ToastService.promise(fetchData(), {
 *   loading: 'Carregando...',
 *   success: 'Sucesso!',
 *   error: 'Erro ao carregar'
 * })
 * ```
 */
export class ToastService {
  /**
   * Exibe um toast genérico
   * @param type - Tipo do toast
   * @param message - Mensagem principal
   * @param description - Descrição opcional
   */
  static show(type: ToastType, message: string, description?: string) {
    switch (type) {
      case 'success':
        toast.success(message, { description })
        break
      case 'error':
        toast.error(message, { description })
        break
      case 'info':
        toast(message, { description })
        break
      case 'warning':
        toast.warning(message, { description })
        break
    }
  }

  /**
   * Exibe um toast de sucesso
   * @param message - Mensagem principal
   * @param description - Descrição opcional
   */
  static success(message: string, description?: string) {
    toast.success(message, { description })
  }

  /**
   * Exibe um toast de erro
   * @param message - Mensagem principal
   * @param description - Descrição opcional
   */
  static error(message: string, description?: string) {
    toast.error(message, { description })
  }

  /**
   * Exibe um toast informativo
   * @param message - Mensagem principal
   * @param description - Descrição opcional
   */
  static info(message: string, description?: string) {
    toast(message, { description })
  }

  /**
   * Exibe um toast de aviso
   * @param message - Mensagem principal
   * @param description - Descrição opcional
   */
  static warning(message: string, description?: string) {
    toast.warning(message, { description })
  }

  /**
   * Exibe um toast de carregamento
   * @param message - Mensagem principal
   * @param description - Descrição opcional
   * @returns ID do toast para controle manual
   */
  static loading(message: string, description?: string) {
    return toast.loading(message, { description })
  }

  /**
   * Remove um toast específico ou todos
   * @param toastId - ID do toast a ser removido (opcional)
   */
  static dismiss(toastId?: string | number) {
    toast.dismiss(toastId)
  }

  /**
   * Exibe um toast baseado em uma Promise
   * Automaticamente mostra loading → success/error baseado no resultado
   *
   * @param promise - Promise a ser executada
   * @param messages - Mensagens para cada estado (loading, success, error)
   * @returns Promise original
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) {
    return toast.promise(promise, messages)
  }
}
