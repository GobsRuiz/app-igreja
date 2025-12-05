/**
 * Auth Provider
 * Context Provider para estado global de autenticação
 */

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import * as authService from '../services/auth.service';
import type { User, AuthState } from '../types/auth.types';
import type { Role } from '@shared/constants/permissions';
import { firebaseFirestore } from '@core/config/firebase.config';

/**
 * Auth Context Type
 */
interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  signUp: (email: string, password: string, confirmPassword: string) => Promise<{
    user: User | null;
    error: string | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    user: User | null;
    error: string | null;
  }>;
  signOut: () => Promise<{ error: string | null }>;
}

/**
 * Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider
 * Um único listener onAuthStateChanged para toda a aplicação
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
    error: null,
  });

  // Listener único de mudanças de autenticação + role do Firestore
  useEffect(() => {
    let unsubscribeRole: (() => void) | null = null;

    // Listener de autenticação
    const unsubscribeAuth = authService.onAuthStateChanged((user) => {
      // Limpar listener anterior SEMPRE (previne memory leak)
      if (unsubscribeRole) {
        unsubscribeRole();
        unsubscribeRole = null;
      }

      if (user) {
        // Usuário autenticado → escutar role do Firestore
        unsubscribeRole = firebaseFirestore
          .collection('users')
          .doc(user.uid)
          .onSnapshot(
            (doc) => {
              const role = doc.exists ? ((doc.data()?.role as Role) || 'user') : 'user';
              setState({
                user,
                role,
                loading: false,
                error: null,
              });
            },
            (error) => {
              console.error('Erro ao obter role do usuário:', error);
              // Fallback seguro
              setState({
                user,
                role: 'user',
                loading: false,
                error: null,
              });
            }
          );
      } else {
        // Não autenticado → limpar estado
        setState({
          user: null,
          role: null,
          loading: false,
          error: null,
        });
      }
    });

    // Cleanup
    return () => {
      unsubscribeAuth();
      if (unsubscribeRole) {
        unsubscribeRole();
      }
    };
  }, []);

  // Cadastrar
  const signUp = async (email: string, password: string, confirmPassword: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { user, error } = await authService.signUp(email, password, confirmPassword);

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
      return { user: null, error };
    }

    // ✅ onAuthStateChanged gerencia user e loading
    return { user, error: null };
  };

  // Login
  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { user, error } = await authService.signIn(email, password);

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
      return { user: null, error };
    }

    // ✅ onAuthStateChanged gerencia user e loading
    return { user, error: null };
  };

  // Logout
  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { error } = await authService.signOut();

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
      return { error };
    }

    // Estado será atualizado pelo onAuthStateChanged
    return { error: null };
  };

  const value: AuthContextType = {
    ...state,
    isAuthenticated: !!state.user,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para consumir o AuthContext
 */
export function useAuthContext() {
  const context = React.useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
