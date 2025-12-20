import { useEffect, useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown'
import { useTheme } from 'tamagui'

import { onCategoriesChange } from '../services/category.service'
import type { Category } from '../types/category.types'

interface CategorySelectProps {
  value: string
  onChange: (categoryId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CategorySelect({
  value,
  onChange,
  placeholder = 'Selecione uma categoria',
  disabled = false,
}: CategorySelectProps) {
  const theme = useTheme()

  // Dados do Firestore
  const [categories, setCategories] = useState<Category[]>([])

  // Listener de categorias
  useEffect(() => {
    const unsubscribe = onCategoriesChange(
      (data) => setCategories(data),
      () => {
        // Error loading categories
      }
    )

    return () => unsubscribe()
  }, [])

  // Transformação para dropdown
  const categoryItems = categories.map((cat) => ({ label: cat.name, value: cat.id }))

  // Estilos consistentes
  const dropdownStyles = {
    dropdown: {
      height: 50,
      borderColor: theme.borderColor?.val || '#e5e5e5',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.background?.val || '#fff',
      opacity: disabled ? 0.6 : 1,
    },
    placeholderStyle: {
      fontSize: 14,
      color: theme.color11?.val || '#666',
    },
    selectedTextStyle: {
      fontSize: 14,
      color: theme.color12?.val || '#000',
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 14,
    },
  }

  return (
    <Dropdown
      style={dropdownStyles.dropdown}
      placeholderStyle={dropdownStyles.placeholderStyle}
      selectedTextStyle={dropdownStyles.selectedTextStyle}
      inputSearchStyle={dropdownStyles.inputSearchStyle}
      data={categoryItems}
      search
      maxHeight={300}
      labelField="label"
      valueField="value"
      placeholder={placeholder}
      searchPlaceholder="Buscar categoria..."
      value={value}
      onChange={(item) => onChange(item.value)}
      disable={disabled}
    />
  )
}
