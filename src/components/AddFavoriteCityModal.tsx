import { useState, useCallback } from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { BottomSheetModal, Button, toast } from '@shared/ui'

import { StateCitySelect } from '@features/geo/components/state-city-select'
import { useFavoriteCitiesStore } from '@shared/store'

interface AddFavoriteCityModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddFavoriteCityModal({ isOpen, onClose }: AddFavoriteCityModalProps) {
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const toggleFavorite = useFavoriteCitiesStore((state) => state.toggleFavorite)
  const isFavorite = useFavoriteCitiesStore((state) =>
    state.isFavorite(selectedState, selectedCity)
  )

  const handleAddFavorite = useCallback(() => {
    if (!selectedState || !selectedCity || selectedCity === '') {
      toast.warning('Selecione um estado e uma cidade')
      return
    }

    if (isFavorite) {
      toast.info('Essa cidade já está nos favoritos')
      return
    }

    toggleFavorite(selectedState, selectedCity)
    toast.success(`${selectedCity} adicionada aos favoritos`)

    // Reset and close
    setSelectedState('')
    setSelectedCity('')
    onClose()
  }, [selectedState, selectedCity, isFavorite, toggleFavorite, onClose])

  const handleClose = useCallback(() => {
    setSelectedState('')
    setSelectedCity('')
    onClose()
  }, [onClose])

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
      header={
        <Text fontSize="$6" fontWeight="700" color="$color12">
          Adicionar Cidade Favorita
        </Text>
      }
      footer={
        <XStack gap="$3">
          <Button flex={1} variant="outlined" onPress={handleClose}>
            Cancelar
          </Button>
          <Button
            flex={1}
            variant="primary"
            onPress={handleAddFavorite}
            disabled={!selectedState || !selectedCity || selectedCity === ''}
          >
            Adicionar
          </Button>
        </XStack>
      }
      contentContainerProps={{ padding: '$4', gap: '$4' }}
    >
      <YStack gap="$3">
        <Text fontSize="$3" color="$color11">
          Selecione seu estado e cidade para adicionar aos favoritos
        </Text>

        <StateCitySelect
          stateValue={selectedState}
          cityValue={selectedCity}
          onStateChange={setSelectedState}
          onCityChange={setSelectedCity}
          showStateLabel={true}
          showCityLabel={true}
          showFavoriteButton={false}
        />
      </YStack>
    </BottomSheetModal>
  )
}
