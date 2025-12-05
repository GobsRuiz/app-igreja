import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import Slider from '@react-native-community/slider'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar, MapPin, Tag } from '@tamagui/lucide-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { Text, useTheme, XStack, YStack } from 'tamagui'
import { Button } from '@shared/ui'

import { brazilStates, getCitiesByStateCode } from '@shared/data/brazil-locations'
import { useEventStore } from '@shared/store/use-event-store'
import { EVENT_TYPES, EventType } from '@shared/types/event'
import { Formatters } from '@shared/utils/formatters'

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
  const selectedEventTypes = useEventStore((state) => state.selectedEventTypes)
  const radiusKm = useEventStore((state) => state.radiusKm)
  const startDate = useEventStore((state) => state.startDate)
  const endDate = useEventStore((state) => state.endDate)

  const setSelectedCity = useEventStore((state) => state.setSelectedCity)
  const toggleEventType = useEventStore((state) => state.toggleEventType)
  const setRadiusKm = useEventStore((state) => state.setRadiusKm)
  const setDateRange = useEventStore((state) => state.setDateRange)
  const clearFilters = useEventStore((state) => state.clearFilters)

  // Estados locais para edição antes de aplicar
  const [localCity, setLocalCity] = useState(selectedCity)
  const [localState, setLocalState] = useState('SP')
  const [localRadius, setLocalRadius] = useState(radiusKm)
  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(startDate)
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(endDate)
  const [localEventTypes, setLocalEventTypes] = useState<Set<EventType>>(new Set(selectedEventTypes))

  // DatePicker states
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  // Cidades filtradas por estado
  const cities = useMemo(() => getCitiesByStateCode(localState), [localState])

  // Sincroniza estado local com store quando modal abre
  useEffect(() => {
    if (isOpen) {
      setLocalCity(selectedCity)
      setLocalRadius(radiusKm)
      setLocalStartDate(startDate)
      setLocalEndDate(endDate)
      setLocalEventTypes(new Set(selectedEventTypes))
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isOpen, selectedCity, radiusKm, startDate, endDate, selectedEventTypes])

  // Quando muda o estado, seleciona primeira cidade
  useEffect(() => {
    const citiesForState = getCitiesByStateCode(localState)
    if (citiesForState.length > 0 && !citiesForState.includes(localCity)) {
      setLocalCity(citiesForState[0])
    }
  }, [localState, localCity])

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

    // Aplica tipos de evento (toggle os que mudaram)
    const currentTypes = new Set(selectedEventTypes)
    localEventTypes.forEach((type) => {
      if (!currentTypes.has(type)) {
        toggleEventType(type)
      }
    })
    currentTypes.forEach((type) => {
      if (!localEventTypes.has(type)) {
        toggleEventType(type)
      }
    })

    onClose()
  }, [localCity, localRadius, localStartDate, localEndDate, localEventTypes, selectedCity, radiusKm, startDate, endDate, selectedEventTypes, setSelectedCity, setRadiusKm, setDateRange, toggleEventType, onClose])

  const handleClear = useCallback(() => {
    setLocalState('SP')
    setLocalCity('Taquaritinga')
    setLocalRadius(10)
    setLocalStartDate(undefined)
    setLocalEndDate(undefined)
    setLocalEventTypes(new Set())
  }, [])

  const handleToggleEventType = (type: EventType) => {
    setLocalEventTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  const stateItems = brazilStates.map((s) => ({ label: s.name, value: s.code }))
  const cityItems = cities.map((c) => ({ label: c, value: c }))

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
                <YStack gap="$1">
                  <Text fontSize="$3" color="$color11">Estado</Text>
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
                    placeholder="Selecione o estado"
                    searchPlaceholder="Buscar..."
                    value={localState}
                    onChange={(item) => setLocalState(item.value)}
                  />
                </YStack>

                <YStack gap="$1">
                  <Text fontSize="$3" color="$color11">Cidade</Text>
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
                    placeholder="Selecione a cidade"
                    searchPlaceholder="Buscar..."
                    value={localCity}
                    onChange={(item) => setLocalCity(item.value)}
                  />
                </YStack>

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

            {/* Tipos de Evento */}
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Tag size={20} color="$color11" />
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Tipos de Evento
                </Text>
              </XStack>

              <XStack flexWrap="wrap" gap="$2">
                {EVENT_TYPES.map((type) => (
                  <Button
                    key={type}
                    size="$3"
                    variant="outlined"
                    backgroundColor={localEventTypes.has(type) ? '$color3' : 'transparent'}
                    borderColor={localEventTypes.has(type) ? '$color8' : '$borderColor'}
                    color={localEventTypes.has(type) ? '$color12' : '$color11'}
                    onPress={() => handleToggleEventType(type)}
                  >
                    {type}
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
