/**
 * Auth Service
 * Wrapper simples do Firebase Auth com validações
 */

import { firebaseAuth, firebaseFirestore } from '@core/config';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AuthErrorCode, mapFirebaseUser, type User } from '../types/auth.types';

/**
 * Validar formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar senha (mínimo 6 caracteres)
 */
function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Mapear erro do Firebase para mensagem amigável
 * IMPORTANTE: Login sempre retorna mensagem genérica (segurança)
 */
function mapAuthError(error: any, isSignUp: boolean = false): string {
  const code = error.code as AuthErrorCode;

  // LOGIN: sempre genérico (segurança)
  if (!isSignUp) {
    if (
      code === AuthErrorCode.USER_NOT_FOUND ||
      code === AuthErrorCode.WRONG_PASSWORD ||
      code === AuthErrorCode.INVALID_CREDENTIAL
    ) {
      return 'E-mail ou senha inválidos';
    }
  }

  // CADASTRO: pode ser mais específico (não expõe dados de usuários)
  switch (code) {
    case AuthErrorCode.EMAIL_ALREADY_IN_USE:
      return 'Este e-mail já está cadastrado';
    case AuthErrorCode.INVALID_EMAIL:
      return 'E-mail inválido';
    case AuthErrorCode.WEAK_PASSWORD:
      return 'A senha deve ter no mínimo 6 caracteres';
    case AuthErrorCode.TOO_MANY_REQUESTS:
      return 'Muitas tentativas. Tente novamente mais tarde';
    case AuthErrorCode.NETWORK_REQUEST_FAILED:
      return 'Erro de conexão. Verifique sua internet';
    default:
      return 'Ocorreu um erro. Tente novamente';
  }
}

/**
 * Cadastrar novo usuário
 */
export async function signUp(
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Validações
    if (!email || !password || !confirmPassword) {
      return { user: null, error: 'Preencha todos os campos' };
    }

    if (!isValidEmail(email)) {
      return { user: null, error: 'E-mail inválido' };
    }

    if (!isValidPassword(password)) {
      return { user: null, error: 'A senha deve ter no mínimo 6 caracteres' };
    }

    if (password !== confirmPassword) {
      return { user: null, error: 'As senhas não conferem' };
    }

    // Criar usuário no Firebase Auth
    console.log('🔥 [AUTH] Criando usuário no Firebase Auth...');
    const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = mapFirebaseUser(userCredential.user);
    console.log('✅ [AUTH] Usuário criado no Auth:', user?.uid);

    // Criar documento do usuário na collection users/
    if (user) {
      console.log('🔥 [FIRESTORE] Tentando criar documento em users/...');
      try {
        await firebaseFirestore.collection('users').doc(user.uid).set({
          email: user.email,
          role: 'user', // Todos começam como usuários
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ [FIRESTORE] Documento criado com sucesso!');
      } catch (firestoreError: any) {
        console.error('❌ [FIRESTORE] ERRO ao criar documento:', firestoreError);
        console.error('❌ [FIRESTORE] Código do erro:', firestoreError.code);
        console.error('❌ [FIRESTORE] Mensagem:', firestoreError.message);
      }
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('❌ [AUTH] Erro geral:', error);
    const errorMessage = mapAuthError(error, true);
    return { user: null, error: errorMessage };
  }
}

/**
 * Fazer login
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Validações básicas
    if (!email || !password) {
      return { user: null, error: 'Preencha todos os campos' };
    }

    if (!isValidEmail(email)) {
      return { user: null, error: 'E-mail ou senha inválidos' }; // Genérico (segurança)
    }

    // Login no Firebase
    const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
    const user = mapFirebaseUser(userCredential.user);

    return { user, error: null };
  } catch (error: any) {
    const errorMessage = mapAuthError(error, false); // isSignUp = false
    return { user: null, error: errorMessage };
  }
}

/**
 * Fazer logout
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    await firebaseAuth.signOut();
    return { error: null };
  } catch (error: any) {
    return { error: 'Erro ao sair. Tente novamente' };
  }
}

/**
 * Obter usuário atual
 */
export function getCurrentUser(): User | null {
  const firebaseUser = firebaseAuth.currentUser;
  return mapFirebaseUser(firebaseUser);
}

/**
 * Listener de mudanças de autenticação
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return firebaseAuth.onAuthStateChanged((firebaseUser) => {
    const user = mapFirebaseUser(firebaseUser);
    callback(user);
  });
}
