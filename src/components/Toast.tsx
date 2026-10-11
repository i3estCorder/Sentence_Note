import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  text: string
}

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onDismiss()
    }, 3500)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
  }

  const borderClasses = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/95 dark:bg-[#132c21]/95 text-emerald-900 dark:text-[#a7f3d0]',
    error: 'border-red-200 dark:border-rose-900 bg-red-50/95 dark:bg-[#2c1818]/95 text-red-900 dark:text-[#fecdd3]',
    info: 'border-blue-200 dark:border-blue-800 bg-blue-50/95 dark:bg-[#122838]/95 text-blue-900 dark:text-[#bae6fd]',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xs text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className={`flex items-center gap-2.5 ${borderClasses[toast.type]}`}>
        {icons[toast.type]}
        <span>{toast.text}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 p-0.5 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
