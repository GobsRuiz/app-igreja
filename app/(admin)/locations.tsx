import React, { useState, useEffect, useCallback } from 'react'
import {
  YStack,
  XStack,
  Text,
  Input,
  ScrollView,
  Spinner,
  Sheet,
} from 'tamagui'
import { Button, Card, EmptyState, MaskedInput } from '@shared/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Pencil, Trash2, X, MapPin } from '@tamagui/lucide-icons'
import { Alert } from 'react-native'
import { toast } from 'sonner-native'
import {
  onLocationsChange,
  createLocation,
  updateLocation,
  deleteLocation,
  checkLocationInUse,
  type Location,
  type CreateLocationData,
} from '@features/locations'
import { StateCitySelect } from '@features/geo'

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState<CreateLocationData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Memoized handlers for StateCitySelect to prevent infinite loops
  const handleStateChange = useCallback((state: string) => {
    setFormData((prev) => ({ ...prev, state, city: '' }))
  }, [])

  const handleCityChange = useCallback((city: string) => {
    setFormData((prev) => ({ ...prev, city }))
  }, [])

  // Listener em tempo real
  useEffect(() => {
    const unsubscribe = onLocationsChange(
      (data) => {
        setLocations(data)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar locais:', error)
        toast.error('Erro ao carregar locais')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleOpenCreate = () => {
    setEditingLocation(null)
    setFormData({ name: '', address: '', city: '', state: '', zipCode: '' })
    setSheetOpen(true)
  }

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode || '',
    })
    setSheetOpen(true)
  }

  const handleClose = () => {
    setSheetOpen(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    if (editingLocation) {
      // Update
      const { error } = await updateLocation(editingLocation.id, formData)

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Local atualizado!')
    } else {
      // Create
      const { error } = await createLocation(formData)

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Local criado!')
    }

    setSubmitting(false)
    handleClose()
    setFormData({ name: '', address: '', city: '', state: '', zipCode: '' })

    // Show loading while listener updates data
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  const handleDelete = async (location: Location) => {
    // Check if location is being used by events
    const { inUse, error: checkError } = await checkLocationInUse(location.id)

    if (checkError) {
      toast.error(checkError)
      return
    }

    if (inUse) {
      Alert.alert(
        'Não é possível deletar',
        'Este local está sendo usado por eventos.\n\nRemova ou altere o local desses eventos antes de deletá-lo.',
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    Alert.alert(
      'Deletar Local',
      `Tem certeza que deseja deletar "${location.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)

            const { error } = await deleteLocation(location.id)

            if (error) {
              toast.error(error)
              setLoading(false)
              return
            }

            toast.success('Local deletado!')

            // Wait for listener to update data
            setTimeout(() => {
              setLoading(false)
            }, 300)
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Locais
          </Text>
          <Button
            variant="primary"
            icon={Plus}
            onPress={handleOpenCreate}
          >
            Novo
          </Button>
        </XStack>

        {/* Lista ou Loading */}
        {loading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="large" color="$color12" />
          </YStack>
        ) : locations.length === 0 ? (
          <EmptyState
            icon={<MapPin size={48} color="$foreground" />}
            message="Nenhum local cadastrado"
            description="Clique em &quot;Novo&quot; para criar"
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {locations.map((location) => (
                <Card key={location.id}>
                  <XStack alignItems="flex-start" justifyContent="space-between">
                    <XStack alignItems="flex-start" gap="$3" flex={1}>
                      {/* Ícone */}
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$2"
                        backgroundColor="$green2"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <MapPin size={20} color="$green10" />
                      </YStack>

                      <YStack flex={1} gap="$1">
                        <Text fontSize="$5" fontWeight="600" color="$color12">
                          {location.name}
                        </Text>
                        <Text fontSize="$3" color="$color11">
                          {location.address}
                        </Text>
                        <Text fontSize="$2" color="$color10">
                          {location.city} - {location.state}
                          {location.zipCode && ` • ${location.zipCode}`}
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack gap="$2">
                      <Button
                        variant="outlined"
                        icon={Pencil}
                        onPress={() => handleOpenEdit(location)}
                        circular
                      />
                      <Button
                        variant="danger"
                        icon={Trash2}
                        onPress={() => handleDelete(location)}
                        circular
                      />
                    </XStack>
                  </XStack>
                </Card>
              ))}
            </YStack>
          </ScrollView>
        )}

        {/* Sheet Create/Edit */}
        <Sheet
          modal
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          snapPoints={[85]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay />
          <Sheet.Frame padding="$4" backgroundColor="$background">
            <Sheet.Handle />
            <YStack gap="$4">
              <Text fontSize="$7" fontWeight="700" color="$foreground">
                {editingLocation ? 'Editar Local' : 'Novo Local'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <YStack gap="$4">
                  {/* Nome */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Nome *
                    </Text>
                    <Input
                      size="$4"
                      placeholder="Ex: Igreja Central, Templo Norte..."
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </YStack>

                  {/* Endereço */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Endereço *
                    </Text>
                    <Input
                      size="$4"
                      placeholder="Rua, número, bairro"
                      value={formData.address}
                      onChangeText={(text) => setFormData({ ...formData, address: text })}
                    />
                  </YStack>

                  {/* Estado e Cidade */}
                  <StateCitySelect
                    stateValue={formData.state}
                    cityValue={formData.city}
                    onStateChange={handleStateChange}
                    onCityChange={handleCityChange}
                  />

                  {/* CEP */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      CEP (opcional)
                    </Text>
                    <MaskedInput
                      preset="CEP"
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChangeText={(masked, unmasked) =>
                        setFormData({ ...formData, zipCode: unmasked || '' })
                      }
                      keyboardType="numeric"
                    />
                  </YStack>
                </YStack>
              </ScrollView>

              <XStack gap="$3" marginTop="$4">
                <Button
                  flex={1}
                  variant="outlined"
                  icon={X}
                  onPress={handleClose}
                  disabled={submitting}
                  opacity={submitting ? 0.5 : 1}
                >
                  Cancelar
                </Button>

                <Button
                  flex={1}
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={
                    submitting ||
                    !formData.name.trim() ||
                    !formData.address.trim() ||
                    !formData.city.trim() ||
                    !formData.state.trim()
                  }
                  opacity={
                    submitting ||
                    !formData.name.trim() ||
                    !formData.address.trim() ||
                    !formData.city.trim() ||
                    !formData.state.trim()
                      ? 0.5
                      : 1
                  }
                >
                  {submitting ? 'Salvando...' : editingLocation ? 'Atualizar' : 'Criar'}
                </Button>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      </YStack>
    </SafeAreaView>
  )
}
