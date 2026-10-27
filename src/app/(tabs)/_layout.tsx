import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={focused ? colors.text : colors.textFaint} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'library' : 'library-outline'} size={size} color={focused ? colors.text : colors.textFaint} />
          ),
        }}
      />
    </Tabs>
  );
}
