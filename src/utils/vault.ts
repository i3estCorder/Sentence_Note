import type { IndexPhrase, SentenceData } from '../types'

export interface AnkiCardStats {
  id: string
  reps: number
  interval: number
  easeFactor: number
  dueDate: string
  state: 'new' | 'learning' | 'review'
  lapses: number
  lastReviewed?: string
}

export type ReviewStats = Record<string, AnkiCardStats>
export const REVIEW_STORAGE_KEY = 'sentence_vault_anki_stats_v1'

export function localDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function cardId(sentence: SentenceData, index: IndexPhrase) {
  return `${sentence.id}_${index.id}`
}

export function isDue(stats: AnkiCardStats | undefined, today: string) {
  return !stats?.lastReviewed || stats.state === 'learning' || stats.dueDate <= today
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function optionalText(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isIndex(value: unknown): value is IndexPhrase {
  return isRecord(value) && isText(value.id) && isText(value.phrase) && optionalText(value.meaning)
}

export function isSentence(value: unknown): value is SentenceData {
  return isRecord(value) && isText(value.id) && isText(value.text)
    && optionalText(value.translation) && optionalText(value.notes)
    && (value.isFavorite === undefined || typeof value.isFavorite === 'boolean')
    && Array.isArray(value.indexes) && value.indexes.every(isIndex)
    && new Set(value.indexes.map((index) => index.id)).size === value.indexes.length
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isCount(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function parseStats(value: unknown): ReviewStats {
  if (!isRecord(value)) return {}
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, AnkiCardStats] => {
    const [id, stat] = entry
    return isRecord(stat) && stat.id === id && isCount(stat.reps) && isCount(stat.interval)
      && isCount(stat.lapses) && typeof stat.easeFactor === 'number' && Number.isFinite(stat.easeFactor)
      && stat.easeFactor >= 1.3 && isDate(stat.dueDate)
      && (stat.lastReviewed === undefined || isDate(stat.lastReviewed))
      && (stat.state === 'new' || stat.state === 'learning' || stat.state === 'review')
  }))
}

export function readBackup(value: unknown) {
  if (Array.isArray(value)) return { sentences: value as unknown[], stats: {} as ReviewStats, invalidStats: 0 }
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.sentences) || !isRecord(value.reviewStats)) return null
  const stats = parseStats(value.reviewStats)
  return {
    sentences: value.sentences as unknown[],
    stats,
    invalidStats: Object.keys(value.reviewStats).length - Object.keys(stats).length,
  }
}

export function sentenceKey(sentence: SentenceData) {
  return JSON.stringify([sentence.text.trim(), sentence.indexes.map((index) => index.phrase.trim().toLowerCase()).sort()])
}

export function addPhrases(indexes: IndexPhrase[], text: string): IndexPhrase[] {
  const result = [...indexes]
  const seen = new Set(indexes.map((index) => index.phrase.trim().toLowerCase()))
  for (const part of text.split(',')) {
    const phrase = part.trim()
    const key = phrase.toLowerCase()
    if (!phrase || seen.has(key)) continue
    seen.add(key)
    result.push({ id: `idx-${crypto.randomUUID()}`, phrase })
  }
  return result
}
