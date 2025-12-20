import { useState } from 'react'
import { YStack } from 'tamagui'
import { StateCitySelect } from '@features/geo'

interface CitySelectorProps {
  onSelect: (city: string, state: string) => void
}

/**
 * Seletor manual de cidade
 * Usado quando GPS falha ou usuário prefere escolher manualmente
 */
export function CitySelector({ onSelect }: CitySelectorProps) {
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    setSelectedCity('') // Reset city when state changes
  }

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName)

    // Only call onSelect when both state and city are selected
    if (selectedState && cityName) {
      onSelect(cityName, selectedState)
    }
  }

  return (
    <YStack gap="$3">
      <StateCitySelect
        stateValue={selectedState}
        cityValue={selectedCity}
        onStateChange={handleStateChange}
        onCityChange={handleCityChange}
        showStateLabel={true}
        showCityLabel={true}
        statePlaceholder="Selecione o estado"
        cityPlaceholder="Selecione a cidade"
      />
    </YStack>
  )
}
