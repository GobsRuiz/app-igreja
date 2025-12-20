import { ToastService } from './toast-service'

/**
 * Serviço centralizado para tratamento de erros
 * Integra com ToastService para feedback visual ao usuário
 *
 * @example
 * ```typescript
 * import { ErrorHandler } from '@shared/services'
 *
 * // Tratamento genérico
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   ErrorHandler.handle(error, 'Operação falhou')
 * }
 *
 * // Tratamento específico de rede
 * try {
 *   await fetchData()
 * } catch (error) {
 *   ErrorHandler.handleNetworkError(error)
 * }
 *
 * // Tratamento de validação
 * try {
 *   validateForm(data)
 * } catch (error) {
 *   ErrorHandler.handleValidationError(error)
 * }
 *
 * // Tratamento de erros de API
 * try {
 *   const response = await api.post('/events', data)
 * } catch (error) {
 *   ErrorHandler.handleApiError(error)
 * }
 * ```
 */
export class ErrorHandler {
  /**
   * Tratamento genérico de erros
   * Loga no console e exibe toast de erro
   *
   * @param error - Erro a ser tratado (unknown type)
   * @param context - Contexto do erro (opcional)
   */
  static handle(error: unknown, context?: string): void {
    // Parse mensagem amigável
    const message = this.parseErrorMessage(error)

    // Sanitiza mensagem (remove dados sensíveis)
    const sanitizedMessage = this.sanitizeMessage(message)

    // Exibe toast para o usuário
    ToastService.error(
      context || 'Erro',
      sanitizedMessage || 'Ocorreu um erro inesperado'
    )
  }

