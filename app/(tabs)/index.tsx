import { YStack, H1, Paragraph } from 'tamagui';

export default function HomeScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$4">
      <H1 size="$10" fontWeight="800">
        App Igreja
      </H1>
      <Paragraph theme="alt2" size="$5" textAlign="center" marginTop="$3">
        Visualizador de eventos
      </Paragraph>
    </YStack>
  );
}
