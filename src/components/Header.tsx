import React from 'react'
import { Plus, Menu, Sun, Moon } from 'lucide-react'

interface HeaderProps {
  onOpenMobileMenu: () => void
  onNewSentenceClick: () => void
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onNewSentenceClick,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#eae6dc]/60 dark:border-[#23352f]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-lg text-[#3d5249] dark:text-[#8ea49a] hover:bg-[#eae6dc] dark:hover:bg-[#1e302a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e]"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12382c] dark:text-[#e4ede8]">
            Edit an index
          </h1>
          <p className="text-sm text-[#5f756c] dark:text-[#8ea49a] mt-1 font-normal">
            Change its phrase, tags, or remove it from this sentence.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="inline-flex items-center justify-center w-9.5 h-9.5 rounded-xl bg-white hover:bg-[#f6f4ee] dark:bg-[#1a2b25] dark:hover:bg-[#233a32] text-[#12382c] dark:text-[#e4ede8] border border-[#dedad0] dark:border-[#2a3f36] shadow-2xs transition-all cursor-pointer"
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#2d5244] stroke-[2.2]" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onNewSentenceClick}
          className="inline-flex items-center gap-1.5 h-9.5 px-4 bg-[#133d2e] dark:bg-[#1d5743] hover:bg-[#0c2b20] dark:hover:bg-[#256c53] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#133d2e] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.4]" aria-hidden="true" />
          <span>New sentence</span>
        </button>
      </div>
    </header>
  )
}
