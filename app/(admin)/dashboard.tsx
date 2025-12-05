import React from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { Button, Card } from '@shared/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, LayoutDashboard } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'

export default function DashboardPage() {
  const router = useRouter()

  const handleBackToUser = () => {
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <XStack alignItems="center" gap="$3">
            <LayoutDashboard size={32} color="$color12" />
            <Text fontSize="$8" fontWeight="700" color="$foreground">
              Dashboard
            </Text>
          </XStack>

          {/* Botão Voltar para Área de Usuário */}
          <Button
            size="$3"
            variant="outlined"
            icon={ArrowLeft}
            onPress={handleBackToUser}
          >
            Voltar
          </Button>
        </XStack>

        {/* Content */}
        <YStack gap="$4">
          <Card>
            <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
              Bem-vindo à Área Admin
            </Text>
            <Text fontSize="$4" color="$color11">
              Aqui você poderá gerenciar categorias, locais e eventos da igreja.
            </Text>
          </Card>

          {/* Cards de estatísticas (placeholder) */}
          <XStack gap="$3">
            <Card flex={1} backgroundColor="$blue2">
              <Text fontSize="$8" fontWeight="700" color="$blue10">
                0
              </Text>
              <Text fontSize="$3" color="$blue11">
                Categorias
              </Text>
            </Card>

            <Card flex={1} backgroundColor="$green2">
              <Text fontSize="$8" fontWeight="700" color="$green10">
                0
              </Text>
              <Text fontSize="$3" color="$green11">
                Locais
              </Text>
            </Card>
          </XStack>

          <Card backgroundColor="$purple2">
            <Text fontSize="$8" fontWeight="700" color="$purple10">
              0
            </Text>
            <Text fontSize="$3" color="$purple11">
              Eventos Cadastrados
            </Text>
          </Card>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}
