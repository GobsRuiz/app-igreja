import { useRolePropagationCheck } from '@features/auth'
import { onCategoriesChange, type Category } from '@features/categories'
import {
  createEvent,
  deleteEvent,
  onEventsChange,
  updateEvent,
  type CreateEventData,
  type Event,
  type EventStatus,
} from '@features/events'
import { onLocationsChange, type Location } from '@features/locations'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Button, Card, EmptyState, AdminLoadingState, AdminActionButtons, BottomSheetModal, toast } from '@shared/ui'
import { AlertCircle, Calendar, Eye, MapPin, Plus, Tag, X } from '@tamagui/lucide-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import React, { useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
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

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Listeners em tempo real
  useEffect(() => {
    const unsubscribeEvents = onEventsChange(
      (data) => {
        setEvents(data)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar eventos:', error)
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

  const handleDelete = (event: Event) => {
    setProcessingId(event.id)
    Alert.alert('Deletar Evento', `Tem certeza que deseja deletar "${event.title}"?`, [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: () => setProcessingId(null),
      },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true)

          const { error } = await deleteEvent(event.id)

          if (error) {
            toast.error(error)
            setLoading(false)
            setProcessingId(null)
            return
          }

          toast.success('Evento deletado!')

          // Wait for listener to update data
          setTimeout(() => {
            setLoading(false)
            setProcessingId(null)
          }, 300)
        },
      },
    ])
  }

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

        {/* Lista ou Loading */}
        {loading ? (
          <AdminLoadingState />
        ) : events.length === 0 ? (
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {events.map((event) => (
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
                        isProcessing={processingId === event.id}
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
            <XStack gap="$3">
              <Button
                flex={editingEvent?.status === 'finished' ? 1 : 1}
                variant="outlined"
                icon={X}
                onPress={handleClose}
                disabled={submitting}
                opacity={submitting ? 0.5 : 1}
              >
                {editingEvent?.status === 'finished' ? 'Fechar' : 'Cancelar'}
              </Button>

              {editingEvent?.status !== 'finished' && (
                <Button
                  flex={1}
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={
                    submitting ||
                    !formData.title.trim() ||
                    !formData.categoryId ||
                    !formData.locationId
                  }
                  opacity={
                    submitting ||
                    !formData.title.trim() ||
                    !formData.categoryId ||
                    !formData.locationId
                      ? 0.5
                      : 1
                  }
                >
                  {submitting ? 'Salvando...' : editingEvent ? 'Atualizar' : 'Criar'}
                </Button>
              )}
            </XStack>
          }
          contentContainerProps={{ padding: '$4', gap: '$4' }}
        >
          <YStack gap="$4">
                  {/* Título */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Título *
                    </Text>
                    <Input
                      size="$4"
                      placeholder="Ex: Culto de Domingo"
                      value={formData.title}
                      onChangeText={(text) => setFormData({ ...formData, title: text })}
                      disabled={editingEvent?.status === 'finished'}
                      opacity={editingEvent?.status === 'finished' ? 0.6 : 1}
                    />
                  </YStack>

                  {/* Descrição */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Descrição
                    </Text>
                    <TextArea
                      size="$4"
                      placeholder="Detalhes do evento (opcional)..."
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      numberOfLines={4}
                      disabled={editingEvent?.status === 'finished'}
                      opacity={editingEvent?.status === 'finished' ? 0.6 : 1}
                    />
                  </YStack>

                  {/* Data e Hora */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Data e Hora *
                    </Text>
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
                  </YStack>

                  {/* Categoria */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Categoria *
                    </Text>
                    <Dropdown
                      data={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
                      labelField="label"
                      valueField="value"
                      value={formData.categoryId}
                      onChange={(item) => setFormData({ ...formData, categoryId: item.value })}
                      placeholder="Selecione uma categoria"
                      disable={editingEvent?.status === 'finished'}
                      style={{
                        height: 50,
                        borderWidth: 1,
                        borderColor: '#e5e5e5',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        opacity: editingEvent?.status === 'finished' ? 0.6 : 1,
                      }}
                    />
                  </YStack>

                  {/* Local */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Local *
                    </Text>
                    <Dropdown
                      data={locations.map((loc) => ({ label: loc.name, value: loc.id }))}
                      labelField="label"
                      valueField="value"
                      value={formData.locationId}
                      onChange={(item) => setFormData({ ...formData, locationId: item.value })}
                      placeholder="Selecione um local"
                      disable={editingEvent?.status === 'finished'}
                      style={{
                        height: 50,
                        borderWidth: 1,
                        borderColor: '#e5e5e5',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        opacity: editingEvent?.status === 'finished' ? 0.6 : 1,
                      }}
                    />
                  </YStack>

                  {/* Status - Só aparece se NÃO for finished */}
                  {editingEvent?.status !== 'finished' && (
                    <YStack gap="$2">
                      <Text fontSize="$3" fontWeight="600" color="$color11">
                        Status *
                      </Text>
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
                    </YStack>
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
      </YStack>
    </SafeAreaView>
  )
}
