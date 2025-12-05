import { Tabs } from 'expo-router'
import { LayoutDashboard, Tag, MapPin, CalendarDays, Users } from '@tamagui/lucide-icons'

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Usuários',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorias',
          tabBarIcon: ({ color, size }) => <Tag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: 'Locais',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
