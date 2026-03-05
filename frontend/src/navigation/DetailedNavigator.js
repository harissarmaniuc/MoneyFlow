import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DetailedDashboard from '../screens/detailed/DetailedDashboard';
import DetailedAddTransaction from '../screens/detailed/DetailedAddTransaction';
import DetailedTransactionsList from '../screens/detailed/DetailedTransactionsList';
import DetailedBudget from '../screens/detailed/DetailedBudget';
import SettingsScreen from '../screens/shared/SettingsScreen';
import MoreMenuScreen from '../screens/detailed/MoreMenuScreen';
import GoalsScreen from '../screens/detailed/GoalsScreen';
import SubscriptionsScreen from '../screens/detailed/SubscriptionsScreen';
import AnalyticsScreen from '../screens/detailed/AnalyticsScreen';
import GroupExpensesScreen from '../screens/detailed/GroupExpensesScreen';
import ExportScreen from '../screens/detailed/ExportScreen';
import InsightsScreen from '../screens/detailed/InsightsScreen';

import { colors } from '../styles/colors';

const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

const icon = (name) =>
  ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

const MoreNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} />
    <MoreStack.Screen name="Goals" component={GoalsScreen} />
    <MoreStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
    <MoreStack.Screen name="Analytics" component={AnalyticsScreen} />
    <MoreStack.Screen name="GroupExpenses" component={GroupExpensesScreen} />
    <MoreStack.Screen name="Exports" component={ExportScreen} />
    <MoreStack.Screen name="Insights" component={InsightsScreen} />
  </MoreStack.Navigator>
);

const DetailedNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      headerShown: false,
      tabBarStyle: { paddingBottom: 4, height: 60 },
    }}
  >
    <Tab.Screen name="Home" component={DetailedDashboard} options={{ tabBarIcon: icon('home-outline') }} />
    <Tab.Screen name="Add" component={DetailedAddTransaction} options={{ tabBarIcon: icon('add-circle-outline') }} />
    <Tab.Screen name="Transactions" component={DetailedTransactionsList} options={{ tabBarIcon: icon('list-outline') }} />
    <Tab.Screen name="Budget" component={DetailedBudget} options={{ tabBarIcon: icon('wallet-outline') }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: icon('settings-outline') }} />
    <Tab.Screen name="More" component={MoreNavigator} options={{ tabBarIcon: icon('ellipsis-horizontal-outline') }} />
  </Tab.Navigator>
);

export default DetailedNavigator;
