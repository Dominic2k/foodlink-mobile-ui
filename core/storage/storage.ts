/**
 * Storage utilities for AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@foodlink/token',
  USER: '@foodlink/user',
};

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.TOKEN);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },

  async getUser<T>(): Promise<T | null> {
    try {
      const json = await AsyncStorage.getItem(KEYS.USER);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  async setUser<T>(user: T): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },
};
