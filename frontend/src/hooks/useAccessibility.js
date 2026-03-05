import { useContext } from 'react';
import { AccessibilityContext } from '../context/AccessibilityContext';

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
};
