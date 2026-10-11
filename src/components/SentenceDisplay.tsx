import React from 'react'
import type { IndexPhrase } from '../types'
import { findPhraseMatches } from '../utils/highlight'

interface SentenceDisplayProps {
  sentenceText: string
  indexes: IndexPhrase[]
  activeIndexId: string
  onSelectIndex: (id: string) => void
}

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  sentenceText,
  indexes,
  activeIndexId,
  onSelectIndex,
}) => {
  // Parse sentence into segments based on indexed phrases
  const renderInteractiveSentence = () => {
    // If no indexes, just return plain text
    if (!indexes || indexes.length === 0) {
      return <span>{sentenceText}</span>
    }

    // Find occurrences of each indexed phrase
    type MatchSpan = {
      startIndex: number
      endIndex: number
      indexPhrase: IndexPhrase
    }

    const matches: MatchSpan[] = []

    for (const idx of indexes) {
      if (!idx.phrase.trim()) continue
      const phraseMatches = findPhraseMatches(sentenceText, idx.phrase, idx.id === activeIndexId)
      for (const m of phraseMatches) {
        matches.push({
          startIndex: m.start,
          endIndex: m.end,
          indexPhrase: idx,
        })
      }
    }

    // Sort matches by startIndex
    matches.sort((a, b) => a.startIndex - b.startIndex)

    // Handle non-overlapping segments
    const elements: React.ReactNode[] = []
    let cursor = 0

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      if (match.startIndex < cursor) {
        // Skip overlapping for safety
        continue
      }

      // Add text before match
      if (match.startIndex > cursor) {
        elements.push(
          <span key={`text-${cursor}`}>
            {sentenceText.substring(cursor, match.startIndex)}
          </span>
        )
      }

      // Add match highlight
      const isActive = match.indexPhrase.id === activeIndexId
      const matchedText = sentenceText.substring(match.startIndex, match.endIndex)

      elements.push(
        <button
          key={`match-${match.startIndex}-${match.indexPhrase.id}`}
          type="button"
          onClick={() => onSelectIndex(match.indexPhrase.id)}
          className={`inline-block mx-1 px-2.5 py-0.5 rounded-md font-medium transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e] ${
            isActive
              ? 'bg-[#fef08a] text-[#12382c] shadow-xs ring-1 ring-amber-300'
              : 'bg-[#dcf2e6] text-[#12382c] hover:bg-[#cceed9] cursor-pointer'
          }`}
          title={isActive ? 'Currently editing' : `Switch to edit "${match.indexPhrase.phrase}"`}
          aria-label={
            isActive
              ? `Currently editing index: ${match.indexPhrase.phrase}`
              : `Click to edit index: ${match.indexPhrase.phrase}`
          }
        >
          {matchedText}
        </button>
      )

      cursor = match.endIndex
    }

    // Add remainder
    if (cursor < sentenceText.length) {
      elements.push(
        <span key={`text-${cursor}`}>
          {sentenceText.substring(cursor)}
        </span>
      )
    }

    return elements
  }

  const countText =
    indexes.length === 2
      ? 'Two indexed phrases in this sentence'
      : indexes.length === 1
        ? 'One indexed phrase in this sentence'
        : `${indexes.length} indexed phrases in this sentence`

  return (
    <div className="mb-6">
      <div className="text-xl sm:text-2xl md:text-[26px] leading-relaxed text-[#143d30] font-serif font-normal">
        {renderInteractiveSentence()}
      </div>

      <p className="text-xs sm:text-sm text-[#7c8d85] mt-3 font-normal">
        {countText}
      </p>

      <div className="mt-6 border-b border-[#ece7dc]" />
    </div>
  )
}
