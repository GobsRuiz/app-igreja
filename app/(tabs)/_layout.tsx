import { Tabs } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'
import { Home, Star, Bell, User } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'

export default function TabLayout() {
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
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, focused }) => (
            <Star size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ color, focused }) => (
            <Bell size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
    </Tabs>
  )
}
