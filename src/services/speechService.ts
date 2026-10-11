/**
 * Speech Service Layer
 * 
 * Supports:
 * 1. Device Native Voice (Apple Siri / Samsung Bixby / Google Natural Priority) via Web Speech API
 * 2. Pluggable architecture ready for commercial AI Voice Engines (OpenAI, ElevenLabs, Custom Neural TTS API)
 */

export type SpeechEngineType = 'device-native' | 'openai' | 'custom-api'

export interface SpeechEngineConfig {
  engine: SpeechEngineType
  rate: number
  pitch: number
  openaiApiKey?: string
  openaiVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  customApiEndpoint?: string
}

export interface SpeakOptions {
  rate?: number
  pitch?: number
  lang?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: (err?: unknown) => void
}

const STORAGE_KEY = 'sentence_vault_speech_config_v1'

const DEFAULT_CONFIG: SpeechEngineConfig = {
  engine: 'device-native',
  rate: 0.95,
  pitch: 1.0,
  openaiVoice: 'nova',
}

/**
 * Score a speech synthesis voice based on device-native naturalness and fidelity.
 * High priority given to:
 * - Apple Siri / Enhanced voices (iOS / macOS)
 * - Samsung Bixby / Samsung TTS (Galaxy / Android)
 * - Google Natural / Neural / US English voices
 * - Microsoft Natural voices (Edge / Windows)
 */
export function scoreVoice(voice: SpeechSynthesisVoice): number {
  const lang = (voice.lang || '').toLowerCase().replace('_', '-')
  const name = (voice.name || '').toLowerCase()

  // Must be English voice for our English sentence vault
  if (!lang.startsWith('en')) {
    return -1
  }

  let score = 10

  // 1. Apple Ecosystem (Siri & Enhanced natural voices)
  if (name.includes('siri')) {
    score += 100
  } else if (name.includes('enhanced') || name.includes('premium')) {
    score += 85
  } else if (name.includes('samantha')) {
    score += 75
  } else if (name.includes('ava') || name.includes('allison') || name.includes('daniel') || name.includes('karen')) {
    score += 70
  }

  // 2. Samsung Ecosystem (Samsung TTS / Bixby engine)
  if (name.includes('samsung') || name.includes('bixby')) {
    score += 90
  }

  // 3. Google / Microsoft Natural / Neural engines
  if (name.includes('natural') || name.includes('neural')) {
    score += 95
  } else if (name.includes('google')) {
    score += 65
  }

  // 4. US / UK English dialect bonus
  if (lang.startsWith('en-us')) {
    score += 15
  } else if (lang.startsWith('en-gb')) {
    score += 10
  }

  // 5. Default voice bonus
  if (voice.default) {
    score += 5
  }

  return score
}

/**
 * Select the highest quality English voice available on the device
 */
export function selectBestNativeVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null

  let bestVoice: SpeechSynthesisVoice | null = null
  let highestScore = -1

  for (const voice of voices) {
    const score = scoreVoice(voice)
    if (score > highestScore) {
      highestScore = score
      bestVoice = voice
    }
  }

  // If no scored voice matched, fallback to first en voice or first voice
  if (!bestVoice) {
    bestVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) || voices[0] || null
  }

  return bestVoice
}

class SpeechService {
  private config: SpeechEngineConfig = DEFAULT_CONFIG
  private cachedVoices: SpeechSynthesisVoice[] = []
  private activeAudio: HTMLAudioElement | null = null

  constructor() {
    this.loadConfig()
    this.initVoices()
  }

  private loadConfig(): void {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
      }
    } catch {
      this.config = DEFAULT_CONFIG
    }
  }

  private saveConfig(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
    } catch {
      // Ignore quota errors
    }
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    this.cachedVoices = window.speechSynthesis.getVoices()

    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices()
      }
    }
  }

  public getConfig(): SpeechEngineConfig {
    return { ...this.config }
  }

  public setConfig(newConfig: Partial<SpeechEngineConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
  }

  /**
   * Get available device voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
    if (this.cachedVoices.length === 0) {
      this.cachedVoices = window.speechSynthesis.getVoices()
    }
    return this.cachedVoices
  }

  /**
   * Information about the currently selected native voice
   */
  public getCurrentVoiceInfo(): { name: string; lang: string } | null {
    const best = selectBestNativeVoice(this.getAvailableVoices())
    if (!best) return null
    return { name: best.name, lang: best.lang }
  }

  /**
   * Cancel any active speaking (either Web Speech or Cloud audio)
   */
  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (this.activeAudio) {
      this.activeAudio.pause()
      this.activeAudio.currentTime = 0
      this.activeAudio = null
    }
  }

  /**
   * Primary Speak method
   * Routes dynamically to:
   * - Device native (Siri/Bixby/Google priority)
   * - Commercial OpenAI TTS (when engine is 'openai' & apiKey provided)
   * - Custom AI TTS API (future expansion)
   */
  public async speak(text: string, options?: SpeakOptions): Promise<void> {
    const cleanText = text.trim()
    if (!cleanText) return

    this.cancel()

    // 1. Future Commercial AI Voice Engine (OpenAI TTS)
    if (this.config.engine === 'openai' && this.config.openaiApiKey) {
      try {
        await this.speakWithOpenAI(cleanText, options)
        return
      } catch (err) {
        console.warn('OpenAI TTS failed, falling back to device-native voice', err)
        // Fallback to native on error
      }
    }

    // 2. Device-Native Web Speech Engine (Default)
    this.speakNative(cleanText, options)
  }

  /**
   * Web Speech API with Device-Native priority
   */
  private speakNative(text: string, options?: SpeakOptions): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options?.onError?.(new Error('Speech synthesis not supported in this browser'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options?.rate ?? this.config.rate
    utterance.pitch = options?.pitch ?? this.config.pitch
    utterance.lang = options?.lang || 'en-US'

    // Pick the best natural voice on this device
    const voices = this.getAvailableVoices()
    const bestVoice = selectBestNativeVoice(voices)
    if (bestVoice) {
      utterance.voice = bestVoice
    }

    utterance.onstart = () => {
      options?.onStart?.()
    }

    utterance.onend = () => {
      options?.onEnd?.()
    }

    utterance.onerror = (e) => {
      options?.onError?.(e)
    }

    window.speechSynthesis.speak(utterance)
  }

  /**
   * Commercial OpenAI TTS Integration (Ready for API key plug-in)
   */
  private async speakWithOpenAI(text: string, options?: SpeakOptions): Promise<void> {
    options?.onStart?.()

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: this.config.openaiVoice || 'nova',
        input: text,
        speed: options?.rate ?? this.config.rate,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS Error: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    this.activeAudio = audio

    audio.onended = () => {
      this.activeAudio = null
      URL.revokeObjectURL(audioUrl)
      options?.onEnd?.()
    }

    audio.onerror = (err) => {
      this.activeAudio = null
      URL.revokeObjectURL(audioUrl)
      options?.onError?.(err)
    }

    await audio.play()
  }
}

export const speechService = new SpeechService()
