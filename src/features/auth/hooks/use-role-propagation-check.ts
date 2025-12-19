/**
 * useRolePropagationCheck Hook
 * Verifica se role foi recém-atualizada (janela de propagação de custom claims)
 */

import { useAuth } from './use-auth';

/**
 * Janela de propagação de custom claims (em ms)
 * Durante este período, custom claims podem ainda não estar sincronizados no token JWT
 */
const PROPAGATION_WINDOW_MS = 5000; // 5 segundos

/**
 * Hook para verificar se role foi recém-atualizada
 *
 * Durante janela de propagação (5s após atualização), custom claims
 * podem ainda não estar sincronizados no token JWT.
 *
 * @returns isPropagating - true se dentro da janela de propagação
 * @returns timeRemaining - milissegundos restantes até fim da propagação
 * @returns timeSinceUpdate - milissegundos desde a última atualização de role
 */
export function useRolePropagationCheck() {
  const { roleUpdatedAtMs } = useAuth();

  const now = Date.now();
  const timeSinceUpdate = roleUpdatedAtMs > 0 ? now - roleUpdatedAtMs : Infinity;
  const isPropagating = timeSinceUpdate < PROPAGATION_WINDOW_MS;
  const timeRemaining = isPropagating ? PROPAGATION_WINDOW_MS - timeSinceUpdate : 0;

  return {
    isPropagating,
    timeRemaining,
    timeSinceUpdate,
  };
}
