import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { TamaguiProvider, PortalProvider } from 'tamagui'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Toaster } from 'sonner-native'
import 'react-native-reanimated'

import tamaguiConfig from '../tamagui.config'
import '@core/config/firebase.config'
import { AuthProvider, useAuth } from '@features/auth'
import { isAdmin } from '@shared/constants/permissions'
import { toast } from '@shared/ui'

export const unstable_settings = {
  anchor: '(tabs)',
}

function RootNavigator() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  // Proteção de rotas global
  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === 'auth'
    const inTabsGroup = segments[0] === '(tabs)'
    const inAdminGroup = segments[0] === '(admin)'

    if (user) {
      // Autenticado

      // Verificar acesso à área admin
      if (inAdminGroup) {
        // Bloqueia se role não existe OU não é admin
        if (!role || !isAdmin(role)) {
          toast.error('Acesso negado', {
            description: 'Você não tem permissão para acessar a área administrativa.',
          })
          router.replace('/(tabs)')
          return
        }
      }

      // Garantir que está em (tabs) ou (admin)
      if (!inTabsGroup && !inAdminGroup) {
        router.replace('/(tabs)')
      }
    } else {
      // Não autenticado → garantir que está em auth
      if (!inAuthGroup) {
        router.replace('/auth')
      }
    }
  }, [user, role, loading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <PortalProvider shouldAddRootHost>
              <BottomSheetModalProvider>
                <RootNavigator />
                <StatusBar style="auto" />
                <Toaster visibleToasts={1} style={{ zIndex: 10000 }} />
              </BottomSheetModalProvider>
            </PortalProvider>
          </TamaguiProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AuthProvider>
  )
}
