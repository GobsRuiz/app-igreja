import { useEffect, useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown'
import { useTheme } from 'tamagui'

import { onLocationsChange } from '../services/location.service'
import type { Location } from '../types/location.types'

interface LocationSelectProps {
  value: string
  onChange: (locationId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function LocationSelect({
  value,
  onChange,
  placeholder = 'Selecione um local',
  disabled = false,
}: LocationSelectProps) {
  const theme = useTheme()

  // Dados do Firestore
  const [locations, setLocations] = useState<Location[]>([])

  // Listener de locais
  useEffect(() => {
    const unsubscribe = onLocationsChange(
      (data) => setLocations(data),
      () => {
        // Error loading locations
      }
    )

    return () => unsubscribe()
  }, [])

  // Transformação para dropdown (Nome - Cidade, Estado)
  const locationItems = locations.map((loc) => ({
    label: `${loc.name} - ${loc.city}, ${loc.state}`,
    value: loc.id,
  }))

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
      data={locationItems}
      search
      maxHeight={300}
      labelField="label"
      valueField="value"
      placeholder={placeholder}
      searchPlaceholder="Buscar local..."
      value={value}
      onChange={(item) => onChange(item.value)}
      disable={disabled}
    />
  )
}
