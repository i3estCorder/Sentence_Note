import React, { useState } from 'react'
import { Plus, X, Languages, FileText } from 'lucide-react'
import type { SentenceData, IndexPhrase } from '../types'

interface NewSentenceModalProps {
  isOpen: boolean
  onAddSentence: (sentence: SentenceData) => void
  onClose: () => void
}

export const NewSentenceModal: React.FC<NewSentenceModalProps> = ({
  isOpen,
  onAddSentence,
  onClose,
}) => {
  const [text, setText] = useState('')
  const [translation, setTranslation] = useState('')
  const [notes, setNotes] = useState('')
  const [phrasesInput, setPhrasesInput] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    const rawPhrases = phrasesInput.trim()
    const phrasesList = rawPhrases
      ? rawPhrases
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : [text.split(' ')[0] || 'index']

    const indexes: IndexPhrase[] = phrasesList.map((p, i) => ({
      id: `idx-${Date.now()}-${i}`,
      phrase: p,
    }))

    const newSentence: SentenceData = {
      id: `sentence-${Date.now()}`,
      text: text.trim(),
      translation: translation.trim() || undefined,
      notes: notes.trim() || undefined,
      indexes,
      isFavorite: false,
    }

    onAddSentence(newSentence)
    setText('')
    setTranslation('')
    setNotes('')
    setPhrasesInput('')
    onClose()
  }

  const handleClose = () => {
    setText('')
    setTranslation('')
    setNotes('')
    setPhrasesInput('')
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-sentence-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-[#0f241d]/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-[#14201c] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#ece8de] dark:border-[#23352f] z-10 max-h-[92vh] overflow-y-auto my-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-[#6c7d75] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f2efe6] dark:hover:bg-[#1b2b27] rounded-xl transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="new-sentence-title" className="text-xl font-extrabold text-[#12382c] dark:text-[#e4ede8]">
          새 문장 추가 (Add New Sentence)
        </h3>
        <p className="text-xs text-[#5f746b] dark:text-[#8ea49a] mt-1">
          영어 예문과 한국어 번역, 핵심 인덱스 및 학습 추가 정보를 함께 기록하세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. English Sentence */}
          <div>
            <label
              htmlFor="new-sentence-text"
              className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider block mb-1.5"
            >
              영어 예문 (Sentence) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="new-sentence-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. She stumbled upon a rare antique clock in the attic."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f6f5ef] dark:bg-[#1b2b27] border border-[#e4e0d4] dark:border-[#283d36] text-[#12382c] dark:text-[#e4ede8] text-sm focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] focus:bg-white dark:focus:bg-[#14201c] placeholder-[#8c9e96] dark:placeholder-[#6a8076] resize-none"
            />
          </div>

          {/* 2. Translation */}
          <div>
            <label
              htmlFor="new-sentence-translation"
              className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider flex items-center gap-1.5 mb-1.5"
            >
              <Languages className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
              <span>문장 번역 (Translation)</span>
            </label>
            <input
              id="new-sentence-translation"
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="예: 그녀는 다락방에서 보기 드문 골동품 시계를 우연히 발견했습니다."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f6f5ef] dark:bg-[#1b2b27] border border-[#e4e0d4] dark:border-[#283d36] text-[#12382c] dark:text-[#e4ede8] text-sm focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] focus:bg-white dark:focus:bg-[#14201c] placeholder-[#8c9e96] dark:placeholder-[#6a8076]"
            />
          </div>

          {/* 3. Index Phrases */}
          <div>
            <label
              htmlFor="primary-phrases"
              className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider block mb-1.5"
            >
              인덱스 단어 / 표현 (Index Phrases)
            </label>
            <input
              id="primary-phrases"
              type="text"
              value={phrasesInput}
              onChange={(e) => setPhrasesInput(e.target.value)}
              placeholder="쉼표(,)로 여러 개 입력 (예: stumbled upon, rare)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f6f5ef] dark:bg-[#1b2b27] border border-[#e4e0d4] dark:border-[#283d36] text-[#12382c] dark:text-[#e4ede8] text-sm focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] focus:bg-white dark:focus:bg-[#14201c] placeholder-[#8c9e96] dark:placeholder-[#6a8076]"
            />
            <p className="text-[11px] text-[#7a8f85] dark:text-[#8ea49a] mt-1">
              문장 안에서 색인으로 묶을 핵심 단어나 표현을 쉼표로 구분해 입력하세요.
            </p>
          </div>

          {/* 4. Additional Study Notes (추가 정보 칸, 최대 1000자) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="new-sentence-notes"
                className="text-xs font-bold text-[#446255] dark:text-[#a0b5ab] uppercase tracking-wider flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
                <span>추가 정보 (Study Notes / Memo)</span>
              </label>
              <span
                className={`text-[11px] font-semibold ${
                  notes.length > 900 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-[#849a90] dark:text-[#8ea49a]'
                }`}
              >
                {notes.length} / 1000자
              </span>
            </div>
            <textarea
              id="new-sentence-notes"
              rows={4}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="영어 공부에 필요한 문법 팁, 유의어/반의어, 뉘앙스, 어원 등 자유롭게 메모하세요 (최대 1,000자)."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f6f5ef] dark:bg-[#1b2b27] border border-[#e4e0d4] dark:border-[#283d36] text-[#12382c] dark:text-[#e4ede8] text-sm focus:outline-none focus:ring-2 focus:ring-[#133d2e]/20 dark:focus:ring-[#34d399]/20 focus:border-[#133d2e] dark:focus:border-[#34d399] focus:bg-white dark:focus:bg-[#14201c] placeholder-[#8c9e96] dark:placeholder-[#6a8076] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f4f1e8] dark:border-[#23352f]">
            <button
              type="button"
              onClick={handleClose}
              className="h-9.5 px-4 text-xs sm:text-sm font-semibold text-[#465b52] dark:text-[#a0b5ab] bg-white dark:bg-[#14201c] border border-[#dedad0] dark:border-[#283d36] hover:bg-[#f7f5ed] dark:hover:bg-[#1b2b27] active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 h-9.5 px-4.5 text-xs sm:text-sm font-semibold text-white bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] rounded-xl transition-all disabled:opacity-40 shadow-xs hover:shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.4]" />
              <span>문장 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
