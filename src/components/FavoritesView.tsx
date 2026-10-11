import React, { useState, useMemo } from 'react'
import {
  Star,
  Edit3,
  Trash2,
  ArrowLeft,
  Menu,
  ArrowUpDown,
  Eye,
  EyeOff,
  Volume2,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import type { SentenceData, IndexPhrase } from '../types'
import { highlightMultiPhrases } from '../utils/highlight'
import { speechService } from '../services/speechService'

interface FavoritesViewProps {
  sentences: SentenceData[]
  onSelectSentenceToEdit: (sentence: SentenceData) => void
  onToggleFavorite: (sentenceId: string) => void
  onDeleteSentence: (sentenceId: string) => void
  onBackToMain?: () => void
  onOpenMobileMenu?: () => void
  onSelectIndexToEdit?: (sentence: SentenceData, indexId: string) => void
}

type SortOrder = 'index-asc' | 'index-desc' | 'original'
type ViewMode = 'index' | 'sentence'

interface FlattenedFavIndexCard {
  indexId: string
  phrase: string
  sentence: SentenceData
}

interface FavoriteSentenceCardItem {
  id: string
  sentence: SentenceData
  allSentenceIds: string[]
  indexes: IndexPhrase[]
  primaryPhrase: string
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  sentences,
  onSelectSentenceToEdit,
  onToggleFavorite,
  onDeleteSentence,
  onBackToMain,
  onOpenMobileMenu,
  onSelectIndexToEdit,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('index')
  const [sortOrder, setSortOrder] = useState<SortOrder>('index-asc')
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

  const favoriteSentences = sentences.filter((s) => s.isFavorite)

  // 1. Index-based cards (Index별 보기: 각 인덱스 표현별 카드 분리)
  const favoriteIndexCards: FlattenedFavIndexCard[] = useMemo(() => {
    return favoriteSentences.flatMap((sentence) =>
      sentence.indexes.map((idx: IndexPhrase) => ({
        indexId: idx.id,
        phrase: idx.phrase,
        sentence,
      }))
    )
  }, [favoriteSentences])

  const sortedIndexCards = useMemo(() => {
    const list = [...favoriteIndexCards]
    if (sortOrder === 'index-asc') {
      return list.sort((a, b) =>
        a.phrase.localeCompare(b.phrase, undefined, { sensitivity: 'base' })
      )
    }
    if (sortOrder === 'index-desc') {
      return list.sort((a, b) =>
        b.phrase.localeCompare(a.phrase, undefined, { sensitivity: 'base' })
      )
    }
    return list
  }, [favoriteIndexCards, sortOrder])

  // 2. Sentence-based cards (Sentence별 보기: 문장별 카드 통합)
  const favoriteSentenceCards: FavoriteSentenceCardItem[] = useMemo(() => {
    const map = new Map<string, {
      sentence: SentenceData
      allSentenceIds: string[]
      indexesMap: Map<string, IndexPhrase>
    }>()

    for (const sentence of favoriteSentences) {
      const key = sentence.text.trim().toLowerCase()
      if (!map.has(key)) {
        const indexesMap = new Map<string, IndexPhrase>()
        for (const idx of sentence.indexes) {
          if (idx.phrase.trim()) {
            indexesMap.set(idx.phrase.trim().toLowerCase(), idx)
          }
        }
        map.set(key, {
          sentence,
          allSentenceIds: [sentence.id],
          indexesMap,
        })
      } else {
        const existing = map.get(key)!
        if (!existing.allSentenceIds.includes(sentence.id)) {
          existing.allSentenceIds.push(sentence.id)
        }
        for (const idx of sentence.indexes) {
          if (idx.phrase.trim() && !existing.indexesMap.has(idx.phrase.trim().toLowerCase())) {
            existing.indexesMap.set(idx.phrase.trim().toLowerCase(), idx)
          }
        }
        if (!existing.sentence.translation && sentence.translation) {
          existing.sentence.translation = sentence.translation
        }
        if (!existing.sentence.notes && sentence.notes) {
          existing.sentence.notes = sentence.notes
        }
      }
    }

    const items: FavoriteSentenceCardItem[] = []
    map.forEach((value) => {
      const indexes = Array.from(value.indexesMap.values())
      items.push({
        id: value.sentence.id,
        sentence: value.sentence,
        allSentenceIds: value.allSentenceIds,
        indexes,
        primaryPhrase: indexes.map((i) => i.phrase).join(' | ') || value.sentence.text,
      })
    })

    return items
  }, [favoriteSentences])

  const sortedSentenceCards = useMemo(() => {
    const list = [...favoriteSentenceCards]
    if (sortOrder === 'index-asc') {
      return list.sort((a, b) =>
        a.primaryPhrase.localeCompare(b.primaryPhrase, undefined, { sensitivity: 'base' })
      )
    }
    if (sortOrder === 'index-desc') {
      return list.sort((a, b) =>
        b.primaryPhrase.localeCompare(a.primaryPhrase, undefined, { sensitivity: 'base' })
      )
    }
    return list
  }, [favoriteSentenceCards, sortOrder])

  const handleEditIndexCard = (card: FlattenedFavIndexCard) => {
    if (onSelectIndexToEdit) {
      onSelectIndexToEdit(card.sentence, card.indexId)
    } else {
      onSelectSentenceToEdit(card.sentence)
    }
  }

  const handleEditSentenceCard = (card: FavoriteSentenceCardItem) => {
    if (onSelectIndexToEdit && card.indexes[0]?.id) {
      onSelectIndexToEdit(card.sentence, card.indexes[0].id)
    } else {
      onSelectSentenceToEdit(card.sentence)
    }
  }

  const handleToggleFavoriteSentence = (card: FavoriteSentenceCardItem) => {
    for (const id of card.allSentenceIds) {
      onToggleFavorite(id)
    }
  }

  const handleDeleteSentenceCard = (card: FavoriteSentenceCardItem) => {
    for (const id of card.allSentenceIds) {
      onDeleteSentence(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back to Main Navigation Link */}
      <div className="flex items-center justify-between">
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
            className="lg:hidden p-1.5 rounded-lg text-[#3d5249] dark:text-[#a0b5ab] hover:bg-[#eae6dc] dark:hover:bg-[#1b2b27] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Top Header */}
      <div className="pb-6 border-b border-[#eae6dc]/60 dark:border-[#23352f]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12382c] dark:text-[#e4ede8]">
          Favorites
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-sm text-[#5f756c] dark:text-[#8ea49a]">
            Your starred and high-priority cards:
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#dcf2e6] dark:bg-[#183d2f] text-[#12382c] dark:text-[#34d399] ring-1 ring-[#bbf0d7] dark:ring-[#235845]">
            <Sparkles className="w-3 h-3 text-[#12382c] dark:text-[#34d399]" />
            Index {favoriteIndexCards.length}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#e0e7ff] dark:bg-[#1e1b4b] text-[#3730a3] dark:text-[#a5b4fc] ring-1 ring-[#c7d2fe] dark:ring-[#312e81]">
            <BookOpen className="w-3 h-3 text-[#3730a3] dark:text-[#a5b4fc]" />
            Sentence {favoriteSentences.length}
          </span>
        </div>
      </div>

      {/* Controls Bar: Index/Sentence View Mode Toggle & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Index vs Sentence Mode Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#ede9df] dark:bg-[#1b2b27] border border-[#dedad0] dark:border-[#283d36] self-start">
          <button
            type="button"
            onClick={() => setViewMode('index')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'index'
                ? 'bg-white dark:bg-[#14201c] text-[#12382c] dark:text-[#34d399] shadow-xs'
                : 'text-[#61776c] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8]'
            }`}
            aria-label="View by index"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
            <span>Index별 ({favoriteIndexCards.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sentence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'sentence'
                ? 'bg-white dark:bg-[#14201c] text-[#3730a3] dark:text-[#a5b4fc] shadow-xs'
                : 'text-[#61776c] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8]'
            }`}
            aria-label="View by sentence"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#3730a3] dark:text-[#a5b4fc]" />
            <span>Sentence별 ({favoriteSentenceCards.length})</span>
          </button>
        </div>

        {/* Sort Selector */}
        <div className="relative inline-flex items-center self-end sm:self-auto">
          <label htmlFor="fav-index-sort-select" className="sr-only">
            Sort order
          </label>
          <div className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] text-xs font-medium text-[#234235] dark:text-[#c4ded3] shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#5e786d] dark:text-[#8ea49a]" />
            <span className="text-[#7c8d85] dark:text-[#8ea49a]">Sort:</span>
            <select
              id="fav-index-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-transparent font-semibold text-[#12382c] dark:text-[#e4ede8] focus:outline-none cursor-pointer pr-1"
            >
              <option value="index-asc" className="dark:bg-[#14201c]">A → Z</option>
              <option value="index-desc" className="dark:bg-[#14201c]">Z → A</option>
              <option value="original" className="dark:bg-[#14201c]">Original</option>
            </select>
          </div>
        </div>
      </div>

      {/* Favorite Cards Grid */}
      <div className="space-y-4">
        {/* VIEW 1: INDEX-BASED CARDS (Default) */}
        {viewMode === 'index' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedIndexCards.map((card, idx) => (
              <div
                key={`idx-${card.sentence.id}-${card.indexId}-${idx}`}
                className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece7dc] dark:border-[#23352f] hover:border-[#133d2e]/30 dark:hover:border-[#34d399]/30 shadow-[0_2px_10px_-2px_rgba(20,50,40,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(20,50,40,0.08)] transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#f4f1e8] dark:border-[#23352f]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-lg bg-[#e8f5ee] dark:bg-[#1b352b] text-[#134937] dark:text-[#a7f3d0] ring-1 ring-[#c5e6d3] dark:ring-[#235845] inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#1a533f] dark:text-[#34d399]" />
                          {card.phrase}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200/80 dark:ring-amber-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current text-amber-500" />
                          Favorite
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#12382c] dark:text-[#e4ede8] tracking-tight truncate">
                        {card.phrase}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSpeakSentence(card.sentence.id, card.sentence.text)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          speakingSentenceId === card.sentence.id
                            ? 'text-[#12382c] dark:text-[#a7f3d0] bg-[#e3eedf] dark:bg-[#1f3d32] ring-1 ring-[#12382c]/20'
                            : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae6dc] dark:hover:bg-[#1b2b27]'
                        }`}
                        aria-label="Listen to sentence"
                        title="문장 듣기"
                      >
                        <Volume2 className="w-4 h-4 stroke-[2.2]" />
                      </button>

                      {card.sentence.translation && (
                        <button
                          type="button"
                          onClick={() => toggleTranslation(card.sentence.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                            revealedTranslationIds[card.sentence.id]
                              ? 'text-[#133d2e] dark:text-[#34d399] bg-[#e8f5ee] dark:bg-[#1b352b]'
                              : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae6dc] dark:hover:bg-[#1b2b27]'
                          }`}
                          aria-label={revealedTranslationIds[card.sentence.id] ? 'Hide translation' : 'Show translation'}
                          title={revealedTranslationIds[card.sentence.id] ? '번역 숨기기' : '번역 보기'}
                        >
                          {revealedTranslationIds[card.sentence.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(card.sentence.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        aria-label="Remove from favorites"
                        title="즐겨찾기 해제"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSentence(card.sentence.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8c9e96] dark:text-[#6a8076] hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        aria-label="Delete sentence"
                        title="문장 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 pb-1">
                    <div className="p-3 sm:p-3.5 rounded-xl bg-[#faf9f5] dark:bg-[#1b2b27] border border-[#eeebe3] dark:border-[#283d36] hover:border-[#ded8ca] dark:hover:border-[#38534a] transition-all">
                      <p className="text-sm sm:text-base text-[#143d30] dark:text-[#d3e2db] font-serif leading-relaxed">
                        {highlightMultiPhrases(
                          card.sentence.text,
                          card.phrase,
                          card.sentence.indexes
                            .filter((i) => i.phrase.toLowerCase() !== card.phrase.toLowerCase())
                            .map((i) => i.phrase)
                        )}
                      </p>

                      {card.sentence.translation && (
                        <div className="mt-2.5 pt-2 border-t border-[#eeebe3] dark:border-[#283d36]">
                          {revealedTranslationIds[card.sentence.id] ? (
                            <div className="flex items-start justify-between gap-2 animate-in fade-in duration-150">
                              <p className="text-xs text-[#527063] dark:text-[#8ea49a] font-sans leading-relaxed">
                                {card.sentence.translation}
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleTranslation(card.sentence.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7c8d85] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] px-1.5 py-0.5 rounded hover:bg-[#ede9df] dark:hover:bg-[#20342f] transition-colors shrink-0 cursor-pointer"
                                aria-label="Hide translation"
                              >
                                <EyeOff className="w-3 h-3" />
                                <span>숨기기</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleTranslation(card.sentence.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b6b58] dark:text-[#6ee7b7] hover:text-[#12382c] dark:hover:text-[#a7f3d0] transition-colors py-0.5 group cursor-pointer"
                              aria-label="Show translation"
                            >
                              <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span>번역 보기</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 mt-3 border-t border-[#f2ede4] dark:border-[#23352f] flex items-center justify-between gap-3">
                  <div className="text-xs text-[#71857c] dark:text-[#8ea49a] font-medium truncate">
                    Favorite index tagged with "{card.phrase}"
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditIndexCard(card)}
                    className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] text-white transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Edit index</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: SENTENCE-BASED CARDS */}
        {viewMode === 'sentence' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedSentenceCards.map((card, idx) => (
              <div
                key={`sent-${card.sentence.id}-${idx}`}
                className="bg-white dark:bg-[#14201c] rounded-2xl p-5 sm:p-6 border border-[#ece7dc] dark:border-[#23352f] hover:border-[#133d2e]/30 dark:hover:border-[#34d399]/30 shadow-[0_2px_10px_-2px_rgba(20,50,40,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(20,50,40,0.08)] transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5"
              >
                <div>
                  {/* Card Header: All indexes displayed as badges and title */}
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#f4f1e8] dark:border-[#23352f]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {card.indexes.map((indexObj) => (
                          <span
                            key={indexObj.id}
                            className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-lg bg-[#e8f5ee] dark:bg-[#1b352b] text-[#134937] dark:text-[#a7f3d0] ring-1 ring-[#c5e6d3] dark:ring-[#235845] inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-[#1a533f] dark:text-[#34d399]" />
                            {indexObj.phrase}
                          </span>
                        ))}
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200/80 dark:ring-amber-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current text-amber-500" />
                          Favorite
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-[#12382c] dark:text-[#e4ede8] tracking-tight truncate flex items-center flex-wrap">
                        {card.indexes.length > 0
                          ? card.indexes.map((i, idx) => (
                              <React.Fragment key={i.id || idx}>
                                {idx > 0 && (
                                  <span className="text-[#9cb0a6] dark:text-[#4e685c] font-light mx-1.5 select-none">
                                    {' | '}
                                  </span>
                                )}
                                <span>{i.phrase}</span>
                              </React.Fragment>
                            ))
                          : card.primaryPhrase}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSpeakSentence(card.sentence.id, card.sentence.text)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          speakingSentenceId === card.sentence.id
                            ? 'text-[#12382c] dark:text-[#a7f3d0] bg-[#e3eedf] dark:bg-[#1f3d32] ring-1 ring-[#12382c]/20'
                            : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae6dc] dark:hover:bg-[#1b2b27]'
                        }`}
                        aria-label="Listen to sentence"
                        title="문장 듣기"
                      >
                        <Volume2 className="w-4 h-4 stroke-[2.2]" />
                      </button>

                      {card.sentence.translation && (
                        <button
                          type="button"
                          onClick={() => toggleTranslation(card.sentence.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                            revealedTranslationIds[card.sentence.id]
                              ? 'text-[#133d2e] dark:text-[#34d399] bg-[#e8f5ee] dark:bg-[#1b352b]'
                              : 'text-[#8c9e96] dark:text-[#6a8076] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#eae6dc] dark:hover:bg-[#1b2b27]'
                          }`}
                          aria-label={revealedTranslationIds[card.sentence.id] ? 'Hide translation' : 'Show translation'}
                          title={revealedTranslationIds[card.sentence.id] ? '번역 숨기기' : '번역 보기'}
                        >
                          {revealedTranslationIds[card.sentence.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleFavoriteSentence(card)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        aria-label="Remove from favorites"
                        title="즐겨찾기 해제"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSentenceCard(card)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8c9e96] dark:text-[#6a8076] hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        aria-label="Delete sentence"
                        title="문장 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Sentence text rendered once with all multi-index phrases highlighted */}
                  <div className="pt-3 pb-1">
                    <div className="p-3 sm:p-3.5 rounded-xl bg-[#faf9f5] dark:bg-[#1b2b27] border border-[#eeebe3] dark:border-[#283d36] hover:border-[#ded8ca] dark:hover:border-[#38534a] transition-all">
                      <p className="text-sm sm:text-base text-[#143d30] dark:text-[#d3e2db] font-serif leading-relaxed">
                        {highlightMultiPhrases(
                          card.sentence.text,
                          card.indexes[0]?.phrase || '',
                          card.indexes.slice(1).map((i) => i.phrase)
                        )}
                      </p>

                      {card.sentence.translation && (
                        <div className="mt-2.5 pt-2 border-t border-[#eeebe3] dark:border-[#283d36]">
                          {revealedTranslationIds[card.sentence.id] ? (
                            <div className="flex items-start justify-between gap-2 animate-in fade-in duration-150">
                              <p className="text-xs text-[#527063] dark:text-[#8ea49a] font-sans leading-relaxed">
                                {card.sentence.translation}
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleTranslation(card.sentence.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7c8d85] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] px-1.5 py-0.5 rounded hover:bg-[#ede9df] dark:hover:bg-[#20342f] transition-colors shrink-0 cursor-pointer"
                                aria-label="Hide translation"
                              >
                                <EyeOff className="w-3 h-3" />
                                <span>숨기기</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleTranslation(card.sentence.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b6b58] dark:text-[#6ee7b7] hover:text-[#12382c] dark:hover:text-[#a7f3d0] transition-colors py-0.5 group cursor-pointer"
                              aria-label="Show translation"
                            >
                              <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span>번역 보기</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Edit Button & Index Summary */}
                <div className="pt-3.5 mt-3 border-t border-[#f2ede4] dark:border-[#23352f] flex items-center justify-between gap-3">
                  <div className="text-xs text-[#71857c] dark:text-[#8ea49a] font-medium truncate">
                    {card.indexes.length > 1 ? (
                      <span>
                        {card.indexes.length}개 인덱스 태그:{' '}
                        {card.indexes.map((i, idx) => (
                          <React.Fragment key={i.id || idx}>
                            {idx > 0 && (
                              <span className="text-[#a4b5ad] dark:text-[#4d665a] font-light mx-1 select-none">
                                {' | '}
                              </span>
                            )}
                            <span>{i.phrase}</span>
                          </React.Fragment>
                        ))}
                      </span>
                    ) : (
                      `인덱스 태그: "${card.indexes[0]?.phrase || ''}"`
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditSentenceCard(card)}
                    className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] text-white transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Edit sentence</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {favoriteSentences.length === 0 && (
          <div className="bg-white dark:bg-[#14201c] rounded-2xl p-12 text-center border border-[#ece8df] dark:border-[#23352f]">
            <Star className="w-10 h-10 text-amber-400 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-[#12382c] dark:text-[#e4ede8]">No favorite items yet</h3>
            <p className="text-xs text-[#7c8d85] dark:text-[#8ea49a] mt-1">
              Click the star icon on any index card or sentence in the Library to save it here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
