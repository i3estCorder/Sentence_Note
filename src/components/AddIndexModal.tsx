import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { IndexPhrase } from '../types'

interface AddIndexModalProps {
  isOpen: boolean
  sentenceText: string
  existingIndexes: IndexPhrase[]
  onAddMulti: (phrases: string[]) => void
  onClose: () => void
}

export const AddIndexModal: React.FC<AddIndexModalProps> = ({
  isOpen,
  sentenceText,
  existingIndexes,
  onAddMulti,
  onClose,
}) => {
  const [phraseInput, setPhraseInput] = useState('')

  const handleClose = () => {
    setPhraseInput('')
    onClose()
  }

  if (!isOpen) return null

  // Quick word suggestions from sentence words that aren't already indexed
  const existingPhrases = existingIndexes.map((i) => i.phrase.toLowerCase())
  const words = sentenceText
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !existingPhrases.includes(w.toLowerCase()) &&
        !['the', 'is', 'and', 'for', 'are', 'was', 'were'].includes(w.toLowerCase())
    )
  const uniqueSuggestions = Array.from(new Set(words)).slice(0, 5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = phraseInput.trim()
    if (!trimmed) return

    const phrases = trimmed
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (phrases.length > 0) {
      onAddMulti(phrases)
    }
    handleClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-index-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-[#ece8de] z-10">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-[#6c7d75] hover:text-[#12382c] hover:bg-[#f2efe6] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="add-index-title" className="text-lg font-bold text-[#12382c]">
          Add index phrases
        </h3>
        <p className="text-xs text-[#5f746b] mt-1">
          Enter one or multiple phrases separated by commas.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="add-phrase-input"
              className="text-xs font-semibold text-[#7c8d85] uppercase tracking-wider block mb-1.5"
            >
              Index Phrase(s)
            </label>
            <input
              id="add-phrase-input"
              type="text"
              value={phraseInput}
              onChange={(e) => setPhraseInput(e.target.value)}
              placeholder="e.g. bookstore, small café..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f6f5ef] border border-[#e4e0d4] text-[#12382c] text-sm focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 focus:border-[#133d2e] focus:bg-white"
            />

            {uniqueSuggestions.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#7c8d85]">Suggestions:</span>
                {uniqueSuggestions.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setPhraseInput((prev) => (prev ? `${prev}, ${w}` : w))
                    }}
                    className="text-xs px-2 py-0.5 rounded-md bg-[#eef8f2] text-[#165a41] hover:bg-[#dcf2e6] transition-colors"
                  >
                    +{w}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f4f1e8]">
            <button
              type="button"
              onClick={handleClose}
              className="h-9.5 px-4 text-xs sm:text-sm font-semibold text-[#465b52] bg-white border border-[#dedad0] hover:bg-[#f7f5ed] active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!phraseInput.trim()}
              className="inline-flex items-center gap-1.5 h-9.5 px-4.5 text-xs sm:text-sm font-semibold text-white bg-[#133d2e] hover:bg-[#0c2b20] active:scale-[0.98] rounded-xl transition-all disabled:opacity-40 shadow-xs hover:shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.4]" />
              <span>Add to sentence</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
