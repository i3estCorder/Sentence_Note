import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { SentenceDisplay } from './components/SentenceDisplay'
import { IndexEditForm } from './components/IndexEditForm'
import { SentenceIndexList } from './components/SentenceIndexList'
import { ConfirmationModal } from './components/ConfirmationModal'
import { AddIndexModal } from './components/AddIndexModal'
import { NewSentenceModal } from './components/NewSentenceModal'
import { LibraryView } from './components/LibraryView'
import { ReviewView } from './components/ReviewView'
import { FavoritesView } from './components/FavoritesView'
import { Toast, type ToastMessage } from './components/Toast'
import { initialSentences } from './data/mockData'
import type { NavItemId, SentenceData, IndexPhrase } from './types'

const STORAGE_KEY = 'sentence_vault_v1'
const THEME_KEY = 'sentence_note_theme'

export function App() {
  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  // Sync theme class to documentElement
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem(THEME_KEY, 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem(THEME_KEY, 'light')
      }
    } catch (e) {
      console.error('Failed to sync theme:', e)
    }
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev)

  // Navigation State
  const [currentNav, setCurrentNav] = useState<NavItemId>('library')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Sentences Vault State with LocalStorage persistence
  const [sentences, setSentences] = useState<SentenceData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load sentences from localStorage:', e)
    }
    return initialSentences
  })

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences))
    } catch (e) {
      console.error('Failed to save sentences to localStorage:', e)
    }
  }, [sentences])

  const [activeSentenceId, setActiveSentenceId] = useState<string>(() => {
    return sentences[0]?.id || 'sentence-1'
  })

  // Currently active sentence
  const sentenceData =
    sentences.find((s) => s.id === activeSentenceId) || sentences[0]

  // Active Index State within the current sentence
  const [activeIndexId, setActiveIndexId] = useState<string>(
    sentenceData?.indexes[0]?.id || ''
  )

  // Modals & Feedback State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddIndexModalOpen, setIsAddIndexModalOpen] = useState(false)
  const [isNewSentenceModalOpen, setIsNewSentenceModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Selected Index object
  const activeIndex =
    sentenceData?.indexes.find((i) => i.id === activeIndexId) ||
    sentenceData?.indexes[0] ||
    null

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({
      id: String(Date.now()),
      type,
      text,
    })
  }

  // Handle Multi-Index Update from Form
  const handleUpdateIndexes = (updatedIndexes: IndexPhrase[]) => {
    setSentences((prev) =>
      prev.map((s) => {
        if (s.id !== sentenceData.id) return s
        return {
          ...s,
          indexes: updatedIndexes,
        }
      })
    )

    showToast('success', 'Saved index changes for this sentence')
  }

  // Handle Revert/Cancel
  const handleCancelIndex = () => {
    showToast('info', 'Reverted unsaved changes')
  }

  // Handle Delete Index
  const handleConfirmDelete = () => {
    if (!activeIndex) return
    const deletedPhrase = activeIndex.phrase

    const remainingIndexes = sentenceData.indexes.filter(
      (idx) => idx.id !== activeIndex.id
    )

    setSentences((prev) =>
      prev.map((s) => {
        if (s.id !== sentenceData.id) return s
        return {
          ...s,
          indexes: remainingIndexes,
        }
      })
    )

    setIsDeleteModalOpen(false)

    if (remainingIndexes.length > 0) {
      setActiveIndexId(remainingIndexes[0].id)
    } else {
      setActiveIndexId('')
    }

    showToast('success', `Removed "${deletedPhrase}" from sentence indexes`)
  }

  // Handle Add Multiple Indexes
  const handleAddMultiIndexes = (phrases: string[]) => {
    const newItems: IndexPhrase[] = phrases.map((phrase, idx) => ({
      id: `idx-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      phrase,
    }))

    setSentences((prev) =>
      prev.map((s) => {
        if (s.id !== sentenceData.id) return s
        return {
          ...s,
          indexes: [...s.indexes, ...newItems],
        }
      })
    )

    if (newItems.length > 0) {
      setActiveIndexId(newItems[newItems.length - 1].id)
    }

    showToast(
      'success',
      `Added ${newItems.length} index ${newItems.length === 1 ? 'phrase' : 'phrases'}`
    )
  }

  // Handle Add New Sentence
  const handleAddNewSentence = (newSentence: SentenceData) => {
    setSentences((prev) => [newSentence, ...prev])
    setActiveSentenceId(newSentence.id)
    if (newSentence.indexes.length > 0) {
      setActiveIndexId(newSentence.indexes[0].id)
    }
    setCurrentNav('library')
    showToast('success', 'Created new sentence')
  }

  // Select specific sentence index from Library or Favorites to edit
  const handleSelectIndexToEdit = (sentence: SentenceData, indexId: string) => {
    setActiveSentenceId(sentence.id)
    setActiveIndexId(indexId)
    setCurrentNav('edit-index')
  }

  // Select sentence from Library or Favorites to edit
  const handleSelectSentenceToEdit = (sentence: SentenceData) => {
    setActiveSentenceId(sentence.id)
    if (sentence.indexes.length > 0) {
      setActiveIndexId(sentence.indexes[0].id)
    }
    setCurrentNav('edit-index')
  }

  // Delete specific index from vault
  const handleDeleteIndexFromVault = (sentenceId: string, indexId: string) => {
    setSentences((prev) =>
      prev.map((s) => {
        if (s.id !== sentenceId) return s
        const remaining = s.indexes.filter((idx) => idx.id !== indexId)
        return {
          ...s,
          indexes: remaining,
        }
      })
    )
    showToast('info', 'Index removed from sentence')
  }

  // Toggle favorite star
  const handleToggleFavorite = (sentenceId: string) => {
    setSentences((prev) =>
      prev.map((s) => {
        if (s.id !== sentenceId) return s
        const nextFav = !s.isFavorite
        showToast(
          nextFav ? 'success' : 'info',
          nextFav ? 'Added to favorites' : 'Removed from favorites'
        )
        return { ...s, isFavorite: nextFav }
      })
    )
  }

  // Delete sentence
  const handleDeleteSentence = (sentenceId: string) => {
    setSentences((prev) => prev.filter((s) => s.id !== sentenceId))
    showToast('info', 'Sentence deleted from vault')
  }

  // Update sentence
  const handleUpdateSentence = (updatedSentence: SentenceData) => {
    setSentences((prev) =>
      prev.map((s) => (s.id === updatedSentence.id ? updatedSentence : s))
    )
    showToast('success', '문장이 성공적으로 수정되었습니다.')
  }

  // Export Sentences to JSON file
  const handleExportJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sentences, null, 2))
      const downloadAnchor = document.createElement('a')
      const fileName = `sentences-vault-${new Date().toISOString().slice(0, 10)}.json`
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', fileName)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      showToast('success', `Exported ${sentences.length} sentences as JSON`)
    } catch (e) {
      console.error('Export failed:', e)
      showToast('error', 'Failed to export sentences')
    }
  }

  // Import Sentences from JSON file
  const handleImportJSON = (importedData: SentenceData[]) => {
    if (!Array.isArray(importedData) || importedData.length === 0) {
      showToast('error', 'Invalid JSON data: Expected an array of sentences')
      return
    }

    // Merge or replace
    setSentences((prev) => {
      const existingIds = new Set(prev.map((s) => s.id))
      const newItems = importedData.filter((s) => !existingIds.has(s.id))
      const updated = [...prev, ...newItems]
      return updated
    })

    showToast('success', `Imported ${importedData.length} sentences successfully!`)
  }

  return (
    <div className="min-h-screen bg-[#f7f6f1] dark:bg-[#0c1412] text-[#16382c] dark:text-[#e4ede8] flex flex-col lg:flex-row antialiased selection:bg-[#dcf2e6] selection:text-[#12382c] dark:selection:bg-[#1a4435] dark:selection:text-[#cbf3e2] transition-colors duration-150">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#133d2e] focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Left Sidebar */}
      <Sidebar
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        sentenceCount={sentences.length}
        favoritesCount={sentences.filter((s) => s.isFavorite).length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl w-full mx-auto"
        >
          {/* View 1: Edit an Index (Main Prototype Screen) */}
          {currentNav === 'edit-index' && (
            <>
              {/* Back to Home Navigation Link */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setCurrentNav('library')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#486358] dark:text-[#8ea49a] hover:text-[#12382c] dark:hover:text-[#e4ede8] transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-[#ede9df] dark:hover:bg-[#1b2b27] group cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Library (Home)</span>
                </button>
              </div>

              {/* Page Header */}
              <Header
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                onNewSentenceClick={() => setIsNewSentenceModalOpen(true)}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />

              {/* Main 2-Column Content Grid */}
              <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Primary Card: Sentence display & Multi-Index Edit Form */}
                <section
                  aria-labelledby="edit-index-heading"
                  className="lg:col-span-8 xl:col-span-8 bg-white dark:bg-[#14201c] rounded-2xl p-6 sm:p-8 border border-[#ece8df] dark:border-[#23352f] shadow-xs transition-colors"
                >
                  <h2 id="edit-index-heading" className="sr-only">
                    Edit Index Form
                  </h2>

                  {/* Highlighted Sentence Viewer */}
                  <SentenceDisplay
                    sentenceText={sentenceData.text}
                    indexes={sentenceData.indexes}
                    activeIndexId={activeIndexId}
                    onSelectIndex={setActiveIndexId}
                  />

                  {/* Form Content */}
                  <IndexEditForm
                    key={sentenceData.id}
                    sentenceText={sentenceData.text}
                    indexes={sentenceData.indexes}
                    activeIndexId={activeIndexId}
                    onSelectIndex={setActiveIndexId}
                    onUpdateIndexes={handleUpdateIndexes}
                    onDeleteRequest={(id) => {
                      setActiveIndexId(id)
                      setIsDeleteModalOpen(true)
                    }}
                    onCancel={handleCancelIndex}
                  />
                </section>

                {/* Secondary Right Column: Index List */}
                <div className="lg:col-span-4 xl:col-span-4">
                  <SentenceIndexList
                    indexes={sentenceData.indexes}
                    activeIndexId={activeIndexId}
                    onSelectIndex={setActiveIndexId}
                    onAddAnotherIndex={() => setIsAddIndexModalOpen(true)}
                    sentenceText={sentenceData.text}
                  />
                </div>
              </div>
            </>
          )}

          {/* View 2: Library */}
          {currentNav === 'library' && (
            <LibraryView
              sentences={sentences}
              onSelectSentenceToEdit={handleSelectSentenceToEdit}
              onSelectIndexToEdit={handleSelectIndexToEdit}
              onToggleFavorite={handleToggleFavorite}
              onDeleteSentence={handleDeleteSentence}
              onUpdateSentence={handleUpdateSentence}
              onDeleteIndex={handleDeleteIndexFromVault}
              onNavigateToAdd={() => setIsNewSentenceModalOpen(true)}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onExportJSON={handleExportJSON}
              onImportJSON={handleImportJSON}
            />
          )}

          {/* View 3: Review Mode */}
          {currentNav === 'review' && (
            <ReviewView
              sentences={sentences}
              onEditSentenceIndex={handleSelectSentenceToEdit}
              onBackToMain={() => setCurrentNav('library')}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onNavigateToLibrary={() => setCurrentNav('library')}
            />
          )}

          {/* View 4: Favorites */}
          {currentNav === 'favorites' && (
            <FavoritesView
              sentences={sentences}
              onSelectSentenceToEdit={handleSelectSentenceToEdit}
              onSelectIndexToEdit={handleSelectIndexToEdit}
              onToggleFavorite={handleToggleFavorite}
              onDeleteSentence={handleDeleteSentence}
              onBackToMain={() => setCurrentNav('library')}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal for Delete Index */}
      {activeIndex && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Delete index?"
          message={`Are you sure you want to remove the index "${activeIndex.phrase}" from this sentence? This change applies only to this sentence.`}
          confirmLabel="Delete index"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* Add Multiple Indexes Modal */}
      <AddIndexModal
        isOpen={isAddIndexModalOpen}
        sentenceText={sentenceData.text}
        existingIndexes={sentenceData.indexes}
        onAddMulti={handleAddMultiIndexes}
        onClose={() => setIsAddIndexModalOpen(false)}
      />

      {/* New Sentence Modal */}
      <NewSentenceModal
        isOpen={isNewSentenceModalOpen}
        onAddSentence={handleAddNewSentence}
        onClose={() => setIsNewSentenceModalOpen(false)}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default App
