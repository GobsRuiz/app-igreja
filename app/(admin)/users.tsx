import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, ScrollView, Input } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User as UserIcon, Mail, Phone, Shield, Clock, Plus, X } from '@tamagui/lucide-icons'
import { Badge, Card, EmptyState, Button, AdminLoadingState, AdminActionButtons, BottomSheetModal, toast, AdminModalFooter, FormField } from '@shared/ui'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Alert } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import {
  onUsersChange,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserData,
} from '@features/users'
import type { Role } from '@shared/constants/permissions'

// Roles disponíveis
const ROLES: Array<{ label: string; value: Role }> = [
  { label: 'Usuário', value: 'user' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'superadmin' },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    displayName: '',
    phone: '',
    role: 'user',
  })
  const [submitting, setSubmitting] = useState(false)

  // Processing state for action buttons
  const [processingId, setProcessingId] = useState<string | null>(null)

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

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      password: '',
      displayName: '',
      phone: '',
      role: 'user',
    })
    setSheetOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setProcessingId(user.id)
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // Não permitimos editar senha
      displayName: user.displayName || '',
      phone: user.phone || '',
      role: user.role,
    })
    setSheetOpen(true)
    setProcessingId(null)
  }

  const handleClose = () => {
    setSheetOpen(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    if (editingUser) {
      // Update
      const { error } = await updateUser(editingUser.id, {
        displayName: formData.displayName,
        phone: formData.phone,
        role: formData.role,
      })

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Usuário atualizado!')
    } else {
      // Create
      const { error } = await createUser(formData)

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Usuário criado!')
    }

    setSubmitting(false)
    handleClose()
    setFormData({
      email: '',
      password: '',
      displayName: '',
      phone: '',
      role: 'user',
    })

    // Show loading while listener updates data
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  const handleDelete = (user: User) => {
    setProcessingId(user.id)
    Alert.alert(
      'Deletar Usuário',
      `Tem certeza que deseja deletar "${user.displayName || user.email}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setProcessingId(null),
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)

            const { error } = await deleteUser(user.id)

            if (error) {
              toast.error(error)
              setLoading(false)
              setProcessingId(null)
              return
            }

            toast.success('Usuário deletado!')

            // Wait for listener to update data
            setTimeout(() => {
              setLoading(false)
              setProcessingId(null)
            }, 300)
          },
        },
      ]
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
          <XStack gap="$3" alignItems="center">
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
            <Button variant="primary" icon={Plus} onPress={handleOpenCreate}>
              Novo
            </Button>
          </XStack>
        </XStack>

        {/* Lista ou Loading */}
        {loading ? (
          <AdminLoadingState />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UserIcon size={48} color="$foreground" />}
            message="Nenhum usuário cadastrado"
            description="Clique em &quot;Novo&quot; para criar"
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {users.map((user) => (
                <Card key={user.id}>
                  <XStack alignItems="flex-start" justifyContent="space-between">
                    <XStack alignItems="flex-start" gap="$3" flex={1}>
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

                    {/* Botões de ação */}
                    <AdminActionButtons
                      disabled={loading || submitting || sheetOpen}
                      isProcessing={processingId === user.id}
                      onEdit={() => handleOpenEdit(user)}
                      onDelete={() => handleDelete(user)}
                    />
                  </XStack>
                </Card>
              ))}
            </YStack>
          </ScrollView>
        )}

        {/* Modal Create/Edit */}
        <BottomSheetModal
          isOpen={sheetOpen}
          onClose={handleClose}
          size="large"
          header={
            <Text fontSize="$7" fontWeight="700" color="$foreground">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </Text>
          }
          footer={
            <AdminModalFooter
              onCancel={handleClose}
              onConfirm={handleSubmit}
              confirmText={submitting ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
              confirmDisabled={
                submitting ||
                !formData.email.trim() ||
                (!editingUser && !formData.password.trim())
              }
              submitting={submitting}
            />
          }
          contentContainerProps={{ padding: '$4', gap: '$4' }}
        >
          <YStack gap="$4">
            {/* Email */}
            <FormField label="E-mail" required>
              <Input
                size="$4"
                placeholder="usuario@exemplo.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={!!editingUser} // Não permite editar email
                opacity={editingUser ? 0.6 : 1}
              />
              {editingUser && (
                <Text fontSize="$2" color="$color10">
                  O e-mail não pode ser alterado
                </Text>
              )}
            </FormField>

            {/* Senha (apenas no create) */}
            {!editingUser && (
              <FormField label="Senha" required>
                <Input
                  size="$4"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                />
              </FormField>
            )}

            {/* Nome */}
            <FormField label="Nome (opcional)">
              <Input
                size="$4"
                placeholder="Nome completo"
                value={formData.displayName}
                onChangeText={(text) => setFormData({ ...formData, displayName: text })}
              />
            </FormField>

            {/* Telefone */}
            <FormField label="Telefone (opcional)">
              <Input
                size="$4"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </FormField>

            {/* Role */}
            <FormField label="Permissão" required>
              <Dropdown
                data={ROLES}
                labelField="label"
                valueField="value"
                value={formData.role}
                onChange={(item) => setFormData({ ...formData, role: item.value })}
                placeholder="Selecione uma permissão"
                style={{
                  height: 50,
                  borderWidth: 1,
                  borderColor: '#e5e5e5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                }}
              />
            </FormField>
          </YStack>
        </BottomSheetModal>
      </YStack>
    </SafeAreaView>
  )
}
