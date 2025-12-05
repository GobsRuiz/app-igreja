import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Card,
  Text,
  Button,
  Input,
  Dialog,
  ScrollView,
  Spinner,
} from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Edit, Trash2, X, MapPin } from '@tamagui/lucide-icons'
import { Alert } from 'react-native'
import { toast } from 'sonner-native'
import {
  onLocationsChange,
  createLocation,
  updateLocation,
  deleteLocation,
  type Location,
  type CreateLocationData,
} from '@features/locations'

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState<CreateLocationData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [submitting, setSubmitting] = useState(false)

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
    setDialogOpen(true)
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
    setDialogOpen(true)
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
    setDialogOpen(false)
    setFormData({ name: '', address: '', city: '', state: '', zipCode: '' })
  }

  const handleDelete = (location: Location) => {
    Alert.alert(
      'Deletar Local',
      `Tem certeza que deseja deletar "${location.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteLocation(location.id)

            if (error) {
              toast.error(error)
              return
            }

            toast.success('Local deletado!')
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$color12" />
        </YStack>
      </SafeAreaView>
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
            size="$3"
            backgroundColor="$green10"
            color="white"
            icon={Plus}
            onPress={handleOpenCreate}
          >
            Novo
          </Button>
        </XStack>

        {/* Lista */}
        {locations.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Text fontSize="$5" color="$mutedForeground">
              Nenhum local cadastrado
            </Text>
            <Text fontSize="$3" color="$mutedForeground">
              Clique em "Novo" para criar
            </Text>
          </YStack>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {locations.map((location) => (
                <Card key={location.id} elevate size="$4" bordered padding="$4">
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
                        size="$3"
                        variant="outlined"
                        icon={Edit}
                        onPress={() => handleOpenEdit(location)}
                        circular
                      />
                      <Button
                        size="$3"
                        variant="outlined"
                        borderColor="$red10"
                        color="$red10"
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

        {/* Dialog Create/Edit */}
        <Dialog modal open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              animation="quick"
              opacity={0.5}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />

            <Dialog.Content
              bordered
              elevate
              key="content"
              animateOnly={['transform', 'opacity']}
              animation={[
                'quick',
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
              gap="$4"
              padding="$4"
            >
              <Dialog.Title fontSize="$7" fontWeight="700">
                {editingLocation ? 'Editar Local' : 'Novo Local'}
              </Dialog.Title>

              <ScrollView maxHeight={500}>
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

                  {/* Cidade */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Cidade *
                    </Text>
                    <Input
                      size="$4"
                      placeholder="Ex: São Paulo"
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                    />
                  </YStack>

                  {/* Estado */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Estado *
                    </Text>
                    <Input
                      size="$4"
                      placeholder="Ex: SP"
                      value={formData.state}
                      onChangeText={(text) => setFormData({ ...formData, state: text })}
                      maxLength={2}
                    />
                  </YStack>

                  {/* CEP */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      CEP (opcional)
                    </Text>
                    <Input
                      size="$4"
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                      keyboardType="numeric"
                    />
                  </YStack>
                </YStack>
              </ScrollView>

              <XStack gap="$3" marginTop="$2">
                <Dialog.Close asChild>
                  <Button flex={1} variant="outlined" icon={X}>
                    Cancelar
                  </Button>
                </Dialog.Close>

                <Button
                  flex={1}
                  backgroundColor="$green10"
                  color="white"
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
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </YStack>
    </SafeAreaView>
  )
}
