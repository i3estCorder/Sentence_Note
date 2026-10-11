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

      <div className="relative w-full max-w-md bg-white dark:bg-[#14201c] rounded-2xl p-6 shadow-2xl border border-[#ece8de] dark:border-[#23352f] z-10">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-[#6c7d75] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f2efe6] dark:hover:bg-[#1b2b27] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="add-index-title" className="text-lg font-bold text-[#12382c] dark:text-[#e4ede8]">
          Add index phrases
        </h3>
        <p className="text-xs text-[#5f746b] dark:text-[#8ea49a] mt-1">
          Enter one or multiple phrases separated by commas.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="add-phrase-input"
              className="text-xs font-semibold text-[#7c8d85] dark:text-[#8ea49a] uppercase tracking-wider block mb-1.5"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f6f5ef] dark:bg-[#1b2b27] border border-[#e4e0d4] dark:border-[#283d36] text-[#12382c] dark:text-[#e4ede8] text-sm focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] focus:bg-white dark:focus:bg-[#14201c] placeholder-[#8c9e96] dark:placeholder-[#6a8076]"
            />

            {uniqueSuggestions.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#7c8d85] dark:text-[#8ea49a]">Suggestions:</span>
                {uniqueSuggestions.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setPhraseInput((prev) => (prev ? `${prev}, ${w}` : w))
                    }}
                    className="text-xs px-2 py-0.5 rounded-md bg-[#eef8f2] dark:bg-[#1b352b] text-[#165a41] dark:text-[#a7f3d0] hover:bg-[#dcf2e6] dark:hover:bg-[#204a37] border border-emerald-100 dark:border-[#235845] transition-colors cursor-pointer"
                  >
                    +{w}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f4f1e8] dark:border-[#23352f]">
            <button
              type="button"
              onClick={handleClose}
              className="h-9.5 px-4 text-xs sm:text-sm font-semibold text-[#465b52] dark:text-[#a0b5ab] bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] hover:bg-[#f7f5ed] dark:hover:bg-[#1b2b27] active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!phraseInput.trim()}
              className="inline-flex items-center gap-1.5 h-9.5 px-4.5 text-xs sm:text-sm font-semibold text-white bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] rounded-xl transition-all disabled:opacity-40 shadow-xs hover:shadow-sm cursor-pointer"
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
