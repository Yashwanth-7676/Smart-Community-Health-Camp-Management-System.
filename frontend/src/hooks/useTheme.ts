// src/hooks/useTheme.ts
import { useThemeContext } from '@/contexts/ThemeContext';

export const useTheme = () => {
  return useThemeContext();
};

export default useTheme;
