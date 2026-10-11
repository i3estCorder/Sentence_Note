import React, { useEffect } from 'react'
import {
  BookOpen,
  RotateCw,
  Star,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import type { NavItemId } from '../types'

interface SidebarProps {
  currentNav: NavItemId
  onSelectNav: (id: NavItemId) => void
  isOpen: boolean
  onClose: () => void
  sentenceCount?: number
  favoritesCount?: number
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  isOpen,
  onClose,
  sentenceCount,
  favoritesCount,
  isDarkMode,
  onToggleDarkMode,
}) => {
  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const navItems: { id: NavItemId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'library',
      label: 'Library',
      icon: <BookOpen className="w-4 h-4 shrink-0 stroke-[2]" aria-hidden="true" />,
    },
    {
      id: 'review',
      label: 'Review',
      icon: <RotateCw className="w-4 h-4 shrink-0 stroke-[2]" aria-hidden="true" />,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: <Star className="w-4 h-4 shrink-0 stroke-[2]" aria-hidden="true" />,
    },
  ]

  const renderContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Brand Section - explicitly separated with ample bottom margin from menu */}
      <div className="flex items-center justify-between pb-2 mb-8">
        <button
          type="button"
          onClick={() => {
            onSelectNav('library')
            if (isMobile) onClose()
          }}
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e] rounded-lg p-1 -m-1 text-left cursor-pointer"
          aria-label="Sentence Note Home (Go to Library)"
        >
          <div className="w-8 h-8 rounded-lg bg-[#133d2e] dark:bg-[#1d5743] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm shrink-0">
            SN
          </div>
          <span className="font-semibold text-base text-[#12382c] dark:text-[#e4ede8] tracking-tight group-hover:text-[#0b271d] dark:group-hover:text-white transition-colors">
            sentence note
          </span>
        </button>

        {/* Close button only on mobile drawer */}
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#556961] dark:text-[#8ba397] hover:text-[#12382c] dark:hover:text-white hover:bg-[#f1eee6] dark:hover:bg-[#1e302a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e]"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Menu Section */}
      <nav aria-label="Main navigation" className="flex-1">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentNav === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectNav(item.id)
                    if (isMobile) onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#133d2e] cursor-pointer ${
                    isActive
                      ? 'bg-[#dcf2e6] dark:bg-[#183d2f] text-[#12382c] dark:text-[#9fe2c7] font-semibold shadow-xs'
                      : 'text-[#4e635a] dark:text-[#8ba397] hover:text-[#12382c] dark:hover:text-[#e4ede8] hover:bg-[#f6f4ee] dark:hover:bg-[#1a2b25] font-medium'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`${isActive ? 'text-[#12382c] dark:text-[#9fe2c7]' : 'text-[#687d74] dark:text-[#738f82]'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>

                  {/* Sentence count badge next to Library */}
                  {item.id === 'library' && typeof sentenceCount === 'number' && (
                    <span
                      className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-[#12382c] dark:bg-[#9fe2c7] text-white dark:text-[#0b281d] shadow-2xs'
                          : 'bg-[#e7e4dc] dark:bg-[#253932] text-[#556961] dark:text-[#9bb3a7]'
                      }`}
                      aria-label={`${sentenceCount} sentences in library`}
                    >
                      {sentenceCount}
                    </span>
                  )}

                  {/* Favorite count badge next to Favorites */}
                  {item.id === 'favorites' && typeof favoritesCount === 'number' && favoritesCount > 0 && (
                    <span
                      className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-2xs'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                      aria-label={`${favoritesCount} favorites`}
                    >
                      {favoritesCount}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Dark / Light Mode Switcher & Footer Info */}
      <div className="pt-5 border-t border-[#ede9e0] dark:border-[#23352f] text-xs text-[#7e8f87] dark:text-[#849c90] space-y-4">
        {onToggleDarkMode && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4e635a] dark:text-[#8ba397]">
              Theme
            </span>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#f4f2ec] hover:bg-[#eae6db] dark:bg-[#1c2e28] dark:hover:bg-[#253d35] text-[#12382c] dark:text-[#e4ede8] border border-[#dedad0] dark:border-[#2f463e] transition-all cursor-pointer shadow-2xs font-semibold text-xs"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#2d5244] stroke-[2.2]" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        )}

        <div>
          <p className="font-medium text-[#4e635a] dark:text-[#8ba397]">Sentence Note v1.0</p>
          <p className="mt-0.5">Wordbook Learning App</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 xl:w-64 min-h-screen bg-white dark:bg-[#14201c] border-r border-[#eae6dc] dark:border-[#23352f] p-6 shrink-0 sticky top-0 self-start transition-colors"
        aria-label="Sidebar navigation"
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer (Only rendered when open) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#14201c] p-6 shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out"
            aria-label="Mobile sidebar navigation"
          >
            {renderContent(true)}
          </aside>
        </>
      )}
    </>
  )
}
