import { useState, useCallback, useMemo, useRef } from 'react'
import { YStack, XStack, Text, Button } from 'tamagui'
import { X } from '@tamagui/lucide-icons'
import { toast } from 'sonner-native'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'

import { StateCitySelect } from '@features/geo/components/state-city-select'
import { useFavoriteCitiesStore } from '@shared/store'

interface AddFavoriteCityModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddFavoriteCityModal({ isOpen, onClose }: AddFavoriteCityModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const toggleFavorite = useFavoriteCitiesStore((state) => state.toggleFavorite)
  const isFavorite = useFavoriteCitiesStore((state) => state.isFavorite(selectedState, selectedCity))

  const snapPoints = useMemo(() => ['75%'], [])

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

    // Resetar e fechar
    setSelectedState('')
    setSelectedCity('')
    bottomSheetRef.current?.close()
  }, [selectedState, selectedCity, isFavorite, toggleFavorite])

  const handleClose = useCallback(() => {
    setSelectedState('')
    setSelectedCity('')
    bottomSheetRef.current?.close()
  }, [])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={handleClose}
      />
    ),
    [handleClose]
  )

  // Sincronizar isOpen com bottomSheet
  if (isOpen && bottomSheetRef.current) {
    bottomSheetRef.current.snapToIndex(0)
  } else if (!isOpen && bottomSheetRef.current) {
    bottomSheetRef.current.close()
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'white' }}
    >
      <BottomSheetView style={{ flex: 1, padding: 20 }}>
        <YStack gap="$4" flex={1}>
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$6" fontWeight="700">
              Adicionar Cidade Favorita
            </Text>
            <Button
              size="$3"
              circular
              chromeless
              onPress={handleClose}
              icon={<X size={20} />}
            />
          </XStack>

          {/* Selector */}
          <StateCitySelect
            stateValue={selectedState}
            cityValue={selectedCity}
            onStateChange={setSelectedState}
            onCityChange={setSelectedCity}
            showStateLabel={true}
            showCityLabel={true}
            showFavoriteButton={false}
          />

          {/* Actions */}
          <XStack gap="$3" justifyContent="flex-end">
            <Button variant="outlined" onPress={handleClose}>
              Cancelar
            </Button>
            <Button
              onPress={handleAddFavorite}
              disabled={!selectedState || !selectedCity || selectedCity === ''}
            >
              Adicionar
            </Button>
          </XStack>
        </YStack>
      </BottomSheetView>
    </BottomSheet>
  )
}
