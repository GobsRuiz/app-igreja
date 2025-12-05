import { Badge } from '@shared/ui'
import { Wifi, WifiOff } from '@tamagui/lucide-icons'
import { useNetInfo } from '@react-native-community/netinfo'

export function ConnectionBadge() {
  const netInfo = useNetInfo()
  const isConnected = netInfo.isConnected ?? true // default true enquanto carrega

  return (
    <Badge
      variant={isConnected ? 'success' : 'danger'}
      icon={isConnected ? Wifi : WifiOff}
    >
      {isConnected ? 'Online' : 'Offline'}
    </Badge>
  )
}
