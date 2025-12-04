/**
 * Firebase Configuration
 * Inicialização básica do Firebase usando React Native Firebase
 *
 * IMPORTANTE: Este projeto é apenas iOS/Android (não tem suporte web)
 * React Native Firebase usa módulos nativos que não funcionam no web
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

/**
 * Firebase App - inicializado automaticamente pelo plugin
 * Não precisa de firebase.initializeApp() com React Native Firebase
 */

/**
 * Instâncias dos serviços Firebase
 * Exportadas para uso direto nos services
 */
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseMessaging = messaging();

/**
 * Configuração de cache do Firestore
 * 100MB - conservador para não consumir memória excessiva
 */
firebaseFirestore.settings({
  cacheSizeBytes: 100 * 1024 * 1024, // 100MB
});

/**
 * Log de inicialização (apenas em dev)
 */
if (__DEV__) {
  console.log('[Firebase] Configurado');
}
