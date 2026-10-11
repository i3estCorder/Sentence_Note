import React, { useState } from 'react'
import { Plus, X, Sparkles } from 'lucide-react'
import type { IndexPhrase } from '../types'

interface IndexEditFormProps {
  sentenceText: string
  indexes: IndexPhrase[]
  activeIndexId: string
  onSelectIndex: (id: string) => void
  onUpdateIndexes: (indexes: IndexPhrase[]) => void
  onDeleteRequest: (indexId: string) => void
  onCancel: () => void
}

function createIndexId(prefix = 'idx'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const IndexEditForm: React.FC<IndexEditFormProps> = ({
  sentenceText,
  indexes,
  activeIndexId,
  onSelectIndex,
  onUpdateIndexes,
  onDeleteRequest,
  onCancel,
}) => {
  const [localIndexes, setLocalIndexes] = useState<IndexPhrase[]>(indexes)
  const [prevIndexes, setPrevIndexes] = useState<IndexPhrase[]>(indexes)

  const activeIndex = localIndexes.find((idx) => idx.id === activeIndexId) || localIndexes[0]

  const [activePhraseEdit, setActivePhraseEdit] = useState(activeIndex?.phrase || '')
  const [prevActiveId, setPrevActiveId] = useState(activeIndexId)
  const [multiInput, setMultiInput] = useState('')

  if (prevIndexes !== indexes) {
    setPrevIndexes(indexes)
    setLocalIndexes(indexes)
  }

  if (prevActiveId !== activeIndexId) {
    setPrevActiveId(activeIndexId)
    setActivePhraseEdit(activeIndex?.phrase || '')
  }

  // Extract candidate words from sentence that are not yet indexed
  const existingPhrasesLower = localIndexes.map((i) => i.phrase.toLowerCase())
  const sentenceWords = sentenceText
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !existingPhrasesLower.includes(w.toLowerCase()) &&
        !['the', 'and', 'for', 'are', 'was', 'were'].includes(w.toLowerCase())
    )
  const unindexedSuggestions = Array.from(new Set(sentenceWords)).slice(0, 6)

  // Add multiple indexes (supports comma-separated string)
  const handleAddMultiIndexes = () => {
    const raw = multiInput.trim()
    if (!raw) return

    // Split by comma
    const phrasesToAdd = raw
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (phrasesToAdd.length === 0) return

    const newItems: IndexPhrase[] = phrasesToAdd.map((phrase) => ({
      id: createIndexId('idx'),
      phrase,
    }))

    const updated = [...localIndexes, ...newItems]
    setLocalIndexes(updated)
    setMultiInput('')

    if (newItems.length > 0) {
      onSelectIndex(newItems[newItems.length - 1].id)
    }
  }

  const handleKeyDownMultiInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMultiIndexes()
    }
  }

  // Quick add suggestion word as index
  const handleAddSuggestion = (word: string) => {
    const newIdx: IndexPhrase = {
      id: createIndexId('idx'),
      phrase: word,
    }
    const updated = [...localIndexes, newIdx]
    setLocalIndexes(updated)
    onSelectIndex(newIdx.id)
  }

  // Remove individual index
  const handleRemoveIndex = (id: string) => {
    const updated = localIndexes.filter((i) => i.id !== id)
    setLocalIndexes(updated)
    if (activeIndexId === id && updated.length > 0) {
      onSelectIndex(updated[0].id)
    }
  }

  // Update active index text
  const handleActivePhraseChange = (val: string) => {
    setActivePhraseEdit(val)
    if (!activeIndex) return
    setLocalIndexes((prev) =>
      prev.map((i) => (i.id === activeIndex.id ? { ...i, phrase: val } : i))
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateIndexes(localIndexes)
  }

  const handleReset = () => {
    setLocalIndexes(indexes)
    if (indexes.length > 0) {
      setActivePhraseEdit(indexes[0].phrase)
    }
    onCancel()
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col space-y-6">
      {/* 1. Multi-Index Chips Manager */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold tracking-wider text-[#7c8d85] dark:text-[#8ea49a] uppercase block">
            Indexed phrases in this sentence ({localIndexes.length})
          </label>
          <span className="text-[11px] text-[#7c8d85] dark:text-[#8ea49a]">
            Click to select · Click × to remove
          </span>
        </div>

        {/* Index badges row */}
        <div className="flex flex-wrap items-center gap-2 min-h-9 p-2.5 rounded-xl bg-[#f7f6f0] dark:bg-[#1b2b27] border border-[#e6e2d6] dark:border-[#283d36]">
          {localIndexes.map((idx) => {
            const isSelected = idx.id === activeIndex?.id
            return (
              <span
                key={idx.id}
                onClick={() => onSelectIndex(idx.id)}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#fef08a] dark:bg-[#eab308] text-[#12382c] dark:text-[#0c1412] shadow-xs ring-1 ring-amber-300 dark:ring-amber-400 font-semibold'
                    : 'bg-white dark:bg-[#14201c] text-[#224034] dark:text-[#c4ded3] hover:bg-[#eae6dc] dark:hover:bg-[#20342f] border border-[#dedad0] dark:border-[#283d36]'
                }`}
              >
                <span>{idx.phrase}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveIndex(idx.id)
                  }}
                  className="ml-1.5 text-[#50665c] dark:text-[#8ea49a] hover:text-red-700 dark:hover:text-red-400 p-0.5 rounded transition-colors"
                  aria-label={`Remove ${idx.phrase} index`}
                >
                  <X className="w-3 h-3 stroke-[2.2]" />
                </button>
              </span>
            )
          })}

          {localIndexes.length === 0 && (
            <span className="text-xs text-[#8c9e96] dark:text-[#6a8076] italic px-1">
              No index phrases added yet. Add one below.
            </span>
          )}
        </div>
      </div>

      {/* 2. Multi-Input Field (Enter multiple separated by commas) */}
      <div>
        <label
          htmlFor="multi-index-input"
          className="text-xs font-semibold tracking-wider text-[#7c8d85] dark:text-[#8ea49a] uppercase mb-2 block"
        >
          Add multiple indexes
        </label>
        <div className="flex gap-2">
          <input
            id="multi-index-input"
            type="text"
            value={multiInput}
            onChange={(e) => setMultiInput(e.target.value)}
            onKeyDown={handleKeyDownMultiInput}
            placeholder="Type index phrases separated by comma (e.g. café, bookstore)..."
            className="flex-1 h-10 px-3.5 rounded-xl bg-[#f7f6f0] dark:bg-[#1b2b27] border border-[#e2ded2] dark:border-[#283d36] text-[#143d30] dark:text-[#e4ede8] text-sm focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] focus:bg-white dark:focus:bg-[#14201c] placeholder-[#8c9e96] dark:placeholder-[#6a8076] transition-all"
          />
          <button
            type="button"
            onClick={handleAddMultiIndexes}
            disabled={!multiInput.trim()}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>Add</span>
          </button>
        </div>

        {/* Quick word suggestions from sentence */}
        {unindexedSuggestions.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#7c8d85] dark:text-[#8ea49a] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Sentence words:</span>
            </span>
            {unindexedSuggestions.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleAddSuggestion(w)}
                className="text-xs px-2 py-0.5 rounded-lg bg-[#eef8f2] dark:bg-[#1b352b] text-[#165a41] dark:text-[#a7f3d0] hover:bg-[#dcf2e6] dark:hover:bg-[#244b3c] border border-emerald-100 dark:border-[#235845] transition-colors cursor-pointer"
              >
                +{w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Selected Index Edit Field (if any selected) */}
      {activeIndex && (
        <div>
          <label
            htmlFor="selected-index-input"
            className="text-xs font-semibold tracking-wider text-[#7c8d85] dark:text-[#8ea49a] uppercase mb-2 block"
          >
            Edit Selected Index
          </label>
          <input
            id="selected-index-input"
            type="text"
            value={activePhraseEdit}
            onChange={(e) => handleActivePhraseChange(e.target.value)}
            placeholder="Edit selected phrase..."
            required
            className="w-full h-11 px-4 rounded-xl bg-[#f7f6f0] dark:bg-[#1b2b27] border border-[#e2ded2] dark:border-[#283d36] text-[#143d30] dark:text-[#e4ede8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] focus:bg-white dark:focus:bg-[#14201c] transition-all shadow-2xs"
          />
        </div>
      )}

      {/* 4. Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-[#f2eee4] dark:border-[#23352f]">
        <div>
          {activeIndex && (
            <button
              type="button"
              onClick={() => onDeleteRequest(activeIndex.id)}
              className="w-full sm:w-auto h-9.5 px-4 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-[#14201c] border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer shadow-2xs"
              aria-label={`Delete ${activeIndex.phrase} index`}
            >
              Delete index
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-initial h-9.5 px-4 text-xs sm:text-sm font-semibold text-[#4a5b54] dark:text-[#a0b5ab] bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27] active:scale-[0.98] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e] cursor-pointer shadow-2xs"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 sm:flex-initial h-9.5 px-5 text-xs sm:text-sm font-semibold text-white bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] rounded-xl shadow-xs hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#133d2e] cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </form>
  )
}
