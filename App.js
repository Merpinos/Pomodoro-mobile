import React, { createContext, useState, useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import TabNavigator from './navigation/TabNavigator';

export const ThemeContext = createContext();

export default function App() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const themeData = useMemo(() => ({ isDark, toggleTheme }), [isDark]);

  return (
    <ThemeContext.Provider value={themeData}>
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <TabNavigator />
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}