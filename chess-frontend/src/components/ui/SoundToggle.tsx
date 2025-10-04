'use client'

import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'

export function SoundToggle() {
  const { settings, toggleSound } = useSettingsStore()

  return (
    <motion.button
      onClick={toggleSound}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={settings.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {settings.soundEnabled ? (
        <Volume2 size={20} className="text-gray-600 dark:text-gray-400" />
      ) : (
        <VolumeX size={20} className="text-gray-600 dark:text-gray-400" />
      )}
    </motion.button>
  )
}