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
  Sparkles,
} from 'lucide-react'
import type { SentenceData } from '../types'
import { SentenceDetailModal } from './SentenceDetailModal'
import { EditSentenceModal } from './EditSentenceModal'
import { ConfirmationModal } from './ConfirmationModal'
import { highlightMultiPhrases } from '../utils/highlight'

interface LibraryViewProps {
  sentences: SentenceData[]
  onSelectSentenceToEdit: (sentence: SentenceData) => void
  onToggleFavorite: (sentenceId: string) => void
  onDeleteSentence: (sentenceId: string) => void
  onUpdateSentence?: (sentence: SentenceData) => void
  onNavigateToAdd: () => void
  onBackToMain: () => void
  onOpenMobileMenu?: () => void
  onSelectIndexToEdit?: (sentence: SentenceData, indexId: string) => void
  onDeleteIndex?: (sentenceId: string, indexId: string) => void
  onExportJSON?: () => void
  onImportJSON?: (data: SentenceData[]) => void
}

type SortOrder = 'index-asc' | 'index-desc' | 'original'

interface GroupedIndex {
  phrase: string
  letter: string
  sentences: SentenceData[]
}

interface AlphabetSection {
  letter: string
  indexes: GroupedIndex[]
}

// Bookmark color palette inspired by neon book index tabs (Image 2)
const TAB_PALETTES = [
  { bg: 'bg-[#ff2d7a]', border: 'border-[#e02068]', text: 'text-white' },
  { bg: 'bg-[#84cc16]', border: 'border-[#65a30d]', text: 'text-[#14360e]' },
  { bg: 'bg-[#facc15]', border: 'border-[#eab308]', text: 'text-[#422006]' },
  { bg: 'bg-[#fb923c]', border: 'border-[#f97316]', text: 'text-white' },
  { bg: 'bg-[#c084fc]', border: 'border-[#a855f7]', text: 'text-white' },
  { bg: 'bg-[#38bdf8]', border: 'border-[#0ea5e9]', text: 'text-white' },
  { bg: 'bg-[#2dd4bf]', border: 'border-[#14b8a6]', text: 'text-[#042f2e]' },
]


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
  onDeleteIndex,
  onExportJSON,
  onImportJSON,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('index-asc')
  const [selectedDetailGroup, setSelectedDetailGroup] = useState<GroupedIndex | null>(null)
  const [sentenceToEdit, setSentenceToEdit] = useState<SentenceData | null>(null)
  const [sentenceToDelete, setSentenceToDelete] = useState<SentenceData | null>(null)

  // Google Photos style fast-scroll floating bubble state
  const [scrollingLabel, setScrollingLabel] = useState<string>('')
  const [isScrolling, setIsScrolling] = useState<boolean>(false)
  const scrollTimeoutRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Group sentences by unique index phrase (Case-insensitive unique phrase grouping)
  const groupedIndexMap = useMemo(() => {
    const map = new Map<string, { phrase: string; sentences: SentenceData[] }>()

    for (const sentence of sentences) {
      for (const idx of sentence.indexes) {
        const trimmed = idx.phrase.trim()
        if (!trimmed) continue
        const key = trimmed.toLowerCase()

        if (!map.has(key)) {
          map.set(key, {
            phrase: trimmed,
            sentences: [sentence],
          })
        } else {
          const entry = map.get(key)!
          // avoid duplicate sentence in the same index group
          if (!entry.sentences.some((s) => s.id === sentence.id)) {
            entry.sentences.push(sentence)
          }
        }
      }
    }

    return map
  }, [sentences])

  // Convert map to list and filter by search query
  const groupedIndexList: GroupedIndex[] = useMemo(() => {
    const list: GroupedIndex[] = []
    const q = searchQuery.toLowerCase().trim()

    groupedIndexMap.forEach((entry) => {
      const matchesPhrase = entry.phrase.toLowerCase().includes(q)
      const matchingSentences = entry.sentences.filter(
        (s) => matchesPhrase || s.text.toLowerCase().includes(q)
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

  // Scroll listener for Google Photos style fast-scroll indicator
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true)

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

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false)
      }, 1200)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [alphabetSections])

  // Smooth scroll to an alphabet section
  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`section-${letter}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setScrollingLabel(letter)
      setIsScrolling(true)
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false)
      }, 1400)
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
        alert('Invalid JSON file format.')
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="relative space-y-6 pb-24">
      {/* Hidden JSON file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Back to Main Navigation Link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToMain}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#486358] hover:text-[#12382c] transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-[#ede9df] group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Edit index (Main)</span>
        </button>

        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-[#3d5249] hover:bg-[#eae6dc] transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#eae6dc]/60">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12382c]">
              Sentence Library
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#133d2e] text-white shadow-2xs">
              {sentences.length} sentences
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#dcf2e6] text-[#133d2e]">
              <Sparkles className="w-3 h-3 text-[#133d2e]" />
              2-Tier Index Grouping
            </span>
          </div>
          <p className="text-sm text-[#5f756c] mt-1">
            Browse indexes and sentences in your vault ({groupedIndexList.length} unique index cards &bull; {alphabetSections.length} alphabet chapters &bull; {sentences.length} sentences).
          </p>
        </div>

        {/* Action Buttons: Export/Import JSON & New Sentence */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onExportJSON && (
            <button
              type="button"
              onClick={onExportJSON}
              title="Download all sentences as a JSON file"
              className="inline-flex items-center gap-1.5 h-9.5 px-3.5 bg-white hover:bg-[#f6f4ee] active:scale-[0.98] border border-[#dedad0] text-[#12382c] text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#486358]" />
              <span>Export JSON</span>
            </button>
          )}

          {onImportJSON && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import sentences from a JSON backup file"
              className="inline-flex items-center gap-1.5 h-9.5 px-3.5 bg-white hover:bg-[#f6f4ee] active:scale-[0.98] border border-[#dedad0] text-[#12382c] text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#486358]" />
              <span>Import JSON</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToAdd}
            className="inline-flex items-center gap-1.5 h-9.5 px-4 bg-[#133d2e] hover:bg-[#0c2b20] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.4]" aria-hidden="true" />
            <span>New sentence</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search, View Mode Toggle, and Sort Order */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8d85]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search index keywords or sentence context..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#dedad0] text-sm text-[#12382c] placeholder-[#8c9e96] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 focus:border-[#133d2e] transition-all"
          />
        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sort Order Selector */}
          <div className="relative inline-flex items-center">
            <label htmlFor="index-sort-select" className="sr-only">
              Sort index order
            </label>
            <div className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white border border-[#dedad0] text-xs font-medium text-[#234235] shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5e786d]" />
              <span className="text-[#7c8d85]">Sort:</span>
              <select
                id="index-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="bg-transparent font-semibold text-[#12382c] focus:outline-none cursor-pointer pr-1"
              >
                <option value="index-asc">Index (A → Z)</option>
                <option value="index-desc">Index (Z → A)</option>
                <option value="original">Original</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* GOOGLE PHOTOS STYLE FLOATING FAST-SCROLL BUBBLE */}
      {/* ------------------------------------------------------------- */}
      <div
        aria-live="polite"
        className={`fixed right-14 sm:right-20 top-24 z-50 pointer-events-none transition-all duration-300 transform ${
          isScrolling && scrollingLabel
            ? 'opacity-100 translate-x-0 scale-100 shadow-2xl'
            : 'opacity-0 translate-x-4 scale-90'
        }`}
      >
        <div className="bg-[#12382c]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-[#235845] flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-[#fef08a] text-[#12382c] font-black text-sm flex items-center justify-center shadow-xs">
            {scrollingLabel.slice(0, 1).toUpperCase()}
          </div>
          <div className="pr-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#a2cbba]">
              Index Position
            </div>
            <div className="text-sm font-bold text-white tracking-tight capitalize">
              {scrollingLabel}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* IMAGE 2 INSPIRED BOOKMARK INDEX TAB RAIL (Right Edge Sticky) */}
      {/* ------------------------------------------------------------- */}
      {activeLetters.length > 0 && (
        <aside
          aria-label="Alphabetical fast-jump tabs"
          className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 items-end pointer-events-auto"
        >
          {activeLetters.map((letter, idx) => {
            const palette = TAB_PALETTES[idx % TAB_PALETTES.length]
            const isCurrent = scrollingLabel.toUpperCase().startsWith(letter.toUpperCase())

            return (
              <button
                key={letter}
                type="button"
                onClick={() => scrollToLetter(letter)}
                title={`Jump to section ${letter}`}
                className={`group relative flex items-center justify-center rounded-l-md transition-all cursor-pointer font-bold select-none ${
                  palette.bg
                } ${palette.text} ${
                  isCurrent
                    ? 'w-10 h-7 text-xs shadow-md ring-2 ring-white translate-x-0 font-black'
                    : 'w-7 h-6 text-[11px] opacity-85 hover:opacity-100 hover:w-9 hover:-translate-x-1 shadow-xs'
                }`}
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 12% 50%)',
                }}
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
      {/* 2-TIER GROUPED INDEX CARDS (Default & Permanent View) */}
      {/* Tier 1: Alphabet Section Chapter Header */}
      {/* Tier 2: Grouped Index Card (e.g. rare is 1 card) */}
      {/* Tier 3: Multiple Context Sentences Grouped Inside Card */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-10" role="region" aria-label="Index cards list">
        <div className="flex items-center justify-between text-xs font-medium text-[#647c72] px-1">
            <span>
              Showing {groupedIndexList.length} unique index {groupedIndexList.length === 1 ? 'card' : 'cards'} in {alphabetSections.length} alphabet chapters
              {sortOrder === 'index-asc' && ' (sorted by index A → Z)'}
              {sortOrder === 'index-desc' && ' (sorted by index Z → A)'}
            </span>
          </div>

          {alphabetSections.map((section, secIdx) => {
            const palette = TAB_PALETTES[secIdx % TAB_PALETTES.length]

            return (
              <section
                key={section.letter}
                id={`section-${section.letter}`}
                data-scroll-anchor={`Chapter ${section.letter}`}
                className="scroll-mt-24 space-y-4"
              >
                {/* TIER 1: Alphabet Section Header */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#e8e4da]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex items-center justify-center min-w-8 h-7 px-2.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-xs ${palette.bg} ${palette.text}`}
                    >
                      <span>{section.letter}</span>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[#7c8d85]">
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
                        onClick={() => setSelectedDetailGroup(group)}
                        className="scroll-mt-24 bg-white rounded-2xl p-5 sm:p-6 border border-[#ece7dc] hover:border-[#133d2e]/30 shadow-[0_2px_10px_-2px_rgba(20,50,40,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(20,50,40,0.08)] transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:-translate-y-0.5"
                      >
                        <div>
                          {/* Card Header: Index Phrase as primary hero */}
                          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#f4f1e8]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-lg bg-[#e8f5ee] text-[#134937] ring-1 ring-[#c5e6d3]">
                                  {group.phrase}
                                </span>
                                {hasFavorite && (
                                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current text-amber-500" />
                                    Favorite
                                  </span>
                                )}
                                {group.sentences.length > 1 && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#fef3c7] text-[#78350f] ring-1 ring-amber-300/70">
                                    {group.sentences.length} sentences
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg sm:text-xl font-bold text-[#12382c] tracking-tight truncate">
                                {group.phrase}
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
                                      ? 'text-amber-500 hover:bg-amber-50'
                                      : 'text-[#8c9e96] hover:text-[#12382c] hover:bg-[#f6f4ee]'
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

                              {firstSentence && targetIndexObj && onDeleteIndex ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteIndex(firstSentence.id, targetIndexObj.id)
                                  }}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8c9e96] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                  aria-label={`Delete ${group.phrase} index`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : firstSentence ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSentenceToDelete(firstSentence)
                                  }}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8c9e96] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                  aria-label="Delete sentence"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>

                          {/* TIER 3: Context Sentence(s) Grouped Inside Card */}
                          <div className="pt-3.5 pb-2 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#7c8d85]">
                              {group.sentences.length > 1
                                ? `Context sentences (${group.sentences.length})`
                                : 'Context sentence'}
                            </p>

                            <div className="space-y-2.5">
                              {group.sentences.map((sentence, sIdx) => (
                                <div
                                  key={sentence.id}
                                  className="p-3 sm:p-3.5 rounded-xl bg-[#faf9f5] border border-[#eeebe3] hover:border-[#ded8ca] transition-all"
                                >
                                  {/* Sentence mini toolbar: Number, Favorite, Edit, Delete */}
                                  <div className="flex items-center justify-between mb-1.5 gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ede9df] text-[#4f675b]">
                                      Sentence {sIdx + 1}
                                    </span>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onToggleFavorite(sentence.id)
                                        }}
                                        className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                          sentence.isFavorite
                                            ? 'text-amber-500 hover:bg-amber-50'
                                            : 'text-[#9bad9f] hover:text-[#12382c] hover:bg-[#eae5d8]'
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
                                        className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[#8c9e96] hover:text-[#12382c] hover:bg-[#eae5d8] transition-colors cursor-pointer"
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
                                        className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[#8c9e96] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                        title="문장 삭제"
                                        aria-label="Delete sentence"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-sm sm:text-base text-[#143d30] font-serif leading-relaxed">
                                    {highlightMultiPhrases(
                                      sentence.text,
                                      group.phrase,
                                      sentence.indexes
                                        .filter((i) => i.phrase.toLowerCase() !== group.phrase.toLowerCase())
                                        .map((i) => i.phrase)
                                    )}
                                  </p>

                                  {sentence.translation && (
                                    <p className="mt-1.5 text-xs text-[#527063] font-sans">
                                      {sentence.translation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3.5 mt-3 border-t border-[#f2ede4] flex items-center justify-between gap-3">
                          <div className="text-xs text-[#71857c] font-medium truncate">
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
                              className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-[#133d2e] hover:bg-[#0c2b20] active:scale-[0.98] text-white transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
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
            <div className="bg-white rounded-2xl p-12 text-center border border-[#ece8df]">
              <BookOpen className="w-10 h-10 text-[#8c9e96] mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-[#12382c]">No index cards found</h3>
              <p className="text-xs text-[#7c8d85] mt-1">
                Try adjusting your search query or add a new sentence with indexed phrases.
              </p>
            </div>
          )}
        </div>

      {/* Sentence Detail Popup Modal */}
      <SentenceDetailModal
        key={selectedDetailGroup?.phrase || 'none'}
        isOpen={selectedDetailGroup !== null}
        group={selectedDetailGroup}
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

