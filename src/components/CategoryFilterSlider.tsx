import { useCallback, useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { XStack, YStack, Text } from 'tamagui'
import { Button } from '@shared/ui'
import { onCategoriesChange, type Category } from '@features/categories'
import { useEventStore } from '@shared/store'

// Mapeamento de ícones (mesma estrutura da tela de admin)
import {
  Calendar,
  Heart,
  Music,
  Book,
  Coffee,
  Star,
  Users,
  Home,
} from '@tamagui/lucide-icons'

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

export function CategoryFilterSlider() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const selectedCategoryIds = useEventStore((state) => state.selectedCategoryIds)
  const toggleCategoryId = useEventStore((state) => state.toggleCategoryId)

  // Listener de categorias em tempo real
  useEffect(() => {
    const unsubscribe = onCategoriesChange(
      (data) => {
        setCategories(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading categories:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleAllPress = useCallback(() => {
    // Clear all selected categories
    selectedCategoryIds.forEach((id) => {
      toggleCategoryId(id)
    })
  }, [selectedCategoryIds, toggleCategoryId])

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      toggleCategoryId(categoryId)
    },
    [toggleCategoryId]
  )

  const isAllSelected = selectedCategoryIds.size === 0

  if (loading) {
    return null
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <YStack paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <XStack gap="$2">
          {/* Botão "Todos" */}
          <Button
            size="$3"
            variant={isAllSelected ? 'primary' : 'outlined'}
            onPress={handleAllPress}
            paddingHorizontal="$4"
          >
            Todos
          </Button>

          {/* Categorias */}
          {categories.map((category) => {
            const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP]
            const isSelected = selectedCategoryIds.has(category.id)

            return (
              <Button
                key={category.id}
                size="$3"
                variant={isSelected ? undefined : 'outlined'}
                backgroundColor={isSelected ? category.color : 'transparent'}
                borderColor={isSelected ? category.color : '$borderColor'}
                color={isSelected ? 'white' : '$color11'}
                onPress={() => handleCategoryPress(category.id)}
                paddingHorizontal="$3"
                icon={IconComponent ? <IconComponent size={16} /> : undefined}
              >
                {category.name}
              </Button>
            )
          })}
        </XStack>
      </ScrollView>
    </YStack>
  )
}
