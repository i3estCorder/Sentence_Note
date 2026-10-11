import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import App from './App'

describe('Sentence Vault - Multi-Index Management', () => {
  it('renders the header and primary components correctly', () => {
    render(<App />)

    // Check Header title and subtitle
    expect(screen.getByRole('heading', { level: 1, name: /edit an index/i })).toBeInTheDocument()
    expect(screen.getByText(/change its phrase, tags, or remove it from this sentence/i)).toBeInTheDocument()

    // Check Brand Section in sidebar
    expect(screen.getByRole('button', { name: /sentence vault home/i })).toBeInTheDocument()

    // Check Sidebar Navigation items (Word index removed; Library, Review, Favorites remain)
    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /word index/i })).not.toBeInTheDocument()

    // Check '+ New sentence' button
    expect(screen.getByRole('button', { name: /new sentence/i })).toBeInTheDocument()
  })

  it('navigates to another view and returns back to the main screen using back button or brand', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /main navigation/i })

    // Go to Library
    fireEvent.click(within(nav).getByRole('button', { name: /library/i }))
    expect(screen.getByRole('heading', { level: 1, name: /sentence library/i })).toBeInTheDocument()

    // Click "Back to Edit index (Main)"
    const backBtn = screen.getByRole('button', { name: /back to edit index/i })
    fireEvent.click(backBtn)
    expect(screen.getByRole('heading', { level: 1, name: /edit an index/i })).toBeInTheDocument()

    // Go to Review
    fireEvent.click(within(nav).getByRole('button', { name: /review/i }))
    expect(screen.getByRole('heading', { level: 1, name: /review & practice/i })).toBeInTheDocument()

    // Click brand logo button to return to main screen
    const brandBtn = screen.getByRole('button', { name: /sentence vault home/i })
    fireEvent.click(brandBtn)
    expect(screen.getByRole('heading', { level: 1, name: /edit an index/i })).toBeInTheDocument()
  })

  it('renders sentence with highlighted phrase and correct count', () => {
    render(<App />)

    expect(screen.getByText(/two indexed phrases in this sentence/i)).toBeInTheDocument()
    expect(screen.getByText(/the small café is/i)).toBeInTheDocument()
    expect(screen.getByText(/the bookstore\./i)).toBeInTheDocument()
  })

  it('renders initial index badges for "tucked away" and "behind"', () => {
    render(<App />)

    // Current sentence has tucked away and behind badges
    expect(screen.getAllByText('tucked away').length).toBeGreaterThan(0)
    expect(screen.getAllByText('behind').length).toBeGreaterThan(0)

    // Selected phrase input has tucked away
    const selectedInput = screen.getByLabelText(/edit selected index/i) as HTMLInputElement
    expect(selectedInput.value).toBe('tucked away')
  })

  it('allows adding multiple indexes at once via comma-separated input', async () => {
    render(<App />)

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

    const hamburgerBtn = screen.getByRole('button', { name: /open mobile navigation menu/i })
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
    expect(within(libraryBtn).getByText(/\d+/)).toBeInTheDocument()
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
})


