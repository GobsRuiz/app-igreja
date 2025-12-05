/**
 * Index Screen
 * Tela de carregamento inicial
 * Redirect gerenciado por _layout.tsx
 */

import { YStack, Spinner, Text } from 'tamagui';

export default function Index() {
  return (
    <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center" gap="$4">
      <Spinner size="large" color="$color12" />
      <Text fontSize="$4" color="$color11">
        Carregando...
      </Text>
    </YStack>
  );
}
