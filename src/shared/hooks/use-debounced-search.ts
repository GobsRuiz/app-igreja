import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook para debounce de função (genérico)
 *
 * @param callback - Função a ser debounced
 * @param delay - Delay em ms (padrão: 300ms)
 * @returns Função debounced
 *
 * @example
 * const debouncedSearch = useDebounce((query: string) => {
 *   console.log('Searching:', query)
 * }, 300)
 *
 * <Input onChangeText={debouncedSearch} />
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Cleanup timeout ao desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      // Limpa timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Cria novo timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Hook especializado para debounce de busca em stores
 * Wrapper conveniente para useDebounce
 *
 * @param onSearch - Callback de busca (ex: setSearchQuery do store)
 * @param delay - Delay em ms (padrão: 300ms)
 * @returns Função debounced para usar em inputs
 *
 * @example
 * import { useEventStore } from '@shared/store'
 *
 * function SearchBar() {
 *   const setSearchQuery = useEventStore(state => state.setSearchQuery)
 *   const debouncedSearch = useDebouncedSearch(setSearchQuery)
 *
 *   return <Input onChangeText={debouncedSearch} />
 * }
 */
export function useDebouncedSearch(
  onSearch: (query: string) => void,
  delay: number = 300
): (query: string) => void {
  return useDebounce(onSearch, delay)
}
