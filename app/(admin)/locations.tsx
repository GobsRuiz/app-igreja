import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  YStack,
  XStack,
  Text,
  Input,
  ScrollView,
} from 'tamagui'
import { Button, Card, EmptyState, MaskedInput, AdminLoadingState, AdminActionButtons, BottomSheetModal, toast, AdminModalFooter, FormField, AdminFilterModal } from '@shared/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, X, MapPin, SlidersHorizontal, Search } from '@tamagui/lucide-icons'
import { Dropdown } from 'react-native-element-dropdown'
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
import { useAdminDelete } from '@shared/hooks'

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

  // Processing state for action buttons
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Filter states - LOCAL (edited in modal, not yet applied)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [localStateFilter, setLocalStateFilter] = useState<string>('all')
  const [localCityFilter, setLocalCityFilter] = useState<string>('all')

  // Filter states - APPLIED (used for filtering the list)
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')

  // Filter modal state
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  // Delete handler
  const { handleDelete } = useAdminDelete<Location>({
    entityName: 'Local',
    getItemName: (location) => location.name,
    deleteAction: deleteLocation,
    checkInUse: checkLocationInUse,
    setLoading,
    setProcessingId,
  })

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
        // Ordena locais do mais recente para o mais antigo (por createdAt se existir, senão por nome)
        const sortedLocations = [...data].sort((a, b) => {
          // Se tiver createdAt, ordena por data
          if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime()
          }
          // Senão, ordena alfabeticamente por nome
          return a.name.localeCompare(b.name)
        })
        setLocations(sortedLocations)
        setLoading(false)
      },
      () => {
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
    setProcessingId(location.id)
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode || '',
    })
    setSheetOpen(true)
    setProcessingId(null)
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

  // Filter handlers
  const handleOpenFilter = () => {
    setLocalSearchQuery(searchQuery)
    setLocalStateFilter(stateFilter)
    setLocalCityFilter(cityFilter)
    setFilterModalOpen(true)
  }

  const handleApplyFilter = () => {
    setSearchQuery(localSearchQuery)
    setStateFilter(localStateFilter)
    setCityFilter(localCityFilter)
    setFilterModalOpen(false)
  }

  const handleClearFilter = () => {
    setLocalSearchQuery('')
    setLocalStateFilter('all')
    setLocalCityFilter('all')
  }

  // Get unique states and cities for filter dropdowns
  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(locations.map((l) => l.state))).sort()
    return [{ label: 'Todos', value: 'all' }, ...states.map((s) => ({ label: s, value: s }))]
  }, [locations])

  const uniqueCities = useMemo(() => {
    const filteredByState = localStateFilter === 'all'
      ? locations
      : locations.filter((l) => l.state === localStateFilter)
    const cities = Array.from(new Set(filteredByState.map((l) => l.city))).sort()
    return [{ label: 'Todos', value: 'all' }, ...cities.map((c) => ({ label: c, value: c }))]
  }, [locations, localStateFilter])

  // Filtered locations - memoized for performance
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      // Search filter (name or address)
      const matchesSearch =
        !searchQuery.trim() ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase())

      // State filter
      const matchesState = stateFilter === 'all' || location.state === stateFilter

      // City filter
      const matchesCity = cityFilter === 'all' || location.city === cityFilter

      return matchesSearch && matchesState && matchesCity
    })
  }, [locations, searchQuery, stateFilter, cityFilter])

  // Check if filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || stateFilter !== 'all' || cityFilter !== 'all'

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Locais
          </Text>
          <XStack gap="$3" alignItems="center">
            {/* Botão Filtros */}
            <Button
              variant="outlined"
              icon={SlidersHorizontal}
              onPress={handleOpenFilter}
              {...(hasActiveFilters && {
                style: {
                  backgroundColor: '$color3',
                  borderColor: '$color8',
                },
              })}
            >
              Filtros
            </Button>

            <Button variant="primary" icon={Plus} onPress={handleOpenCreate}>
              Novo
            </Button>
          </XStack>
        </XStack>

        {/* Lista ou Loading */}
        {loading ? (
          <AdminLoadingState />
        ) : filteredLocations.length === 0 ? (
          <EmptyState
            icon={<MapPin size={48} color="$foreground" />}
            message={
              locations.length === 0
                ? 'Nenhum local cadastrado'
                : 'Nenhum local encontrado com os filtros aplicados'
            }
            description={
              locations.length === 0
                ? 'Clique em "Novo" para criar'
                : 'Tente ajustar os filtros'
            }
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {filteredLocations.map((location) => (
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

                    <AdminActionButtons
                      disabled={loading || submitting || sheetOpen}
                      isEditProcessing={processingId === location.id}
                      isDeleteProcessing={processingId === location.id}
                      onEdit={() => handleOpenEdit(location)}
                      onDelete={() => handleDelete(location)}
                    />
                  </XStack>
                </Card>
              ))}
            </YStack>
          </ScrollView>
        )}

        {/* Modal Create/Edit */}
        <BottomSheetModal
          isOpen={sheetOpen}
          onClose={handleClose}
          size="large"
          header={
            <Text fontSize="$7" fontWeight="700" color="$foreground">
              {editingLocation ? 'Editar Local' : 'Novo Local'}
            </Text>
          }
          footer={
            <AdminModalFooter
              onCancel={handleClose}
              onConfirm={handleSubmit}
              confirmText={submitting ? 'Salvando...' : editingLocation ? 'Atualizar' : 'Criar'}
              confirmDisabled={
                submitting ||
                !formData.name.trim() ||
                !formData.address.trim() ||
                !formData.city.trim() ||
                !formData.state.trim()
              }
              submitting={submitting}
            />
          }
          contentContainerProps={{ padding: '$4', gap: '$4' }}
        >
          <YStack gap="$4">
            {/* Nome */}
            <FormField label="Nome" required>
              <Input
                size="$4"
                placeholder="Ex: Igreja Central, Templo Norte..."
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </FormField>

            {/* Endereço */}
            <FormField label="Endereço" required>
              <Input
                size="$4"
                placeholder="Rua, número, bairro"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
              />
            </FormField>

            {/* Estado e Cidade */}
            <StateCitySelect
              stateValue={formData.state}
              cityValue={formData.city}
              onStateChange={handleStateChange}
              onCityChange={handleCityChange}
            />

            {/* CEP */}
            <FormField label="CEP (opcional)">
              <MaskedInput
                preset="CEP"
                placeholder="00000-000"
                value={formData.zipCode}
                onChangeText={(masked, unmasked) =>
                  setFormData({ ...formData, zipCode: unmasked || '' })
                }
                keyboardType="numeric"
              />
            </FormField>
          </YStack>
        </BottomSheetModal>

        {/* Modal de Filtros */}
        <AdminFilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApply={handleApplyFilter}
          onClear={handleClearFilter}
          title="Filtrar Locais"
        >
          {/* Busca por texto */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <Search size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Busca
              </Text>
            </XStack>
            <Input
              size="$4"
              placeholder="Nome ou endereço..."
              value={localSearchQuery}
              onChangeText={setLocalSearchQuery}
            />
          </YStack>

          {/* Filtro por Estado */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <MapPin size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Estado
              </Text>
            </XStack>
            <Dropdown
              data={uniqueStates}
              labelField="label"
              valueField="value"
              value={localStateFilter}
              onChange={(item) => {
                setLocalStateFilter(item.value)
                if (item.value !== localStateFilter) {
                  setLocalCityFilter('all')
                }
              }}
              placeholder="Selecione um estado"
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            />
          </YStack>

          {/* Filtro por Cidade */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <MapPin size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Cidade
              </Text>
            </XStack>
            <Dropdown
              data={uniqueCities}
              labelField="label"
              valueField="value"
              value={localCityFilter}
              onChange={(item) => setLocalCityFilter(item.value)}
              placeholder="Selecione uma cidade"
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
              disable={localStateFilter === 'all'}
            />
          </YStack>
        </AdminFilterModal>
      </YStack>
    </SafeAreaView>
  )
}
