import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Utilitários para formatação de datas e horas
 * Utiliza date-fns com locale pt-BR
 *
 * @example
 * ```typescript
 * import { Formatters } from '@shared/utils'
 *
 * // Data curta
 * Formatters.formatDate('2025-12-01') // "01/12/2025"
 *
 * // Data completa
 * Formatters.formatDateFull('2025-12-01') // "01 de Dezembro de 2025"
 *
 * // Data + hora
 * Formatters.formatDateTimeShort('2025-12-01', '19:00') // "Qui, 01/12 às 19:00"
 * ```
 */
export class Formatters {
  /**
   * Formata data ISO para formato brasileiro curto (DD/MM/YYYY)
   *
   * @param dateString - Data no formato ISO (YYYY-MM-DD)
   * @returns Data formatada (DD/MM/YYYY) ou string original se inválida
   *
   * @example
   * ```typescript
   * Formatters.formatDate('2025-12-01') // "01/12/2025"
   * Formatters.formatDate('invalid')    // "invalid"
   * ```
   */
  static formatDate(dateString: string): string {
    try {
      const date = this.parseDateSafe(dateString)
      if (!date) return dateString

      return format(date, 'dd/MM/yyyy', { locale: ptBR })
    } catch (error) {
      console.warn('[Formatters] Error formatting date:', error)
      return dateString
    }
  }

  /**
   * Formata data ISO para formato brasileiro completo por extenso
   *
   * @param dateString - Data no formato ISO (YYYY-MM-DD)
   * @returns Data formatada por extenso ou string original se inválida
   *
   * @example
   * ```typescript
   * Formatters.formatDateFull('2025-12-01') // "01 de Dezembro de 2025"
   * Formatters.formatDateFull('2025-01-15') // "15 de Janeiro de 2025"
   * ```
   */
  static formatDateFull(dateString: string): string {
    try {
      const date = this.parseDateSafe(dateString)
      if (!date) return dateString

      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (error) {
      console.warn('[Formatters] Error formatting full date:', error)
      return dateString
    }
  }

  /**
   * Formata string de hora para formato HH:mm (com zero à esquerda)
   *
   * @param timeString - Hora no formato HH:mm ou H:mm
   * @returns Hora formatada (HH:mm) ou string original se inválida
   *
   * @example
   * ```typescript
   * Formatters.formatTime('19:00') // "19:00"
   * Formatters.formatTime('9:30')  // "09:30"
   * ```
   */
  static formatTime(timeString: string): string {
    // Validação e extração de hora/minuto
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) {
      console.warn('[Formatters] Invalid time format:', timeString)
      return timeString
    }

    const [, hours, minutes] = match
    return `${hours.padStart(2, '0')}:${minutes}`
  }

  /**
   * Formata data e hora no formato completo DD/MM/YYYY às HH:MM
   *
   * @param dateString - Data no formato ISO (YYYY-MM-DD)
   * @param timeString - Hora no formato HH:mm
   * @returns Data e hora formatadas ou string concatenada se inválida
   *
   * @example
   * ```typescript
   * Formatters.formatDateTime('2025-12-01', '19:00') // "01/12/2025 às 19:00"
   * Formatters.formatDateTime('2025-01-15', '14:30') // "15/01/2025 às 14:30"
   * ```
   */
  static formatDateTime(dateString: string, timeString: string): string {
    try {
      const date = this.parseDateSafe(dateString)
      if (!date) {
        return `${dateString} às ${timeString}`
      }

      // Data completa (DD/MM/YYYY)
      const fullDate = format(date, 'dd/MM/yyyy', { locale: ptBR })

      // Formata hora
      const formattedTime = this.formatTime(timeString)

      return `${fullDate} às ${formattedTime}`
    } catch (error) {
      console.warn('[Formatters] Error formatting date time:', error)
      return `${dateString} às ${timeString}`
    }
  }

  /**
   * Formata data e hora em formato curto para exibição em listas
   *
   * @param dateString - Data no formato ISO (YYYY-MM-DD)
   * @param timeString - Hora no formato HH:mm
   * @returns Data e hora formatadas ou string concatenada se inválida
   *
   * @example
   * ```typescript
   * Formatters.formatDateTimeShort('2025-12-01', '19:00') // "Qui, 01/12 às 19:00"
   * Formatters.formatDateTimeShort('2025-01-15', '14:30') // "Qua, 15/01 às 14:30"
   * ```
   */
  static formatDateTimeShort(dateString: string, timeString: string): string {
    try {
      const date = this.parseDateSafe(dateString)
      if (!date) {
        return `${dateString} às ${timeString}`
      }

      // Dia da semana abreviado (Seg, Ter, Qua, etc)
      const dayOfWeek = format(date, 'EEE', { locale: ptBR })

      // Data curta (DD/MM)
      const shortDate = format(date, 'dd/MM', { locale: ptBR })

      // Formata hora
      const formattedTime = this.formatTime(timeString)

      return `${dayOfWeek}, ${shortDate} às ${formattedTime}`
    } catch (error) {
      console.warn('[Formatters] Error formatting date time:', error)
      return `${dateString} às ${timeString}`
    }
  }

  /**
   * Parse seguro de data ISO com validação
   *
   * @param dateString - Data no formato ISO (YYYY-MM-DD)
   * @returns Date object se válida, null se inválida
   * @private
   */
  private static parseDateSafe(dateString: string): Date | null {
    try {
      // Validação básica de formato ISO (YYYY-MM-DD)
      const isoRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!isoRegex.test(dateString)) {
        return null
      }

      const date = parseISO(dateString)

      // Verifica se a data é válida
      if (!isValid(date)) {
        return null
      }

      return date
    } catch {
      return null
    }
  }
}
