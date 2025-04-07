import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PomodoroScreen from '../screens/PomodoroScreen';
import TodoScreen from '../screens/TodoScreen';
import StatsScreen from '../screens/StatsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const scheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Pomodoro') iconName = focused ? 'timer' : 'timer-outline';
          else if (route.name === 'To-Do') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Stats') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: scheme === 'dark' ? '#00FFB3' : '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Pomodoro" component={PomodoroScreen} />
      <Tab.Screen name="To-Do" component={TodoScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}
