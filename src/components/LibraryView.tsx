import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  Star,
  Edit3,
  Trash2,
  BookOpen,
  Plus,
  ArrowLeft,
  Menu,
  ArrowUpDown,
  Download,
  Upload,
  ListFilter,
  Eye,
  EyeOff,
  Volume2,
} from 'lucide-react'
import type { SentenceData } from '../types'
import { SentenceDetailModal } from './SentenceDetailModal'
import { EditSentenceModal } from './EditSentenceModal'
import { ConfirmationModal } from './ConfirmationModal'
import { highlightMultiPhrases } from '../utils/highlight'
import { speechService } from '../services/speechService'

interface LibraryViewProps {
  sentences: SentenceData[]
  onSelectSentenceToEdit: (sentence: SentenceData) => void
  onToggleFavorite: (sentenceId: string) => void
  onDeleteSentence: (sentenceId: string) => void
  onUpdateSentence?: (sentence: SentenceData) => void
  onNavigateToAdd: () => void
  onBackToMain?: () => void
  onOpenMobileMenu?: () => void
  onSelectIndexToEdit?: (sentence: SentenceData, indexId: string) => void
  onExportJSON?: () => void
  onImportJSON?: (data: unknown) => void
  dueCount: number
  onStartReview: () => void
}

type SortOrder = 'index-asc' | 'index-desc' | 'original'
type ViewMode = 'index' | 'sentence'
type SentenceSortOrder = 'original' | 'az' | 'za'

interface GroupedIndex {
  phrase: string
  letter: string
  sentences: SentenceData[]
}

interface AlphabetSection {
  letter: string
  indexes: GroupedIndex[]
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  sentences,
  onSelectSentenceToEdit,
  onToggleFavorite,
  onDeleteSentence,
  onUpdateSentence,
  onNavigateToAdd,
  onBackToMain,
  onOpenMobileMenu,
  onSelectIndexToEdit,
  onExportJSON,
  onImportJSON,
  dueCount,
  onStartReview,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('index')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('index-asc')
  const [sentenceSortOrder, setSentenceSortOrder] = useState<SentenceSortOrder>('original')
  const [selectedDetailGroup, setSelectedDetailGroup] = useState<{
    group: GroupedIndex
    initialIndex: number
  } | null>(null)
  const [sentenceToEdit, setSentenceToEdit] = useState<SentenceData | null>(null)
  const [sentenceToDelete, setSentenceToDelete] = useState<SentenceData | null>(null)
  // Revealed translations state: default hidden for all sentences
  const [revealedTranslationIds, setRevealedTranslationIds] = useState<Record<string, boolean>>({})

  const toggleTranslation = (sentenceId: string) => {
    setRevealedTranslationIds((prev) => ({
      ...prev,
      [sentenceId]: !prev[sentenceId],
    }))
  }

  // Text-to-speech pronunciation handler for sentences
  const [speakingSentenceId, setSpeakingSentenceId] = useState<string | null>(null)

  const handleSpeakSentence = (sentenceId: string, text: string) => {
    speechService.speak(text, {
      onStart: () => setSpeakingSentenceId(sentenceId),
      onEnd: () => setSpeakingSentenceId(null),
      onError: () => setSpeakingSentenceId(null),
    })
  }

  // Current alphabet section for the navigation rail
  const [scrollingLabel, setScrollingLabel] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Group sentences by unique index phrase (Case-insensitive unique phrase grouping)
  const groupedIndexMap = useMemo(() => {
    const map = new Map<string, { phrase: string; sentences: SentenceData[] }>()

    for (const sentence of sentences) {
      const validIndexes = sentence.indexes.filter(
        (idx) => idx && idx.phrase && idx.phrase.trim().length > 0
      )

      if (validIndexes.length === 0) {
        // Fallback: If a sentence has no valid indexes, group under "(Unindexed)" so it is NEVER hidden!
        const key = '(unindexed)'
        if (!map.has(key)) {
          map.set(key, {
            phrase: 'Unindexed',
            sentences: [sentence],
          })
        } else {
          const entry = map.get(key)!
          if (!entry.sentences.some((s) => s.id === sentence.id && s.text.trim() === sentence.text.trim())) {
            entry.sentences.push(sentence)
          }
        }
        continue
      }

      for (const idx of validIndexes) {
        const trimmed = idx.phrase.trim()
        const key = trimmed.toLowerCase()

        if (!map.has(key)) {
          map.set(key, {
            phrase: trimmed,
            sentences: [sentence],
          })
        } else {
          const entry = map.get(key)!
          // avoid duplicate sentence in the same index group: compare ID and text to prevent dropping distinct sentences
          if (!entry.sentences.some((s) => s.id === sentence.id && s.text.trim() === sentence.text.trim())) {
            entry.sentences.push(sentence)
          }
        }
      }
    }

    return map
  }, [sentences])

