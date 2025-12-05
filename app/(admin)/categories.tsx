import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Card,
  Text,
  Input,
  ScrollView,
  Spinner,
  Sheet,
} from 'tamagui'
import { Button } from '@shared/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  Heart,
  Music,
  Book,
  Coffee,
  Star,
  Users,
  Home,
} from '@tamagui/lucide-icons'
import { Alert } from 'react-native'
import { toast } from 'sonner-native'
import {
  onCategoriesChange,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type CreateCategoryData,
} from '@features/categories'

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

  // Listener em tempo real
  useEffect(() => {
    const unsubscribe = onCategoriesChange(
      (data) => {
        setCategories(data)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar categorias:', error)
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
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
    })
    setSheetOpen(true)
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
  }

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Deletar Categoria',
      `Tem certeza que deseja deletar "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteCategory(category.id)

            if (error) {
              toast.error(error)
              return
            }

            toast.success('Categoria deletada!')
          },
        },
      ]
    )
  }

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
            Categorias
          </Text>
          <Button
            variant="primary"
            icon={Plus}
            onPress={handleOpenCreate}
          >
            Nova
          </Button>
        </XStack>

        {/* Lista */}
        {categories.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Text fontSize="$5" color="$mutedForeground">
              Nenhuma categoria cadastrada
            </Text>
            <Text fontSize="$3" color="$mutedForeground">
              Clique em "Nova" para criar
            </Text>
          </YStack>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {categories.map((category) => (
                <Card key={category.id} size="$4" bordered padding="$4" backgroundColor="$background">
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

                    <XStack gap="$2">
                      <Button
                        variant="outlined"
                        icon={Pencil}
                        onPress={() => handleOpenEdit(category)}
                        circular
                      />
                      <Button
                        variant="outlined"
                        icon={Trash2}
                        onPress={() => handleDelete(category)}
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
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <YStack gap="$4">
                  {/* Nome */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Nome
                    </Text>
                    <Input
                      size="$4"
                      placeholder="Ex: Culto, Célula, Retiro..."
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </YStack>

                  {/* Cor */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Cor
                    </Text>
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
                  </YStack>

                  {/* Ícone */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Ícone
                    </Text>
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
                  </YStack>
                </YStack>
              </ScrollView>

              <XStack gap="$3" marginTop="$4">
                <Button
                  flex={1}
                  variant="outlined"
                  icon={X}
                  onPress={handleClose}
                >
                  Cancelar
                </Button>

                <Button
                  flex={1}
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={submitting || !formData.name.trim()}
                  opacity={submitting || !formData.name.trim() ? 0.5 : 1}
                >
                  {submitting ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      </YStack>
    </SafeAreaView>
  )
}
