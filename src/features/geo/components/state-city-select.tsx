import { useEffect, useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown'
import { Text, useTheme, YStack } from 'tamagui'

import { onStatesChange, onCitiesByStateChange, type State, type City } from '../services'

interface StateCitySelectProps {
  stateValue: string
  cityValue: string
  onStateChange: (stateCode: string) => void
  onCityChange: (cityName: string) => void
  showStateLabel?: boolean
  showCityLabel?: boolean
  statePlaceholder?: string
  cityPlaceholder?: string
}

export function StateCitySelect({
  stateValue,
  cityValue,
  onStateChange,
  onCityChange,
  showStateLabel = true,
  showCityLabel = true,
  statePlaceholder = 'Selecione o estado',
  cityPlaceholder = 'Selecione a cidade',
}: StateCitySelectProps) {
  const theme = useTheme()

  // Dados do Firestore
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])

  // Listener de estados (monta UMA VEZ)
  useEffect(() => {
    const unsubscribeStates = onStatesChange(
      (data) => setStates(data),
      (error) => console.error('Erro ao carregar estados:', error)
    )

    return () => {
      unsubscribeStates()
    }
  }, [])

  // Listener de cidades (REATIVO a stateValue)
  useEffect(() => {
    if (!stateValue) return

    const unsubscribe = onCitiesByStateChange(
      stateValue,
      (data) => setCities(data),
      (error) => console.error('Erro ao carregar cidades:', error)
    )

    return () => unsubscribe()
  }, [stateValue])

  // Auto-seleção de primeira cidade quando lista muda
  useEffect(() => {
    if (cities.length > 0 && !cities.find((c) => c.name === cityValue)) {
      onCityChange(cities[0].name)
    }
  }, [cities, cityValue, onCityChange])

  // Transformação para dropdown
  const stateItems = states.map((s) => ({ label: s.name, value: s.code }))
  const cityItems = cities.map((c) => ({ label: c.name, value: c.name }))

  // Estilos consistentes com FilterModal
  const dropdownStyles = {
    dropdown: {
      height: 50,
      borderColor: theme.borderColor?.val || '#e5e5e5',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.background?.val || '#fff',
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
    <YStack gap="$3">
      {/* Estado */}
      <YStack gap="$1">
        {showStateLabel && (
          <Text fontSize="$3" color="$color11">
            Estado
          </Text>
        )}
        <Dropdown
          style={dropdownStyles.dropdown}
          placeholderStyle={dropdownStyles.placeholderStyle}
          selectedTextStyle={dropdownStyles.selectedTextStyle}
          inputSearchStyle={dropdownStyles.inputSearchStyle}
          data={stateItems}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={statePlaceholder}
          searchPlaceholder="Buscar..."
          value={stateValue}
          onChange={(item) => onStateChange(item.value)}
        />
      </YStack>

      {/* Cidade */}
      <YStack gap="$1">
        {showCityLabel && (
          <Text fontSize="$3" color="$color11">
            Cidade
          </Text>
        )}
        <Dropdown
          style={dropdownStyles.dropdown}
          placeholderStyle={dropdownStyles.placeholderStyle}
          selectedTextStyle={dropdownStyles.selectedTextStyle}
          inputSearchStyle={dropdownStyles.inputSearchStyle}
          data={cityItems}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={cityPlaceholder}
          searchPlaceholder="Buscar..."
          value={cityValue}
          onChange={(item) => onCityChange(item.value)}
        />
      </YStack>
    </YStack>
  )
}