  function matchesSentence(sentence: SentenceData, query: string) {
    return [sentence.text, sentence.translation, sentence.notes,
      ...sentence.indexes.flatMap((index) => [index.phrase, index.meaning]),
    ].some((value) => value?.toLowerCase().includes(query))
  }

  // Convert map to list and filter by search query
  const groupedIndexList: GroupedIndex[] = useMemo(() => {
    const list: GroupedIndex[] = []
    const q = searchQuery.toLowerCase().trim()

    groupedIndexMap.forEach((entry) => {
      const matchesPhrase = entry.phrase.toLowerCase().includes(q)
      const matchingSentences = entry.sentences.filter(
        (s) => matchesPhrase || matchesSentence(s, q)
      )

      if (matchingSentences.length > 0) {
        const firstChar = entry.phrase.charAt(0).toUpperCase()
        const letter = /^[A-Z]$/.test(firstChar) ? firstChar : '#'
        list.push({
          phrase: entry.phrase,
          letter,
          sentences: matchingSentences,
        })
      }
    })

    // Sort index list
    list.sort((a, b) => {
      if (sortOrder === 'index-asc') {
        return a.phrase.localeCompare(b.phrase, undefined, { sensitivity: 'base' })
      }
      if (sortOrder === 'index-desc') {
        return b.phrase.localeCompare(a.phrase, undefined, { sensitivity: 'base' })
      }
      return 0
    })

    return list
  }, [groupedIndexMap, searchQuery, sortOrder])

  // 2. TIER 1: Alphabet Section Chapters (A, B, C...)
  const alphabetSections: AlphabetSection[] = useMemo(() => {
    const sectionMap = new Map<string, GroupedIndex[]>()

    for (const item of groupedIndexList) {
      if (!sectionMap.has(item.letter)) {
        sectionMap.set(item.letter, [])
      }
      sectionMap.get(item.letter)!.push(item)
    }

    const sections: AlphabetSection[] = []
    sectionMap.forEach((indexes, letter) => {
      sections.push({ letter, indexes })
    })

    // Sort alphabet sections
    sections.sort((a, b) => {
      if (a.letter === '#') return 1
      if (b.letter === '#') return -1
      return sortOrder === 'index-asc'
        ? a.letter.localeCompare(b.letter)
        : b.letter.localeCompare(a.letter)
    })

    return sections
  }, [groupedIndexList, sortOrder])

  // Unique list of active alphabet letters for fast bookmark jumping
  const activeLetters = useMemo(() => {
    return alphabetSections.map((s) => s.letter)
  }, [alphabetSections])

  // Filtered and sorted sentences for sentence view mode
  const filteredSentences = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const list = sentences.filter((sentence) => matchesSentence(sentence, q))

