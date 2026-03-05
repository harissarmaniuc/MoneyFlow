import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';

import { AuthProvider } from './src/context/AuthContext';
import { ModeProvider } from './src/context/ModeContext';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ModeProvider>
          <AccessibilityProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </AccessibilityProvider>
        </ModeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
