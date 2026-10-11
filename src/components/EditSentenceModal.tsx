import React, { useState } from 'react'
import { X, Languages, FileText, Sparkles, Check } from 'lucide-react'
import type { SentenceData, IndexPhrase } from '../types'

interface EditSentenceModalProps {
  isOpen: boolean
  sentence: SentenceData | null
  onSaveSentence: (updatedSentence: SentenceData) => void
  onClose: () => void
}

export const EditSentenceModal: React.FC<EditSentenceModalProps> = ({
  isOpen,
  sentence,
  onSaveSentence,
  onClose,
}) => {
  if (!isOpen || !sentence) return null

  return (
    <EditSentenceDialog
      key={sentence.id}
      sentence={sentence}
      onSaveSentence={onSaveSentence}
      onClose={onClose}
    />
  )
}

interface EditSentenceDialogProps {
  sentence: SentenceData
  onSaveSentence: (updatedSentence: SentenceData) => void
  onClose: () => void
}

const EditSentenceDialog: React.FC<EditSentenceDialogProps> = ({
  sentence,
  onSaveSentence,
  onClose,
}) => {
  const [text, setText] = useState(sentence.text || '')
  const [translation, setTranslation] = useState(sentence.translation || '')
  const [notes, setNotes] = useState(sentence.notes || '')
  const [phrasesInput, setPhrasesInput] = useState(
    sentence.indexes.map((i) => i.phrase).join(', ')
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    // Parse phrases input
    const rawPhrases = phrasesInput.trim()
    const phraseStrings = rawPhrases
      ? rawPhrases
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : sentence.indexes.map((i) => i.phrase)

    // Preserve existing IDs where phrase matches, generate new IDs for added phrases
    const updatedIndexes: IndexPhrase[] = phraseStrings.map((phrase, idx) => {
      const existing = sentence.indexes.find(
        (i) => i.phrase.toLowerCase() === phrase.toLowerCase()
      )
      if (existing) {
        return existing
      }
      return {
        id: `idx-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        phrase,
      }
    })

    const updatedSentence: SentenceData = {
      ...sentence,
      text: text.trim(),
      translation: translation.trim() || undefined,
      notes: notes.trim() || undefined,
      indexes: updatedIndexes.length > 0 ? updatedIndexes : sentence.indexes,
    }

    onSaveSentence(updatedSentence)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-sentence-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-[#0f241d]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-[#14201c] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#ece8de] dark:border-[#23352f] z-10 max-h-[92vh] overflow-y-auto my-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#6c7d75] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f2efe6] dark:hover:bg-[#1b2b27] rounded-xl transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="edit-sentence-title" className="text-xl font-extrabold text-[#12382c] dark:text-[#e4ede8]">
          문장 수정 (Edit Sentence)
        </h3>
        <p className="text-xs text-[#5f746b] dark:text-[#8ea49a] mt-1">
          영어 예문 내용, 한국어 번역, 색인(인덱스) 및 추가 학습 정보를 수정합니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. English Sentence */}
          <div>
            <label
              htmlFor="edit-sentence-text"
              className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider block mb-1.5"
            >
              영어 문장 (English Sentence) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-sentence-text"
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dad6cb] dark:border-[#283d36] bg-white dark:bg-[#1b2b27] text-sm text-[#12382c] dark:text-[#e4ede8] focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] font-serif leading-relaxed resize-y placeholder:text-[#9bad9f] dark:placeholder:text-[#6a8076]"
              placeholder="e.g. Her innovative approach breathed new life into the aging project."
            />
          </div>

          {/* 2. Korean Translation */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Languages className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
              <label
                htmlFor="edit-sentence-translation"
                className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider"
              >
                한국어 번역 (Translation)
              </label>
            </div>
            <input
              id="edit-sentence-translation"
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dad6cb] dark:border-[#283d36] bg-white dark:bg-[#1b2b27] text-sm text-[#12382c] dark:text-[#e4ede8] focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] placeholder:text-[#9bad9f] dark:placeholder:text-[#6a8076]"
              placeholder="e.g. 그녀의 혁신적인 접근법은 노후화된 프로젝트에 새로운 활력을 불어넣었습니다."
            />
          </div>

          {/* 3. Additional Study Notes (1,000 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
                <label
                  htmlFor="edit-sentence-notes"
                  className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider"
                >
                  추가 학습 정보 (Study Notes)
                </label>
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  notes.length > 900 ? 'text-amber-600 dark:text-amber-400' : 'text-[#7c8d85] dark:text-[#8ea49a]'
                }`}
              >
                {notes.length.toLocaleString()} / 1,000자
              </span>
            </div>
            <textarea
              id="edit-sentence-notes"
              maxLength={1000}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dad6cb] dark:border-[#283d36] bg-white dark:bg-[#1b2b27] text-xs sm:text-sm text-[#12382c] dark:text-[#e4ede8] focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] leading-relaxed resize-y placeholder:text-[#9bad9f] dark:placeholder:text-[#6a8076]"
              placeholder="문법 구조, 유의어/반의어, 뉘앙스 차이, 발음 팁 등을 자유롭게 기록하세요."
            />
          </div>

          {/* 4. Index Phrases */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
              <label
                htmlFor="edit-sentence-phrases"
                className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider"
              >
                등록된 인덱스 (Index Phrases, 쉼표로 구분)
              </label>
            </div>
            <input
              id="edit-sentence-phrases"
              type="text"
              value={phrasesInput}
              onChange={(e) => setPhrasesInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dad6cb] dark:border-[#283d36] bg-white dark:bg-[#1b2b27] text-sm text-[#12382c] dark:text-[#e4ede8] focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] placeholder:text-[#9bad9f] dark:placeholder:text-[#6a8076]"
              placeholder="e.g. breath into, innovative approach"
            />
            <p className="text-[11px] text-[#7c8d85] dark:text-[#8ea49a] mt-1">
              여러 인덱스를 쉼표(,)로 구분하여 등록하거나 수정할 수 있습니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f2ede2] dark:border-[#23352f]">
            <button
              type="button"
              onClick={onClose}
              className="h-9.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-[#50665b] dark:text-[#a0b5ab] bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] hover:bg-[#f6f4ee] dark:hover:bg-[#1b2b27] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-9.5 px-4.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>변경사항 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
