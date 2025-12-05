import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Text,
  Input,
  TextArea,
  ScrollView,
  Spinner,
  Sheet,
} from 'tamagui'
import { Button, Card } from '@shared/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Pencil, Trash2, X, Calendar, MapPin, Tag } from '@tamagui/lucide-icons'
import { Alert, Platform } from 'react-native'
import { toast } from 'sonner-native'
import { Dropdown } from 'react-native-element-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  onEventsChange,
  createEvent,
  updateEvent,
  deleteEvent,
  type Event,
  type CreateEventData,
} from '@features/events'
import { onCategoriesChange, type Category } from '@features/categories'
import { onLocationsChange, type Location } from '@features/locations'

export default function AdminEventsPage() {
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
    })
    setSheetOpen(true)
  }

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      categoryId: event.categoryId,
      locationId: event.locationId,
    })
    setSheetOpen(true)
  }

  const handleClose = () => {
    setSheetOpen(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    if (editingEvent) {
      // Update
      const { error } = await updateEvent(editingEvent.id, formData)

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Evento atualizado!')
    } else {
      // Create
      const { error } = await createEvent(formData)

      if (error) {
        toast.error(error)
        setSubmitting(false)
        return
      }

      toast.success('Evento criado!')
    }

    setSubmitting(false)
    handleClose()
  }

  const handleDelete = (event: Event) => {
    Alert.alert('Deletar Evento', `Tem certeza que deseja deletar "${event.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteEvent(event.id)

          if (error) {
            toast.error(error)
            return
          }

          toast.success('Evento deletado!')
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
    return locations.find((l) => l.id === locationId)?.name || 'N/A'
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

        {/* Lista */}
        {events.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            {categories.length === 0 || locations.length === 0 ? (
              <>
                <Text fontSize="$5" color="$mutedForeground" textAlign="center">
                  {categories.length === 0 && locations.length === 0
                    ? 'Cadastre categorias e locais antes'
                    : categories.length === 0
                    ? 'Cadastre pelo menos uma categoria'
                    : 'Cadastre pelo menos um local'}
                </Text>
                <Text fontSize="$3" color="$mutedForeground" textAlign="center">
                  Acesse as abas correspondentes para criar
                </Text>
              </>
            ) : (
              <>
                <Text fontSize="$5" color="$mutedForeground">
                  Nenhum evento cadastrado
                </Text>
                <Text fontSize="$3" color="$mutedForeground">
                  Clique em "Novo" para criar
                </Text>
              </>
            )}
          </YStack>
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

                      <XStack gap="$2">
                        <Button
                          variant="outlined"
                          icon={Pencil}
                          onPress={() => handleOpenEdit(event)}
                          circular
                        />
                        <Button
                          variant="danger"
                          icon={Trash2}
                          onPress={() => handleDelete(event)}
                          circular
                        />
                      </XStack>
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
                        <MapPin size={16} color="$color10" />
                        <Text fontSize="$3" color="$color11">
                          {getLocationName(event.locationId)}
                        </Text>
                      </XStack>
                    </YStack>
                  </YStack>
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
          snapPoints={[90]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay />
          <Sheet.Frame padding="$4" backgroundColor="$background">
            <Sheet.Handle />
            <YStack gap="$4">
              <Text fontSize="$7" fontWeight="700" color="$foreground">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
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
                    />
                  </YStack>

                  {/* Descrição */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      Descrição *
                    </Text>
                    <TextArea
                      size="$4"
                      placeholder="Detalhes do evento..."
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      numberOfLines={4}
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
                      >
                        {format(formData.date, 'dd/MM/yyyy', { locale: ptBR })}
                      </Button>
                      <Button
                        flex={1}
                        size="$4"
                        variant="outlined"
                        onPress={() => setShowTimePicker(true)}
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
                      style={{
                        height: 50,
                        borderWidth: 1,
                        borderColor: '#e5e5e5',
                        borderRadius: 8,
                        paddingHorizontal: 12,
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
                      style={{
                        height: 50,
                        borderWidth: 1,
                        borderColor: '#e5e5e5',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                      }}
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
                >
                  Cancelar
                </Button>

                <Button
                  flex={1}
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={
                    submitting ||
                    !formData.title.trim() ||
                    !formData.description.trim() ||
                    !formData.categoryId ||
                    !formData.locationId
                  }
                  opacity={
                    submitting ||
                    !formData.title.trim() ||
                    !formData.description.trim() ||
                    !formData.categoryId ||
                    !formData.locationId
                      ? 0.5
                      : 1
                  }
                >
                  {submitting ? 'Salvando...' : editingEvent ? 'Atualizar' : 'Criar'}
                </Button>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>

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
