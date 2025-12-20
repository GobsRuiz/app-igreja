import { create } from 'zustand'
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo'
import { useEffect } from 'react'

// ========================================
// TYPES
// ========================================

interface ConnectivityState {
  // State
  isConnected: boolean
  connectionType: NetInfoStateType | null
  isInternetReachable: boolean | null
  details: NetInfoState['details'] | null
  _listenerActive: boolean // Internal flag para prevenir múltiplos listeners

  // Actions
  setConnectionState: (state: NetInfoState) => void
  checkConnection: () => Promise<void>
}

// ========================================
// STORE
// ========================================

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  // ========================================
  // STATE INICIAL
  // ========================================
  isConnected: true, // Assume conectado até verificar
  connectionType: null,
  isInternetReachable: null,
  details: null,
  _listenerActive: false, // Nenhum listener ativo inicialmente

  // ========================================
  // ACTIONS
  // ========================================

  setConnectionState: (state) => {
    // Validação de segurança
    if (!state || typeof state !== 'object') {
      return
    }

    set({
      isConnected: state.isConnected ?? false,
      connectionType: state.type,
      isInternetReachable: state.isInternetReachable,
      details: state.details,
    })
  },

  checkConnection: async () => {
    try {
      const state = await NetInfo.fetch()

      set({
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details,
      })
    } catch (error) {
      // Em caso de erro, assume desconectado
      set({
        isConnected: false,
        connectionType: null,
        isInternetReachable: null,
      })
    }
  },
}))

// ========================================
// HOOK DE LISTENER
// ========================================

/**
 * Hook para inicializar o listener de conectividade
 * Deve ser usado uma única vez no componente raiz (ex: _layout.tsx)
 *
 * SINGLETON: Previne múltiplos listeners automaticamente.
 * Se chamado 2x, apenas o primeiro será ativado (outros serão ignorados com warning).
 *
 * @example
 * function App() {
 *   useConnectivityListener()
 *   return <YourApp />
 * }
 */
export function useConnectivityListener() {
  useEffect(() => {
    const store = useConnectivityStore.getState()

    // ✅ SINGLETON: Verifica se já existe listener ativo
    if (store._listenerActive) {
      return
    }

    // ✅ Ativa flag (marca listener como ativo)
    useConnectivityStore.setState({ _listenerActive: true })

    // Verifica conexão inicial
    store.checkConnection()

    // Listener de mudanças de conexão
    const unsubscribe = NetInfo.addEventListener((state) => {
      useConnectivityStore.getState().setConnectionState(state)
    })

    // ✅ Cleanup: desativa flag e remove listener
    return () => {
      unsubscribe()
      useConnectivityStore.setState({ _listenerActive: false })
    }
  }, [])
}

// ========================================
// SELECTORS OTIMIZADOS
// ========================================

/**
 * Selector otimizado para status de conexão
 * Uso: const isConnected = useConnectivityStore(selectIsConnected)
 */
export const selectIsConnected = (state: ConnectivityState) => state.isConnected

/**
 * Selector otimizado para tipo de conexão
 * Uso: const connectionType = useConnectivityStore(selectConnectionType)
 */
export const selectConnectionType = (state: ConnectivityState) => state.connectionType

/**
 * Selector otimizado para alcance de internet
 * Uso: const isReachable = useConnectivityStore(selectIsInternetReachable)
 */
export const selectIsInternetReachable = (state: ConnectivityState) => state.isInternetReachable

/**
 * Selector otimizado para verificar se está offline
 * Uso: const isOffline = useConnectivityStore(selectIsOffline)
 */
export const selectIsOffline = (state: ConnectivityState) => !state.isConnected

/**
 * Selector otimizado para verificar se está em WiFi
 * Uso: const isWifi = useConnectivityStore(selectIsWifi)
 */
export const selectIsWifi = (state: ConnectivityState) =>
  state.connectionType === 'wifi' && state.isConnected

/**
 * Selector otimizado para verificar se está em dados móveis
 * Uso: const isCellular = useConnectivityStore(selectIsCellular)
 */
export const selectIsCellular = (state: ConnectivityState) =>
  state.connectionType === 'cellular' && state.isConnected
