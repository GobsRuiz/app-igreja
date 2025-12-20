import { YStack, XStack, Text, Separator } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { MapPin, Trash2, Eye, Plus } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'

import { useFavoriteCitiesStore, parseCityKey, useEventStore } from '@shared/store'
import { EmptyState, Button, Card, toast } from '@shared/ui'

interface FavoriteCitiesListProps {
  onOpenAddModal: () => void
}

export function FavoriteCitiesList({ onOpenAddModal }: FavoriteCitiesListProps) {
  const router = useRouter()
  const favoriteCities = useFavoriteCitiesStore((state) => state.favoriteCities)
  const removeFavorite = useFavoriteCitiesStore((state) => state.removeFavorite)
  const setSelectedCity = useEventStore((state) => state.setSelectedCity)

  const handleRemoveFavorite = (cityKey: string) => {
    const parsed = parseCityKey(cityKey)
    if (!parsed) return

    removeFavorite(cityKey)
    toast.success(`${parsed.cityName} removida dos favoritos`)
  }

  const handleViewEvents = (cityKey: string) => {
    const parsed = parseCityKey(cityKey)
    if (!parsed) return

    // Setar filtro de cidade na Home
    setSelectedCity(parsed.cityName)

    // Navegar para Home
    router.push('/(tabs)')

    toast.success(`Filtrando eventos em ${parsed.cityName}`)
  }

  if (favoriteCities.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
        <EmptyState
          icon={<MapPin size={48} color="$color11" />}
          message="Nenhuma cidade favorita"
          description="Adicione cidades para acesso rápido aos eventos"
        />

        <Button
          size="$4"
          onPress={onOpenAddModal}
          icon={<Plus size={20} />}
        >
          Adicionar Cidade
        </Button>
      </YStack>
    )
  }

  return (
    <YStack flex={1} gap="$3">
      {/* Lista de Favoritos */}
      <YStack flex={1}>
        <FlashList
          data={favoriteCities}
          renderItem={({ item }) => {
            const parsed = parseCityKey(item)
            if (!parsed) return null

            return (
              <Card marginBottom="$3" padding="$0">
                <Card.Header>
                  <YStack gap="$2">
                    {/* Informações da Cidade */}
                    <XStack gap="$2" alignItems="center">
                      <MapPin size={20} color="$color11" />
                      <YStack flex={1}>
                        <Text fontSize="$6" fontWeight="700" color="$color12">
                          {parsed.cityName}
                        </Text>
                        <Text fontSize="$3" color="$color11">
                          {parsed.stateCode}
                        </Text>
                      </YStack>
                    </XStack>
                  </YStack>

                  <Separator marginTop="$4" />
                </Card.Header>

                <Card.Footer>
                  <XStack gap="$2" width="100%">
                    {/* Ver Eventos */}
                    <Button
                      flex={1}
                      variant="outlined"
                      onPress={() => handleViewEvents(item)}
                      iconAfter={<Eye size={16} />}
                    >
                      Ver Eventos
                    </Button>

                    {/* Remover */}
                    <Button
                      flex={1}
                      variant="outlined"
                      onPress={() => handleRemoveFavorite(item)}
                      iconAfter={<Trash2 size={16} color="$red10" />}
                    >
                      Remover
                    </Button>
                  </XStack>
                </Card.Footer>
              </Card>
            )
          }}
          keyExtractor={(item) => item}
          estimatedItemSize={120}
          showsVerticalScrollIndicator={false}
        />
      </YStack>

      {/* Botão Adicionar - Com espaçamento do fundo */}
      <YStack paddingBottom="$4">
        <Button
          size="$4"
          variant="primary"
          onPress={onOpenAddModal}
          icon={<Plus size={20} />}
        >
          Adicionar Cidade
        </Button>
      </YStack>
    </YStack>
  )
}
