/**
 * Auth Feature - Barrel Export
 * Exports públicos da feature de autenticação
 */

// Providers
export { AuthProvider } from './providers/auth-provider';

// Hooks
export { useAuth } from './hooks/use-auth';

// Services
export * as authService from './services/auth.service';

// Types
export type { User, AuthState } from './types/auth.types';
export { AuthErrorCode } from './types/auth.types';
