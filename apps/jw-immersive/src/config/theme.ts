export interface ThemeConfig {
  name: string;
  colors: {
    // Base colors
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;

    // Accent colors
    primary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;

    // Interactive states
    hover: string;
    focus: string;
    active: string;

    // Special colors
    neonCyan: string;
    neonGreen: string;
    neonYellow: string;
    neonPink: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  dark: {
    name: 'Dark',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#475569',
      primary: '#3b82f6',
      accent: '#6366f1',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      hover: '#1e40af',
      focus: '#60a5fa',
      active: '#2563eb',
      neonCyan: '#00d3ff',
      neonGreen: '#00ff00',
      neonYellow: '#ffff00',
      neonPink: '#ff5ed7'
    }
  },
  light: {
    name: 'Light',
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      primary: '#2563eb',
      accent: '#4f46e5',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      hover: '#1d4ed8',
      focus: '#3b82f6',
      active: '#1e40af',
      neonCyan: '#0891b2',
      neonGreen: '#059669',
      neonYellow: '#ca8a04',
      neonPink: '#c026d3'
    }
  }
};

export type ThemeName = keyof typeof themes;
export const defaultTheme: ThemeName = 'dark';