  /**
   * Tratamento específico para erros de rede
   * Identifica timeouts, falta de conexão, etc.
   *
   * @param error - Erro de rede
   */
  static handleNetworkError(error: unknown): void {
    let message = 'Erro de conexão'
    let description = 'Verifique sua internet e tente novamente'

    // Identifica tipo de erro de rede
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        description = 'A conexão está muito lenta'
      } else if (error.message.includes('Network request failed')) {
        description = 'Sem conexão com a internet'
      } else if (error.message.includes('ECONNREFUSED')) {
        description = 'Servidor indisponível'
      }
    }

    ToastService.error(message, description)
  }

  /**
   * Tratamento específico para erros de validação
   * Útil para formulários e inputs do usuário
   *
   * @param error - Erro de validação
   */
  static handleValidationError(error: unknown): void {
    const message = this.parseErrorMessage(error)
    const sanitizedMessage = this.sanitizeMessage(message)

    ToastService.warning(
      'Dados inválidos',
      sanitizedMessage || 'Verifique os campos e tente novamente'
    )
  }

  /**
   * Tratamento específico para erros de API
   * Parse de respostas HTTP com status codes
   *
   * @param error - Erro de API (axios, fetch, etc)
   */
  static handleApiError(error: unknown): void {
    let message = 'Erro no servidor'
    let description = 'Tente novamente em alguns instantes'

    // Parse de erro Axios
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any

      if (axiosError.response?.status) {
        switch (axiosError.response.status) {
          case 400:
            message = 'Requisição inválida'
            description = 'Verifique os dados enviados'
            break
          case 401:
            message = 'Não autorizado'
            description = 'Faça login novamente'
            break
          case 403:
            message = 'Acesso negado'
            description = 'Você não tem permissão para esta ação'
            break
          case 404:
            message = 'Não encontrado'
            description = 'O recurso solicitado não existe'
            break
          case 422:
            message = 'Dados inválidos'
            description = axiosError.response?.data?.message || 'Verifique os campos'
            break
          case 500:
          case 502:
          case 503:
            message = 'Erro no servidor'
            description = 'Tente novamente em alguns instantes'
            break
          default:
            message = 'Erro na API'
            description = axiosError.response?.data?.message || 'Erro desconhecido'
        }
      }
    }

    // Parse de erro Fetch
    if (error instanceof Response) {
      message = `Erro ${error.status}`
      description = error.statusText || 'Erro ao processar requisição'
    }

    ToastService.error(message, this.sanitizeMessage(description))
  }

  /**
   * Parse e sanitiza erros do Firebase/Firestore
   * Trata códigos comuns e retorna mensagem amigável
   * Usado principalmente em services para retornar string sanitizada
   *
   * @param error - Erro do Firebase/Firestore
   * @param fallback - Mensagem padrão se erro não for reconhecido
   * @returns Mensagem de erro sanitizada
   *
   * @example
   * ```typescript
   * catch (error: any) {
   *   const msg = ErrorHandler.parseFirebaseError(error, 'Erro ao criar categoria')
   *   return { category: null, error: msg }
   * }
   * ```
   */
  static parseFirebaseError(error: any, fallback: string): string {
    // Códigos Firestore comuns
    if (error?.code === 'permission-denied') {
      return 'Você não tem permissão para esta ação'
    }

    if (error?.code === 'not-found') {
      return 'Recurso não encontrado'
    }

    if (error?.code === 'unavailable') {
      return 'Servidor indisponível. Tente novamente'
    }

    if (error?.code === 'unauthenticated') {
      return 'Você precisa estar autenticado'
    }

    if (error?.code === 'already-exists') {
      return 'Este recurso já existe'
    }

    if (error?.code === 'deadline-exceeded') {
      return 'Tempo esgotado. Tente novamente'
    }

    if (error?.code === 'cancelled') {
      return 'Operação cancelada'
    }

    if (error?.code === 'resource-exhausted') {
      return 'Limite de recursos excedido. Tente novamente mais tarde'
    }

    if (error?.code === 'failed-precondition') {
      return 'Operação não permitida no estado atual'
    }

    if (error?.code === 'aborted') {
      return 'Operação abortada devido a conflito'
    }

    if (error?.code === 'out-of-range') {
      return 'Valor fora do intervalo permitido'
    }

    if (error?.code === 'unimplemented') {
      return 'Operação não implementada'
    }

    if (error?.code === 'internal') {
      return 'Erro interno do servidor'
    }

    if (error?.code === 'data-loss') {
      return 'Perda de dados detectada'
    }

    // Network errors
    if (error?.message?.includes('network')) {
      return 'Erro de conexão. Verifique sua internet'
    }

    // Parse mensagem do erro e sanitiza
    const message = this.parseErrorMessage(error)
    const sanitized = this.sanitizeMessage(message)

    // Se sanitização resultou em string vazia ou genérica, usa fallback
    if (!sanitized || sanitized === 'Ocorreu um erro inesperado') {
      return fallback
    }

    return sanitized
  }

  /**
   * Parse de mensagem de erro de diferentes tipos
   *
   * @param error - Erro a ser parseado
   * @returns Mensagem de erro legível
   */
  private static parseErrorMessage(error: unknown): string {
    // String simples
    if (typeof error === 'string') {
      return error
    }

    // Error object
    if (error instanceof Error) {
      return error.message
    }

    // Zod error (validação)
    if (error && typeof error === 'object' && 'errors' in error) {
      const zodError = error as any
      if (Array.isArray(zodError.errors) && zodError.errors.length > 0) {
        return zodError.errors[0].message || 'Erro de validação'
      }
    }

    // Axios error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      return axiosError.response?.data?.message || axiosError.message || 'Erro na API'
    }

    // Objeto genérico com message
    if (error && typeof error === 'object' && 'message' in error) {
      const errObj = error as any
      return errObj.message
    }

    // Fallback
    return 'Ocorreu um erro inesperado'
  }

  /**
   * Sanitiza mensagem de erro removendo dados sensíveis
   * Remove tokens, senhas, emails, etc.
   * Trunca mensagens muito longas para evitar problemas de performance
   *
   * @param message - Mensagem a ser sanitizada
   * @returns Mensagem sanitizada e truncada se necessário
   */
  static sanitizeMessage(message: string): string {
    // Trunca ENTRADA se muito longa (evita processar megabytes de texto)
    const maxInputLength = 5000
    const input = message.length > maxInputLength
      ? message.substring(0, maxInputLength)
      : message

    let sanitized = input

    // Remove tokens JWT
    sanitized = sanitized.replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, '[TOKEN]')

    // Remove senhas (password=..., senha=..., etc)
    sanitized = sanitized.replace(/(password|senha|pass|pwd)[\s=:]+[\w@#$%^&*()]+/gi, '[REDACTED]')

    // Remove emails
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')

    // Remove números de cartão de crédito
    sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')

    // Remove CPF/CNPJ
    sanitized = sanitized.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF]')
    sanitized = sanitized.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[CNPJ]')

    // Remove paths absolutos (C:\, /home/, etc)
    sanitized = sanitized.replace(/[A-Z]:\\[\w\\/.-]+/gi, '[PATH]')
    sanitized = sanitized.replace(/\/(?:home|usr|var)\/[\w/.-]+/g, '[PATH]')

    // Trunca SAÍDA se ainda muito longa (para toasts/logs)
    if (sanitized.length > 1000) {
      return sanitized.substring(0, 500) + '... [mensagem truncada]'
    }

    return sanitized
  }
}
