'use client'

import { motion } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'

export function ThemeToggle() {
  const { settings, setTheme } = useSettingsStore()

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'auto', icon: Monitor, label: 'Auto' },
  ] as const

  const currentTheme = themes.find(theme => theme.value === settings.theme) || themes[0]

  const handleThemeChange = () => {
    const currentIndex = themes.findIndex(theme => theme.value === settings.theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex].value)
  }

  return (
    <motion.button
      onClick={handleThemeChange}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Current theme: ${currentTheme.label}`}
    >
      <currentTheme.icon size={20} className="text-gray-600 dark:text-gray-400" />
    </motion.button>
  )
}