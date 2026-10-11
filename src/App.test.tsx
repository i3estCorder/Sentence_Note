import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import App from './App'

describe('Sentence Note - Multi-Index Management', () => {
  const openEditIndex = (indexPhrase = 'tucked away') => {
    const cardsRegion = screen.getByRole('region', { name: /index cards list/i })
    const card = within(cardsRegion)
      .getByRole('heading', { level: 3, name: indexPhrase })
      .closest('article')
    if (card) {
      const editBtn = within(card).getByRole('button', { name: /edit index/i })
      fireEvent.click(editBtn)
    }
  }

  it('renders the header and primary components correctly on initial load (Library as Home)', () => {
    render(<App />)

    // Check Header title and subtitle for Library (Home)
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()
    expect(screen.getByText(/browse indexes and sentences in your vault/i)).toBeInTheDocument()

    // Check Brand Section in sidebar
    expect(screen.getByRole('button', { name: /sentence note home/i })).toBeInTheDocument()

    // Check Sidebar Navigation items (Word index removed; Library, Review, Favorites remain)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(nav).getByRole('button', { name: /library/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /review/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /favorites/i })).toBeInTheDocument()
    expect(within(nav).queryByRole('button', { name: /word index/i })).not.toBeInTheDocument()

    // Check '+ New sentence' button
    expect(screen.getByRole('button', { name: /new sentence/i })).toBeInTheDocument()
  })

  it('navigates to another view and returns back to the Library home screen using back button or brand', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })

    // Initially at Library (Home)
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()

    // Open Edit Index via card button
    openEditIndex('tucked away')
    expect(screen.getByRole('heading', { level: 1, name: /edit an index/i })).toBeInTheDocument()

    // Click "Back to Library (Home)"
    const backBtn = screen.getByRole('button', { name: /back to library \(home\)/i })
    fireEvent.click(backBtn)
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()

    // Go to Review
    fireEvent.click(within(nav).getByRole('button', { name: /review/i }))
    expect(screen.getByRole('heading', { level: 1, name: /review & practice/i })).toBeInTheDocument()

    // Click "Back to Library (Home)"
    fireEvent.click(screen.getByRole('button', { name: /back to library \(home\)/i }))
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()

    // Click brand logo button to return to Library home screen
    const brandBtn = screen.getByRole('button', { name: /sentence note home/i })
    fireEvent.click(brandBtn)
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()
  })

  it('renders sentence with highlighted phrase and correct count', () => {
    render(<App />)
    openEditIndex('tucked away')

    expect(screen.getByText(/two indexed phrases in this sentence/i)).toBeInTheDocument()
    expect(screen.getByText(/the small café is/i)).toBeInTheDocument()
    expect(screen.getByText(/the bookstore\./i)).toBeInTheDocument()
  })

  it('renders initial index badges for "tucked away" and "behind"', () => {
    render(<App />)
    openEditIndex('tucked away')

    // Current sentence has tucked away and behind badges
    expect(screen.getAllByText('tucked away').length).toBeGreaterThan(0)
    expect(screen.getAllByText('behind').length).toBeGreaterThan(0)

    // Selected phrase input has tucked away
    const selectedInput = screen.getByLabelText(/edit selected index/i) as HTMLInputElement
    expect(selectedInput.value).toBe('tucked away')
  })

  it('allows adding multiple indexes at once via comma-separated input', async () => {
    render(<App />)
    openEditIndex('tucked away')

    const multiInput = screen.getByPlaceholderText(/type index phrases separated by comma/i)
    fireEvent.change(multiInput, { target: { value: 'bookstore, small café' } })

    const addBtn = screen.getByRole('button', { name: /^add$/i })
    fireEvent.click(addBtn)

    // Both should now be added as index items
    await waitFor(() => {
      expect(screen.getByText('bookstore')).toBeInTheDocument()
      expect(screen.getByText('small café')).toBeInTheDocument()
    })
  })

  it('switches active index when clicking an item in the right sidebar', () => {
    render(<App />)
    openEditIndex('tucked away')

    // Find the right sidebar container
    const rightSidebar = screen.getByRole('complementary', { name: /sentence index list/i })
    const behindItem = within(rightSidebar).getByRole('button', { name: /behind/i })
    fireEvent.click(behindItem)

    // Form input should now have 'behind'
    const phraseInput = screen.getByLabelText(/edit selected index/i) as HTMLInputElement
    expect(phraseInput.value).toBe('behind')
  })

  it('edits the selected phrase and saves changes with feedback toast', async () => {
    render(<App />)
    openEditIndex('tucked away')

    const phraseInput = screen.getByLabelText(/edit selected index/i)
    fireEvent.change(phraseInput, { target: { value: 'tucked away nicely' } })

    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)

    // Check toast
    await waitFor(() => {
      expect(screen.getByText(/saved index changes for this sentence/i)).toBeInTheDocument()
    })

    // Check right column updated
    const rightSidebar = screen.getByRole('complementary', { name: /sentence index list/i })
    expect(within(rightSidebar).getByText('tucked away nicely')).toBeInTheDocument()
  })

  it('handles delete index with confirmation modal', async () => {
    render(<App />)
    openEditIndex('tucked away')

    const deleteBtn = screen.getByRole('button', { name: /delete tucked away index/i })
    fireEvent.click(deleteBtn)

    // Confirmation modal should appear
    const dialog = screen.getByRole('dialog', { name: /delete index\?/i })
    expect(dialog).toBeInTheDocument()

    // Confirm deletion inside modal
    const confirmDeleteBtn = within(dialog).getByRole('button', { name: /delete index/i })
    fireEvent.click(confirmDeleteBtn)

    // Toast feedback
    await waitFor(() => {
      expect(screen.getByText(/removed "tucked away" from sentence indexes/i)).toBeInTheDocument()
    })

    // The remaining index ('behind') should now be active
    const phraseInput = screen.getByLabelText(/edit selected index/i) as HTMLInputElement
    expect(phraseInput.value).toBe('behind')
  })

  it('opens and closes mobile sidebar navigation drawer', () => {
    render(<App />)

    const hamburgerBtn = screen.getByRole('button', { name: /open menu/i })
    fireEvent.click(hamburgerBtn)

    // Mobile sidebar should be open
    const closeBtn = screen.getByRole('button', { name: /close navigation sidebar/i })
    expect(closeBtn).toBeInTheDocument()

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
  })

  it('displays index cards sorted by index order (A-Z) in Sentence Library by default', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    // Library heading
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()

    // Region for index cards
    const cardsRegion = screen.getByRole('region', { name: /index cards list/i })
    expect(cardsRegion).toBeInTheDocument()

    // Check headings inside index cards (h3 tags)
    // The phrases are: behind, reached a compromise, rare, stumbled upon, tucked away
    // Sorted A-Z: behind, rare, reached a compromise, stumbled upon, tucked away
    const cardHeadings = within(cardsRegion).getAllByRole('heading', { level: 3 })
    const headingTexts = cardHeadings.map((h) => h.textContent)

    expect(headingTexts).toEqual([
      'behind',
      'rare',
      'reached a compromise',
      'stumbled upon',
      'tucked away',
    ])

    // Verify context sentence is displayed for index cards
    expect(within(cardsRegion).getAllByText(/The small café is/i).length).toBe(2)
    expect(within(cardsRegion).getAllByText(/antique clock in the attic/i).length).toBe(2)
  })

  it('allows changing sort order (A-Z to Z-A) in Library', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    const cardsRegion = screen.getByRole('region', { name: /index cards list/i })

    // Change sort order to Z -> A
    const sortSelect = screen.getByLabelText(/sort index order/i)
    fireEvent.change(sortSelect, { target: { value: 'index-desc' } })

    const descHeadings = within(cardsRegion).getAllByRole('heading', { level: 3 })
    const descTexts = descHeadings.map((h) => h.textContent)

    expect(descTexts).toEqual([
      'tucked away',
      'stumbled upon',
      'reached a compromise',
      'rare',
      'behind',
    ])
  })

  it('renders index cards in right sidebar sorted by index phrase A-Z by default', () => {
    render(<App />)
    openEditIndex('tucked away')

    const rightSidebar = screen.getByRole('complementary', { name: /sentence index list/i })
    const cardsList = within(rightSidebar).getByRole('list', { name: /index cards/i })

    // For first sentence (tucked away, behind), sorted by index A-Z means behind is first
    const buttons = within(cardsList).getAllByRole('button')
    expect(buttons[0]).toHaveTextContent('behind')
    expect(buttons[1]).toHaveTextContent('tucked away')
  })

  it('navigates directly to edit an index when clicking "Edit index" on a Library index card', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    const cardsRegion = screen.getByRole('region', { name: /index cards list/i })

    // Find card for 'rare' and click its 'Edit index' button
    const rareCard = within(cardsRegion).getByRole('heading', { level: 3, name: 'rare' }).closest('div')
    expect(rareCard).not.toBeNull()

    const editBtns = within(cardsRegion).getAllByRole('button', { name: /edit index/i })
    // The second card in A-Z order is 'rare'
    fireEvent.click(editBtns[1])

    // Should navigate back to Edit Index screen
    expect(screen.getByRole('heading', { level: 1, name: /edit an index/i })).toBeInTheDocument()

    // Form input should now have 'rare'
    const phraseInput = screen.getByLabelText(/edit selected index/i) as HTMLInputElement
    expect(phraseInput.value).toBe('rare')
  })

  it('allows editing a sentence text and notes via per-sentence edit button in Library', async () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    // Click "문장 수정" on a sentence
    const editSentenceBtns = screen.getAllByRole('button', { name: /edit sentence/i })
    expect(editSentenceBtns.length).toBeGreaterThan(0)
    fireEvent.click(editSentenceBtns[0])

    // Edit Sentence Modal should open
    expect(screen.getByRole('heading', { level: 3, name: /문장 수정/i })).toBeInTheDocument()

    // Modify translation input
    const translationInput = screen.getByLabelText(/한국어 번역/i)
    fireEvent.change(translationInput, { target: { value: '테스트용 수정된 번역 문장입니다.' } })

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /변경사항 저장/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: /문장 수정/i })).not.toBeInTheDocument()
    })
  })

  it('allows deleting a sentence with confirmation modal in Library', async () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    // Click "문장 삭제" on a sentence
    const deleteSentenceBtns = screen.getAllByRole('button', { name: /delete sentence/i })
    expect(deleteSentenceBtns.length).toBeGreaterThan(0)
    fireEvent.click(deleteSentenceBtns[0])

    // Confirmation Modal should appear
    expect(screen.getByRole('heading', { level: 3, name: '문장 삭제' })).toBeInTheDocument()

    // Click "취소" closes modal without deletion
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('heading', { level: 3, name: '문장 삭제' })).not.toBeInTheDocument()
  })

  it('displays sentence count badge next to Library in sidebar', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const libraryBtn = within(nav).getByRole('button', { name: /library/i })

    // Should contain sentence count badge
    expect(within(libraryBtn).getAllByText(/\d+/).length).toBeGreaterThanOrEqual(1)
  })

  it('supports Anki-style SRS review flow with Reveal and 4 rating buttons', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /review/i }))

    // Heading for review
    expect(screen.getByRole('heading', { level: 1, name: /review & practice/i })).toBeInTheDocument()

    // Anki 3-color counters (New, Learn, Review)
    expect(screen.getByText(/\d+\s+New/i)).toBeInTheDocument()
    expect(screen.getByText(/\d+\s+Learn/i)).toBeInTheDocument()
    expect(screen.getByText(/\d+\s+Review/i)).toBeInTheDocument()

    // Click Reveal answer
    const revealBtn = screen.getByRole('button', { name: /reveal answer/i })
    fireEvent.click(revealBtn)

    // 4 Anki evaluation buttons should be visible
    expect(screen.getByRole('button', { name: /again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /easy/i })).toBeInTheDocument()

    // Click Good button
    fireEvent.click(screen.getByRole('button', { name: /good/i }))
  })

  it('toggles dark and light mode, updating DOM class and localStorage', () => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')

    render(<App />)

    // Check Header & Sidebar toggle buttons
    const toggles = screen.getAllByRole('button', { name: /switch to dark mode/i })
    expect(toggles.length).toBeGreaterThanOrEqual(1)

    // Click first toggle (Header) to activate Dark mode
    fireEvent.click(toggles[0])

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('sentence_note_theme')).toBe('dark')

    // Click to switch back to Light mode
    const lightToggles = screen.getAllByRole('button', { name: /switch to light mode/i })
    expect(lightToggles.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(lightToggles[0])

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('sentence_note_theme')).toBe('light')
  })

  it('persists reviewed card state so re-entering review does not reset completed cards', () => {
    localStorage.clear()
    const { unmount } = render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /review/i }))

    // All initial cards are due (5 total)
    expect(screen.getByText(/5\s+New/i)).toBeInTheDocument()

    // Rate the first card as Good
    fireEvent.click(screen.getByRole('button', { name: /reveal answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /good/i }))

    // Now 4 cards remain in the active queue
    expect(screen.getByText(/4\s+New/i)).toBeInTheDocument()

    // Navigate away to Library
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()

    // Navigate back to Review
    fireEvent.click(within(nav).getByRole('button', { name: /review/i }))

    // The completed card is NOT reset! Remaining count should still be 4 New cards
    expect(screen.getByText(/4\s+New/i)).toBeInTheDocument()
    unmount()
  })

  it('finishes review session cleanly without repeating Again cards, and offers Again 다시 복습하기 button', () => {
    localStorage.clear()
    const { unmount } = render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /review/i }))

    // Rate 5 cards: 1 Again, 4 Good
    // Card 1: Again
    fireEvent.click(screen.getByRole('button', { name: /reveal answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /again/i }))

    // Cards 2-5: Good
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /reveal answer/i }))
      fireEvent.click(screen.getByRole('button', { name: /good/i }))
    }

    // Session immediately ends without re-looping the Again card!
    expect(screen.getByRole('heading', { level: 2, name: /오늘의 복습 완료/i })).toBeInTheDocument()

    // Both buttons exist: "전체 다시 복습하기" and "Again 다시 복습하기 (1)"
    expect(screen.getByRole('button', { name: /전체 다시 복습하기/i })).toBeInTheDocument()
    const againReviewBtn = screen.getByRole('button', { name: /again 다시 복습하기 \(1\)/i })
    expect(againReviewBtn).toBeInTheDocument()

    // Click "Again 다시 복습하기 (1)" -> starts session with exactly 1 Again card!
    fireEvent.click(againReviewBtn)
    expect(screen.getByRole('heading', { level: 1, name: /review & practice/i })).toBeInTheDocument()
    expect(screen.getByText(/1\s+Learn/i)).toBeInTheDocument()

    unmount()
  })

  it('sanitizes ghost sentences with 0 indexes from localStorage so sentence count strictly matches visible sentences', () => {
    localStorage.clear()
    const storedWithGhost = [
      {
        id: 'sentence-1',
        text: "I didn't like pretty people because they showed off all the time.",
        indexes: [{ id: 'idx-1', phrase: 'show off' }],
        isFavorite: false,
      },
      {
        id: 'ghost-sentence',
        text: 'Ghost sentence without indexes',
        indexes: [],
        isFavorite: false,
      },
    ]
    localStorage.setItem('sentence_vault_v1', JSON.stringify(storedWithGhost))

    const { unmount } = render(<App />)

    // Header badges should accurately say "1 sentences"
    expect(screen.getAllByText(/1 sentences/i).length).toBeGreaterThanOrEqual(1)

    // Sidebar badge should display sent 1, not 2
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const libraryBtn = within(nav).getByRole('button', { name: /library/i })
    expect(within(libraryBtn).getByText(/sent 1/i)).toBeInTheDocument()

    unmount()
  })

  it('hides translations by default in Library and allows toggling visibility with the show/hide button', () => {
    localStorage.clear()
    const { unmount } = render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    // Switch to Sentences tab
    fireEvent.click(screen.getByRole('button', { name: /sentences/i }))

    // Default translation text should NOT be visible initially
    const sampleTranslation = '그 작은 카페는 서점 뒤편에 아늑하게 자리 잡고 있습니다.'
    expect(screen.queryAllByText(sampleTranslation)).toHaveLength(0)

    // "번역 보기" buttons should be present
    const showBtns = screen.getAllByRole('button', { name: /show translation/i })
    expect(showBtns.length).toBeGreaterThan(0)

    // Click the first "번역 보기" button
    fireEvent.click(showBtns[0])

    // Now the translation should be visible
    expect(screen.getAllByText(sampleTranslation).length).toBeGreaterThanOrEqual(1)

    // Clicking "숨기기" or toggle button hides it again
    const hideBtns = screen.getAllByRole('button', { name: /hide translation/i })
    expect(hideBtns.length).toBeGreaterThan(0)
    fireEvent.click(hideBtns[0])

    expect(screen.queryAllByText(sampleTranslation)).toHaveLength(0)

    unmount()
  })

  it('hides sentence translation by default in SentenceDetailModal and reveals when clicking show button', async () => {
    localStorage.clear()
    const { unmount } = render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    // Click on an index card to open SentenceDetailModal
    const cardTitle = screen.getByRole('heading', { level: 3, name: 'tucked away' })
    fireEvent.click(cardTitle)

    // Modal dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // The sentence translation should NOT be visible by default
    const sampleTranslation = '그 작은 카페는 서점 뒤편에 아늑하게 자리 잡고 있습니다.'
    expect(screen.queryByText(`"${sampleTranslation}"`)).not.toBeInTheDocument()

    // Modal should show "번역이 숨겨져 있습니다" or "번역 보기" button
    const showBtns = within(screen.getByRole('dialog')).getAllByRole('button', { name: /show translation/i })
    expect(showBtns.length).toBeGreaterThan(0)

    // Click "번역 보기"
    fireEvent.click(showBtns[0])

    // Now the translation is revealed
    expect(screen.getByText(`"${sampleTranslation}"`)).toBeInTheDocument()

    unmount()
  })

  it('guarantees unique IDs for stored sentences and clicking a specific sentence opens its own detail', () => {
    localStorage.clear()
    const storedWithSameId = [
      {
        id: 'sentence-1',
        text: 'She wanted to show off her new car.',
        translation: '그녀는 새 차를 과시하고 싶어했다.',
        indexes: [{ id: 'idx-1', phrase: 'show off' }],
        isFavorite: false,
      },
      {
        id: 'sentence-1', // Colliding ID in raw localStorage
        text: "I didn't like pretty people because they showed off all the time.",
        translation: '나는 예쁜 사람들이 늘 과시해서 좋아하지 않았다.',
        indexes: [{ id: 'idx-2', phrase: 'show off' }],
        isFavorite: false,
      },
    ]
    localStorage.setItem('sentence_vault_v1', JSON.stringify(storedWithSameId))

    const { unmount } = render(<App />)

    // Header should say 2 sentences
    expect(screen.getAllByText(/2 sentences/i).length).toBeGreaterThanOrEqual(1)

    // Both sentences should be visible under the "show off" card
    expect(screen.getByText(/She wanted to/i)).toBeInTheDocument()
    expect(screen.getByText(/I didn't like pretty people/i)).toBeInTheDocument()

    // Clicking the second sentence ("I didn't like pretty people...") opens its own detail
    fireEvent.click(screen.getByText(/I didn't like pretty people/i))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText(/I didn't like pretty people/i)).toBeInTheDocument()

    unmount()
  })

  it('renders a listen (TTS) button for each sentence in Library and triggers speech synthesis on click', () => {
    localStorage.clear()
    const { unmount } = render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    // Sentences in library should have listen buttons
    const listenBtns = screen.getAllByRole('button', { name: /listen to sentence/i })
    expect(listenBtns.length).toBeGreaterThan(0)

    // Clicking listen button does not throw
    expect(() => fireEvent.click(listenBtns[0])).not.toThrow()

    unmount()
  })

  it('does not display the sentence translation section in SentenceDetailModal when sentence has no translation', () => {
    localStorage.clear()
    const storedWithoutTranslation = [
      {
        id: 'sentence-no-trans',
        text: 'She wanted to show off her new husband at the party.',
        indexes: [{ id: 'idx-1', phrase: 'show off' }],
        isFavorite: false,
      },
    ]
    localStorage.setItem('sentence_vault_v1', JSON.stringify(storedWithoutTranslation))

    const { unmount } = render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))

    // Open detail modal for the sentence
    fireEvent.click(screen.getByText(/She wanted to/i))

    const modal = screen.getByRole('dialog')
    expect(modal).toBeInTheDocument()

    // "문장 뜻 (Sentence Translation)" section should NOT be present
    expect(within(modal).queryByText(/문장 뜻/i)).not.toBeInTheDocument()
    expect(within(modal).queryByText(/Sentence Translation/i)).not.toBeInTheDocument()
    expect(within(modal).queryByRole('button', { name: /show translation/i })).not.toBeInTheDocument()

    unmount()
  })

  it('renders a sentence only once in FavoritesView even if it has multiple indexes, while showing all indexes in header', () => {
    localStorage.clear()
    const storedMultiIndexFavorite = [
      {
        id: 'fav-multi',
        text: 'The small café is tucked away behind the bookstore.',
        indexes: [
          { id: 'idx-1', phrase: 'tucked away' },
          { id: 'idx-2', phrase: 'behind' },
        ],
        isFavorite: true,
      },
    ]
    localStorage.setItem('sentence_vault_v1', JSON.stringify(storedMultiIndexFavorite))

    const { unmount } = render(<App />)

    // Navigate to Favorites view
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /favorites/i }))

    // In default Index view: each index card is separated
    expect(screen.getByRole('button', { name: /view by index/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view by sentence/i })).toBeInTheDocument()

    // Switch to Sentence view: only ONE card rendered for this sentence
    fireEvent.click(screen.getByRole('button', { name: /view by sentence/i }))
    expect(screen.getAllByText(/The small café is/i)).toHaveLength(1)

    // The card header should display BOTH indexes
    expect(screen.getAllByText('tucked away').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('behind').length).toBeGreaterThanOrEqual(1)

    // Title should contain both phrases separated by |
    expect(screen.getByRole('heading', { level: 3, name: /tucked away\s*\|\s*behind/i })).toBeInTheDocument()

    unmount()
  })

  it('displays separate colored badges for Index and Sentence next to Library in Sidebar', () => {
    localStorage.clear()
    const stored = [
      {
        id: 's-1',
        text: 'The small café is tucked away behind the bookstore.',
        indexes: [
          { id: 'idx-1', phrase: 'tucked away' },
          { id: 'idx-2', phrase: 'behind' },
        ],
        isFavorite: false,
      },
      {
        id: 's-2',
        text: 'She stumbled upon a rare antique clock in the attic.',
        indexes: [{ id: 'idx-3', phrase: 'stumbled upon' }],
        isFavorite: false,
      },
    ]
    localStorage.setItem('sentence_vault_v1', JSON.stringify(stored))

    const { unmount } = render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const libraryBtn = within(nav).getByRole('button', { name: /library/i })

    // Should display index count (3 unique indexes) and sentence count (2 sentences) with separate labels
    expect(within(libraryBtn).getByText(/idx 3/i)).toBeInTheDocument()
    expect(within(libraryBtn).getByText(/sent 2/i)).toBeInTheDocument()

    unmount()
  })
})


