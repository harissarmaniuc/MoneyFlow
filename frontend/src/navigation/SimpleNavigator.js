import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SimpleDashboard from '../screens/simple/SimpleDashboard';
import SimpleAddTransaction from '../screens/simple/SimpleAddTransaction';
import SimpleBudget from '../screens/simple/SimpleBudget';
import SettingsScreen from '../screens/shared/SettingsScreen';
import { colors } from '../styles/colors';

const Tab = createBottomTabNavigator();

const icon = (name) =>
  ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

const SimpleNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      headerShown: false,
      tabBarStyle: { paddingBottom: 4, height: 60 },
    }}
  >
    <Tab.Screen name="Home" component={SimpleDashboard} options={{ tabBarIcon: icon('home-outline') }} />
    <Tab.Screen name="Add" component={SimpleAddTransaction} options={{ tabBarIcon: icon('add-circle-outline') }} />
    <Tab.Screen name="Budget" component={SimpleBudget} options={{ tabBarIcon: icon('wallet-outline') }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: icon('settings-outline') }} />
  </Tab.Navigator>
);

export default SimpleNavigator;
