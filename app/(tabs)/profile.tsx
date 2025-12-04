import React from 'react'
import { YStack, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User } from '@tamagui/lucide-icons'

export default function ProfilePage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <Text fontSize="$8" fontWeight="700" color="$foreground" marginBottom="$4">
          Perfil
        </Text>

        <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
          <User size={48} color="$mutedForeground" />
          <Text fontSize="$5" color="$mutedForeground">
            Em breve
          </Text>
          <Text fontSize="$3" color="$mutedForeground" textAlign="center">
            Aqui você poderá configurar seu perfil
          </Text>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}
