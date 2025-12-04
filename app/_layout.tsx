import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { TamaguiProvider } from 'tamagui'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Toaster } from 'sonner-native'
import 'react-native-reanimated'

import tamaguiConfig from '../tamagui.config'
import '@core/config/firebase.config'
import { AuthProvider } from '@features/auth/providers/auth-provider'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="auto" />
            <Toaster visibleToasts={1} style={{ zIndex: 10000 }} />
          </BottomSheetModalProvider>
        </TamaguiProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
    </AuthProvider>
  )
}
