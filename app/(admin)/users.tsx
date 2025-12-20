import React, { useState, useEffect, useMemo } from 'react'
import { YStack, XStack, Text, ScrollView, Input } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User as UserIcon, Mail, Shield, Clock, Plus, X, SlidersHorizontal, Search } from '@tamagui/lucide-icons'
import { Badge, Card, EmptyState, Button, AdminLoadingState, AdminActionButtons, BottomSheetModal, toast, AdminModalFooter, FormField, AdminFilterModal } from '@shared/ui'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dropdown } from 'react-native-element-dropdown'
import {
  onUsersChange,
  createUser,
  updateUser,
  deleteUser,
  checkCanDeleteUser,
  type User,
  type CreateUserData,
} from '@features/users'
import type { Role } from '@shared/constants/permissions'
import { useAdminDelete } from '@shared/hooks'
import { useAuth } from '@features/auth'

// Roles disponíveis
const ROLES: Array<{ label: string; value: Role }> = [
  { label: 'Usuário', value: 'user' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'superadmin' },
]

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete state (blocks all buttons during delete process)
  const [isDeleting, setIsDeleting] = useState(false)

  // Processing states for action buttons (separated for better UX)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter states - LOCAL (edited in modal, not yet applied)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [localRoleFilter, setLocalRoleFilter] = useState<Role | 'all'>('all')

  // Filter states - APPLIED (used for filtering the list)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')

  // Filter modal state
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  // Delete handler with validation
  const { handleDelete } = useAdminDelete<User>({
    entityName: 'Usuário',
    getItemName: (user) => user.displayName || user.email,
    deleteAction: deleteUser,
    checkInUse: async (userId) => {
      // Validações customizadas para usuários
      if (!currentUser) {
        return { inUse: true, error: 'Usuário não autenticado' }
      }

      const { canDelete, error } = await checkCanDeleteUser(userId, currentUser.uid)

      if (!canDelete) {
        return { inUse: true, error: error || 'Não é possível deletar este usuário' }
      }

      return { inUse: false, error: null }
    },
    setLoading,
    setProcessingId: setDeletingId,
    setIsDeleting, // Blocks all buttons globally (like sheetOpen)
  })

  // Listener em tempo real
  useEffect(() => {
    const unsubscribe = onUsersChange(
      (data) => {
        // Ordena usuários do mais recente para o mais antigo (por createdAt se existir, senão por nome/email)
        const sortedUsers = [...data].sort((a, b) => {
          // Se tiver createdAt, ordena por data
          if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime()
          }
          // Senão, ordena alfabeticamente por displayName ou email
          const nameA = a.displayName || a.email
          const nameB = b.displayName || b.email
          return nameA.localeCompare(nameB)
        })
        setUsers(sortedUsers)
        setLoading(false)
      },
      () => {
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
      role: 'user',
    })
    setSheetOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingId(user.id)
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // Não permitimos editar senha
      displayName: user.displayName || '',
      role: user.role,
    })
    setSheetOpen(true)
    setEditingId(null)
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
      role: 'user',
    })

    // Show loading while listener updates data
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  // Filter handlers
  const handleOpenFilter = () => {
    // Sync local state with applied filters when opening modal
    setLocalSearchQuery(searchQuery)
    setLocalRoleFilter(roleFilter)
    setFilterModalOpen(true)
  }

  const handleApplyFilter = () => {
    // Apply filters from local state
    setSearchQuery(localSearchQuery)
    setRoleFilter(localRoleFilter)
    setFilterModalOpen(false)
  }

  const handleClearFilter = () => {
    // Clear only local state (preview)
    setLocalSearchQuery('')
    setLocalRoleFilter('all')
  }

  // Filtered users - memoized for performance
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter (name or email)
      const matchesSearch =
        !searchQuery.trim() ||
        (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  // Check if filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== 'all'

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Usuários
          </Text>
          <XStack gap="$3" alignItems="center">
            {/* Botão Filtros */}
            <Button
              variant="outlined"
              icon={SlidersHorizontal}
              onPress={handleOpenFilter}
              {...(hasActiveFilters && {
                style: {
                  backgroundColor: '$color3',
                  borderColor: '$color8',
                },
              })}
            >
              Filtros
            </Button>

            <Button variant="primary" icon={Plus} onPress={handleOpenCreate}>
              Novo
            </Button>
          </XStack>
        </XStack>

        {/* Lista ou Loading */}
        {loading ? (
          <AdminLoadingState />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UserIcon size={48} color="$foreground" />}
            message={
              users.length === 0
                ? 'Nenhum usuário cadastrado'
                : 'Nenhum usuário encontrado com os filtros aplicados'
            }
            description={
              users.length === 0
                ? 'Clique em "Novo" para criar'
                : 'Tente ajustar os filtros'
            }
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {filteredUsers.map((user) => (
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
                      disabled={loading || submitting || sheetOpen || isDeleting}
                      isEditProcessing={editingId === user.id}
                      isDeleteProcessing={deletingId === user.id}
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
                !formData.displayName.trim() ||
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
            <FormField label="Nome" required>
              <Input
                size="$4"
                placeholder="Nome completo"
                value={formData.displayName}
                onChangeText={(text) => setFormData({ ...formData, displayName: text })}
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

        {/* Modal de Filtros */}
        <AdminFilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApply={handleApplyFilter}
          onClear={handleClearFilter}
          title="Filtrar Usuários"
        >
          {/* Busca por texto */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <Search size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Busca
              </Text>
            </XStack>
            <Input
              size="$4"
              placeholder="Nome ou e-mail..."
              value={localSearchQuery}
              onChangeText={setLocalSearchQuery}
            />
          </YStack>

          {/* Filtro por Role */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <Shield size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Permissão
              </Text>
            </XStack>
            <Dropdown
              data={[
                { label: 'Todos', value: 'all' },
                { label: 'Usuário', value: 'user' },
                { label: 'Admin', value: 'admin' },
                { label: 'Super Admin', value: 'superadmin' },
              ]}
              labelField="label"
              valueField="value"
              value={localRoleFilter}
              onChange={(item) => setLocalRoleFilter(item.value as Role | 'all')}
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
        </AdminFilterModal>
      </YStack>
    </SafeAreaView>
  )
}
