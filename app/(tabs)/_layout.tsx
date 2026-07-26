import { Tabs } from 'expo-router';
import { Text } from '@/components/ui/Text';

function TabLabel({ focused, title }: { focused: boolean; title: string }) {
  return (
    <Text
      variant="caption"
      color={focused ? 'primary' : 'muted'}
      weight={focused ? '600' : '400'}
      style={{ marginTop: 2 }}
    >
      {title}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8EAED',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#3B5BFF',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Today" />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Plan" />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Inbox" />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Focus" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Settings" />,
        }}
      />
    </Tabs>
  );
}
