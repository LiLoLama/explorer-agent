'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      aria-label="Theme umschalten"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:opacity-95 dark:text-white"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
