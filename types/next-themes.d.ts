declare module 'next-themes' {
  import * as React from 'react';

  export interface ThemeProviderProps {
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    forcedTheme?: string;
    storageKey?: string;
    value?: string;
    themes?: string[];
    disableTransitionOnChange?: boolean;
    children?: React.ReactNode;
  }

  export const ThemeProvider: React.ComponentType<ThemeProviderProps>;

  export interface UseThemeReturn {
    theme?: string;
    setTheme: (theme: string) => void;
    resolvedTheme?: string;
    systemTheme?: string;
    forcedTheme?: string;
  }

  export function useTheme(): UseThemeReturn;
}
