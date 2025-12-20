/**
 * Firebase Configuration
 * Inicialização básica do Firebase usando React Native Firebase
 *
 * IMPORTANTE: Este projeto é apenas iOS/Android (não tem suporte web)
 * React Native Firebase usa módulos nativos que não funcionam no web
 */

import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import '@react-native-firebase/functions';
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

/**
 * Firebase Functions para região South America (São Paulo)
 * Configurado explicitamente para southamerica-east1 onde as Cloud Functions foram deployadas
 * Usa firebase.app().functions(region) conforme documentação oficial React Native Firebase
 */
export const firebaseFunctions = firebase.app().functions('southamerica-east1');

export const firebaseMessaging = messaging();

/**
 * Configuração de cache do Firestore
 * 100MB - conservador para não consumir memória excessiva
 */
firebaseFirestore.settings({
  cacheSizeBytes: 100 * 1024 * 1024, // 100MB
});

/**
 * Configuração concluída
 */
