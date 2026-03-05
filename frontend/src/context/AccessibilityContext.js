import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AccessibilityContext = createContext();

const DEFAULTS = {
  fontSize: 14,
  darkMode: false,
  highContrast: false,
  screenReader: false,
  voiceInput: false,
};

export const AccessibilityProvider = ({ children }) => {
  const [accessibility, setAccessibility] = useState(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem('accessibility').then((saved) => {
      if (saved) setAccessibility({ ...DEFAULTS, ...JSON.parse(saved) });
    });
  }, []);

  const updateAccessibility = useCallback(async (updates) => {
    setAccessibility((prev) => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem('accessibility', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AccessibilityContext.Provider value={{ accessibility, updateAccessibility }}>
      {children}
    </AccessibilityContext.Provider>
  );
};
