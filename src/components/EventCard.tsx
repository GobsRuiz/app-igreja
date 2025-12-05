import { Card, XStack, YStack, Text } from 'tamagui'
import { Button } from '@shared/ui'
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
    <Card
      size="$4"
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      marginBottom="$3"
      shadowColor="$shadowColor"
      shadowOpacity={0.1}
      shadowRadius={8}
      shadowOffset={{ width: 0, height: 2 }}
      elevation={2}
    >
      <Card.Header padded>
        <YStack gap="$2">
          {/* Badge do Tipo */}
          <XStack>
            <Text
              fontSize="$2"
              fontWeight="600"
              color="$color11"
              backgroundColor="$color3"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
            >
              {event.eventType}
            </Text>
          </XStack>

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
              {event.church} - {event.address}, {event.city}
            </Text>
          </XStack>

          {/* Regente */}
          <XStack gap="$2" alignItems="center">
            <User size={16} color="$color11" />
            <Text fontSize="$3" color="$color11">
              {event.conductor}
            </Text>
          </XStack>
        </YStack>
      </Card.Header>

      <Card.Footer padded>
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
