import React, { useState, useEffect, useMemo } from 'react'
import {
  YStack,
  XStack,
  Text,
  Input,
  ScrollView,
} from 'tamagui'
import { Button, Card, EmptyState, AdminLoadingState, AdminActionButtons, BottomSheetModal, toast, AdminModalFooter, FormField, AdminFilterModal } from '@shared/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Plus,
  X,
  Calendar,
  Heart,
  Music,
  Book,
  Coffee,
  Star,
  Users,
  Home,
  Tag,
  SlidersHorizontal,
  Search,
} from '@tamagui/lucide-icons'
import {
  onCategoriesChange,
  createCategory,
  updateCategory,
  deleteCategory,
  checkCategoryInUse,
  type Category,
  type CreateCategoryData,
} from '@features/categories'
import { useAdminDelete } from '@shared/hooks'

// Cores disponíveis para seleção
const COLORS = [
  { label: 'Azul', value: '$blue10' },
  { label: 'Verde', value: '$green10' },
  { label: 'Vermelho', value: '$red10' },
  { label: 'Amarelo', value: '$yellow10' },
  { label: 'Roxo', value: '$purple10' },
  { label: 'Rosa', value: '$pink10' },
  { label: 'Laranja', value: '$orange10' },
  { label: 'Cinza', value: '$gray10' },
]

// Mapeamento de ícones
const ICON_MAP = {
  Calendar,
  Heart,
  Music,
  Book,
  Coffee,
  Star,
  Users,
  Home,
}

// Ícones disponíveis
const ICONS = Object.keys(ICON_MAP) as Array<keyof typeof ICON_MAP>

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    color: '$blue10',
    icon: 'Calendar',
  })
  const [submitting, setSubmitting] = useState(false)

  // Processing state for action buttons
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Filter states - LOCAL (edited in modal, not yet applied)
  const [localSearchQuery, setLocalSearchQuery] = useState('')

  // Filter states - APPLIED (used for filtering the list)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter modal state
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  // Delete handler
  const { handleDelete } = useAdminDelete<Category>({
    entityName: 'Categoria',
    getItemName: (category) => category.name,
    deleteAction: deleteCategory,
    checkInUse: checkCategoryInUse,
    setLoading,
    setProcessingId,
    successMessage: 'Categoria deletada!',
  })

  // Listener em tempo real
  useEffect(() => {
    const unsubscribe = onCategoriesChange(
      (data) => {
        // Ordena categorias do mais recente para o mais antigo (por createdAt se existir, senão por nome)
        const sortedCategories = [...data].sort((a, b) => {
          // Se tiver createdAt, ordena por data
          if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime()
          }
          // Senão, ordena alfabeticamente por nome
          return a.name.localeCompare(b.name)
        })
        setCategories(sortedCategories)
        setLoading(false)
      },
      () => {
        toast.error('Erro ao carregar categorias')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setFormData({ name: '', color: '$blue10', icon: 'Calendar' })
    setSheetOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setProcessingId(category.id)
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
    })
    setSheetOpen(true)
    setProcessingId(null)
  }

  const handleClose = () => {
    setSheetOpen(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    if (editingCategory) {
      // Update
      const { error } = await updateCategory(editingCategory.id, formData)

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Categoria atualizada!')
    } else {
      // Create
      const { error } = await createCategory(formData)

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Categoria criada!')
    }

    setSubmitting(false)
    handleClose()
    setFormData({ name: '', color: '$blue10', icon: 'Calendar' })

    // Show loading while listener updates data
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  // Filter handlers
  const handleOpenFilter = () => {
    setLocalSearchQuery(searchQuery)
    setFilterModalOpen(true)
  }

  const handleApplyFilter = () => {
    setSearchQuery(localSearchQuery)
    setFilterModalOpen(false)
  }

  const handleClearFilter = () => {
    setLocalSearchQuery('')
  }

  // Filtered categories - memoized for performance
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      // Search filter (name)
      const matchesSearch =
        !searchQuery.trim() ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [categories, searchQuery])

  // Check if filters are active
  const hasActiveFilters = searchQuery.trim() !== ''

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Categorias
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
              Nova
            </Button>
          </XStack>
        </XStack>

        {/* Lista ou Loading */}
        {loading ? (
          <AdminLoadingState />
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={<Tag size={48} color="$foreground" />}
            message={
              categories.length === 0
                ? 'Nenhuma categoria cadastrada'
                : 'Nenhuma categoria encontrada com os filtros aplicados'
            }
            description={
              categories.length === 0
                ? 'Clique em "Nova" para criar'
                : 'Tente ajustar os filtros'
            }
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {filteredCategories.map((category) => (
                <Card key={category.id}>
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$3" flex={1}>
                      {/* Cor preview */}
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$2"
                        backgroundColor={category.color}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {(() => {
                          const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP]
                          return IconComponent ? <IconComponent size={20} color="white" /> : null
                        })()}
                      </YStack>

                      <YStack flex={1}>
                        <Text fontSize="$5" fontWeight="600" color="$color12">
                          {category.name}
                        </Text>
                      </YStack>
                    </XStack>

                    <AdminActionButtons
                      disabled={loading || submitting || sheetOpen}
                      isEditProcessing={processingId === category.id}
                      isDeleteProcessing={processingId === category.id}
                      onEdit={() => handleOpenEdit(category)}
                      onDelete={() => handleDelete(category)}
                      deleteVariant="outlined"
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
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </Text>
          }
          footer={
            <AdminModalFooter
              cancelText="Cancelar"
              confirmText={submitting ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
              onCancel={handleClose}
              onConfirm={handleSubmit}
              confirmDisabled={submitting || !formData.name.trim()}
              submitting={submitting}
            />
          }
          contentContainerProps={{ padding: '$4', gap: '$4' }}
        >
          <YStack gap="$4">
            {/* Nome */}
            <FormField label="Nome">
              <Input
                size="$4"
                placeholder="Ex: Culto, Célula, Retiro..."
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </FormField>

            {/* Cor */}
            <FormField label="Cor">
              <XStack gap="$2" flexWrap="wrap">
                {COLORS.map((color) => (
                  <Button
                    key={color.value}
                    size="$3"
                    backgroundColor={color.value}
                    onPress={() => setFormData({ ...formData, color: color.value })}
                    opacity={formData.color === color.value ? 1 : 0.5}
                    borderWidth={formData.color === color.value ? 2 : 0}
                    borderColor="$color12"
                  >
                    <Text color="white" fontSize="$2">
                      {color.label}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </FormField>

            {/* Ícone */}
            <FormField label="Ícone">
              <XStack gap="$2" flexWrap="wrap">
                {ICONS.map((iconName) => {
                  const IconComponent = ICON_MAP[iconName]
                  return (
                    <Button
                      key={iconName}
                      size="$3"
                      variant={formData.icon === iconName ? undefined : 'outlined'}
                      onPress={() => setFormData({ ...formData, icon: iconName })}
                      icon={IconComponent}
                    />
                  )
                })}
              </XStack>
            </FormField>
          </YStack>
        </BottomSheetModal>

        {/* Modal de Filtros */}
        <AdminFilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApply={handleApplyFilter}
          onClear={handleClearFilter}
          title="Filtrar Categorias"
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
              placeholder="Nome da categoria..."
              value={localSearchQuery}
              onChangeText={setLocalSearchQuery}
            />
          </YStack>
        </AdminFilterModal>
      </YStack>
    </SafeAreaView>
  )
}
