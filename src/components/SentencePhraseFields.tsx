import type { IndexPhrase } from '../types'
import { addPhrases } from '../utils/vault'
import { SentenceDisplay } from './SentenceDisplay'

interface SentencePhraseFieldsProps {
  id: string
  text: string
  selection: string
  indexes: IndexPhrase[]
  onChange: (indexes: IndexPhrase[]) => void
  pending: string
  onPendingChange: (text: string) => void
}

export function SentencePhraseFields({
  id, text, selection, indexes, onChange, pending, onPendingChange,
}: SentencePhraseFieldsProps) {
  const inputClass = 'min-w-0 rounded-lg border border-[#dad6cb] bg-white px-3 py-2 text-sm dark:border-[#283d36] dark:bg-[#1b2b27]'
  const previewIndexes = [...indexes, ...pending.split(',').map((phrase, index) => ({
    id: `preview-${index}`, phrase: phrase.trim(),
  }))].filter((index) => index.phrase.trim())
  const commitPending = () => {
    onChange(addPhrases(indexes, pending))
    onPendingChange('')
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-xs font-bold text-[#446255] dark:text-[#a0b5ab]">핵심 표현</legend>
      {indexes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {indexes.map((index, position) => (
            <li key={index.id} className="flex max-w-full items-center gap-1 rounded-xl bg-[#e6f6ee] p-1 dark:bg-[#153427]">
              <input
                aria-label={`표현 ${position + 1} 수정`}
                className={`w-36 ${inputClass}`}
                value={index.phrase}
                required
                onChange={(event) => onChange(indexes.map((item) =>
                  item.id === index.id ? { ...item, phrase: event.target.value } : item
                ))}
              />
              <button type="button" className="px-2 py-1" aria-label={`${index.phrase} 표현 삭제`}
                onClick={() => onChange(indexes.filter((item) => item.id !== index.id))}>×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <input id={id} aria-label="새 표현 입력" className={`flex-1 ${inputClass}`}
          placeholder="표현 입력 (쉼표로 구분)" value={pending}
          onChange={(event) => onPendingChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
            event.preventDefault()
            commitPending()
          }}
        />
        <button type="button" onClick={commitPending} disabled={!pending.trim()} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">
          추가
        </button>
      </div>
      <button type="button" disabled={!selection} onClick={() => onChange(addPhrases(indexes, selection))}
        className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">
        예문에서 선택한 구간 추가
      </button>
      {text.trim() && previewIndexes.length > 0 && (
        <div className="rounded-xl bg-[#f6f5ef] p-3 dark:bg-[#1b2b27]">
          <p className="mb-1 text-xs font-semibold">하이라이트 미리 보기</p>
          <SentenceDisplay sentenceText={text} indexes={previewIndexes} activeIndexId="" />
        </div>
      )}
    </fieldset>
  )
}
