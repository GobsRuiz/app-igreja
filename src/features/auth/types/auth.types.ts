/**
 * Auth Types
 * Tipos relacionados à autenticação
 */

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * User - Usuário autenticado
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

/**
 * AuthState - Estado de autenticação
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * AuthError - Códigos de erro do Firebase Auth
 */
export enum AuthErrorCode {
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  INVALID_EMAIL = 'auth/invalid-email',
  WEAK_PASSWORD = 'auth/weak-password',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
  INVALID_CREDENTIAL = 'auth/invalid-credential',
}

/**
 * Converter FirebaseAuthTypes.User para User
 */
export function mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User | null): User | null {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
  };
}
