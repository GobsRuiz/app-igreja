import React from 'react'
import { YStack, Spinner } from 'tamagui'

export function AdminLoadingState() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center">
      <Spinner size="large" color="$color12" />
    </YStack>
  )
}
