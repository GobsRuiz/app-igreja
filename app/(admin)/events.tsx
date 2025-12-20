import { useRolePropagationCheck } from '@features/auth'
import { CategorySelect, onCategoriesChange, type Category } from '@features/categories'
import {
  createEvent,
  deleteEvent,
  onEventsChange,
  updateEvent,
  type CreateEventData,
  type Event,
  type EventStatus,
} from '@features/events'
import { LocationSelect, onLocationsChange, type Location } from '@features/locations'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAdminDelete } from '@shared/hooks'
import { AdminActionButtons, AdminLoadingState, AdminModalFooter, BottomSheetModal, Button, Card, EmptyState, FormField, toast, AdminFilterModal } from '@shared/ui'
import { AlertCircle, Calendar, MapPin, Plus, Tag, SlidersHorizontal, Search } from '@tamagui/lucide-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import React, { useEffect, useState, useMemo } from 'react'
import { Platform } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Input,
  ScrollView,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'

export default function AdminEventsPage() {
  const { isPropagating, timeRemaining } = useRolePropagationCheck()

  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    date: new Date(),
    categoryId: '',
    locationId: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Processing state for action buttons
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Filter states - LOCAL (edited in modal, not yet applied)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [localCategoryFilter, setLocalCategoryFilter] = useState<string>('all')
  const [localLocationFilter, setLocalLocationFilter] = useState<string>('all')
  const [localStatusFilter, setLocalStatusFilter] = useState<EventStatus | 'all'>('all')

  // Filter states - APPLIED (used for filtering the list)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')

  // Filter modal state
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  // Delete handler
  const { handleDelete } = useAdminDelete<Event>({
    entityName: 'Evento',
    getItemName: (event) => event.title,
    deleteAction: deleteEvent,
    setLoading,
    setProcessingId,
  })

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Listeners em tempo real
  useEffect(() => {
    const unsubscribeEvents = onEventsChange(
      (data) => {
        // Ordena eventos do mais recente para o mais antigo
        const sortedEvents = [...data].sort((a, b) => {
          return b.date.getTime() - a.date.getTime()
        })
        setEvents(sortedEvents)
        setLoading(false)
      },
      () => {
        toast.error('Erro ao carregar eventos')
        setLoading(false)
      }
    )

    const unsubscribeCategories = onCategoriesChange((data) => {
      setCategories(data)
    })

    const unsubscribeLocations = onLocationsChange((data) => {
      setLocations(data)
    })

    return () => {
      unsubscribeEvents()
      unsubscribeCategories()
      unsubscribeLocations()
    }
  }, [])

  const handleOpenCreate = () => {
    setEditingEvent(null)
    setFormData({
      title: '',
      description: '',
      date: new Date(),
      categoryId: categories[0]?.id || '',
      locationId: locations[0]?.id || '',
      status: 'active',
    })
    setSheetOpen(true)
  }

  const handleOpenEdit = (event: Event) => {
    setProcessingId(event.id)
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      categoryId: event.categoryId,
      locationId: event.locationId,
      status: event.status,
    })
    setSheetOpen(true)
    setProcessingId(null)
  }

  const handleClose = () => {
    setSheetOpen(false)
  }

  const handleSubmit = async () => {
    // Bloquear se role foi recém-atualizada (janela de propagação de custom claims)
    if (isPropagating) {
      const secondsRemaining = Math.ceil(timeRemaining / 1000)

      toast.warning('Aguarde...', {
        description: `Suas permissões estão sendo sincronizadas. Tente novamente em ${secondsRemaining}s.`,
      })

      return
    }

    setSubmitting(true)

    if (editingEvent) {
      // Update
      const { error } = await updateEvent(editingEvent.id, formData)

      if (error) {
        toast.error('Erro ao atualizar evento', { description: error })
        setSubmitting(false)
        return
      }

      toast.success('Evento atualizado!')
    } else {
      // Create
      const { error } = await createEvent(formData)

      if (error) {
        toast.error('Erro ao criar evento', { description: error })
        setSubmitting(false)
        return
      }

      toast.success('Evento criado!')
    }

    setSubmitting(false)
    handleClose()

    // Show loading while listener updates data
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  // Filter handlers
  const handleOpenFilter = () => {
    setLocalSearchQuery(searchQuery)
    setLocalCategoryFilter(categoryFilter)
    setLocalLocationFilter(locationFilter)
    setLocalStatusFilter(statusFilter)
    setFilterModalOpen(true)
  }

  const handleApplyFilter = () => {
    setSearchQuery(localSearchQuery)
    setCategoryFilter(localCategoryFilter)
    setLocationFilter(localLocationFilter)
    setStatusFilter(localStatusFilter)
    setFilterModalOpen(false)
  }

  const handleClearFilter = () => {
    setLocalSearchQuery('')
    setLocalCategoryFilter('all')
    setLocalLocationFilter('all')
    setLocalStatusFilter('all')
  }

  // Filtered events - memoized for performance
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter (title or description)
      const matchesSearch =
        !searchQuery.trim() ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory = categoryFilter === 'all' || event.categoryId === categoryFilter

      // Location filter
      const matchesLocation = locationFilter === 'all' || event.locationId === locationFilter

      // Status filter
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus
    })
  }, [events, searchQuery, categoryFilter, locationFilter, statusFilter])

  // Check if filters are active
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'all' ||
    locationFilter !== 'all' ||
    statusFilter !== 'all'

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'N/A'
  }

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '$gray10'
  }

  const getLocationName = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId)
    if (!location) return 'N/A'
    return `${location.name} - ${location.city}, ${location.state}`
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Eventos
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

            <Button
              variant="primary"
              icon={Plus}
              onPress={handleOpenCreate}
              disabled={categories.length === 0 || locations.length === 0}
              opacity={categories.length === 0 || locations.length === 0 ? 0.5 : 1}
            >
              Novo
            </Button>
          </XStack>
        </XStack>

        {/* Lista ou Loading */}
        {loading ? (
          <AdminLoadingState />
        ) : filteredEvents.length === 0 ? (
          events.length === 0 ? (
            categories.length === 0 || locations.length === 0 ? (
              <EmptyState
                icon={<AlertCircle size={48} color="$foreground" />}
                message={
                  categories.length === 0 && locations.length === 0
                    ? 'Cadastre categorias e locais antes'
                    : categories.length === 0
                    ? 'Cadastre pelo menos uma categoria'
                    : 'Cadastre pelo menos um local'
                }
                description="Acesse as abas correspondentes para criar"
              />
            ) : (
              <EmptyState
                icon={<Calendar size={48} color="$foreground" />}
                message="Nenhum evento cadastrado"
                description="Clique em &quot;Novo&quot; para criar"
              />
            )
          ) : (
            <EmptyState
              icon={<Calendar size={48} color="$foreground" />}
              message="Nenhum evento encontrado com os filtros aplicados"
              description="Tente ajustar os filtros"
            />
          )
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {filteredEvents.map((event) => (
                <Card key={event.id}>
                  <YStack gap="$3">
                    {/* Header do card */}
                    <XStack alignItems="flex-start" justifyContent="space-between">
                      <YStack flex={1} gap="$2">
                        <Text fontSize="$6" fontWeight="700" color="$color12">
                          {event.title}
                        </Text>
                        <Text fontSize="$3" color="$color11" numberOfLines={2}>
                          {event.description}
                        </Text>
                      </YStack>

                      <AdminActionButtons
                        disabled={loading || submitting || sheetOpen}
                        isEditProcessing={processingId === event.id}
                        isDeleteProcessing={processingId === event.id}
                        onEdit={() => handleOpenEdit(event)}
                        onDelete={() => handleDelete(event)}
                      />
                    </XStack>

                    {/* Info */}
                    <YStack gap="$2">
                      <XStack alignItems="center" gap="$2">
                        <Calendar size={16} color="$color10" />
                        <Text fontSize="$3" color="$color11">
                          {format(event.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Text>
                      </XStack>

                      <XStack alignItems="center" gap="$2">
                        <MapPin size={16} color="$color10" />
                        <Text fontSize="$3" color="$color11">
                          {getLocationName(event.locationId)}
                        </Text>
                      </XStack>
                      
                      <XStack alignItems="center" gap="$2">
                        <Tag size={16} color="$color10" />
                        <YStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          backgroundColor={getCategoryColor(event.categoryId)}
                        >
                          <Text fontSize="$2" color="white" fontWeight="600">
                            {getCategoryName(event.categoryId)}
                          </Text>
                        </YStack>
                      </XStack>

                      <XStack alignItems="center" gap="$2">
                        <YStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          backgroundColor={
                            event.status === 'active'
                              ? '$green9'
                              : event.status === 'finished'
                              ? '$gray9'
                              : '$red9'
                          }
                        >
                          <Text fontSize="$2" color="white" fontWeight="600">
                            {event.status === 'active'
                              ? '● Ativo'
                              : event.status === 'finished'
                              ? '● Finalizado'
                              : '● Cancelado'}
                          </Text>
                        </YStack>
                      </XStack>

                    </YStack>
                  </YStack>
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
              {editingEvent
                ? editingEvent.status === 'finished'
                  ? 'Visualizar Evento'
                  : 'Editar Evento'
                : 'Novo Evento'}
            </Text>
          }
          footer={
            <AdminModalFooter
              cancelText={editingEvent?.status === 'finished' ? 'Fechar' : 'Cancelar'}
              onCancel={handleClose}
              onConfirm={handleSubmit}
              confirmText={submitting ? 'Salvando...' : editingEvent ? 'Atualizar' : 'Criar'}
              confirmDisabled={
                submitting ||
                !formData.title.trim() ||
                !formData.categoryId ||
                !formData.locationId
              }
              submitting={submitting}
              hideConfirm={editingEvent?.status === 'finished'}
            />
          }
          contentContainerProps={{ padding: '$4', gap: '$4'}}
        >
          <YStack gap="$4">
                  {/* Título */}
                  <FormField label="Título" required>
                    <Input
                      size="$4"
                      placeholder="Ex: Culto de Domingo"
                      value={formData.title}
                      onChangeText={(text) => setFormData({ ...formData, title: text })}
                      disabled={editingEvent?.status === 'finished'}
                      opacity={editingEvent?.status === 'finished' ? 0.6 : 1}
                    />
                  </FormField>

                  {/* Descrição */}
                  <FormField label="Descrição">
                    <TextArea
                      size="$4"
                      placeholder="Detalhes do evento (opcional)..."
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      numberOfLines={4}
                      disabled={editingEvent?.status === 'finished'}
                      opacity={editingEvent?.status === 'finished' ? 0.6 : 1}
                    />
                  </FormField>

                  {/* Data e Hora */}
                  <FormField label="Data e Hora" required>
                    <XStack gap="$2">
                      <Button
                        flex={1}
                        size="$4"
                        variant="outlined"
                        onPress={() => setShowDatePicker(true)}
                        disabled={editingEvent?.status === 'finished'}
                        opacity={editingEvent?.status === 'finished' ? 0.6 : 1}
                      >
                        {format(formData.date, 'dd/MM/yyyy', { locale: ptBR })}
                      </Button>
                      <Button
                        flex={1}
                        size="$4"
                        variant="outlined"
                        onPress={() => setShowTimePicker(true)}
                        disabled={editingEvent?.status === 'finished'}
                        opacity={editingEvent?.status === 'finished' ? 0.6 : 1}
                      >
                        {format(formData.date, 'HH:mm', { locale: ptBR })}
                      </Button>
                    </XStack>
                  </FormField>

                  {/* Categoria */}
                  <FormField label="Categoria" required>
                    <CategorySelect
                      value={formData.categoryId}
                      onChange={(categoryId) => setFormData({ ...formData, categoryId })}
                      placeholder="Selecione uma categoria"
                      disabled={editingEvent?.status === 'finished'}
                    />
                  </FormField>

                  {/* Local */}
                  <FormField label="Local" required>
                    <LocationSelect
                      value={formData.locationId}
                      onChange={(locationId) => setFormData({ ...formData, locationId })}
                      placeholder="Selecione um local"
                      disabled={editingEvent?.status === 'finished'}
                    />
                  </FormField>

                  {/* Status - Só aparece na EDIÇÃO (não na criação) e se NÃO for finished */}
                  {editingEvent && editingEvent.status !== 'finished' && (
                    <FormField label="Status" required>
                      <Dropdown
                        data={[
                          { label: 'Ativo', value: 'active' },
                          { label: 'Cancelado', value: 'cancelled' },
                        ]}
                        labelField="label"
                        valueField="value"
                        value={formData.status}
                        onChange={(item) => setFormData({ ...formData, status: item.value as EventStatus })}
                        placeholder="Selecione o status"
                        style={{
                          height: 50,
                          borderWidth: 1,
                          borderColor: '#e5e5e5',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                        }}
                      />
                    </FormField>
                  )}
          </YStack>
        </BottomSheetModal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios')
              if (selectedDate) {
                const newDate = new Date(formData.date)
                newDate.setFullYear(selectedDate.getFullYear())
                newDate.setMonth(selectedDate.getMonth())
                newDate.setDate(selectedDate.getDate())
                setFormData({ ...formData, date: newDate })
              }
            }}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={formData.date}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowTimePicker(Platform.OS === 'ios')
              if (selectedDate) {
                const newDate = new Date(formData.date)
                newDate.setHours(selectedDate.getHours())
                newDate.setMinutes(selectedDate.getMinutes())
                setFormData({ ...formData, date: newDate })
              }
            }}
          />
        )}

        {/* Modal de Filtros */}
        <AdminFilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApply={handleApplyFilter}
          onClear={handleClearFilter}
          title="Filtrar Eventos"
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
              placeholder="Título ou descrição..."
              value={localSearchQuery}
              onChangeText={setLocalSearchQuery}
            />
          </YStack>

          {/* Filtro por Categoria */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <Tag size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Categoria
              </Text>
            </XStack>
            <Dropdown
              data={[
                { label: 'Todas', value: 'all' },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
              labelField="label"
              valueField="value"
              value={localCategoryFilter}
              onChange={(item) => setLocalCategoryFilter(item.value)}
              placeholder="Selecione uma categoria"
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            />
          </YStack>

          {/* Filtro por Local */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <MapPin size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Local
              </Text>
            </XStack>
            <Dropdown
              data={[
                { label: 'Todos', value: 'all' },
                ...locations.map((l) => ({ label: l.name, value: l.id })),
              ]}
              labelField="label"
              valueField="value"
              value={localLocationFilter}
              onChange={(item) => setLocalLocationFilter(item.value)}
              placeholder="Selecione um local"
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            />
          </YStack>

          {/* Filtro por Status */}
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <AlertCircle size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Status
              </Text>
            </XStack>
            <Dropdown
              data={[
                { label: 'Todos', value: 'all' },
                { label: 'Ativo', value: 'active' },
                { label: 'Cancelado', value: 'cancelled' },
                { label: 'Finalizado', value: 'finished' },
              ]}
              labelField="label"
              valueField="value"
              value={localStatusFilter}
              onChange={(item) => setLocalStatusFilter(item.value as EventStatus | 'all')}
              placeholder="Selecione um status"
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            />
          </YStack>
        </AdminFilterModal>
      </YStack>
    </SafeAreaView>
  )
}
