import { describe, it, expect, beforeEach } from 'vitest'
import {
  scoreVoice,
  selectBestNativeVoice,
  speechService,
} from './speechService'

describe('SpeechService & Voice Prioritization', () => {
  beforeEach(() => {
    localStorage.clear()
    speechService.setConfig({ engine: 'device-native' })
  })

  it('prioritizes Apple Siri voices above standard voices', () => {
    const siriVoice = {
      name: 'Siri Voice 1',
      lang: 'en-US',
      default: false,
      localService: true,
      voiceURI: 'siri-1',
    } as SpeechSynthesisVoice

    const basicVoice = {
      name: 'Alex',
      lang: 'en-US',
      default: true,
      localService: true,
      voiceURI: 'alex',
    } as SpeechSynthesisVoice

    expect(scoreVoice(siriVoice)).toBeGreaterThan(scoreVoice(basicVoice))
  })

  it('prioritizes Samsung Bixby voices in Samsung devices', () => {
    const samsungVoice = {
      name: 'Samsung English (United States)',
      lang: 'en-US',
      default: false,
      localService: true,
      voiceURI: 'samsung-en',
    } as SpeechSynthesisVoice

    const genericVoice = {
      name: 'Generic Male',
      lang: 'en-US',
      default: false,
      localService: true,
      voiceURI: 'generic',
    } as SpeechSynthesisVoice

    expect(scoreVoice(samsungVoice)).toBeGreaterThan(scoreVoice(genericVoice))
  })

  it('prioritizes Google Natural/Neural voices on Android/Chrome', () => {
    const googleNatural = {
      name: 'Google US English Natural',
      lang: 'en-US',
      default: false,
      localService: false,
      voiceURI: 'google-natural',
    } as SpeechSynthesisVoice

    const regularVoice = {
      name: 'Standard Voice',
      lang: 'en-US',
      default: false,
      localService: true,
      voiceURI: 'standard',
    } as SpeechSynthesisVoice

    expect(scoreVoice(googleNatural)).toBeGreaterThan(scoreVoice(regularVoice))
  })

  it('correctly selects best voice from a list of voices', () => {
    const voices = [
      { name: 'Standard Voice', lang: 'en-US' },
      { name: 'Siri Voice 2', lang: 'en-US' },
      { name: 'Korean Standard', lang: 'ko-KR' },
    ] as SpeechSynthesisVoice[]

    const selected = selectBestNativeVoice(voices)
    expect(selected?.name).toBe('Siri Voice 2')
  })

  it('falls back safely when no premium voices are present', () => {
    const voices = [
      { name: 'Basic EN', lang: 'en-GB' },
    ] as SpeechSynthesisVoice[]

    const selected = selectBestNativeVoice(voices)
    expect(selected?.name).toBe('Basic EN')
  })

  it('manages speech configuration and persistence for future commercialization', () => {
    speechService.setConfig({
      engine: 'openai',
      openaiApiKey: 'sk-test-key',
      openaiVoice: 'alloy',
    })

    const config = speechService.getConfig()
    expect(config.engine).toBe('openai')
    expect(config.openaiApiKey).toBe('sk-test-key')
    expect(config.openaiVoice).toBe('alloy')
  })

  it('calls cancel without throwing', () => {
    expect(() => speechService.cancel()).not.toThrow()
  })
})
