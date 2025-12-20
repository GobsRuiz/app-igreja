import React from 'react'
import { YStack, XStack, Text, Separator, Spinner } from 'tamagui'
import { Button, Card, toast } from '@shared/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User, LogOut, Mail, LayoutDashboard } from '@tamagui/lucide-icons'
import { useAuth } from '@features/auth'
import { useRouter } from 'expo-router'
import { isAdmin } from '@shared/constants/permissions'

export default function ProfilePage() {
  const { user, role, signOut, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await signOut()

    if (error) {
      toast.error(error)
      return
    }

    // Sucesso - _layout.tsx fará o redirect automaticamente
    toast.success('Logout realizado!')
  }

  const handleGoToAdmin = () => {
    router.push('/(admin)/dashboard')
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <Text fontSize="$8" fontWeight="700" color="$foreground" marginBottom="$4">
          Perfil
        </Text>

        <YStack gap="$4">
          {/* Card de Informações do Usuário */}
          <Card gap="$4">
            <YStack gap="$3" alignItems="center">
              <User size={64} color="$color12" />
              <Text fontSize="$6" fontWeight="600" color="$color12">
                Usuário
              </Text>
            </YStack>

            <Separator />

            {/* Email */}
            <XStack alignItems="center" gap="$3">
              <Mail size={20} color="$color11" />
              <Text fontSize="$4" color="$color11">
                {user?.email || 'Não disponível'}
              </Text>
            </XStack>
          </Card>

          {/* Botão Área Admin - Apenas para admin/superadmin */}
          {loading ? (
            <YStack height={48} alignItems="center" justifyContent="center">
              <Spinner size="small" color="$blue10" />
            </YStack>
          ) : (
            role &&
            isAdmin(role) && (
              <Button
                size="$5"
                variant="info"
                fontWeight="600"
                icon={LayoutDashboard}
                onPress={handleGoToAdmin}
              >
                Área Admin
              </Button>
            )
          )}

          {/* Botão de Logout */}
          <Button
            size="$5"
            variant="danger"
            fontWeight="600"
            icon={LogOut}
            onPress={handleLogout}
            disabled={loading}
            opacity={loading ? 0.5 : 1}
          >
            {loading ? 'Saindo...' : 'Sair'}
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}
