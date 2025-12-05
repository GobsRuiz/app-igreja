import { Tabs } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'
import { LayoutDashboard, Tag, MapPin, CalendarDays, Users } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'

export default function AdminLayout() {
  const theme = useTheme()
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.color.val,
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#4D4D4D' : '#BBBBBB',
        headerShown: false,
        tabBarStyle: {
          height: 75,
          paddingBottom: 12,
          paddingTop: 12,
          backgroundColor: theme.background.val,
          borderTopColor: theme.borderColor.val,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Usuários',
          tabBarIcon: ({ color, focused }) => (
            <Users size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorias',
          tabBarIcon: ({ color, focused }) => (
            <Tag size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: 'Locais',
          tabBarIcon: ({ color, focused }) => (
            <MapPin size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, focused }) => (
            <CalendarDays size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
    </Tabs>
  )
}
