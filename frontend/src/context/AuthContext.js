import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await api.get('/users/profile');
          setUser(data);
        }
      } catch {
        await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.multiSet([['userToken', data.token], ['refreshToken', data.refreshToken]]);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    await AsyncStorage.multiSet([['userToken', data.token], ['refreshToken', data.refreshToken]]);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
