import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Spinner, ScrollView, Input, Sheet } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User as UserIcon, Mail, Phone, Shield, Clock, Plus, Pencil, Trash2, X } from '@tamagui/lucide-icons'
import { Badge, Card, EmptyState, Button } from '@shared/ui'
import { toast } from 'sonner-native'
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
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // Não permitimos editar senha
      displayName: user.displayName || '',
      phone: user.phone || '',
      role: user.role,
    })
    setSheetOpen(true)
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
    Alert.alert(
      'Deletar Usuário',
      `Tem certeza que deseja deletar "${user.displayName || user.email}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)

            const { error } = await deleteUser(user.id)

            if (error) {
              toast.error(error)
              setLoading(false)
              return
            }

            toast.success('Usuário deletado!')

            // Wait for listener to update data
            setTimeout(() => {
              setLoading(false)
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
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="large" color="$color12" />
          </YStack>
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
                    <XStack gap="$2">
                      <Button
                        variant="outlined"
                        icon={Pencil}
                        onPress={() => handleOpenEdit(user)}
                        circular
                      />
                      <Button
                        variant="danger"
                        icon={Trash2}
                        onPress={() => handleDelete(user)}
                        circular
                      />
                    </XStack>
                  </XStack>
                </Card>
              ))}
            </YStack>
          </ScrollView>
        )}

        {/* Sheet Create/Edit */}
        <Sheet
          modal
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          snapPoints={[85]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay />
          <Sheet.Frame padding="$4" backgroundColor="$background">
            <Sheet.Handle />
            <YStack gap="$4">
              <Text fontSize="$7" fontWeight="700" color="$foreground">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <YStack gap="$4">
                  {/* Email */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      E-mail *
                    </Text>
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
                  </YStack>

                  {/* Senha (apenas no create) */}
                  {!editingUser && (
                    <YStack gap="$2">
                      <Text fontSize="$3" fontWeight="600" color="$color11">
                        Senha *
                      </Text>
                      <Input
                        size="$4"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        secureTextEntry
                      />
                    </YStack>
                  )}

                  {/* Nome */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Nome (opcional)
                    </Text>
                    <Input
                      size="$4"
                      placeholder="Nome completo"
                      value={formData.displayName}
                      onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                    />
                  </YStack>

                  {/* Telefone */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Telefone (opcional)
                    </Text>
                    <Input
                      size="$4"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      keyboardType="phone-pad"
                    />
                  </YStack>

                  {/* Role */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Permissão *
                    </Text>
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
                  </YStack>
                </YStack>
              </ScrollView>

              <XStack gap="$3" marginTop="$4">
                <Button flex={1} variant="outlined" icon={X} onPress={handleClose}>
                  Cancelar
                </Button>

                <Button
                  flex={1}
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={
                    submitting ||
                    !formData.email.trim() ||
                    (!editingUser && !formData.password.trim())
                  }
                  opacity={
                    submitting ||
                    !formData.email.trim() ||
                    (!editingUser && !formData.password.trim())
                      ? 0.5
                      : 1
                  }
                >
                  {submitting ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                </Button>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      </YStack>
    </SafeAreaView>
  )
}
