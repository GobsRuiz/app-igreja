import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Spinner, ScrollView } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User as UserIcon, Mail, Phone, Shield, Clock } from '@tamagui/lucide-icons'
import { Badge, Card, EmptyState } from '@shared/ui'
import { toast } from 'sonner-native'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { onUsersChange, type User } from '@features/users'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Listener em tempo real
  useEffect(() => {
    const unsubscribe = onUsersChange(
      (data) => {
        setUsers(data)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar usuários:', error)
        toast.error('Erro ao carregar usuários')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$color12" />
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Usuários
          </Text>
          <XStack
            backgroundColor="$gray3"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
          >
            <Text fontSize="$4" fontWeight="600" color="$gray11">
              {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
            </Text>
          </XStack>
        </XStack>

        {/* Lista */}
        {users.length === 0 ? (
          <EmptyState
            icon={<UserIcon size={48} color="$foreground" />}
            message="Nenhum usuário cadastrado"
            description="Os usuários aparecem aqui ao se cadastrarem"
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {users.map((user) => (
                <Card key={user.id}>
                  <XStack alignItems="flex-start" gap="$3">
                    {/* Avatar/Ícone */}
                    <YStack
                      width={56}
                      height={56}
                      borderRadius="$10"
                      backgroundColor="$gray3"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {user.photoUrl ? (
                        <Text>📷</Text>
                      ) : (
                        <UserIcon size={28} color="$gray11" />
                      )}
                    </YStack>

                    {/* Info */}
                    <YStack flex={1} gap="$2">
                      {/* Nome/Email */}
                      <YStack gap="$1">
                        <Text fontSize="$5" fontWeight="700" color="$color12">
                          {user.displayName || 'Sem nome'}
                        </Text>
                        <XStack alignItems="center" gap="$2">
                          <Mail size={14} color="$color10" />
                          <Text fontSize="$3" color="$color11">
                            {user.email}
                          </Text>
                        </XStack>
                      </YStack>

                      {/* Telefone (se houver) */}
                      {user.phone && (
                        <XStack alignItems="center" gap="$2">
                          <Phone size={14} color="$color10" />
                          <Text fontSize="$3" color="$color11">
                            {user.phone}
                          </Text>
                        </XStack>
                      )}

                      {/* Role e Data de cadastro */}
                      <XStack alignItems="center" gap="$3" marginTop="$1">
                        {/* Role Badge */}
                        <Badge
                          variant={
                            user.role === 'superadmin'
                              ? 'danger'
                              : user.role === 'admin'
                              ? 'outlined'
                              : 'info'
                          }
                          icon={Shield}
                        >
                          {user.role === 'superadmin'
                            ? 'Super Admin'
                            : user.role === 'admin'
                            ? 'Admin'
                            : 'Usuário'}
                        </Badge>

                        {/* Data de cadastro */}
                        <XStack alignItems="center" gap="$1">
                          <Clock size={12} color="$color10" />
                          <Text fontSize="$2" color="$color10">
                            {format(user.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                          </Text>
                        </XStack>
                      </XStack>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  )
}
