import React from 'react'
import { YStack, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell } from '@tamagui/lucide-icons'

export default function NotificationsPage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <Text fontSize="$8" fontWeight="700" color="$foreground" marginBottom="$4">
          Notificações
        </Text>

        <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
          <Bell size={48} color="$mutedForeground" />
          <Text fontSize="$5" color="$mutedForeground">
            Em breve
          </Text>
          <Text fontSize="$3" color="$mutedForeground" textAlign="center">
            Aqui você verá notificações sobre seus eventos
          </Text>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}
