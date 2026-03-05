import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useMode } from '../hooks/useMode';
import AuthNavigator from './AuthNavigator';
import SimpleNavigator from './SimpleNavigator';
import DetailedNavigator from './DetailedNavigator';
import { colors } from '../styles/colors';

const RootNavigator = () => {
  const { user, isLoading } = useAuth();
  const { isSimpleMode } = useMode();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <AuthNavigator />;
  return isSimpleMode ? <SimpleNavigator /> : <DetailedNavigator />;
};

export default RootNavigator;
