import { useState } from 'react'
import { Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { YStack, XStack, Text, Button, ScrollView, Separator } from 'tamagui'
import { MapPin, Navigation, X } from '@tamagui/lucide-icons'
import { CitySelector } from './CitySelector'

interface LocationModalProps {
  visible: boolean
  onClose: () => void
  onAutoDetect: () => void
  onManualSelect: (city: string, state: string) => void
  isDetecting: boolean
}

/**
 * Modal para escolha de localização
 * Oferece 2 opções: Auto-detecção GPS ou Seleção manual
 */
export function LocationModal({
  visible,
  onClose,
  onAutoDetect,
  onManualSelect,
  isDetecting,
}: LocationModalProps) {
  const [mode, setMode] = useState<'choose' | 'manual'>('choose')

  const handleManualSelect = (city: string, state: string) => {
    onManualSelect(city, state)
    setMode('choose') // Reset mode
    onClose()
  }

  const handleAutoDetect = () => {
    onAutoDetect()
    setMode('choose') // Reset mode
    // Don't close modal yet - let parent handle it
  }

  const handleClose = () => {
    setMode('choose') // Reset mode
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <YStack flex={1} backgroundColor="rgba(0,0,0,0.5)" justifyContent="flex-end">
          {/* Modal Content */}
          <YStack
            backgroundColor="$background"
            borderTopLeftRadius="$6"
            borderTopRightRadius="$6"
            padding="$4"
            maxHeight="80%"
          >
            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <Text fontSize="$6" fontWeight="600">
                {mode === 'choose' ? 'Localização' : 'Escolher Cidade'}
              </Text>
              <Button
                circular
                size="$3"
                chromeless
                icon={X}
                onPress={handleClose}
                disabled={isDetecting}
              />
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              {mode === 'choose' && (
                <YStack gap="$3">
                  {/* Auto-detect option */}
                  <Button
                    size="$5"
                    backgroundColor="$blue9"
                    borderRadius="$4"
                    onPress={handleAutoDetect}
                    disabled={isDetecting}
                    icon={Navigation}
                  >
                    {isDetecting ? 'Detectando...' : 'Detectar Automaticamente'}
                  </Button>

                  <XStack alignItems="center" gap="$2" paddingVertical="$2">
                    <Separator flex={1} />
                    <Text fontSize="$2" color="$color11">
                      ou
                    </Text>
                    <Separator flex={1} />
                  </XStack>

                  {/* Manual selection option */}
                  <Button
                    size="$5"
                    backgroundColor="$color3"
                    borderColor="$borderColor"
                    borderWidth={1}
                    borderRadius="$4"
                    onPress={() => setMode('manual')}
                    disabled={isDetecting}
                    icon={MapPin}
                    color="$color12"
                  >
                    Escolher Manualmente
                  </Button>

                  <Text fontSize="$2" color="$color11" textAlign="center" marginTop="$2">
                    A localização ajuda a mostrar eventos próximos a você
                  </Text>
                </YStack>
              )}

              {mode === 'manual' && (
                <YStack gap="$4">
                  <Text fontSize="$3" color="$color11">
                    Selecione seu estado e cidade para continuar
                  </Text>

                  <CitySelector onSelect={handleManualSelect} />

                  <Button
                    size="$4"
                    chromeless
                    color="$color11"
                    onPress={() => setMode('choose')}
                    marginTop="$2"
                  >
                    Voltar
                  </Button>
                </YStack>
              )}
            </ScrollView>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  )
}