    return [...list].sort((a, b) => {
      if (sentenceSortOrder === 'az') {
        return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' })
      }
      if (sentenceSortOrder === 'za') {
        return b.text.localeCompare(a.text, undefined, { sensitivity: 'base' })
      }
      return 0
    })
  }, [sentences, searchQuery, sentenceSortOrder])

  // Keep the active alphabet tab in sync with the visible section
  useEffect(() => {
    const handleScroll = () => {

      const elements = document.querySelectorAll<HTMLElement>('[data-scroll-anchor]')
      let currentLabel = ''

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i]
        const rect = el.getBoundingClientRect()
        if (rect.top <= 280) {
          currentLabel = el.getAttribute('data-scroll-anchor') || ''
        } else {
          break
        }
      }

      if (currentLabel) {
        setScrollingLabel(currentLabel)
      } else if (elements.length > 0) {
        setScrollingLabel(elements[0].getAttribute('data-scroll-anchor') || '')
      }


    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [alphabetSections])

  // Smooth scroll to an alphabet section
  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`section-${letter}`)
    if (el) {
      el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
      setScrollingLabel(letter)

    }
  }

  // Handle JSON file upload
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (onImportJSON) {
          onImportJSON(parsed)
        }
      } catch (err) {
        console.error('Invalid JSON file', err)
        onImportJSON?.(null)
      }
    }
    reader.onerror = () => onImportJSON?.(null)
    e.currentTarget.value = ''
    reader.readAsText(file)
  }

  return (
    <div className="library-view relative space-y-6 pb-24">
      {/* Hidden JSON file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Top Bar: Back Link (if provided) and Mobile Menu Button */}
      {(onBackToMain || onOpenMobileMenu) && (
        <div className={`flex items-center ${onBackToMain ? 'justify-between' : 'justify-end lg:hidden'}`}>
          {onBackToMain && (
            <button
              type="button"
              onClick={onBackToMain}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#486358] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-[#ede9df] dark:hover:bg-[#1b2b27] group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Library (Home)</span>
            </button>
          )}

          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-[#3d5249] dark:text-[#a0b5ab] hover:bg-[#eae6dc] dark:hover:bg-[#1b2b27] transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Library header and backup menu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#eae6dc]/60 dark:border-[#23352f]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12382c] dark:text-[#e4ede8]">
              Sentence Library
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#133d2e] dark:bg-[#1d5743] text-white shadow-2xs">
              {sentences.length} sentences
            </span>
          </div>
          <p className="library-description">모아 둔 문장에서, 내 표현을 발견하세요.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {(onExportJSON || onImportJSON) && (
            <details className="relative">
              <summary className="cursor-pointer rounded-xl border border-[#dedad0] px-3 py-2 text-sm dark:border-[#283d36]">백업 및 복원</summary>
              <div className="absolute left-0 z-30 mt-2 grid w-max sm:left-auto sm:right-0 gap-1 rounded-xl bg-white p-2 shadow-lg dark:bg-[#14201c]">
                {onExportJSON && (
                  <button
                    type="button"
                    onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onExportJSON() }}
                    title="Download sentences and review progress"
                    className="inline-flex items-center gap-1.5 h-9.5 px-3.5 bg-white dark:bg-[#14201c] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27] active:scale-[0.98] border border-[#dedad0] dark:border-[#283d36] text-[#12382c] dark:text-[#e4ede8] text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#486358] dark:text-[#8ea49a]" />
                    <span>백업 다운로드</span>
                  </button>
                )}

                {onImportJSON && (
                  <button
                    type="button"
                    onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); fileInputRef.current?.click() }}
                    title="Import sentences from a JSON backup file"
                    className="inline-flex items-center gap-1.5 h-9.5 px-3.5 bg-white dark:bg-[#14201c] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27] active:scale-[0.98] border border-[#dedad0] dark:border-[#283d36] text-[#12382c] dark:text-[#e4ede8] text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#486358] dark:text-[#8ea49a]" />
                    <span>백업 가져오기</span>
                  </button>
                )}
              </div>
            </details>
          )}
        </div>
      </div>

      <section aria-label="오늘 복습" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e6f6ee] px-4 py-3 dark:bg-[#153427]">
        <p className="text-sm font-semibold">{dueCount ? `오늘 복습 ${dueCount}개` : '오늘 복습할 카드가 없습니다'}</p>
        {dueCount > 0 && (
          <button type="button" onClick={onStartReview} className="cursor-pointer rounded-xl bg-[#133d2e] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#1d5743]">
            복습 시작
          </button>
        )}
      </section>

      {/* Controls Bar: Search, View Mode Toggle, and Sort Order */}
      <div className="library-controls">
        {/* Search Bar */}
        <div className="library-search relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8d85] dark:text-[#8ea49a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search sentences and expressions"
            placeholder="표현, 예문, 번역 또는 메모 검색"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] text-sm text-[#12382c] dark:text-[#e4ede8] placeholder-[#8c9e96] dark:placeholder-[#6a8076] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] transition-all"
          />
        </div>

        <button
          type="button"
          onClick={onNavigateToAdd}
          className="inline-flex items-center gap-1.5 h-9.5 px-4 bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.4]" aria-hidden="true" />
          <span>New sentence</span>
        </button>
        {/* View Mode & Sort Controls */}
        <div className="library-view-controls flex items-center gap-2.5 flex-wrap">
          {/* Index vs Sentence Mode Tabs */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#ede9df] dark:bg-[#1b2b27] border border-[#dedad0] dark:border-[#283d36] text-xs font-semibold text-[#50675d] dark:text-[#8ea49a]">
            <button
              type="button"
              onClick={() => setViewMode('index')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'index'
                  ? 'bg-white dark:bg-[#14201c] text-[#12382c] dark:text-[#34d399] font-bold shadow-xs'
                  : 'hover:text-[#12382c] dark:hover:text-[#e4ede8]'
              }`}
              aria-pressed={viewMode === 'index'}
              aria-label="View by index"
            >
              <ListFilter className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
              <span>Index ({groupedIndexList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('sentence')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'sentence'
                  ? 'bg-white dark:bg-[#14201c] text-[#3730a3] dark:text-[#a5b4fc] font-bold shadow-xs'
                  : 'hover:text-[#12382c] dark:hover:text-[#e4ede8]'
              }`}
              aria-pressed={viewMode === 'sentence'}
              aria-label="View by sentence"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#3730a3] dark:text-[#a5b4fc]" />
              <span>Sentence ({sentences.length})</span>
            </button>
          </div>

          {/* Sort Order Selector */}
          <div className="relative inline-flex items-center">
            <label htmlFor="library-sort-select" className="sr-only">
              Sort index order
            </label>
            <div className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] text-xs font-medium text-[#234235] dark:text-[#c4ded3] shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5e786d] dark:text-[#8ea49a]" />
              <span className="text-[#7c8d85] dark:text-[#8ea49a]">Sort:</span>
              {viewMode === 'index' ? (
                <select
                  id="library-sort-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="bg-transparent font-semibold text-[#12382c] dark:text-[#e4ede8] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="index-asc" className="dark:bg-[#14201c]">Index (A → Z)</option>
                  <option value="index-desc" className="dark:bg-[#14201c]">Index (Z → A)</option>
                  <option value="original" className="dark:bg-[#14201c]">Original</option>
                </select>
              ) : (
                <select
                  id="library-sort-select"
                  value={sentenceSortOrder}
                  onChange={(e) => setSentenceSortOrder(e.target.value as SentenceSortOrder)}
                  className="bg-transparent font-semibold text-[#12382c] dark:text-[#e4ede8] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="original" className="dark:bg-[#14201c]">Original</option>
                  <option value="az" className="dark:bg-[#14201c]">Sentence (A → Z)</option>
                  <option value="za" className="dark:bg-[#14201c]">Sentence (Z → A)</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'index' && activeLetters.length > 0 && (
        <aside
          aria-label="Alphabetical fast-jump tabs"
          className="alphabet-rail"
        >
          {activeLetters.map((letter) => {
            const isCurrent = (scrollingLabel.replace('Chapter ', '').slice(0, 1).toUpperCase() || activeLetters[0]) === letter

            return (
              <button
                key={letter}
                type="button"
                onClick={() => scrollToLetter(letter)}
                title={`Jump to section ${letter}`}
                className={`alphabet-tab ${isCurrent ? 'is-current' : ''}`}
                aria-current={isCurrent ? 'location' : undefined}
              >
                <span className="pl-1.5">{letter}</span>

                <span className="absolute right-full mr-2 px-2 py-0.5 rounded bg-[#12382c] text-white text-[10px] font-semibold tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                  Section {letter}
                </span>
              </button>
            )
          })}
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2-TIER GROUPED INDEX CARDS (Index View Mode) */}
      {/* Tier 1: Alphabet Section Chapter Header */}
      {/* Tier 2: Grouped Index Card (e.g. rare is 1 card) */}
      {/* Tier 3: Multiple Context Sentences Grouped Inside Card */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'index' && (
        <div className="space-y-10" role="region" aria-label="Index cards list">
        <div className="flex items-center justify-between text-xs font-medium text-[#647c72] dark:text-[#8ea49a] px-1">
            <span>
              Showing {groupedIndexList.length} unique index {groupedIndexList.length === 1 ? 'card' : 'cards'} in {alphabetSections.length} alphabet chapters
              {sortOrder === 'index-asc' && ' (sorted by index A → Z)'}
              {sortOrder === 'index-desc' && ' (sorted by index Z → A)'}
            </span>
          </div>

          {alphabetSections.map((section) => {

            return (
              <section
                key={section.letter}
                id={`section-${section.letter}`}
                data-scroll-anchor={`Chapter ${section.letter}`}
                className="scroll-mt-24 space-y-4"
              >
                {/* TIER 1: Alphabet Section Header */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#e8e4da] dark:border-[#283d36]">
                  <div className="flex items-center gap-3">
                    <div
                      className="chapter-letter"
                    >
                      <span>{section.letter}</span>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[#7c8d85] dark:text-[#8ea49a]">
                    {section.indexes.length} {section.indexes.length === 1 ? 'index' : 'indexes'}
                  </span>
                </div>

                {/* TIER 2: Grouped Index Cards in 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.indexes.map((group, groupIdx) => {
                    const firstSentence = group.sentences[0]
                    const targetIndexObj = firstSentence?.indexes.find(
                      (i) => i.phrase.toLowerCase() === group.phrase.toLowerCase()
                    )
                    const hasFavorite = group.sentences.some((s) => s.isFavorite)

                    return (
                      <article
                        key={`${section.letter}-${group.phrase}-${groupIdx}`}
                        data-scroll-anchor={`${section.letter} · ${group.phrase}`}
                        onClick={() => setSelectedDetailGroup({ group, initialIndex: 0 })}
                        className="expression-card scroll-mt-24 bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece7dc] dark:border-[#23352f] hover:border-[#133d2e]/30 dark:hover:border-[#34d399]/30 shadow-[0_2px_10px_-2px_rgba(20,50,40,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(20,50,40,0.08)] transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:-translate-y-0.5"
                      >
                        <div>
                          {/* Card Header: Index Phrase as primary hero */}
                          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#f4f1e8] dark:border-[#23352f]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                {hasFavorite && (
                                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200/80 dark:ring-amber-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current text-amber-500" />
                                    Favorite
                                  </span>
                                )}
                                {group.sentences.length > 1 && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#fef3c7] dark:bg-[#3a2e10] text-[#78350f] dark:text-[#fde68a] ring-1 ring-amber-300/70 dark:ring-amber-700/60">
                                    {group.sentences.length} sentences
                                  </span>
                                )}
                              </div>

                              <h3 className="expression-title">
                                <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedDetailGroup({ group, initialIndex: 0 }) }}>
                                  {group.phrase}
                                </button>
                              </h3>
                            </div>

                            {/* Header Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {firstSentence && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleFavorite(firstSentence.id)
                                  }}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                                    firstSentence.isFavorite
                                      ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                      : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27]'
                                  }`}
                                  aria-label={
                                    firstSentence.isFavorite
                                      ? 'Remove from favorites'
                                      : 'Mark as favorite'
                                  }
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      firstSentence.isFavorite ? 'fill-current' : ''
                                    }`}
                                  />
                                </button>
                              )}

                              {firstSentence && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSentenceToDelete(firstSentence)
                                  }}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8c9e96] dark:text-[#6a8076] hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  aria-label="Delete sentence"
                                  title="문장 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Context Sentence(s) Grouped Inside Card */}
                          <div className="pt-3 pb-1 space-y-2.5">
                            <div className="space-y-2.5">
                              {group.sentences.map((sentence, sIdx) => (
                                <div
                                  key={sentence.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDetailGroup({ group, initialIndex: sIdx })
                                  }}
                                  className="context-example p-3 sm:p-3.5 rounded-xl bg-[#faf9f5] dark:bg-[#1b2b27] border border-[#eeebe3] dark:border-[#283d36] hover:border-[#ded8ca] dark:hover:border-[#38534a] transition-all cursor-pointer"
                                >
                                  {/* Sentence mini toolbar: Number, Favorite, Edit, Delete */}
                                  <div className="flex items-center justify-between mb-1.5 gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ede9df] dark:bg-[#273a34] text-[#4f675b] dark:text-[#9eb4aa]">
                                      Sentence {sIdx + 1}
                                    </span>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSpeakSentence(sentence.id, sentence.text)
                                        }}
                                        className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                          speakingSentenceId === sentence.id
                                            ? 'text-[#12382c] dark:text-[#a7f3d0] bg-[#e3eedf] dark:bg-[#1f3d32] ring-1 ring-[#12382c]/20'
                                            : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae5d8] dark:hover:bg-[#20342f]'
                                        }`}
                                        title="문장 듣기"
                                        aria-label="Listen to sentence"
                                      >
                                        <Volume2 className="w-3.5 h-3.5 stroke-[2.2]" />
                                      </button>

                                      {sentence.translation && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleTranslation(sentence.id)
                                          }}
                                          className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                            revealedTranslationIds[sentence.id]
                                              ? 'text-[#12382c] dark:text-[#a7f3d0] bg-[#e3eedf] dark:bg-[#1f3d32]'
                                              : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae5d8] dark:hover:bg-[#20342f]'
                                          }`}
                                          title={revealedTranslationIds[sentence.id] ? '번역 숨기기' : '번역 보기'}
                                          aria-label={revealedTranslationIds[sentence.id] ? 'Hide translation' : 'Show translation'}
                                        >
                                          {revealedTranslationIds[sentence.id] ? (
                                            <EyeOff className="w-3.5 h-3.5 stroke-[2.2]" />
                                          ) : (
                                            <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                                          )}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onToggleFavorite(sentence.id)
                                        }}
                                        className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                          sentence.isFavorite
                                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                            : 'text-[#9bad9f] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae5d8] dark:hover:bg-[#20342f]'
                                        }`}
                                        title={sentence.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                                        aria-label="Toggle favorite"
                                      >
                                        <Star
                                          className={`w-3.5 h-3.5 ${
                                            sentence.isFavorite ? 'fill-current' : ''
                                          }`}
                                        />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSentenceToEdit(sentence)
                                        }}
                                        className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae5d8] dark:hover:bg-[#20342f] transition-colors cursor-pointer"
                                        title="문장 수정"
                                        aria-label="Edit sentence"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSentenceToDelete(sentence)
                                        }}
                                        className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[#8c9e96] dark:text-[#6a8076] hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                        title="문장 삭제"
                                        aria-label="Delete sentence"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-sm sm:text-base text-[#143d30] dark:text-[#d3e2db] font-serif leading-relaxed">
                                    {highlightMultiPhrases(
                                      sentence.text,
                                      group.phrase,
                                      sentence.indexes
                                        .filter((i) => i.phrase.toLowerCase() !== group.phrase.toLowerCase())
                                        .map((i) => i.phrase)
                                    )}
                                  </p>

                                  {sentence.translation && (
                                    revealedTranslationIds[sentence.id] ? (
                                      <div className="mt-2 pt-2 border-t border-[#f0ece2] dark:border-[#23352f] flex items-start justify-between gap-2 animate-in fade-in duration-150">
                                        <p className="text-xs text-[#456356] dark:text-[#9fc4b5] font-sans leading-relaxed">
                                          {sentence.translation}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleTranslation(sentence.id)
                                          }}
                                          className="text-[11px] font-semibold text-[#667e74] dark:text-[#7f998d] hover:text-[#12382c] dark:hover:text-white shrink-0 inline-flex items-center gap-1 cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-[#eae5d8] dark:hover:bg-[#20342f] transition-colors"
                                          title="번역 숨기기"
                                          aria-label="Hide translation"
                                        >
                                          <EyeOff className="w-3 h-3" />
                                          <span>숨기기</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="mt-1.5 flex items-center">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleTranslation(sentence.id)
                                          }}
                                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold text-[#5a7469] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-white bg-[#f2eee5]/80 dark:bg-[#1d2d27] hover:bg-[#eae4d7] dark:hover:bg-[#253d34] transition-colors cursor-pointer"
                                          title="번역 보기"
                                          aria-label="Show translation"
                                        >
                                          <Eye className="w-3 h-3 text-[#3d5a4e] dark:text-[#76b399]" />
                                          <span>번역 보기</span>
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3.5 mt-3 border-t border-[#f2ede4] dark:border-[#23352f] flex items-center justify-between gap-3">
                          <div className="text-xs text-[#71857c] dark:text-[#8ea49a] font-medium truncate">
                            {group.sentences.length}{' '}
                            {group.sentences.length === 1 ? 'sentence' : 'sentences'} tagged with "{group.phrase}"
                          </div>

                          {firstSentence && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (targetIndexObj && onSelectIndexToEdit) {
                                  onSelectIndexToEdit(firstSentence, targetIndexObj.id)
                                } else {
                                  onSelectSentenceToEdit(firstSentence)
                                }
                              }}
                              className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] text-white transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                            >
                              <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>Edit index</span>
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {alphabetSections.length === 0 && (
            <div className="bg-white dark:bg-[#14201c] rounded-2xl p-12 text-center border border-[#ece8df] dark:border-[#23352f]">
              <BookOpen className="w-10 h-10 text-[#8c9e96] dark:text-[#6a8076] mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-[#12382c] dark:text-[#e4ede8]">No index cards found</h3>
              <p className="text-xs text-[#7c8d85] dark:text-[#8ea49a] mt-1">
                Try adjusting your search query or add a new sentence with indexed phrases.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SENTENCE CARDS LIST (Sentence View Mode) */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'sentence' && (
        <div className="space-y-4" role="region" aria-label="Sentences list">
          <div className="flex items-center justify-between text-xs font-medium text-[#647c72] dark:text-[#8ea49a] px-1">
            <span>
              Showing {filteredSentences.length} {filteredSentences.length === 1 ? 'sentence' : 'sentences'}
              {searchQuery.trim() && ` matching "${searchQuery.trim()}"`}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredSentences.map((sentence, sIdx) => (
              <div
                key={sentence.id}
                className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece8df] dark:border-[#23352f] shadow-xs hover:shadow-sm transition-all"
              >
                {/* Card Top: Index badges & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ede9df] dark:bg-[#273a34] text-[#4f675b] dark:text-[#9eb4aa]">
                      #{sIdx + 1}
                    </span>
                    {sentence.indexes.length > 0 ? (
                      sentence.indexes.map((idx) => (
                        <span
                          key={idx.id}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#dcf2e6] dark:bg-[#183d2f] text-[#12382c] dark:text-[#9fe2c7] ring-1 ring-[#b8ebd2] dark:ring-[#235845]"
                        >
                          <ListFilter className="w-2.5 h-2.5 text-[#133d2e] dark:text-[#34d399]" />
                          {idx.phrase}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#8c9e96] dark:text-[#6a8076] italic">
                        Unindexed
                      </span>
                    )}
                  </div>

                  {/* Actions: Speak, Translation Toggle, Favorite, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSpeakSentence(sentence.id, sentence.text)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        speakingSentenceId === sentence.id
                          ? 'text-[#12382c] dark:text-[#a7f3d0] bg-[#e3eedf] dark:bg-[#1f3d32] ring-1 ring-[#12382c]/20'
                          : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27]'
                      }`}
                      title="문장 듣기"
                      aria-label="Listen to sentence"
                    >
                      <Volume2 className="w-4 h-4 stroke-[2.2]" />
                    </button>

                    {sentence.translation && (
                      <button
                        type="button"
                        onClick={() => toggleTranslation(sentence.id)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          revealedTranslationIds[sentence.id]
                            ? 'text-[#12382c] dark:text-[#a7f3d0] bg-[#e3eedf] dark:bg-[#1f3d32]'
                            : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27]'
                        }`}
                        title={revealedTranslationIds[sentence.id] ? '번역 숨기기' : '번역 보기'}
                        aria-label={revealedTranslationIds[sentence.id] ? 'Hide translation' : 'Show translation'}
                      >
                        {revealedTranslationIds[sentence.id] ? (
                          <EyeOff className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <Eye className="w-4 h-4 stroke-[2.2]" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleFavorite(sentence.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        sentence.isFavorite
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27]'
                      }`}
                      aria-label={sentence.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                    >
                      <Star
                        className={`w-4 h-4 ${sentence.isFavorite ? 'fill-current' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSentenceToDelete(sentence)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8c9e96] dark:text-[#6a8076] hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      aria-label="Delete sentence"
                      title="문장 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sentence English Text */}
                <div
                  onClick={() => {
                    const firstIdx = sentence.indexes[0]?.phrase?.toLowerCase()
                    const matchingGroup = firstIdx
                      ? groupedIndexList.find((g) => g.phrase.toLowerCase() === firstIdx)
                      : null
                    if (matchingGroup) {
                      const sIdxInGroup = matchingGroup.sentences.findIndex((s) => s.id === sentence.id)
                      setSelectedDetailGroup({
                        group: matchingGroup,
                        initialIndex: sIdxInGroup >= 0 ? sIdxInGroup : 0,
                      })
                    } else {
                      onSelectSentenceToEdit(sentence)
                    }
                  }}
                  className="cursor-pointer group/sentence"
                >
                  <p className="text-base sm:text-lg text-[#143d30] dark:text-[#e4ede8] font-serif leading-relaxed group-hover/sentence:text-[#133d2e] dark:group-hover/sentence:text-[#a7f3d0] transition-colors">
                    {highlightMultiPhrases(
                      sentence.text,
                      sentence.indexes[0]?.phrase || '',
                      sentence.indexes.slice(1).map((i) => i.phrase)
                    )}
                  </p>
                </div>

                {/* Translation box */}
                {sentence.translation && (
                  <div className="mt-3">
                    {revealedTranslationIds[sentence.id] ? (
                      <p className="text-sm text-[#4d6359] dark:text-[#a0b5ab] bg-[#f6f4ee] dark:bg-[#182621] p-3 rounded-xl border border-[#ece8df] dark:border-[#23352f]">
                        {sentence.translation}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleTranslation(sentence.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#657c72] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] bg-[#f6f4ee]/80 dark:bg-[#182621]/80 px-2.5 py-1 rounded-lg border border-[#ece8df] dark:border-[#23352f] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>번역이 숨겨져 있습니다. 클릭하여 확인하세요.</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Additional Info / Note */}
                {sentence.notes && (
                  <div className="mt-2 text-xs text-[#6e8278] dark:text-[#8ea49a] bg-[#faf9f5] dark:bg-[#1b2b27] px-3 py-2 rounded-lg border border-[#eeebe3] dark:border-[#253932]">
                    <span className="font-semibold text-[#12382c] dark:text-[#a7f3d0] mr-1.5">Note:</span>
                    {sentence.notes}
                  </div>
                )}

                {/* Footer: Edit Button */}
                <div className="pt-3 mt-3 border-t border-[#f2ede4] dark:border-[#23352f] flex items-center justify-between gap-3">
                  <span className="text-xs text-[#71857c] dark:text-[#8ea49a]">
                    {sentence.indexes.length}개 인덱스 연결됨
                  </span>
                  <button
                    type="button"
                    onClick={() => setSentenceToEdit(sentence)}
                    className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] text-white transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Edit sentence</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSentences.length === 0 && (
            <div className="bg-white dark:bg-[#14201c] rounded-2xl p-12 text-center border border-[#ece8df] dark:border-[#23352f]">
              <BookOpen className="w-10 h-10 text-[#8c9e96] dark:text-[#6a8076] mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-[#12382c] dark:text-[#e4ede8]">No sentences found</h3>
              <p className="text-xs text-[#7c8d85] dark:text-[#8ea49a] mt-1">
                Try adjusting your search query or add a new sentence.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sentence Detail Popup Modal */}
      <SentenceDetailModal
        key={`${selectedDetailGroup?.group.phrase || 'none'}-${selectedDetailGroup?.initialIndex ?? 0}`}
        isOpen={selectedDetailGroup !== null}
        group={selectedDetailGroup?.group || null}
        initialSentenceIndex={selectedDetailGroup?.initialIndex ?? 0}
        onClose={() => setSelectedDetailGroup(null)}
        onSelectIndexToEdit={(sentence, indexId) => {
          setSelectedDetailGroup(null)
          if (onSelectIndexToEdit) {
            onSelectIndexToEdit(sentence, indexId)
          } else {
            onSelectSentenceToEdit(sentence)
          }
        }}
        onToggleFavorite={onToggleFavorite}
        onUpdateSentence={onUpdateSentence}
        onDeleteSentence={onDeleteSentence}
      />

      {/* Edit Sentence Modal */}
      {sentenceToEdit && (
        <EditSentenceModal
          isOpen={sentenceToEdit !== null}
          sentence={sentenceToEdit}
          onSaveSentence={(updated) => {
            if (onUpdateSentence) {
              onUpdateSentence(updated)
            }
            setSentenceToEdit(null)
          }}
          onClose={() => setSentenceToEdit(null)}
        />
      )}

      {/* Delete Sentence Confirmation Modal */}
      {sentenceToDelete && (
        <ConfirmationModal
          isOpen={sentenceToDelete !== null}
          title="문장 삭제"
          message="이 문장을 정말 삭제하시겠습니까? 삭제된 문장은 복구할 수 없습니다."
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={() => {
            if (sentenceToDelete) {
              onDeleteSentence(sentenceToDelete.id)
            }
            setSentenceToDelete(null)
          }}
          onCancel={() => setSentenceToDelete(null)}
        />
      )}
    </div>
  )
}

