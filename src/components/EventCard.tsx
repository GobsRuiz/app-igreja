import { XStack, YStack, Text, Separator } from 'tamagui'
import { Badge, Button, Card } from '@shared/ui'
import { Calendar, MapPin, User, Navigation } from '@tamagui/lucide-icons'
import { Event } from '@shared/types/event'
import { Formatters } from '@shared/utils/formatters'

interface EventCardProps {
  event: Event
  onDetailsPress: () => void
  onGoPress: () => void
}

export function EventCard({ event, onDetailsPress, onGoPress }: EventCardProps) {
  return (
    <Card marginBottom="$3" padding="$0">
      <Card.Header>
        <YStack gap="$2">
          {/* Badge do Tipo */}
          {event.categoryName && (
            <XStack>
              <Badge variant="outlined">
                {event.categoryName}
              </Badge>
            </XStack>
          )}

          {/* Título */}
          <Text fontSize="$6" fontWeight="700" color="$color12">
            {event.title}
          </Text>

          {/* Data e Hora */}
          <XStack gap="$2" alignItems="center">
            <Calendar size={16} color="$color11" />
            <Text fontSize="$3" color="$color11">
              {Formatters.formatDateTime(event.date, event.time)}
            </Text>
          </XStack>

          {/* Local */}
          <XStack gap="$2" alignItems="center">
            <MapPin size={16} color="$color11" />
            <Text fontSize="$3" color="$color11" numberOfLines={1} flex={1}>
              {event.church} - {event.city}, {event.state}
            </Text>
          </XStack>

          {/* Regente - só exibe se tiver valor */}
          {event.conductor && (
            <XStack gap="$2" alignItems="center">
              <User size={16} color="$color11" />
              <Text fontSize="$3" color="$color11">
                {event.conductor}
              </Text>
            </XStack>
          )}
        </YStack>
      </Card.Header>

      <Separator />

      <Card.Footer>
        <XStack gap="$2" width="100%">
          <Button
            flex={1}
            variant="outlined"
            onPress={onDetailsPress}
          >
            Detalhes
          </Button>
          <Button
            flex={1}
            variant="primary"
            iconAfter={<Navigation size={16} color="$color1" />}
            onPress={onGoPress}
          >
            Ir
          </Button>
        </XStack>
      </Card.Footer>
    </Card>
  )
}
