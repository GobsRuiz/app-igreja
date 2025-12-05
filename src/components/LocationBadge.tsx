import { Badge } from '@shared/ui'
import { MapPin } from '@tamagui/lucide-icons'

interface LocationBadgeProps {
  city?: string
}

export function LocationBadge({ city = 'Taquaritinga' }: LocationBadgeProps) {
  return (
    <Badge variant="ghost" icon={MapPin}>
      {city}
    </Badge>
  )
}
