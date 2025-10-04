import { Howl } from 'howler'
import { SoundEffects } from '@/types'

// Sound file URLs - in a real app, these would be actual sound files
const SOUND_URLS = {
  move: '/sounds/move.mp3',
  capture: '/sounds/capture.mp3',
  castle: '/sounds/castle.mp3',
  check: '/sounds/check.mp3',
  checkmate: '/sounds/checkmate.mp3',
  gameStart: '/sounds/game-start.mp3',
  timerTick: '/sounds/timer-tick.mp3',
  drawOffer: '/sounds/draw-offer.mp3',
  victory: '/sounds/victory.mp3',
  defeat: '/sounds/defeat.mp3',
  resignation: '/sounds/resignation.mp3',
  click: '/sounds/click.mp3',
}

// Create sound instances
const createSound = (src: string, volume: number = 0.7) => {
  return new Howl({
    src: [src],
    volume,
    preload: true,
  })
}

class SoundManager {
  private sounds: Record<string, Howl> = {}
  private isEnabled: boolean = true
  private volume: number = 0.7

  constructor() {
    this.initializeSounds()
  }

  private initializeSounds() {
    // Initialize all sounds with fallback to silent sounds
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      this.sounds[key] = createSound(url, this.volume)
      
      // Handle load errors gracefully
      this.sounds[key].on('loaderror', () => {
        console.warn(`Failed to load sound: ${key}`)
        // Create a silent sound as fallback
        this.sounds[key] = new Howl({
          src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='],
          volume: 0,
        })
      })
    })
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach(sound => {
      sound.volume(this.volume)
    })
  }

  play(soundName: keyof SoundEffects) {
    if (!this.isEnabled || !this.sounds[soundName]) return
    
    try {
      this.sounds[soundName].play()
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error)
    }
  }

  // Individual sound methods
  move = () => this.play('move')
  capture = () => this.play('capture')
  castle = () => this.play('castle')
  check = () => this.play('check')
  checkmate = () => this.play('checkmate')
  gameStart = () => this.play('gameStart')
  timerTick = () => this.play('timerTick')
  drawOffer = () => this.play('drawOffer')
  victory = () => this.play('victory')
  defeat = () => this.play('defeat')
  resignation = () => this.play('resignation')
  click = () => this.play('click')
}

// Create global sound manager instance
export const soundManager = new SoundManager()

// Export sound effects interface
export const soundEffects: SoundEffects = {
  move: () => soundManager.move(),
  capture: () => soundManager.capture(),
  castle: () => soundManager.castle(),
  check: () => soundManager.check(),
  checkmate: () => soundManager.checkmate(),
  gameStart: () => soundManager.gameStart(),
  timerTick: () => soundManager.timerTick(),
  drawOffer: () => soundManager.drawOffer(),
  victory: () => soundManager.victory(),
  defeat: () => soundManager.defeat(),
  resignation: () => soundManager.resignation(),
  click: () => soundManager.click(),
}

// Utility functions
export const updateSoundSettings = (enabled: boolean, volume: number) => {
  soundManager.setEnabled(enabled)
  soundManager.setVolume(volume)
}

export const playSound = (soundName: keyof SoundEffects) => {
  soundEffects[soundName]()
}