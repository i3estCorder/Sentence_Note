import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Eye,
  Edit3,
  ArrowLeft,
  Menu,
  Volume2,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  Keyboard,
  Info,
} from 'lucide-react'
import type { SentenceData, IndexPhrase } from '../types'
import { findPhraseMatches } from '../utils/highlight'

export type AnkiRating = 'again' | 'hard' | 'good' | 'easy'
export type CardState = 'new' | 'learning' | 'review'

export interface AnkiCardStats {
  id: string // sentenceId or sentenceId-indexId
  reps: number
  interval: number // in days (0 means learning/same day)
  easeFactor: number // default 2.5
  dueDate: string // YYYY-MM-DD
  state: CardState
  lapses: number
  lastReviewed?: string
}

interface ReviewItem {
  sentence: SentenceData
  targetIndex: IndexPhrase
  stats: AnkiCardStats
}

interface ReviewViewProps {
  sentences: SentenceData[]
  onEditSentenceIndex: (sentence: SentenceData) => void
  onBackToMain?: () => void
  onOpenMobileMenu?: () => void
  onNavigateToLibrary?: () => void
}

const STORAGE_KEY = 'sentence_vault_anki_stats_v1'

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  sentences,
  onEditSentenceIndex,
  onBackToMain,
  onOpenMobileMenu,
  onNavigateToLibrary,
}) => {
  // Load persistent SRS stats from LocalStorage
  const [srsStatsMap, setSrsStatsMap] = useState<Record<string, AnkiCardStats>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to parse SRS stats:', e)
    }
    return {}
  })

  // Save to LocalStorage whenever srsStatsMap updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(srsStatsMap))
    } catch (e) {
      console.error('Failed to save SRS stats:', e)
    }
  }, [srsStatsMap])

  // Build flashcard pool from sentences and their indexes
  const allReviewItems: ReviewItem[] = useMemo(() => {
    const list: ReviewItem[] = []
    const today = getTodayString()

    for (const sentence of sentences) {
      if (sentence.indexes.length === 0) continue

      for (const idx of sentence.indexes) {
        if (!idx.phrase.trim()) continue
        const cardKey = `${sentence.id}_${idx.id}`
        const existingStats = srsStatsMap[cardKey]

        const stats: AnkiCardStats = existingStats || {
          id: cardKey,
          reps: 0,
          interval: 0,
          easeFactor: 2.5,
          dueDate: today,
          state: 'new',
          lapses: 0,
        }

        list.push({
          sentence,
          targetIndex: idx,
          stats,
        })
      }
    }

    return list
  }, [sentences, srsStatsMap])

  // Active Session Queue (Anki logic: cards in queue can be appended again when user presses 'Again')
  const [queue, setQueue] = useState<ReviewItem[]>(() => [...allReviewItems])
  const [prevItemsCount, setPrevItemsCount] = useState(allReviewItems.length)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Session stats counters
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0)
  const [sessionAgainCount, setSessionAgainCount] = useState(0)
  const [sessionGoodCount, setSessionGoodCount] = useState(0)
  const [isSessionFinished, setIsSessionFinished] = useState(false)

  // Sync queue if total items changed
  if (prevItemsCount !== allReviewItems.length) {
    setPrevItemsCount(allReviewItems.length)
    setQueue([...allReviewItems])
  }

  // Initialize or restart study session queue
  const startSession = useCallback((itemsToStudy: ReviewItem[]) => {
    // Shuffle or prioritize learning/due cards
    const shuffled = [...itemsToStudy].sort(() => Math.random() - 0.5)
    setQueue(shuffled)
    setIsRevealed(false)
    setIsSessionFinished(false)
    setSessionCompletedCount(0)
    setSessionAgainCount(0)
    setSessionGoodCount(0)
  }, [])

  const currentItem = queue[0] || null

  // Calculate Anki Deck Counts (New, Learning, Review)
  const deckCounts = useMemo(() => {
    let newCards = 0
    let learnCards = 0
    let reviewCards = 0

    for (const item of queue) {
      if (item.stats.state === 'new') newCards++
      else if (item.stats.state === 'learning') learnCards++
      else reviewCards++
    }

    return { newCards, learnCards, reviewCards }
  }, [queue])

  // Text-to-speech pronunciation handler
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.95

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // Anki SM-2 Interval Calculation helper
  const getIntervalPreview = (rating: AnkiRating, stats: AnkiCardStats) => {
    switch (rating) {
      case 'again':
        return '< 10m' // Anki rule: repeat in current session
      case 'hard': {
        const nextInt = stats.reps === 0 ? 1 : Math.max(1, Math.round(stats.interval * 1.2))
        return `${nextInt}d`
      }
      case 'good': {
        if (stats.reps === 0) return '1d'
        if (stats.reps === 1) return '3d'
        const nextInt = Math.max(1, Math.round(stats.interval * stats.easeFactor))
        return `${nextInt}d`
      }
      case 'easy': {
        if (stats.reps === 0) return '4d'
        const nextInt = Math.max(1, Math.round(stats.interval * stats.easeFactor * 1.3))
        return `${nextInt}d`
      }
    }
  }

  // Handle Anki Rating (Again, Hard, Good, Easy)
  const handleRate = useCallback(
    (rating: AnkiRating) => {
      if (!currentItem) return

      const { stats, sentence, targetIndex } = currentItem
      const today = getTodayString()

      let nextReps = stats.reps
      let nextInterval = stats.interval
      let nextEase = stats.easeFactor
      let nextState: CardState = stats.state
      let nextLapses = stats.lapses

      if (rating === 'again') {
        // Anki logic for 'Again':
        // 1. Reset repetition count
        // 2. Mark state as learning
        // 3. Increment lapse count
        // 4. Reduce ease factor slightly
        nextReps = 0
        nextInterval = 0
        nextState = 'learning'
        nextLapses += 1
        nextEase = Math.max(1.3, Number((nextEase - 0.2).toFixed(2)))

        setSessionAgainCount((c) => c + 1)
      } else if (rating === 'hard') {
        nextReps += 1
        nextInterval = stats.reps === 0 ? 1 : Math.max(1, Math.round(stats.interval * 1.2))
        nextEase = Math.max(1.3, Number((nextEase - 0.15).toFixed(2)))
        nextState = 'review'
        setSessionGoodCount((c) => c + 1)
      } else if (rating === 'good') {
        nextReps += 1
        if (stats.reps === 0) {
          nextInterval = 1
        } else if (stats.reps === 1) {
          nextInterval = 3
        } else {
          nextInterval = Math.max(1, Math.round(stats.interval * stats.easeFactor))
        }
        nextState = 'review'
        setSessionGoodCount((c) => c + 1)
      } else if (rating === 'easy') {
        nextReps += 1
        if (stats.reps === 0) {
          nextInterval = 4
        } else {
          nextInterval = Math.max(1, Math.round(stats.interval * stats.easeFactor * 1.3))
        }
        nextEase = Number((nextEase + 0.15).toFixed(2))
        nextState = 'review'
        setSessionGoodCount((c) => c + 1)
      }

      // Calculate next due date
      const dueDateObj = new Date()
      dueDateObj.setDate(dueDateObj.getDate() + (nextInterval || 1))
      const nextDueDate = `${dueDateObj.getFullYear()}-${String(dueDateObj.getMonth() + 1).padStart(2, '0')}-${String(dueDateObj.getDate()).padStart(2, '0')}`

      const updatedStats: AnkiCardStats = {
        id: stats.id,
        reps: nextReps,
        interval: nextInterval,
        easeFactor: nextEase,
        dueDate: nextDueDate,
        state: nextState,
        lapses: nextLapses,
        lastReviewed: today,
      }

      // Update persistent map
      setSrsStatsMap((prev) => ({
        ...prev,
        [stats.id]: updatedStats,
      }))

      // Anki Queue processing:
      // If 'Again', insert back into queue (at the end so user sees it again this session)
      const remainingQueue = queue.slice(1)

      if (rating === 'again') {
        // Put card back at the end of the current session queue
        const reinsertedItem: ReviewItem = {
          sentence,
          targetIndex,
          stats: updatedStats,
        }
        setQueue([...remainingQueue, reinsertedItem])
      } else {
        // Card is successfully answered for today
        setSessionCompletedCount((c) => c + 1)
        if (remainingQueue.length === 0) {
          setIsSessionFinished(true)
        } else {
          setQueue(remainingQueue)
        }
      }

      setIsRevealed(false)
    },
    [currentItem, queue]
  )

  // Keyboard shortcut listener for power-user Anki experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (!isRevealed) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault()
          setIsRevealed(true)
        }
      } else {
        if (e.key === '1') {
          e.preventDefault()
          handleRate('again')
        } else if (e.key === '2') {
          e.preventDefault()
          handleRate('hard')
        } else if (e.key === '3' || e.code === 'Space') {
          e.preventDefault()
          handleRate('good')
        } else if (e.key === '4') {
          e.preventDefault()
          handleRate('easy')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRevealed, handleRate])

  // Empty vault state
  if (sentences.length === 0 || allReviewItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[#ece8df] shadow-xs max-w-2xl mx-auto">
        <BookOpen className="w-12 h-12 text-[#133d2e] mx-auto mb-4 stroke-[1.5]" />
        <h2 className="text-xl font-bold text-[#12382c]">No sentences to review</h2>
        <p className="text-sm text-[#5f756c] mt-2">
          Add sentences with index phrases in your vault first to start Anki-style spaced repetition reviews.
        </p>
        {onNavigateToLibrary && (
          <button
            type="button"
            onClick={onNavigateToLibrary}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#133d2e] hover:bg-[#0c2b20] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Go to Sentence Library</span>
          </button>
        )}
      </div>
    )
  }

  // Session Completion View (Anki Deck Finished Screen)
  if (isSessionFinished || !currentItem) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        {/* Back Link */}
        {onBackToMain && (
          <button
            type="button"
            onClick={onBackToMain}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#486358] hover:text-[#12382c] transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-[#ede9df] group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Edit index (Main)</span>
          </button>
        )}

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#ece8df] shadow-xs text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#dcf2e6] text-[#133d2e] flex items-center justify-center mb-5 shadow-2xs">
            <Trophy className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12382c] tracking-tight">
            오늘의 복습 완료!
          </h2>
          <p className="text-sm text-[#5a7267] mt-2 max-w-md">
            축하합니다! 현재 덱에 배정된 모든 카드를 Anki 간격 반복(SRS) 원칙에 따라 복습했습니다.
          </p>

          {/* Session Statistics Cards */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6 pt-6 border-t border-[#f2ede4]">
            <div className="p-3.5 rounded-2xl bg-[#f8f7f2] border border-[#ebe7dc]">
              <div className="text-xs font-semibold text-[#7c8d85]">완료한 카드</div>
              <div className="text-xl font-black text-[#12382c] mt-1">{sessionCompletedCount}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#fef2f2] border border-rose-200">
              <div className="text-xs font-semibold text-rose-700">다시(Again)</div>
              <div className="text-xl font-black text-rose-800 mt-1">{sessionAgainCount}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#ecfdf5] border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700">기억 성공</div>
              <div className="text-xl font-black text-emerald-800 mt-1">{sessionGoodCount}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => startSession(allReviewItems)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#133d2e] hover:bg-[#0c2b20] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.2]" />
              <span>전체 다시 복습하기 (Study again)</span>
            </button>

            {onNavigateToLibrary && (
              <button
                type="button"
                onClick={onNavigateToLibrary}
                className="inline-flex items-center gap-1.5 h-10 px-4.5 rounded-xl bg-white hover:bg-[#f6f4ee] active:scale-[0.98] border border-[#dedad0] text-[#12382c] text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <span>Library로 이동</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render sentence with masked target index
  const renderSentenceWithMask = () => {
    const { sentence, targetIndex } = currentItem
    const matches = findPhraseMatches(sentence.text, targetIndex.phrase, true)

    if (matches.length === 0) {
      return (
        <span className="leading-relaxed">
          {sentence.text}
        </span>
      )
    }

    const firstMatch = matches[0]
    const before = sentence.text.substring(0, firstMatch.start)
    const matched = sentence.text.substring(firstMatch.start, firstMatch.end)
    const after = sentence.text.substring(firstMatch.end)

    return (
      <span className="leading-relaxed">
        {before}
        {isRevealed ? (
          <span className="bg-[#fef08a] text-[#12382c] px-3 py-1 rounded-xl font-bold mx-1.5 shadow-xs ring-1 ring-amber-300 animate-in fade-in">
            {matched}
          </span>
        ) : (
          <span className="inline-block bg-[#efebe0] text-[#788e83] border-2 border-dashed border-[#c5bfb0] px-4 py-1 rounded-xl font-mono text-sm mx-1.5 min-w-28 text-center select-none shadow-2xs">
            ? ? ? ?
          </span>
        )}
        {after}
      </span>
    )
  }

  return (
    <div className="max-w-3xl space-y-6 mx-auto">
      {/* Back to Main Navigation Link */}
      <div className="flex items-center justify-between">
        {onBackToMain && (
          <button
            type="button"
            onClick={onBackToMain}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#486358] hover:text-[#12382c] transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-[#ede9df] group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Edit index (Main)</span>
          </button>
        )}

        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-[#3d5249] hover:bg-[#eae6dc] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Top Header & Anki 3-Color Deck Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#eae6dc]/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12382c]">
              Review & Practice
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#dcf2e6] text-[#133d2e]">
              <Sparkles className="w-3 h-3 text-[#133d2e]" />
              Anki Spaced Repetition (SRS)
            </span>
          </div>
          <p className="text-sm text-[#5f756c] mt-1 font-normal">
            망각 곡선에 맞춘 4단계 간격 반복(SM-2) 플래시카드로 색인 표현을 기억하세요.
          </p>
        </div>

        {/* Anki Signature 3-Color Badges */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-white px-3.5 py-1.5 rounded-2xl border border-[#dedad0] shadow-2xs">
          <div
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600"
            title="New cards to learn"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>{deckCounts.newCards} New</span>
          </div>
          <span className="text-[#d5cfc2]">&bull;</span>
          <div
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600"
            title="Learning / Again cards queued in this session"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>{deckCounts.learnCards} Learn</span>
          </div>
          <span className="text-[#d5cfc2]">&bull;</span>
          <div
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"
            title="Review cards due today"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>{deckCounts.reviewCards} Review</span>
          </div>
        </div>
      </div>

      {/* Progress & Card Position */}
      <div className="flex items-center justify-between text-xs text-[#7c8d85] font-medium px-1">
        <span>
          Cards remaining in session: <strong className="text-[#12382c]">{queue.length}</strong>
          {sessionCompletedCount > 0 && ` (Finished: ${sessionCompletedCount})`}
        </span>

        {/* Card SRS Metadata chip */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-[#f0ede4] text-[#4d6357] text-[11px] font-semibold">
            Interval: {currentItem.stats.interval}d &bull; Reps: {currentItem.stats.reps}
          </span>
        </div>
      </div>

      {/* Main Flashcard Card */}
      <div className="bg-white rounded-3xl p-7 sm:p-10 border border-[#ece7dc] shadow-[0_4px_20px_-4px_rgba(20,50,40,0.06)] flex flex-col items-center relative overflow-hidden">
        {/* Top prompt */}
        <div className="w-full flex items-center justify-between pb-3.5 border-b border-[#f4f1e8] text-xs font-semibold text-[#7c8d85] uppercase tracking-wider">
          <span>Recall the missing index phrase</span>
          {currentItem.targetIndex.meaning && (
            <span className="text-[11px] font-bold text-[#1a533f] bg-[#eef7f2] px-2.5 py-0.5 rounded-lg border border-emerald-100">
              뜻: {currentItem.targetIndex.meaning}
            </span>
          )}
        </div>

        {/* Context Sentence Masked */}
        <div className="text-xl sm:text-2xl text-[#143d30] font-serif my-8 text-center max-w-2xl leading-relaxed">
          {renderSentenceWithMask()}
        </div>

        {/* Answer Reveal Area */}
        {isRevealed && (
          <div className="mt-2 pt-6 border-t border-[#f2ede4] w-full max-w-xl animate-in fade-in zoom-in-98 duration-200 space-y-4">
            {/* Target phrase highlight banner with TTS */}
            <div className="p-4 rounded-2xl bg-[#faf9f3] border border-[#ebe6d8] flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#788e83] block">
                  Target Index Phrase
                </span>
                <span className="text-lg font-black text-[#12382c] tracking-tight">
                  {currentItem.targetIndex.phrase}
                </span>
                {currentItem.targetIndex.meaning && (
                  <span className="text-xs text-[#3a6352] ml-2 font-semibold">
                    ({currentItem.targetIndex.meaning})
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSpeak(currentItem.sentence.text)}
                title="Listen to full sentence"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isSpeaking
                    ? 'bg-[#133d2e] text-white shadow-xs'
                    : 'bg-white hover:bg-[#ede9df] text-[#12382c] border border-[#d8d3c7] shadow-2xs'
                }`}
              >
                <Volume2 className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Translation & Notes (if available) */}
            {currentItem.sentence.translation && (
              <div className="text-sm text-[#446657] font-sans px-1">
                <span className="font-bold text-[#12382c] mr-1.5">번역:</span>
                {currentItem.sentence.translation}
              </div>
            )}

            {currentItem.sentence.notes && (
              <div className="text-xs text-[#5f746b] bg-[#fdfdfc] p-3 rounded-xl border border-[#ede9df] flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-[#133d2e] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-[#12382c] block mb-0.5">추가 정보 (Memo):</span>
                  {currentItem.sentence.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls: Reveal vs Anki 4 Rating Buttons */}
        <div className="mt-8 w-full max-w-xl">
          {!isRevealed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRevealed(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-8 rounded-xl bg-[#133d2e] hover:bg-[#0c2b20] active:scale-[0.98] text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 stroke-[2.2]" />
                <span>정답 보기 (Reveal answer)</span>
              </button>
              <span className="text-[11px] text-[#8ca097] flex items-center gap-1 mt-1">
                <Keyboard className="w-3 h-3" />
                단축키: <strong>Space</strong> 또는 <strong>Enter</strong>
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Again (다시) - Repeat in session */}
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 active:scale-[0.97] transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                    {getIntervalPreview('again', currentItem.stats)}
                  </span>
                  <span className="text-xs font-bold mt-0.5">Again</span>
                  <span className="text-[10px] text-rose-500 font-mono mt-0.5 group-hover:underline">
                    [1]
                  </span>
                </button>

                {/* 2. Hard (어려움) */}
                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 active:scale-[0.97] transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    {getIntervalPreview('hard', currentItem.stats)}
                  </span>
                  <span className="text-xs font-bold mt-0.5">Hard</span>
                  <span className="text-[10px] text-amber-600 font-mono mt-0.5 group-hover:underline">
                    [2]
                  </span>
                </button>

                {/* 3. Good (알맞음) */}
                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-[#e6f6ee] hover:bg-[#d5f0e1] text-[#0f3d2c] border border-emerald-300 active:scale-[0.97] transition-all cursor-pointer shadow-2xs ring-1 ring-emerald-200 group"
                >
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    {getIntervalPreview('good', currentItem.stats)}
                  </span>
                  <span className="text-xs font-bold mt-0.5">Good</span>
                  <span className="text-[10px] text-emerald-600 font-mono mt-0.5 group-hover:underline">
                    [3 / Space]
                  </span>
                </button>

                {/* 4. Easy (쉬움) */}
                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 active:scale-[0.97] transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                    {getIntervalPreview('easy', currentItem.stats)}
                  </span>
                  <span className="text-xs font-bold mt-0.5">Easy</span>
                  <span className="text-[10px] text-sky-600 font-mono mt-0.5 group-hover:underline">
                    [4]
                  </span>
                </button>
              </div>

              <div className="text-center text-[11px] text-[#7c8d85] font-medium">
                Anki 키보드 단축키: <strong>[1] Again</strong> &bull; <strong>[2] Hard</strong> &bull; <strong>[3/Space] Good</strong> &bull; <strong>[4] Easy</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jump to edit index */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => onEditSentenceIndex(currentItem.sentence)}
          className="inline-flex items-center gap-1.5 text-xs text-[#526a60] hover:text-[#12382c] font-semibold transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit this sentence in Word Index</span>
        </button>
      </div>
    </div>
  )
}
