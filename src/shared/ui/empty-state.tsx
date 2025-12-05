import { YStack, Text } from 'tamagui'
import type { ReactElement } from 'react'

interface EmptyStateProps {
  icon: ReactElement
  message: string
  description?: string
}

export function EmptyState({ icon, message, description }: EmptyStateProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" gap="$3" padding="$4">
      {icon}
      <Text fontSize="$5" color="$foreground" textAlign="center">
        {message}
      </Text>
      {description && (
        <Text fontSize="$3" color="$foreground" textAlign="center">
          {description}
        </Text>
      )}
    </YStack>
  )
}
