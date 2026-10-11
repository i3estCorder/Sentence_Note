import React, { useState } from 'react'
import { Plus, ArrowUpDown, Check } from 'lucide-react'
import type { IndexPhrase } from '../types'

interface SentenceIndexListProps {
  indexes: IndexPhrase[]
  activeIndexId: string
  onSelectIndex: (id: string) => void
  onAddAnotherIndex: () => void
  sentenceText?: string
}

export const SentenceIndexList: React.FC<SentenceIndexListProps> = ({
  indexes,
  activeIndexId,
  onSelectIndex,
  onAddAnotherIndex,
}) => {
  // Sorting state: 'index-asc' (alphabetical by phrase, default) | 'original'
  const [sortOrder, setSortOrder] = useState<'index-asc' | 'original'>('index-asc')

  const sortedIndexes = [...indexes].sort((a, b) => {
    if (sortOrder === 'index-asc') {
      return a.phrase.localeCompare(b.phrase, undefined, { sensitivity: 'base' })
    }
    return 0
  })

  return (
    <aside
      aria-label="Sentence index list"
      className="bg-white dark:bg-[#14201c] rounded-2xl p-5 border border-[#ece8df] dark:border-[#23352f] shadow-xs flex flex-col"
    >
      {/* Header with count and sort toggle */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#f4f1e8] dark:border-[#23352f]">
        <div className="text-[11px] font-semibold tracking-wider text-[#7c8d85] dark:text-[#8ea49a] uppercase">
          In this sentence · {indexes.length}
        </div>

        <button
          type="button"
          onClick={() => setSortOrder(prev => (prev === 'index-asc' ? 'original' : 'index-asc'))}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#41745f] dark:text-[#34d399] hover:text-[#12382c] dark:hover:text-[#a7f3d0] px-2 py-0.5 rounded-md hover:bg-[#eef8f2] dark:hover:bg-[#1e382d] transition-colors"
          title={sortOrder === 'index-asc' ? 'Sorted by index (A-Z). Click for original order.' : 'Original order. Click to sort by index (A-Z).'}
        >
          <ArrowUpDown className="w-3 h-3" />
          <span>{sortOrder === 'index-asc' ? 'Index (A-Z)' : 'Original'}</span>
        </button>
      </div>

      {/* Cards list */}
      <div className="space-y-2.5 flex-1" role="list" aria-label="Index cards">
        {sortedIndexes.map((item, idx) => {
          const isSelected = item.id === activeIndexId

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectIndex(item.id)}
              className={`w-full text-left p-3.5 rounded-xl transition-all block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e] dark:focus-visible:ring-[#34d399] border cursor-pointer ${
                isSelected
                  ? 'bg-[#dcf2e6]/70 dark:bg-[#1f3d32] border-[#133d2e] dark:border-[#34d399] shadow-xs ring-1 ring-[#133d2e]/20 dark:ring-[#34d399]/30'
                  : 'bg-[#faf9f5] dark:bg-[#1b2b27] hover:bg-white dark:hover:bg-[#20342f] border-[#ece8df] dark:border-[#283d36] hover:border-[#dedad0] dark:hover:border-[#38534a] hover:shadow-2xs'
              }`}
              aria-current={isSelected ? 'true' : undefined}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isSelected
                      ? 'bg-[#133d2e] text-white dark:bg-[#1d5743] dark:text-[#e4ede8]'
                      : 'bg-[#ede9df] dark:bg-[#273a34] text-[#697d74] dark:text-[#9eb4aa]'
                  }`}
                >
                  Index {idx + 1}
                </span>

                {isSelected && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#165a41] dark:text-[#34d399]">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Active</span>
                  </span>
                )}
              </div>

              <div
                className={`text-sm font-semibold truncate mt-1 ${
                  isSelected ? 'text-[#12382c] dark:text-[#e4ede8]' : 'text-[#203c31] dark:text-[#c4ded3]'
                }`}
              >
                {item.phrase}
              </div>
            </button>
          )
        })}

        {indexes.length === 0 && (
          <div className="py-6 text-center text-xs text-[#8c9e96] dark:text-[#6a8076]">
            No indexes in this sentence yet.
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-[#f4f1e8] dark:border-[#23352f]">
        <button
          type="button"
          onClick={onAddAnotherIndex}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl border border-dashed border-[#b8d9c7] dark:border-[#2b5242] bg-[#f5faf7] dark:bg-[#182923] hover:bg-[#eaf5ef] dark:hover:bg-[#1f372e] active:scale-[0.98] text-xs font-semibold text-[#134937] dark:text-[#5eead4] hover:border-[#85c0a1] dark:hover:border-[#34d399] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e] cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.4]" aria-hidden="true" />
          <span>Add another index</span>
        </button>
      </div>
    </aside>
  )
}

