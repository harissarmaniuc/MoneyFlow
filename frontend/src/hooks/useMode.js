import { useContext } from 'react';
import { ModeContext } from '../context/ModeContext';

export const useMode = () => {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
};
