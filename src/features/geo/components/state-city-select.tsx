import { useEffect, useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown'
import { Text, useTheme, YStack } from 'tamagui'

import { onStatesChange, onCitiesChange, onCitiesByStateChange, type State, type City } from '../services'

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
    // Se estado vazio, busca TODAS as cidades
    if (!stateValue) {
      const unsubscribe = onCitiesChange(
        (data) => setCities(data),
        (error) => console.error('Erro ao carregar cidades:', error)
      )
      return () => unsubscribe()
    }

    // Se estado preenchido, filtra por estado
    const unsubscribe = onCitiesByStateChange(
      stateValue,
      (data) => setCities(data),
      (error) => console.error('Erro ao carregar cidades:', error)
    )

    return () => unsubscribe()
  }, [stateValue])

  // Auto-seleção "Todo o estado" quando estado muda (APENAS se cidade ainda não selecionada)
  useEffect(() => {
    // Condições:
    // 1. Estado preenchido
    // 2. Cidade VAZIA (para não sobrescrever quando cascata inversa ocorre)
    // 3. Cidades carregadas
    if (stateValue && !cityValue && cities.length > 0) {
      onCityChange('') // "Todo o estado"
    }
  }, [cities, stateValue, cityValue, onCityChange])

  // Handler para seleção de cidade (cascata inversa)
  const handleCityChange = (cityName: string) => {
    onCityChange(cityName)

    // Se estado vazio E cidade preenchida, descobre qual estado pertence essa cidade
    if (!stateValue && cityName) {
      const selectedCity = cities.find((c) => c.name === cityName)
      if (selectedCity) {
        onStateChange(selectedCity.state)
      }
    }
  }

  // Transformação para dropdown
  const stateItems = states.map((s) => ({ label: s.name, value: s.code }))

  // Adiciona opção "Todo o estado" quando estado está selecionado
  const cityItems = stateValue
    ? [
        { label: 'Todo o estado', value: '' }, // Opção para desmarcar cidade
        ...cities.map((c) => ({ label: c.name, value: c.name })),
      ]
    : cities.map((c) => ({ label: c.name, value: c.name }))

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
          onChange={(item) => handleCityChange(item.value)}
        />
      </YStack>
    </YStack>
  )
}
