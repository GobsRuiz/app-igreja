import React from 'react'
import { YStack, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell } from '@tamagui/lucide-icons'
import { EmptyState } from '@shared/ui'

export default function NotificationsPage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <Text fontSize="$8" fontWeight="700" color="$foreground" marginBottom="$4">
          Notificações
        </Text>

        <EmptyState
          icon={<Bell size={48} color="$foreground" />}
          message="Em breve"
          description="Aqui você verá notificações sobre seus eventos"
        />
      </YStack>
    </SafeAreaView>
  )
}
