import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState('simple');
  const [userTypes, setUserTypes] = useState([]);

  useEffect(() => {
    const restore = async () => {
      const savedMode = await AsyncStorage.getItem('userMode');
      const savedTypes = await AsyncStorage.getItem('userTypes');
      if (savedMode) setMode(savedMode);
      if (savedTypes) setUserTypes(JSON.parse(savedTypes));
    };
    restore();
  }, []);

  const switchMode = useCallback(async (newMode) => {
    setMode(newMode);
    await AsyncStorage.setItem('userMode', newMode);
  }, []);

  const updateUserTypes = useCallback(async (types) => {
    setUserTypes(types);
    await AsyncStorage.setItem('userTypes', JSON.stringify(types));
  }, []);

  const hasUserType = useCallback((type) => userTypes.includes(type), [userTypes]);

  return (
    <ModeContext.Provider value={{
      mode,
      userTypes,
      isSimpleMode: mode === 'simple',
      switchMode,
      updateUserTypes,
      hasUserType,
    }}>
      {children}
    </ModeContext.Provider>
  );
};
