import React, { useState, useEffect } from 'react'
import {
  X,
  Star,
  Edit3,
  Volume2,
  Copy,
  Check,
  BookOpen,
  Languages,
  Sparkles,
  FileText,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { SentenceData } from '../types'
import { getIndexMeaning, getSentenceTranslation } from '../utils/dictionary'
import { highlightMultiPhrases } from '../utils/highlight'
import { EditSentenceModal } from './EditSentenceModal'
import { ConfirmationModal } from './ConfirmationModal'

interface GroupedIndex {
  phrase: string
  letter: string
  sentences: SentenceData[]
}

interface SentenceDetailModalProps {
  isOpen: boolean
  group: GroupedIndex | null
  initialSentenceIndex?: number
  onClose: () => void
  onSelectIndexToEdit: (sentence: SentenceData, indexId: string) => void
  onToggleFavorite: (sentenceId: string) => void
  onUpdateSentence?: (sentence: SentenceData) => void
  onDeleteSentence?: (sentenceId: string) => void
}

export const SentenceDetailModal: React.FC<SentenceDetailModalProps> = ({
  isOpen,
  group,
  initialSentenceIndex = 0,
  onClose,
  onSelectIndexToEdit,
  onToggleFavorite,
  onUpdateSentence,
  onDeleteSentence,
}) => {
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(initialSentenceIndex)
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isEditSentenceOpen, setIsEditSentenceOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isTranslationVisible, setIsTranslationVisible] = useState(false)

  // Reset selected sentence index and translation visibility when group or initialSentenceIndex changes without effect
  const currentSentenceKey = `${group?.phrase}-${initialSentenceIndex}-${isOpen}`
  const [prevSentenceKey, setPrevSentenceKey] = useState(currentSentenceKey)
  if (prevSentenceKey !== currentSentenceKey) {
    setPrevSentenceKey(currentSentenceKey)
    setSelectedSentenceIndex(initialSentenceIndex)
    setIsTranslationVisible(false)
  }


  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !group || group.sentences.length === 0) return null

  const currentSentence = group.sentences[selectedSentenceIndex] || group.sentences[0]
  const targetIndexObj = currentSentence.indexes.find(
    (idx) => idx.phrase.toLowerCase() === group.phrase.toLowerCase()
  ) || currentSentence.indexes[0]

  const indexMeaning = getIndexMeaning(group.phrase, targetIndexObj?.meaning)
  const sentenceTranslation = getSentenceTranslation(currentSentence.text, currentSentence.translation)

  // Speak using Web Speech API
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  // Copy sentence to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(currentSentence.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sentence-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0f241d]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#14201c] rounded-3xl shadow-2xl border border-[#ece8df] dark:border-[#23352f] overflow-hidden transform transition-all z-10 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="p-6 sm:p-7 pb-5 border-b border-[#f4f1e8] dark:border-[#23352f] bg-gradient-to-b from-[#fbfaf6] dark:from-[#182622] to-white dark:to-[#14201c]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Top Badge Rail */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#dcf2e6] dark:bg-[#1f3d32] text-[#133d2e] dark:text-[#a7f3d0] inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#133d2e] dark:text-[#34d399]" />
                  Index Word
                </span>

                {currentSentence.isFavorite && (
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-amber-500" />
                    Favorite
                  </span>
                )}

                {group.sentences.length > 1 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#fef08a] dark:bg-[#3a2e10] text-[#12382c] dark:text-[#fde68a]">
                    {group.sentences.length} sentences
                  </span>
                )}
              </div>

              {/* Main Index Hero Title & TTS Audio Button */}
              <div className="flex items-center gap-3">
                <h2
                  id="sentence-detail-title"
                  className="text-2xl sm:text-3xl font-extrabold text-[#12382c] dark:text-[#e4ede8] tracking-tight"
                >
                  {group.phrase}
                </h2>

                <button
                  type="button"
                  onClick={() => handleSpeak(group.phrase)}
                  title="Pronounce word"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-[#133d2e] text-white shadow-xs'
                      : 'bg-[#f4f1e8] dark:bg-[#1b2b27] hover:bg-[#eae6dc] dark:hover:bg-[#20342f] text-[#12382c] dark:text-[#e4ede8]'
                  }`}
                >
                  <Volume2 className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* 1. Index Meaning (인덱스 뜻) */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f5f8f6] dark:bg-[#1b352b] border border-[#d6e5de] dark:border-[#235845]">
                <BookOpen className="w-3.5 h-3.5 text-[#1a533f] dark:text-[#34d399] shrink-0" />
                <span className="text-xs font-semibold text-[#1a533f] dark:text-[#a7f3d0]">
                  인덱스 뜻:
                </span>
                <span className="text-xs font-bold text-[#0c2b20] dark:text-[#e4ede8]">
                  {indexMeaning}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7c8d85] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f4f1e8] dark:hover:bg-[#1b2b27] transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Multiple Sentences Switcher Tabs */}
          {group.sentences.length > 1 && (
            <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[#f4f1e8] dark:border-[#23352f]">
              <span className="text-xs font-bold text-[#7c8d85] dark:text-[#8ea49a] mr-1 shrink-0">
                예문 선택:
              </span>
              {group.sentences.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSentenceIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedSentenceIndex === idx
                      ? 'bg-[#133d2e] dark:bg-[#1d5743] text-white shadow-xs'
                      : 'bg-[#ede9df] dark:bg-[#1b2b27] text-[#4d6357] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#e4dfd4] dark:hover:bg-[#20342f]'
                  }`}
                >
                  Example {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body: Sentence Context & Translation */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* 2. English Context Sentence (원문 예문) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7c8d85] dark:text-[#8ea49a]">
                Context Sentence (영어 원문)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSpeak(currentSentence.text)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f5f2e9] dark:bg-[#1b2b27] hover:bg-[#ede9df] dark:hover:bg-[#20342f] text-[#12382c] dark:text-[#e4ede8] transition-colors cursor-pointer"
                  title="Listen to full sentence"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>듣기</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f5f2e9] dark:bg-[#1b2b27] hover:bg-[#ede9df] dark:hover:bg-[#20342f] text-[#12382c] dark:text-[#e4ede8] transition-colors cursor-pointer"
                  title="Copy sentence"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34d399]" />
                      <span className="text-emerald-700 dark:text-[#34d399] font-semibold">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf9f5] dark:bg-[#1b2b27] border border-[#eeebe3] dark:border-[#283d36] shadow-2xs">
              <p className="text-base sm:text-lg text-[#143d30] dark:text-[#d3e2db] font-serif leading-relaxed">
                {highlightMultiPhrases(
                  currentSentence.text,
                  group.phrase,
                  currentSentence.indexes
                    .filter((i) => i.phrase.toLowerCase() !== group.phrase.toLowerCase())
                    .map((i) => i.phrase)
                )}
              </p>
            </div>
          </div>

          {/* 3. Sentence Translation (문장 뜻/한국어 해석) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7c8d85] dark:text-[#8ea49a]">
                <Languages className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
                <span>문장 뜻 (Sentence Translation)</span>
              </div>

              <button
                type="button"
                onClick={() => setIsTranslationVisible((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-[#f5f2e9] dark:bg-[#1b2b27] hover:bg-[#ede9df] dark:hover:bg-[#20342f] text-[#12382c] dark:text-[#e4ede8]"
                aria-label={isTranslationVisible ? 'Hide translation' : 'Show translation'}
              >
                {isTranslationVisible ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>번역 숨기기</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
                    <span className="text-[#133d2e] dark:text-[#34d399]">번역 보기</span>
                  </>
                )}
              </button>
            </div>

            {isTranslationVisible ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#eef7f2] dark:bg-[#132d21] border border-[#cbe6d8] dark:border-[#204a37] animate-in fade-in duration-150">
                <p className="text-sm sm:text-base text-[#11382b] dark:text-[#a7f3d0] font-medium leading-relaxed">
                  "{sentenceTranslation}"
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsTranslationVisible(true)}
                className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-[#f7f5ed] dark:bg-[#182622] border border-dashed border-[#dcd7cb] dark:border-[#283d36] flex items-center justify-between cursor-pointer hover:bg-[#f0ece1] dark:hover:bg-[#1e2f2a] transition-colors group"
                aria-label="Show translation"
              >
                <span className="text-xs font-medium text-[#7c8d85] dark:text-[#8ea49a] group-hover:text-[#12382c] dark:group-hover:text-[#e4ede8] transition-colors">
                  번역이 숨겨져 있습니다. 클릭하여 확인하세요.
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#133d2e] dark:text-[#34d399]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>번역 보기</span>
                </span>
              </button>
            )}
          </div>

          {/* 4. Additional Study Notes (추가 학습 정보) */}
          {currentSentence.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7c8d85] dark:text-[#8ea49a]">
                <FileText className="w-3.5 h-3.5 text-[#133d2e] dark:text-[#34d399]" />
                <span>추가 학습 정보 (Study Notes)</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#fdf8ee] dark:bg-[#261f10] border border-[#f3e5c8] dark:border-[#42341a] shadow-2xs">
                <p className="text-xs sm:text-sm text-[#4d3811] dark:text-[#fde68a] leading-relaxed whitespace-pre-wrap font-sans">
                  {currentSentence.notes}
                </p>
              </div>
            </div>
          )}

          {/* Additional tagged indexes */}
          {currentSentence.indexes.length > 1 && (
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#7c8d85] dark:text-[#8ea49a]">
                이 문장에 함께 등록된 인덱스:
              </span>
              {currentSentence.indexes
                .filter((i) => i.phrase.toLowerCase() !== group.phrase.toLowerCase())
                .map((idx) => (
                  <span
                    key={idx.id}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#e0f2fe] dark:bg-[#102a3a] border border-[#bae6fd] dark:border-[#1e4e6d] text-[#0369a1] dark:text-[#7dd3fc] shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#0284c7] dark:bg-[#38bdf8]" />
                    {idx.phrase}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#faf8f2] dark:bg-[#182622] border-t border-[#ede8de] dark:border-[#23352f] rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(currentSentence.id)}
              className={`inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-2xs ${
                currentSentence.isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                  : 'bg-white dark:bg-[#14201c] border-[#dedad0] dark:border-[#283d36] text-[#4d6357] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f5f2e9] dark:hover:bg-[#1b2b27]'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  currentSentence.isFavorite ? 'fill-current text-amber-500' : ''
                }`}
              />
              <span>{currentSentence.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}</span>
            </button>

            {onDeleteSentence && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-[#14201c] border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer shadow-2xs"
                title="이 문장 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>문장 삭제</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditSentenceOpen(true)}
              className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold text-[#12382c] dark:text-[#e4ede8] bg-white dark:bg-[#14201c] border border-[#c4cfc9] dark:border-[#283d36] hover:bg-[#f4efe5] dark:hover:bg-[#1b2b27] transition-all cursor-pointer shadow-2xs"
              title="이 문장 내용, 번역, 추가 정보 수정"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>문장 수정</span>
            </button>

            {targetIndexObj && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onSelectIndexToEdit(currentSentence, targetIndexObj.id)
                }}
                className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold bg-[#133d2e] hover:bg-[#0c2b20] dark:bg-[#1d5743] dark:hover:bg-[#256c53] active:scale-[0.98] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Edit index</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-8.5 px-3.5 rounded-xl text-xs font-semibold text-[#50665b] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#ede9df] dark:hover:bg-[#1b2b27] transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* Edit Sentence Modal */}
      {isEditSentenceOpen && (
        <EditSentenceModal
          isOpen={isEditSentenceOpen}
          sentence={currentSentence}
          onSaveSentence={(updated) => {
            if (onUpdateSentence) {
              onUpdateSentence(updated)
            }
            setIsEditSentenceOpen(false)
          }}
          onClose={() => setIsEditSentenceOpen(false)}
        />
      )}

      {/* Delete Sentence Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <ConfirmationModal
          isOpen={isDeleteConfirmOpen}
          title="문장 삭제"
          message="이 문장을 정말 삭제하시겠습니까? 삭제된 문장은 복구할 수 없습니다."
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={() => {
            if (onDeleteSentence) {
              onDeleteSentence(currentSentence.id)
            }
            setIsDeleteConfirmOpen(false)
            if (group.sentences.length <= 1) {
              onClose()
            } else {
              setSelectedSentenceIndex(0)
            }
          }}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  )
}
