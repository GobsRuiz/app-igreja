import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import Slider from '@react-native-community/slider'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar, MapPin, Tag } from '@tamagui/lucide-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { Text, useTheme, XStack, YStack } from 'tamagui'
import { Button } from '@shared/ui'

import { useEventStore } from '@shared/store/use-event-store'
import { useLocationStore } from '@shared/store/use-location-store'
import { Formatters } from '@shared/utils/formatters'
import { StateCitySelect } from '@features/geo'
import { onCategoriesChange, type Category } from '@features/categories'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['90%'], [])
  const theme = useTheme()

  // Store global
  const selectedCity = useEventStore((state) => state.selectedCity)
  const selectedCategoryIds = useEventStore((state) => state.selectedCategoryIds)
  const radiusKm = useEventStore((state) => state.radiusKm)
  const startDate = useEventStore((state) => state.startDate)
  const endDate = useEventStore((state) => state.endDate)

  const setSelectedCity = useEventStore((state) => state.setSelectedCity)
  const toggleCategoryId = useEventStore((state) => state.toggleCategoryId)
  const setRadiusKm = useEventStore((state) => state.setRadiusKm)
  const setDateRange = useEventStore((state) => state.setDateRange)
  const clearFilters = useEventStore((state) => state.clearFilters)

  // Location store - localização detectada do usuário
  const userCity = useLocationStore((state) => state.city)
  const userState = useLocationStore((state) => state.state)

  // Dados do Firestore
  const [categories, setCategories] = useState<Category[]>([])

  // Estados locais para edição antes de aplicar
  const [localCity, setLocalCity] = useState(selectedCity)
  const [localState, setLocalState] = useState('SP')
  const [localRadius, setLocalRadius] = useState(radiusKm)
  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(startDate)
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(endDate)
  const [localCategoryIds, setLocalCategoryIds] = useState<Set<string>>(new Set(selectedCategoryIds))

  // DatePicker states
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  // Listeners Firestore
  useEffect(() => {
    const unsubscribeCategories = onCategoriesChange(
      (data) => setCategories(data),
      (error) => console.error('Erro ao carregar categorias:', error)
    )

    return () => {
      unsubscribeCategories()
    }
  }, [])

  // Sincroniza estado local com store quando modal abre
  useEffect(() => {
    if (isOpen) {
      // Sincroniza com localização detectada, senão usa padrões hardcoded
      setLocalState(userState || 'SP')
      setLocalCity(userCity || 'Taquaritinga')

      setLocalRadius(radiusKm)
      setLocalStartDate(startDate)
      setLocalEndDate(endDate)
      setLocalCategoryIds(new Set(selectedCategoryIds))
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isOpen, userCity, userState, radiusKm, startDate, endDate, selectedCategoryIds])

  const handleApply = useCallback(() => {
    // Aplica cidade
    if (localCity !== selectedCity) {
      setSelectedCity(localCity)
    }

    // Aplica raio
    if (localRadius !== radiusKm) {
      setRadiusKm(localRadius)
    }

    // Aplica datas
    if (localStartDate !== startDate || localEndDate !== endDate) {
      setDateRange(localStartDate, localEndDate)
    }

    // Aplica categorias (toggle os que mudaram)
    const currentCategoryIds = new Set(selectedCategoryIds)
    localCategoryIds.forEach((id) => {
      if (!currentCategoryIds.has(id)) {
        toggleCategoryId(id)
      }
    })
    currentCategoryIds.forEach((id) => {
      if (!localCategoryIds.has(id)) {
        toggleCategoryId(id)
      }
    })

    onClose()
  }, [localCity, localRadius, localStartDate, localEndDate, localCategoryIds, selectedCity, radiusKm, startDate, endDate, selectedCategoryIds, setSelectedCity, setRadiusKm, setDateRange, toggleCategoryId, onClose])

  const handleClear = useCallback(() => {
    setLocalState('SP')
    setLocalCity('Taquaritinga')
    setLocalRadius(10)
    setLocalStartDate(undefined)
    setLocalEndDate(undefined)
    setLocalCategoryIds(new Set())
  }, [])

  const handleToggleCategory = (categoryId: string) => {
    setLocalCategoryIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const formatDateForDisplay = (date: Date | undefined): string => {
    if (!date) return 'Selecionar'
    const isoString = date.toISOString().split('T')[0]
    return Formatters.formatDate(isoString)
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={isOpen ? 0 : -1}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
    >
      <YStack flex={1}>
        {/* Header */}
        <YStack padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <Text fontSize="$6" fontWeight="700" color="$color12">
            Filtros
          </Text>
        </YStack>

        {/* Content */}
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          <YStack padding="$4" gap="$5">
            {/* Localização */}
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <MapPin size={20} color="$color11" />
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Localização
                </Text>
              </XStack>

              <YStack gap="$3">
                <StateCitySelect
                  stateValue={localState}
                  cityValue={localCity}
                  onStateChange={setLocalState}
                  onCityChange={setLocalCity}
                />

                <YStack gap="$1">
                  <XStack justifyContent="space-between">
                    <Text fontSize="$3" color="$color11">Raio de busca</Text>
                    <Text fontSize="$3" fontWeight="600" color="$color12">{localRadius} km</Text>
                  </XStack>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={50}
                    step={1}
                    value={localRadius}
                    onValueChange={setLocalRadius}
                    minimumTrackTintColor="#333333"
                    maximumTrackTintColor="#e5e5e5"
                    thumbTintColor="#333333"
                  />
                </YStack>
              </YStack>
            </YStack>

            {/* Período */}
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Calendar size={20} color="$color11" />
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Período
                </Text>
              </XStack>

              <XStack gap="$3">
                <YStack flex={1} gap="$1">
                  <Text fontSize="$3" color="$color11">Data início</Text>
                  <Button
                    variant="outlined"
                    onPress={() => setShowStartPicker(true)}
                  >
                    {formatDateForDisplay(localStartDate)}
                  </Button>
                  {showStartPicker && (
                    <DateTimePicker
                      value={localStartDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, date) => {
                        setShowStartPicker(Platform.OS === 'ios')
                        if (date) setLocalStartDate(date)
                      }}
                    />
                  )}
                </YStack>

                <YStack flex={1} gap="$1">
                  <Text fontSize="$3" color="$color11">Data fim</Text>
                  <Button
                    variant="outlined"
                    onPress={() => setShowEndPicker(true)}
                  >
                    {formatDateForDisplay(localEndDate)}
                  </Button>
                  {showEndPicker && (
                    <DateTimePicker
                      value={localEndDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, date) => {
                        setShowEndPicker(Platform.OS === 'ios')
                        if (date) setLocalEndDate(date)
                      }}
                    />
                  )}
                </YStack>
              </XStack>
            </YStack>

            {/* Categorias */}
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Tag size={20} color="$color11" />
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Categorias
                </Text>
              </XStack>

              <XStack flexWrap="wrap" gap="$2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    size="$3"
                    variant="outlined"
                    backgroundColor={localCategoryIds.has(category.id) ? '$color3' : 'transparent'}
                    borderColor={localCategoryIds.has(category.id) ? '$color8' : '$borderColor'}
                    color={localCategoryIds.has(category.id) ? '$color12' : '$color11'}
                    onPress={() => handleToggleCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </XStack>
            </YStack>
          </YStack>
        </BottomSheetScrollView>

        {/* Footer */}
        <YStack
          padding="$4"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          backgroundColor="$background"
        >
          <XStack gap="$3">
            <Button flex={1} variant="outlined" onPress={handleClear}>
              Limpar
            </Button>
            <Button flex={1} variant="primary" onPress={handleApply}>
              Aplicar
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
})
